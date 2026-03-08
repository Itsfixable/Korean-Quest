const TRANSCRIBE_ENDPOINT =
  "https://kq-live-transcribe-hf.mr-koji-tanaka.workers.dev/api/transcribe";

const CHUNK_MS = 4000;
const TARGET_SAMPLE_RATE = 16000;
const SILENCE_RMS_THRESHOLD = 0.015;
const MIN_SPEECH_FRAMES_PER_CHUNK = 8;

const els = {
  startBtn: document.getElementById("startLiveTranscriptBtn"),
  stopBtn: document.getElementById("stopLiveTranscriptBtn"),
  clearBtn: document.getElementById("clearTranscriptBtn"),
  statusPill: document.getElementById("liveTranscriptStatus"),
  hint: document.getElementById("liveTranscriptHint"),
  transcript: document.getElementById("callTranscript"),
};

let mediaStream = null;
let audioContext = null;
let sourceNode = null;
let processorNode = null;

let isCapturing = false;
let isSending = false;
let isStopping = false;

let chunkQueue = [];
let transcriptLines = [];
let pcmChunks = [];
let speechFrameCount = 0;
let flushInterval = null;

function setStatus(text, mode = "idle") {
  if (!els.statusPill || !els.hint) return;

  els.statusPill.textContent = text;
  els.statusPill.classList.remove("is-idle", "is-live", "is-error");

  if (mode === "live") {
    els.statusPill.classList.add("is-live");
  } else if (mode === "error") {
    els.statusPill.classList.add("is-error");
  } else {
    els.statusPill.classList.add("is-idle");
  }

  els.hint.textContent = text;
}

function setButtons(capturing) {
  if (els.startBtn) els.startBtn.disabled = capturing;
  if (els.stopBtn) els.stopBtn.disabled = !capturing;
}

function renderTranscript() {
  if (!els.transcript) return;
  els.transcript.value = transcriptLines.join("\n\n");
  els.transcript.scrollTop = els.transcript.scrollHeight;
}

function clearTranscript() {
  transcriptLines = [];
  renderTranscript();
  setStatus("Transcript cleared.", "idle");
}

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) return buffer;

  if (outputSampleRate > inputSampleRate) {
    throw new Error("Output sample rate must be <= input sample rate.");
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (
      let i = offsetBuffer;
      i < nextOffsetBuffer && i < buffer.length;
      i += 1
    ) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function mergeFloat32Chunks(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function floatTo16BitPCM(float32Array) {
  const pcm = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return pcm;
}

function encodeWavFromFloat32(float32Array, sampleRate) {
  const pcm16 = floatTo16BitPCM(float32Array);
  const buffer = new ArrayBuffer(44 + pcm16.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcm16.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcm16.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm16.length; i += 1) {
    view.setInt16(offset, pcm16[i], true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function computeRms(float32Array) {
  let sumSquares = 0;

  for (let i = 0; i < float32Array.length; i += 1) {
    sumSquares += float32Array[i] * float32Array[i];
  }

  return Math.sqrt(sumSquares / float32Array.length);
}

function normalizeTranscriptText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldRejectTranscript(text) {
  const cleaned = normalizeTranscriptText(text);
  if (!cleaned) return true;

  const junkPhrases = new Set([
    "thank you for watching",
    "thank you",
    "you",
    "ha",
    "uh",
    "um",
  ]);

  if (junkPhrases.has(cleaned)) return true;

  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 1 && cleaned.length <= 3) return true;

  return false;
}

function isDuplicateTranscript(text) {
  if (!transcriptLines.length) return false;

  const current = normalizeTranscriptText(text);
  const recent = transcriptLines
    .slice(-3)
    .map((line) => normalizeTranscriptText(line.replace(/^You:\s*/i, "")));

  return recent.includes(current);
}

async function sendChunk(blob) {
  const formData = new FormData();
  formData.append("audio", blob, "chunk.wav");
  formData.append("language", "ko");

  const response = await fetch(TRANSCRIBE_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Transcription request failed.");
  }

  return (data.text || "").trim();
}

async function processQueue() {
  if (isSending) return;

  isSending = true;

  try {
    while (chunkQueue.length > 0) {
      const blob = chunkQueue.shift();

      if (!(blob instanceof Blob) || blob.size === 0) continue;

      setStatus("Transcribing latest speech chunk…", "live");

      const text = await sendChunk(blob);

      if (!text) continue;
      if (shouldRejectTranscript(text)) continue;
      if (isDuplicateTranscript(text)) continue;

      transcriptLines.push(`You: ${text}`);
      renderTranscript();
    }

    if (isCapturing) {
      setStatus("Captions running.", "live");
    } else if (isStopping) {
      setStatus("Captions stopped.", "idle");
      isStopping = false;
    } else {
      setStatus("Captions off.", "idle");
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Captioning failed.", "error");
    isStopping = false;
  } finally {
    isSending = false;

    // If something got queued while a send was already in progress,
    // immediately process the remainder now.
    if (chunkQueue.length > 0) {
      processQueue();
    } else if (!isCapturing && isStopping) {
      setStatus("Captions stopped.", "idle");
      isStopping = false;
    }
  }
}

function flushCurrentChunk() {
  if (!pcmChunks.length) return false;

  if (speechFrameCount < MIN_SPEECH_FRAMES_PER_CHUNK) {
    pcmChunks = [];
    speechFrameCount = 0;

    if (isCapturing) {
      setStatus("Listening for speech…", "live");
    }

    return false;
  }

  const merged = mergeFloat32Chunks(pcmChunks);
  pcmChunks = [];
  speechFrameCount = 0;

  const wavBlob = encodeWavFromFloat32(merged, TARGET_SAMPLE_RATE);
  chunkQueue.push(wavBlob);
  processQueue();

  return true;
}

async function startCaptions() {
  if (isCapturing) return;

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);

    processorNode.onaudioprocess = (event) => {
      if (!isCapturing) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(
        inputData,
        audioContext.sampleRate,
        TARGET_SAMPLE_RATE
      );

      const rms = computeRms(downsampled);

      if (rms >= SILENCE_RMS_THRESHOLD) {
        speechFrameCount += 1;
        pcmChunks.push(new Float32Array(downsampled));
      }
    };

    sourceNode.connect(processorNode);
    processorNode.connect(audioContext.destination);

    flushInterval = setInterval(flushCurrentChunk, CHUNK_MS);

    isCapturing = true;
    isStopping = false;

    setButtons(true);
    setStatus("Captions running.", "live");
  } catch (error) {
    console.error(error);
    setStatus("Could not start microphone captions.", "error");
  }
}

function stopCaptions() {
  if (!isCapturing) return;

  isCapturing = false;
  isStopping = true;

  setButtons(false);

  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }

  const queuedFinalChunk = flushCurrentChunk();

  if (processorNode) {
    processorNode.disconnect();
    processorNode.onaudioprocess = null;
    processorNode = null;
  }

  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  if (queuedFinalChunk || isSending || chunkQueue.length > 0) {
    setStatus("Finishing last caption chunk...", "live");
    return;
  }

  setStatus("Captions stopped.", "idle");
  isStopping = false;
}

function wireUi() {
  if (els.startBtn) {
    els.startBtn.addEventListener("click", startCaptions);
  }

  if (els.stopBtn) {
    els.stopBtn.addEventListener("click", stopCaptions);
  }

  if (els.clearBtn) {
    els.clearBtn.addEventListener("click", clearTranscript);
  }

  window.addEventListener("beforeunload", () => {
    stopCaptions();
  });
}

wireUi();
setButtons(false);
setStatus("Captions off.", "idle");
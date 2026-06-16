"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/pages/video.css";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement | null;
        width: string;
        height: string;
        configOverwrite?: Record<string, unknown>;
        interfaceConfigOverwrite?: Record<string, unknown>;
      },
    ) => {
      dispose: () => void;
      addEventListener: (event: string, listener: () => void) => void;
    };
  }
}

const JITSI_DOMAIN = "meet.jit.si";
const ROOM_PREFIX = "KoreanQuest";
const SUMMARY_ENDPOINT = "https://kq-call-summary.mr-koji-tanaka.workers.dev/api/summary";
const TRANSCRIBE_ENDPOINT = "https://kq-live-transcribe-hf.mr-koji-tanaka.workers.dev/api/transcribe";
const CHUNK_MS = 4000;
const TARGET_SAMPLE_RATE = 16000;
const SILENCE_RMS_THRESHOLD = 0.015;
const MIN_SPEECH_FRAMES_PER_CHUNK = 8;

const missions = [
  { title: "Order Food", desc: "One person is the customer and one is the server.", words: ["김치", "물", "주세요", "밥"] },
  { title: "Introduce Yourself", desc: "Practice names, age, school, and hobbies.", words: ["안녕하세요", "이름", "학교", "좋아해요"] },
  { title: "Talk About School", desc: "Describe classes, teachers, and your favorite subject.", words: ["학교", "수업", "선생님", "과목"] },
  { title: "Favorite Foods", desc: "Ask what foods each person likes and dislikes.", words: ["사과", "빵", "우유", "좋아해요"] },
  { title: "Plan a Day Out", desc: "Pretend you are making weekend plans together.", words: ["오늘", "내일", "가요", "만나요"] },
];

interface VideoViewProps {
  room?: string;
}

function pickRandom<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function sanitizeCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function VideoView({ room }: VideoViewProps) {
  const [initialRoom, setInitialRoom] = useState<string | undefined>(room);

  useEffect(() => {
    if (room) return;
    const r = new URLSearchParams(window.location.search).get("room");
    if (r) setInitialRoom(r);
  }, [room]);

  const meetMountRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<InstanceType<NonNullable<typeof window.JitsiMeetExternalAPI>> | null>(null);
  const timerRef = useRef<number | null>(null);

  const [jitsiReady, setJitsiReady] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [role, setRole] = useState<"none" | "host" | "student">("none");
  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [callTimer, setCallTimer] = useState("00:00");
  const [sessionXp, setSessionXp] = useState(0);

  const [mission, setMission] = useState(() => pickRandom(missions));
  const [sharedNotes, setSharedNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [captionStatus, setCaptionStatus] = useState("Captions off.");
  const [captionMode, setCaptionMode] = useState<"idle" | "live" | "error">("idle");
  const [capturing, setCapturing] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState("");
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryData, setSummaryData] = useState<Record<string, unknown> | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy");

  const transcriptLinesRef = useRef<string[]>([]);
  const autoJoinedRef = useRef(false);

  const addSessionXP = (amount: number) => setSessionXp((x) => x + amount);

  const destroyMeeting = useCallback(() => {
    if (jitsiRef.current) {
      try {
        jitsiRef.current.dispose();
      } catch {
        /* ignore */
      }
      jitsiRef.current = null;
    }
    if (meetMountRef.current) meetMountRef.current.innerHTML = "";
  }, []);

  const getRoomName = (codeOrRoom: string) => {
    if (codeOrRoom.startsWith("KQ_")) return codeOrRoom;
    return `${ROOM_PREFIX}-${sanitizeCode(codeOrRoom)}`;
  };

  const joinCall = useCallback(
    (codeOrRoom: string, asRole: "host" | "student" = "student") => {
      const clean = codeOrRoom.startsWith("KQ_") ? codeOrRoom : sanitizeCode(codeOrRoom);
      if (!clean) {
        alert("Missing room code.");
        return;
      }
      if (!window.JitsiMeetExternalAPI || !meetMountRef.current) {
        alert("Jitsi failed to load. Refresh the page and try again.");
        return;
      }

      destroyMeeting();
      const displayCode = codeOrRoom.startsWith("KQ_") ? codeOrRoom.replace(/^KQ_/, "").slice(0, 6) : clean;
      setRoomCode(displayCode);
      setRole(asRole);

      jitsiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: getRoomName(clean),
        parentNode: meetMountRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: { prejoinPageEnabled: false, startWithAudioMuted: false, startWithVideoMuted: false },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
        },
      });

      setInCall(true);
      setCallTimer("00:00");
      if (timerRef.current) window.clearInterval(timerRef.current);
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds += 1;
        setCallTimer(formatTime(seconds));
        if (seconds > 0 && seconds % 60 === 0) addSessionXP(10);
      }, 1000);

      addSessionXP(25);
      jitsiRef.current.addEventListener("videoConferenceLeft", () => {
        destroyMeeting();
        setInCall(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
      });
    },
    [destroyMeeting],
  );

  useEffect(() => {
    const saved = localStorage.getItem("kq_video_notes");
    if (saved) setSharedNotes(saved);
  }, []);

  useEffect(() => {
    if (initialRoom && jitsiReady && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      joinCall(decodeURIComponent(initialRoom), "student");
    }
  }, [initialRoom, jitsiReady, joinCall]);

  useEffect(() => () => {
    destroyMeeting();
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, [destroyMeeting]);

  const saveNotes = () => {
    localStorage.setItem("kq_video_notes", sharedNotes);
    addSessionXP(5);
  };

  const copyCurrentCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1200);
    });
  };

  const generateSummary = async () => {
    const text = transcript.trim();
    if (!text) {
      setSummaryStatus("Add or capture some transcript text first.");
      return;
    }
    setSummaryStatus("Generating AI summary...");
    try {
      const response = await fetch(SUMMARY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Summary request failed.");
      setSummaryData(data);
      setSummaryVisible(true);
      setSummaryStatus("AI summary generated.");
    } catch (error) {
      setSummaryStatus(error instanceof Error ? error.message : "Could not generate AI summary.");
    }
  };

  const renderTranscript = () => transcriptLinesRef.current.join("\n\n");

  const appendTranscriptLine = (line: string) => {
    transcriptLinesRef.current.push(line);
    setTranscript(renderTranscript());
  };

  const startCaptions = async () => {
    if (capturing) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      setCapturing(true);
      setCaptionMode("live");
      setCaptionStatus("Captions running.");

      const audioContext = new AudioContext();
      const sourceNode = audioContext.createMediaStreamSource(mediaStream);
      const processorNode = audioContext.createScriptProcessor(4096, 1, 1);
      const pcmChunks: Float32Array[] = [];
      let speechFrameCount = 0;
      let chunkQueue: Blob[] = [];
      let isSending = false;

      const downsampleBuffer = (buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) => {
        if (inputSampleRate === outputSampleRate) return buffer;
        const sampleRateRatio = inputSampleRate / outputSampleRate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
          let accum = 0;
          let count = 0;
          for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
            accum += buffer[i];
            count += 1;
          }
          result[offsetResult] = count > 0 ? accum / count : 0;
          offsetResult += 1;
          offsetBuffer = nextOffsetBuffer;
        }
        return result;
      };

      const encodeWav = (float32Array: Float32Array) => {
        const pcm16 = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i += 1) {
          const s = Math.max(-1, Math.min(1, float32Array[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        const buffer = new ArrayBuffer(44 + pcm16.length * 2);
        const view = new DataView(buffer);
        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i += 1) view.setUint8(offset + i, string.charCodeAt(i));
        };
        writeString(0, "RIFF");
        view.setUint32(4, 36 + pcm16.length * 2, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, TARGET_SAMPLE_RATE, true);
        view.setUint32(28, TARGET_SAMPLE_RATE * 2, true);
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
      };

      const processQueue = async () => {
        if (isSending) return;
        isSending = true;
        while (chunkQueue.length > 0) {
          const blob = chunkQueue.shift();
          if (!blob) continue;
          setCaptionStatus("Transcribing latest speech chunk…");
          const formData = new FormData();
          formData.append("audio", blob, "chunk.wav");
          formData.append("language", "ko");
          const response = await fetch(TRANSCRIBE_ENDPOINT, { method: "POST", body: formData });
          const data = await response.json();
          if (response.ok && data.text?.trim()) appendTranscriptLine(`You: ${data.text.trim()}`);
        }
        isSending = false;
        setCaptionStatus("Captions running.");
      };

      processorNode.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleBuffer(inputData, audioContext.sampleRate, TARGET_SAMPLE_RATE);
        let sumSquares = 0;
        for (let i = 0; i < downsampled.length; i += 1) sumSquares += downsampled[i] ** 2;
        const rms = Math.sqrt(sumSquares / downsampled.length);
        if (rms >= SILENCE_RMS_THRESHOLD) {
          speechFrameCount += 1;
          pcmChunks.push(new Float32Array(downsampled));
        }
      };

      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);

      const flushInterval = window.setInterval(() => {
        if (speechFrameCount < MIN_SPEECH_FRAMES_PER_CHUNK || pcmChunks.length === 0) {
          pcmChunks.length = 0;
          speechFrameCount = 0;
          return;
        }
        const totalLength = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const merged = new Float32Array(totalLength);
        let offset = 0;
        pcmChunks.forEach((chunk) => {
          merged.set(chunk, offset);
          offset += chunk.length;
        });
        pcmChunks.length = 0;
        speechFrameCount = 0;
        chunkQueue.push(encodeWav(merged));
        processQueue();
      }, CHUNK_MS);

      (window as unknown as { __kqStopCaptions?: () => void }).__kqStopCaptions = () => {
        window.clearInterval(flushInterval);
        processorNode.disconnect();
        sourceNode.disconnect();
        mediaStream.getTracks().forEach((track) => track.stop());
        audioContext.close().catch(() => {});
        setCapturing(false);
        setCaptionMode("idle");
        setCaptionStatus("Captions stopped.");
      };
    } catch {
      setCaptionMode("error");
      setCaptionStatus("Could not start microphone captions.");
    }
  };

  const stopCaptions = () => {
    (window as unknown as { __kqStopCaptions?: () => void }).__kqStopCaptions?.();
  };

  const roleLabel =
    role === "host" ? "Moderator" : role === "student" ? "Student" : "No role";
  const roleClass = role === "host" ? "role-pill host" : role === "student" ? "role-pill student" : "role-pill";

  return (
    <>
      <Script src="https://meet.jit.si/external_api.js" onLoad={() => setJitsiReady(true)} />

      <section className="video-hero">
        <div className="video-hero__text">
          <p className="eyebrow">Speaking Practice</p>
          <h1 className="video-title">Korean Call Room</h1>
          <p className="video-subtitle">
            Create a private practice group or join one with a code, then practice Korean together with prompts,
            notes, live captions, and AI session summaries.
          </p>
        </div>
      </section>

      <section className="card room-gate-card">
        <div className="room-gate-top">
          <div>
            <h2 className="panel-title">Create or Join a Group</h2>
            <p className="muted">Create a code and share it, or enter a code from someone else.</p>
          </div>
          <div className="status-stack">
            <span id="callStatus" className={`status-pill${inCall ? " live" : ""}`}>
              {inCall ? "In call" : "Not in call"}
            </span>
            <span id="roleBadge" className={roleClass}>
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="room-gate-grid kq-stagger">
          <div className="room-box">
            <h3>Create Group</h3>
            <p className="muted">Generate a code, enter the room immediately, and share it with your partner.</p>
            <div className="room-box__controls">
              <div className="code-display-wrap">
                <div id="generatedCode" className="code-display">
                  {roomCode || "------"}
                </div>
                <button id="copyCodeBtn" className="mini-btn" type="button" onClick={copyCurrentCode}>
                  {copyLabel}
                </button>
              </div>
              <button
                id="createGroupBtn"
                className="btn room-action-btn"
                type="button"
                onClick={() => {
                  const code = generateRoomCode();
                  setRoomCode(code);
                  addSessionXP(5);
                  joinCall(code, "host");
                }}
              >
                Create Group
              </button>
            </div>
          </div>

          <div className="room-box">
            <h3>Join Group</h3>
            <p className="muted">Paste the moderator&apos;s code to join the same call.</p>
            <div className="room-box__controls">
              <label className="sr-only" htmlFor="joinCodeInput">
                Room code
              </label>
              <input
                id="joinCodeInput"
                className="text-input room-input"
                type="text"
                placeholder="Enter code..."
                maxLength={12}
                autoComplete="off"
                value={joinInput}
                onChange={(e) => setJoinInput(sanitizeCode(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSessionXP(5);
                    joinCall(joinInput, "student");
                  }
                }}
              />
              <button
                id="joinGroupBtn"
                className="btn room-action-btn"
                type="button"
                onClick={() => {
                  addSessionXP(5);
                  joinCall(joinInput, "student");
                }}
              >
                Join Group
              </button>
            </div>
          </div>
        </div>

        <div className="current-room-bar">
          <span className="current-room-label">Current room:</span>
          <strong id="currentRoomCode">{roomCode || "None"}</strong>
        </div>
      </section>

      <section className="video-row">
        <section className="card call-stage-card">
          <div className="call-stage-top">
            <div>
              <h2 className="panel-title">Call Room</h2>
              <p className="muted">The creator joins as the first participant. Anyone using the same code joins the same room.</p>
            </div>
            <div className="call-status-wrap">
              <span id="callTimer" className="timer-pill">
                {callTimer}
              </span>
            </div>
          </div>

          <div id="meetWrap" className="meet-wrap">
            <div id="meetMount" ref={meetMountRef} className="meet-mount" />
            <div id="meetPlaceholder" className="meet-placeholder" hidden={inCall}>
              <div className="meet-placeholder__inner">
                <h3>Room not started yet</h3>
              </div>
            </div>
          </div>

          <div className="call-actions">
            <button
              id="leaveCallBtn"
              className="btn secondary"
              type="button"
              disabled={!inCall}
              onClick={() => {
                destroyMeeting();
                setInCall(false);
                if (timerRef.current) window.clearInterval(timerRef.current);
              }}
            >
              Leave Call
            </button>
            <button
              id="completeSessionBtn"
              className="btn ghost"
              type="button"
              disabled={!inCall}
              onClick={() => generateSummary()}
            >
              Finish &amp; Generate Summary
            </button>
          </div>
        </section>

        <aside className="video-side">
          <section className="card notes-card">
            <div className="tool-panel__head">
              <h2 className="panel-title">Shared Notes</h2>
              <button id="saveNotesBtn" className="mini-btn" type="button" onClick={saveNotes}>
                Save
              </button>
            </div>
            <textarea
              id="sharedNotes"
              className="notes-area"
              placeholder="Write notes from the conversation..."
              value={sharedNotes}
              onChange={(e) => {
                setSharedNotes(e.target.value);
                localStorage.setItem("kq_video_notes", e.target.value);
              }}
            />
          </section>

          <section className="card tool-panel">
            <div className="tool-panel__head">
              <h3>Roleplay Mission</h3>
              <button
                id="newMissionBtn"
                className="mini-btn"
                type="button"
                onClick={() => {
                  setMission(pickRandom(missions));
                  addSessionXP(5);
                }}
              >
                New Mission
              </button>
            </div>
            <div className="mission-card">
              <p className="mission-label">Current mission</p>
              <h4 id="missionTitle">{mission.title}</h4>
              <p id="missionDesc" className="muted">
                {mission.desc}
              </p>
              <div>
                <p className="mission-label">Target words</p>
                <div id="missionWords" className="chip-row">
                  {mission.words.map((word) => (
                    <span key={word} className="chip">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
              <p className="muted" style={{ marginTop: 10 }}>
                Session XP: <strong id="xpValue">{sessionXp}</strong>
              </p>
            </div>
          </section>
        </aside>
      </section>

      <section className="card">
        <div className="tool-panel__head transcript-head">
          <div>
            <h2 className="panel-title">Call Transcript</h2>
            <p className="muted transcript-sub">Start captions to transcribe your microphone automatically every few seconds.</p>
          </div>
          <div className="transcript-controls">
            <span
              id="liveTranscriptStatus"
              className={`live-pill${captionMode === "live" ? " is-live" : captionMode === "error" ? " is-error" : " is-idle"}`}
            >
              {captionStatus}
            </span>
            <button id="startLiveTranscriptBtn" className="btn" type="button" disabled={capturing} onClick={startCaptions}>
              Start Captions
            </button>
            <button id="stopLiveTranscriptBtn" className="btn secondary" type="button" disabled={!capturing} onClick={stopCaptions}>
              Stop Captions
            </button>
            <button
              id="clearTranscriptBtn"
              className="btn ghost"
              type="button"
              onClick={() => {
                transcriptLinesRef.current = [];
                setTranscript("");
                setCaptionStatus("Transcript cleared.");
              }}
            >
              Clear
            </button>
            <button id="aiSummaryBtn" className="btn" type="button" onClick={generateSummary}>
              Generate AI Summary
            </button>
          </div>
        </div>

        <textarea
          id="callTranscript"
          className="notes-area transcript-area"
          placeholder="Your live transcript will appear here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />

        <p id="liveTranscriptHint" className="muted" aria-live="polite">
          {captionStatus}
        </p>
        <p id="aiSummaryStatus" className="muted" aria-live="polite">
          {summaryStatus}
        </p>
      </section>

      <section id="summarySection" className="card summary-card" hidden={!summaryVisible}>
        <div className="summary-top">
          <div>
            <p className="eyebrow">AI Session Summary</p>
            <h2 className="summary-title">Your speaking session recap</h2>
          </div>
          <div className="summary-xp">
            <span>XP Earned</span>
            <strong id="summaryXp">{String(summaryData?.xpEarned ?? sessionXp)}</strong>
          </div>
        </div>

        <div className="summary-grid kq-stagger">
          {[
            ["summaryTopics", "Topics Practiced", summaryData?.topicsPracticed],
            ["summaryWords", "Words Used", summaryData?.wordsUsed],
            ["summaryStrengths", "Strengths", summaryData?.strengths],
            ["summaryWeaknesses", "Weaknesses", summaryData?.weaknesses],
            ["summaryRecommendations", "Recommended Next Steps", summaryData?.recommendedNextSteps],
            ["summaryDailyQuests", "Daily Quests", summaryData?.dailyQuests],
          ].map(([id, title, items]) => (
            <div key={id as string} className="summary-panel">
              <h3>{title as string}</h3>
              <ul id={id as string} className="summary-list">
                {Array.isArray(items)
                  ? items.map((item) => (
                      <li key={String(item)}>{String(item)}</li>
                    ))
                  : null}
              </ul>
            </div>
          ))}
        </div>

        <div className="summary-note-box">
          <h3>Coach Note</h3>
          <p id="summaryCoachNote" className="summary-note">
            {String(summaryData?.coachNote || "Great work.")}
          </p>
        </div>
        <div className="summary-note-box">
          <h3>Call Summary</h3>
          <p id="summaryParagraph" className="summary-note">
            {String(summaryData?.summaryParagraph || "No summary yet.")}
          </p>
        </div>
      </section>
    </>
  );
}

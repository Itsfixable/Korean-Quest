/**
 * WebRTC Video Room (2-person)
 * Requires a WebSocket signaling server.
 *
 * URL format: video.html?room=abc123
 *
 * Signaling protocol used (JSON):
 *  - { type:"join", room, clientId }
 *  - { type:"peer-joined", room, clientId } (server -> others)
 *  - { type:"offer", room, from, sdp }
 *  - { type:"answer", room, from, sdp }
 *  - { type:"ice", room, from, candidate }
 *  - { type:"peer-left", room, clientId } (server -> others)
 */

const $ = (id) => document.getElementById(id);

// ✅ IMPORTANT: Put your signaling server WebSocket URL here.
// Example: "wss://your-worker.yourname.workers.dev/ws"
const SIGNALING_URL = "wss://YOUR_SIGNALING_SERVER_HERE";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const room = new URLSearchParams(location.search).get("room") || "";
const roomId = room.trim() || "demo";

const clientId =
  (crypto?.randomUUID?.() || `client_${Math.random().toString(16).slice(2)}`);

const statusPill = $("statusPill");
const debugLine = $("debugLine");
const roomLabel = $("roomLabel");

const joinBtn = $("joinBtn");
const leaveBtn = $("leaveBtn");
const copyLinkBtn = $("copyLinkBtn");
const muteMic = $("muteMic");
const muteCam = $("muteCam");

const localVideo = $("localVideo");
const remoteVideo = $("remoteVideo");

roomLabel.textContent = roomId;

let ws = null;
let pc = null;
let localStream = null;
let remoteStream = null;

function log(msg) {
  console.log("[video]", msg);
  debugLine.textContent = String(msg);
}

function setStatus(text) {
  statusPill.textContent = text;
}

function wsSend(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

/**
 * Creates a RTCPeerConnection and wires handlers.
 */
function createPeerConnection() {
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // Remote stream
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  pc.ontrack = (event) => {
    for (const track of event.streams[0].getTracks()) {
      remoteStream.addTrack(track);
    }
  };

  // ICE candidates -> signaling
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      wsSend({
        type: "ice",
        room: roomId,
        from: clientId,
        candidate: event.candidate,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    setStatus(`PC: ${pc.connectionState}`);
  };

  pc.oniceconnectionstatechange = () => {
    // Helpful debug
    log(`ICE: ${pc.iceConnectionState}`);
  };

  return pc;
}

async function startLocalMedia() {
  // Request camera + mic
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localVideo.srcObject = localStream;

  // Apply mute toggles
  applyMuteSettings();

  return localStream;
}

function applyMuteSettings() {
  if (!localStream) return;

  const audioTracks = localStream.getAudioTracks();
  const videoTracks = localStream.getVideoTracks();

  // checked = muted/disabled
  const micMuted = !!muteMic.checked;
  const camDisabled = !!muteCam.checked;

  audioTracks.forEach((t) => (t.enabled = !micMuted));
  videoTracks.forEach((t) => (t.enabled = !camDisabled));
}

async function connectSignaling() {
  if (!SIGNALING_URL.startsWith("ws")) {
    throw new Error(
      `SIGNALING_URL is not set. Put your WebSocket URL in video.js (currently: "${SIGNALING_URL}")`
    );
  }

  ws = new WebSocket(SIGNALING_URL);

  ws.onopen = () => {
    setStatus("Signaling connected");
    wsSend({ type: "join", room: roomId, clientId });
  };

  ws.onclose = () => {
    setStatus("Signaling closed");
  };

  ws.onerror = (e) => {
    console.error(e);
    setStatus("Signaling error");
  };

  ws.onmessage = async (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    if (!msg || msg.room !== roomId) return;
    if (msg.from && msg.from === clientId) return;

    // Ensure peer connection exists
    if (!pc) createPeerConnection();

    // If we haven't added our tracks yet, do it now
    if (localStream && pc.getSenders().length === 0) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    }

    switch (msg.type) {
      case "peer-joined":
        // Someone else joined — we initiate offer
        log("Peer joined. Creating offer...");
        await makeOffer();
        break;

      case "offer":
        log("Received offer. Creating answer...");
        await pc.setRemoteDescription(msg.sdp);
        await makeAnswer();
        break;

      case "answer":
        log("Received answer.");
        await pc.setRemoteDescription(msg.sdp);
        break;

      case "ice":
        if (msg.candidate) {
          try {
            await pc.addIceCandidate(msg.candidate);
          } catch (err) {
            console.warn("addIceCandidate failed:", err);
          }
        }
        break;

      case "peer-left":
        log("Peer left.");
        // Clear remote video
        if (remoteStream) {
          remoteStream.getTracks().forEach((t) => t.stop());
          remoteStream = null;
        }
        remoteVideo.srcObject = null;
        break;

      default:
        break;
    }
  };
}

async function makeOffer() {
  if (!pc) createPeerConnection();

  // Add local tracks if not present
  if (localStream && pc.getSenders().length === 0) {
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
  }

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  wsSend({
    type: "offer",
    room: roomId,
    from: clientId,
    sdp: pc.localDescription,
  });
}

async function makeAnswer() {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  wsSend({
    type: "answer",
    room: roomId,
    from: clientId,
    sdp: pc.localDescription,
  });
}

async function joinCall() {
  joinBtn.disabled = true;
  setStatus("Starting media...");

  try {
    await startLocalMedia();
  } catch (err) {
    joinBtn.disabled = false;
    setStatus("Camera blocked");
    log(`getUserMedia error: ${err.name || ""} ${err.message || err}`);
    return;
  }

  setStatus("Connecting signaling...");
  try {
    await connectSignaling();
  } catch (err) {
    joinBtn.disabled = false;
    setStatus("No signaling");
    log(err.message || String(err));
    return;
  }

  // Create PC now so it’s ready
  createPeerConnection();

  // Add local tracks immediately
  for (const track of localStream.getTracks()) {
    pc.addTrack(track, localStream);
  }

  leaveBtn.disabled = false;
  setStatus("Ready (waiting for peer)");
  log(`Joined room "${roomId}" as ${clientId}`);
}

function leaveCall() {
  try {
    wsSend({ type: "peer-left", room: roomId, clientId });
  } catch {}

  if (ws) {
    try { ws.close(); } catch {}
    ws = null;
  }

  if (pc) {
    try { pc.close(); } catch {}
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach((t) => t.stop());
    remoteStream = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  joinBtn.disabled = false;
  leaveBtn.disabled = true;

  setStatus("Left");
  log("Left call.");
}

function copyRoomLink() {
  const url = new URL(location.href);
  url.searchParams.set("room", roomId);

  navigator.clipboard
    .writeText(url.toString())
    .then(() => log("Room link copied!"))
    .catch(() => log("Could not copy link (clipboard blocked)."));
}

joinBtn.addEventListener("click", joinCall);
leaveBtn.addEventListener("click", leaveCall);
copyLinkBtn.addEventListener("click", copyRoomLink);

muteMic.addEventListener("change", applyMuteSettings);
muteCam.addEventListener("change", applyMuteSettings);

// Helpful hint if user forgot room param
if (!new URLSearchParams(location.search).get("room")) {
  log(`Tip: add ?room=abc123 to the URL to create/share a room.`);
} 
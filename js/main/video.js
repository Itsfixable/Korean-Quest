// video.js — launches embedded Jitsi Meet room
import { applyTheme } from "./theme.js";

console.log("[KQ] video.js loaded");

// Load external Jitsi script dynamically
const script = document.createElement("script");
script.src = "https://meet.jit.si/external_api.js";
script.onload = initMeet;
document.head.appendChild(script);

function initMeet() {
  const params = new URLSearchParams(location.search);
  const room = params.get("room") || "KQ_DemoRoom";
  const nameEl = document.getElementById("roomName");
  if (nameEl) nameEl.textContent = room;

  const domain = "meet.jit.si";
  const options = {
    roomName: room,
    parentNode: document.getElementById("meet"),
    userInfo: { displayName: localStorage.getItem("kq-display") || "KQ Student" },
    configOverwrite: { prejoinConfig: { enabled: true } },
    interfaceConfigOverwrite: { DEFAULT_REMOTE_DISPLAY_NAME: "Student" },
  };

  // eslint-disable-next-line no-undef
  const api = new JitsiMeetExternalAPI(domain, options);
  window.addEventListener("beforeunload", () => api.dispose());
}

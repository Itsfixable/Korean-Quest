const JITSI_DOMAIN = "meet.jit.si";
const ROOM_PREFIX = "KoreanQuest";

const missions = [
  {
    title: "Order Food",
    desc: "One person is the customer and one is the server.",
    words: ["김치", "물", "주세요", "밥"],
    topic: "Food ordering",
  },
  {
    title: "Introduce Yourself",
    desc: "Practice names, age, school, and hobbies.",
    words: ["안녕하세요", "이름", "학교", "좋아해요"],
    topic: "Introductions",
  },
  {
    title: "Talk About School",
    desc: "Describe classes, teachers, and your favorite subject.",
    words: ["학교", "수업", "선생님", "과목"],
    topic: "School life",
  },
  {
    title: "Favorite Foods",
    desc: "Ask what foods each person likes and dislikes.",
    words: ["사과", "빵", "우유", "좋아해요"],
    topic: "Food vocabulary",
  },
  {
    title: "Plan a Day Out",
    desc: "Pretend you are making weekend plans together.",
    words: ["오늘", "내일", "가요", "만나요"],
    topic: "Planning",
  },
];

const prompts = [
  {
    english: "What food do you like the most?",
    korean: "가장 좋아하는 음식이 뭐예요?",
    topic: "Food conversation",
  },
  {
    english: "What class do you like at school?",
    korean: "학교에서 어떤 수업을 좋아해요?",
    topic: "School conversation",
  },
  {
    english: "What do you do after school?",
    korean: "방과 후에 뭐 해요?",
    topic: "Daily routine",
  },
  {
    english: "What is your favorite Korean word so far?",
    korean: "지금까지 가장 좋아하는 한국어 단어는 뭐예요?",
    topic: "Reflection",
  },
  {
    english: "Where do you want to go this weekend?",
    korean: "이번 주말에 어디 가고 싶어요?",
    topic: "Travel and plans",
  },
  {
    english: "What drink do you want right now?",
    korean: "지금 무슨 음료를 마시고 싶어요?",
    topic: "Food and drink",
  },
];

const els = {
  callStatus: document.getElementById("callStatus"),
  roleBadge: document.getElementById("roleBadge"),
  callTimer: document.getElementById("callTimer"),

  createGroupBtn: document.getElementById("createGroupBtn"),
  joinGroupBtn: document.getElementById("joinGroupBtn"),
  copyCodeBtn: document.getElementById("copyCodeBtn"),
  generatedCode: document.getElementById("generatedCode"),
  joinCodeInput: document.getElementById("joinCodeInput"),
  currentRoomCode: document.getElementById("currentRoomCode"),

  meetMount: document.getElementById("meetMount"),
  meetPlaceholder: document.getElementById("meetPlaceholder"),
  leaveCallBtn: document.getElementById("leaveCallBtn"),
  completeSessionBtn: document.getElementById("completeSessionBtn"),

  missionTitle: document.getElementById("missionTitle"),
  missionDesc: document.getElementById("missionDesc"),
  missionWords: document.getElementById("missionWords"),
  newMissionBtn: document.getElementById("newMissionBtn"),

  promptText: document.getElementById("promptText"),
  promptSubtext: document.getElementById("promptSubtext"),
  newPromptBtn: document.getElementById("newPromptBtn"),

  xpValue: document.getElementById("xpValue"),
  trackedWordCount: document.getElementById("trackedWordCount"),
  promptCount: document.getElementById("promptCount"),
  missionStatus: document.getElementById("missionStatus"),

  wordForm: document.getElementById("wordForm"),
  wordInput: document.getElementById("wordInput"),
  wordList: document.getElementById("wordList"),
  clearWordsBtn: document.getElementById("clearWordsBtn"),

  sharedNotes: document.getElementById("sharedNotes"),
  saveNotesBtn: document.getElementById("saveNotesBtn"),

  aiSummaryBtn: document.getElementById("aiSummaryBtn"),
};

const state = {
  api: null,
  roomCode: "",
  inCall: false,
  role: "none",
  timerId: null,
  seconds: 0,
  xp: 0,
  promptsUsed: 0,
  missionComplete: false,
  currentMission: null,
  currentPrompt: null,
  words: [],
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function sanitizeCode(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getRoomNameFromCode(code) {
  return `${ROOM_PREFIX}-${code}`;
}

function saveNotes() {
  if (!els.sharedNotes) return;
  localStorage.setItem("kq_video_notes", els.sharedNotes.value);
}

function loadNotes() {
  if (!els.sharedNotes) return;
  const saved = localStorage.getItem("kq_video_notes");
  if (saved) els.sharedNotes.value = saved;
}

function renderWords() {
  if (!els.wordList || !els.trackedWordCount) return;

  els.wordList.innerHTML = "";

  if (state.words.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No vocabulary tracked yet.";
    els.wordList.appendChild(empty);
  } else {
    state.words.forEach((word, index) => {
      const chip = document.createElement("span");
      chip.className = "chip";

      const label = document.createElement("span");
      label.textContent = word;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.setAttribute("aria-label", `Remove ${word}`);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        state.words.splice(index, 1);
        updateStats();
        renderWords();
      });

      chip.append(label, removeBtn);
      els.wordList.appendChild(chip);
    });
  }

  els.trackedWordCount.textContent = String(state.words.length);
}

function renderMission(mission) {
  state.currentMission = mission;

  if (els.missionTitle) els.missionTitle.textContent = mission.title;
  if (els.missionDesc) els.missionDesc.textContent = mission.desc;

  if (!els.missionWords) return;
  els.missionWords.innerHTML = "";

  mission.words.forEach((word) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = word;
    els.missionWords.appendChild(chip);
  });
}

function renderPrompt(prompt) {
  state.currentPrompt = prompt;
  if (els.promptText) els.promptText.textContent = prompt.english;
  if (els.promptSubtext) els.promptSubtext.textContent = prompt.korean;
}

function updateStats() {
  if (els.xpValue) els.xpValue.textContent = String(state.xp);
  if (els.promptCount) els.promptCount.textContent = String(state.promptsUsed);
  if (els.trackedWordCount) {
    els.trackedWordCount.textContent = String(state.words.length);
  }
  if (els.missionStatus) {
    els.missionStatus.textContent = state.missionComplete ? "Yes" : "No";
  }
}

function addXP(amount) {
  state.xp += amount;
  updateStats();
}

function startTimer() {
  stopTimer();
  state.seconds = 0;
  if (els.callTimer) els.callTimer.textContent = "00:00";

  state.timerId = window.setInterval(() => {
    state.seconds += 1;
    if (els.callTimer) els.callTimer.textContent = formatTime(state.seconds);

    if (state.seconds > 0 && state.seconds % 60 === 0) {
      addXP(10);
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function setRole(role) {
  state.role = role;

  if (!els.roleBadge) return;

  if (role === "host") {
    els.roleBadge.textContent = "Moderator";
    els.roleBadge.className = "role-pill host";
  } else if (role === "student") {
    els.roleBadge.textContent = "Student";
    els.roleBadge.className = "role-pill student";
  } else {
    els.roleBadge.textContent = "No role";
    els.roleBadge.className = "role-pill";
  }
}

function setCallUI(isLive) {
  state.inCall = isLive;

  if (els.leaveCallBtn) els.leaveCallBtn.disabled = !isLive;
  if (els.completeSessionBtn) els.completeSessionBtn.disabled = !isLive;

  if (els.callStatus) {
    if (isLive) {
      els.callStatus.textContent = "In call";
      els.callStatus.classList.add("live");
    } else {
      els.callStatus.textContent = "Not in call";
      els.callStatus.classList.remove("live");
    }
  }

  if (els.meetPlaceholder) {
    els.meetPlaceholder.hidden = isLive;
  }
}

function setRoomCode(code) {
  state.roomCode = sanitizeCode(code);

  if (els.generatedCode) {
    els.generatedCode.textContent = state.roomCode || "------";
  }

  if (els.currentRoomCode) {
    els.currentRoomCode.textContent = state.roomCode || "None";
  }
}

function copyCurrentCode() {
  if (!state.roomCode) return;

  navigator.clipboard.writeText(state.roomCode).then(() => {
    if (!els.copyCodeBtn) return;

    els.copyCodeBtn.textContent = "Copied";
    window.setTimeout(() => {
      els.copyCodeBtn.textContent = "Copy";
    }, 1200);
  });
}

function destroyMeeting() {
  if (state.api) {
    try {
      state.api.dispose();
    } catch (error) {
      console.error("Error disposing Jitsi room:", error);
    }
    state.api = null;
  }

  if (els.meetMount) {
    els.meetMount.innerHTML = "";
  }
}

function joinCallWithCode(code) {
  const cleanCode = sanitizeCode(code);

  if (!cleanCode) {
    alert("Missing room code.");
    return;
  }

  if (!window.JitsiMeetExternalAPI) {
    alert("Jitsi failed to load. Refresh the page and try again.");
    return;
  }

  destroyMeeting();
  setRoomCode(cleanCode);

  const roomName = getRoomNameFromCode(cleanCode);

  state.api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
    roomName,
    parentNode: els.meetMount,
    width: "100%",
    height: "100%",
    configOverwrite: {
      prejoinPageEnabled: false,
      startWithAudioMuted: false,
      startWithVideoMuted: false,
    },
    interfaceConfigOverwrite: {
      MOBILE_APP_PROMO: false,
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
    },
  });

  setCallUI(true);
  startTimer();
  addXP(25);

  state.api.addEventListener("videoConferenceJoined", () => {
    console.log("Joined room:", roomName);
  });

  state.api.addEventListener("videoConferenceLeft", () => {
    leaveCall();
  });
}

function createGroup() {
  const code = generateRoomCode();
  setRole("host");
  setRoomCode(code);
  addXP(5);
  joinCallWithCode(code);
}

function joinGroup() {
  const code = sanitizeCode(els.joinCodeInput?.value || "");

  if (!code) {
    alert("Enter a valid room code first.");
    return;
  }

  setRole("student");
  setRoomCode(code);
  if (els.joinCodeInput) els.joinCodeInput.value = code;
  addXP(5);
  joinCallWithCode(code);
}

function leaveCall() {
  destroyMeeting();
  setCallUI(false);
  stopTimer();
}

function handleWordAdd(event) {
  event.preventDefault();

  const value = els.wordInput?.value?.trim();
  if (!value) return;

  if (!state.words.includes(value)) {
    state.words.push(value);
    addXP(5);
  }

  if (els.wordInput) els.wordInput.value = "";
  renderWords();
  updateStats();
}

function finishSession() {
  state.missionComplete = true;
  updateStats();

  if (els.aiSummaryBtn) {
    els.aiSummaryBtn.click();
  }
}

function initEvents() {
  els.createGroupBtn?.addEventListener("click", createGroup);
  els.joinGroupBtn?.addEventListener("click", joinGroup);
  els.copyCodeBtn?.addEventListener("click", copyCurrentCode);

  els.joinCodeInput?.addEventListener("input", (event) => {
    event.target.value = sanitizeCode(event.target.value);
  });

  els.joinCodeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      joinGroup();
    }
  });

  els.leaveCallBtn?.addEventListener("click", leaveCall);
  els.completeSessionBtn?.addEventListener("click", finishSession);

  els.newMissionBtn?.addEventListener("click", () => {
    renderMission(pickRandom(missions));
    addXP(5);
  });

  els.newPromptBtn?.addEventListener("click", () => {
    renderPrompt(pickRandom(prompts));
    state.promptsUsed += 1;
    addXP(5);
    updateStats();
  });

  els.wordForm?.addEventListener("submit", handleWordAdd);

  els.clearWordsBtn?.addEventListener("click", () => {
    state.words = [];
    renderWords();
    updateStats();
  });

  els.saveNotesBtn?.addEventListener("click", () => {
    saveNotes();
    addXP(5);
  });

  els.sharedNotes?.addEventListener("input", saveNotes);
}

function initDefaultState() {
  renderMission(pickRandom(missions));
  renderPrompt(pickRandom(prompts));
  renderWords();
  loadNotes();
  updateStats();
  setCallUI(false);
  setRole("none");
  setRoomCode("");
}

function boot() {
  initDefaultState();
  initEvents();
}

boot();
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
  callTimer: document.getElementById("callTimer"),

  createGroupBtn: document.getElementById("createGroupBtn"),
  joinGroupBtn: document.getElementById("joinGroupBtn"),
  copyCodeBtn: document.getElementById("copyCodeBtn"),
  generatedCode: document.getElementById("generatedCode"),
  joinCodeInput: document.getElementById("joinCodeInput"),
  currentRoomCode: document.getElementById("currentRoomCode"),

  meetMount: document.getElementById("meetMount"),
  meetPlaceholder: document.getElementById("meetPlaceholder"),
  joinCallBtn: document.getElementById("joinCallBtn"),
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

  summarySection: document.getElementById("summarySection"),
  summaryXp: document.getElementById("summaryXp"),
  summaryTopics: document.getElementById("summaryTopics"),
  summaryWords: document.getElementById("summaryWords"),
  summaryStrengths: document.getElementById("summaryStrengths"),
  summaryRecommendations: document.getElementById("summaryRecommendations"),
  summaryCoachNote: document.getElementById("summaryCoachNote"),
};

const state = {
  api: null,
  roomCode: "",
  inCall: false,
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
  localStorage.setItem("kq_video_notes", els.sharedNotes.value);
}

function loadNotes() {
  const saved = localStorage.getItem("kq_video_notes");
  if (saved) els.sharedNotes.value = saved;
}

function renderWords() {
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
  els.missionTitle.textContent = mission.title;
  els.missionDesc.textContent = mission.desc;
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
  els.promptText.textContent = prompt.english;
  els.promptSubtext.textContent = prompt.korean;
}

function updateStats() {
  els.xpValue.textContent = String(state.xp);
  els.promptCount.textContent = String(state.promptsUsed);
  els.trackedWordCount.textContent = String(state.words.length);
  els.missionStatus.textContent = state.missionComplete ? "Yes" : "No";
}

function addXP(amount) {
  state.xp += amount;
  updateStats();
}

function startTimer() {
  stopTimer();
  state.seconds = 0;
  els.callTimer.textContent = "00:00";

  state.timerId = window.setInterval(() => {
    state.seconds += 1;
    els.callTimer.textContent = formatTime(state.seconds);

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

function setCallUI(isLive) {
  state.inCall = isLive;

  els.joinCallBtn.disabled = !state.roomCode || isLive;
  els.leaveCallBtn.disabled = !isLive;
  els.completeSessionBtn.disabled = !isLive;

  if (isLive) {
    els.callStatus.textContent = "In call";
    els.callStatus.classList.add("live");
    els.meetPlaceholder.hidden = true;
  } else {
    els.callStatus.textContent = "Not in call";
    els.callStatus.classList.remove("live");
    els.meetPlaceholder.hidden = false;
  }
}

function setRoomCode(code) {
  state.roomCode = sanitizeCode(code);
  els.generatedCode.textContent = state.roomCode || "------";
  els.currentRoomCode.textContent = state.roomCode || "None";
  els.joinCallBtn.disabled = !state.roomCode || state.inCall;
}

function copyCurrentCode() {
  if (!state.roomCode) return;
  navigator.clipboard.writeText(state.roomCode).then(() => {
    els.copyCodeBtn.textContent = "Copied";
    window.setTimeout(() => {
      els.copyCodeBtn.textContent = "Copy";
    }, 1200);
  });
}

function createGroup() {
  const code = generateRoomCode();
  setRoomCode(code);
  addXP(5);
}

function joinGroup() {
  const code = sanitizeCode(els.joinCodeInput.value);
  if (!code) {
    alert("Enter a valid room code first.");
    return;
  }
  setRoomCode(code);
  els.joinCodeInput.value = code;
  addXP(5);
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
  els.meetMount.innerHTML = "";
}

function joinCall() {
  if (!state.roomCode) {
    alert("Create a group or join one with a code first.");
    return;
  }

  if (!window.JitsiMeetExternalAPI) {
    alert("Jitsi failed to load. Refresh the page and try again.");
    return;
  }

  destroyMeeting();

  const roomName = getRoomNameFromCode(state.roomCode);

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
    console.log("Joined Jitsi room");
  });

  state.api.addEventListener("videoConferenceLeft", () => {
    leaveCall();
  });
}

function leaveCall() {
  destroyMeeting();
  setCallUI(false);
  stopTimer();
}

function makeListItems(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function inferTopics() {
  const topics = new Set();

  if (state.currentMission?.topic) topics.add(state.currentMission.topic);
  if (state.currentPrompt?.topic) topics.add(state.currentPrompt.topic);

  const notes = els.sharedNotes.value.toLowerCase();

  if (notes.includes("food") || notes.includes("김치") || notes.includes("물")) {
    topics.add("Food vocabulary");
  }
  if (notes.includes("school") || notes.includes("수업") || notes.includes("학교")) {
    topics.add("School conversation");
  }
  if (
    notes.includes("introduce") ||
    notes.includes("이름") ||
    notes.includes("안녕하세요")
  ) {
    topics.add("Introductions");
  }

  if (topics.size === 0) topics.add("General speaking practice");

  return [...topics];
}

function inferStrengths() {
  const strengths = [];

  if (state.words.length >= 5) {
    strengths.push("You used a strong amount of target vocabulary during the session.");
  } else if (state.words.length >= 2) {
    strengths.push("You used multiple Korean words during the call, which is a great sign of recall.");
  } else {
    strengths.push("You completed a speaking session and started building speaking confidence.");
  }

  if (state.promptsUsed >= 2) {
    strengths.push("You explored multiple prompts, which helps build flexible conversation skills.");
  }

  if (state.missionComplete) {
    strengths.push("You completed your roleplay mission and practiced language in context.");
  }

  if (els.sharedNotes.value.trim().length > 25) {
    strengths.push("You took useful notes, which will help reinforce retention after the call.");
  }

  if (strengths.length === 0) {
    strengths.push("You showed up and practiced speaking, which is one of the best ways to improve.");
  }

  return strengths;
}

function inferRecommendations() {
  const recs = [];
  const words = state.words.map((w) => w.toLowerCase());
  const notes = els.sharedNotes.value.toLowerCase();

  if (words.length < 4) {
    recs.push("Review a short flashcard set before your next call so you can use more target words naturally.");
  }

  if (notes.includes("hard") || notes.includes("confusing") || notes.includes("forgot")) {
    recs.push("Revisit the words or phrases you marked as difficult in your notes.");
  }

  if (state.currentMission?.topic === "Food ordering") {
    recs.push("Try the Food Basics lesson and matching flashcards next.");
  }

  if (state.currentMission?.topic === "Introductions") {
    recs.push("Practice beginner Hangul and introduction phrases before your next session.");
  }

  if (!state.missionComplete) {
    recs.push("Finish the full mission next time for bonus XP and stronger speaking structure.");
  }

  if (recs.length < 3) {
    recs.push("Do one short speaking call again tomorrow to reinforce confidence and consistency.");
  }

  return recs.slice(0, 4);
}

function buildCoachNote(durationMinutes) {
  const topicText = inferTopics()[0];
  const usedWords = state.words.length;

  return `Nice work. You spent about ${durationMinutes} minute${
    durationMinutes === 1 ? "" : "s"
  } practicing ${topicText.toLowerCase()}. You tracked ${usedWords} word${
    usedWords === 1 ? "" : "s"
  } during the session, which gives you a strong base for your next review. Keep focusing on speaking complete phrases and reusing the mission vocabulary out loud.`;
}

function generateSummary() {
  leaveCall();

  if (state.seconds >= 120) addXP(30);
  if (state.words.length >= 4) addXP(20);
  if (state.promptsUsed >= 2) addXP(10);
  if (state.missionComplete) addXP(20);

  const topics = inferTopics();
  const strengths = inferStrengths();
  const recommendations = inferRecommendations();
  const durationMinutes = Math.max(1, Math.round(state.seconds / 60));

  makeListItems(els.summaryTopics, topics);
  makeListItems(
    els.summaryWords,
    state.words.length ? state.words : ["No words were manually tracked this session."]
  );
  makeListItems(els.summaryStrengths, strengths);
  makeListItems(els.summaryRecommendations, recommendations);

  els.summaryXp.textContent = String(state.xp);
  els.summaryCoachNote.textContent = buildCoachNote(durationMinutes);

  els.summarySection.hidden = false;
  els.summarySection.scrollIntoView({ behavior: "smooth", block: "start" });
  updateStats();
}

function handleWordAdd(event) {
  event.preventDefault();
  const value = els.wordInput.value.trim();

  if (!value) return;

  if (!state.words.includes(value)) {
    state.words.push(value);
    addXP(5);
  }

  els.wordInput.value = "";
  renderWords();
  updateStats();
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

  els.joinCallBtn?.addEventListener("click", joinCall);
  els.leaveCallBtn?.addEventListener("click", leaveCall);
  els.completeSessionBtn?.addEventListener("click", generateSummary);

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
  setRoomCode("");
}

function boot() {
  initDefaultState();
  initEvents();
}

boot();
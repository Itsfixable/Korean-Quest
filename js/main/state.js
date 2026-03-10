/* state.js — central game state, progression, achievements, adventure unlocks, and guide bubbles */

export const KQ_VERSION = "1.5.0";
const GUIDE_BUBBLE_PREF_KEY = "kq-guide-bubbles-enabled";
const KEY = "kq-state";
const DAILY_QUEST_XP_BONUS = 15;
const DAILY_ALL_XP_BONUS = 60;

const LESSON_UNLOCKS = {
  L1_hangul: { cap: 4, label: "Adventure Levels 1–4" },
  L2_vocab_food: { cap: 8, label: "Adventure Levels 5–8" },
  L3_greetings: { cap: 12, label: "Adventure Levels 9–12" },
};

const ACHIEVEMENTS = {
  "Lesson Starter": {
    icon: "📘",
    desc: "Complete your first lesson.",
  },
  "Hangul Hero": {
    icon: "🇰🇷",
    desc: "Finish your first lesson quest.",
  },
  "Tracing Starter": {
    icon: "✍️",
    desc: "Trace your first Korean character.",
  },
  "Battle Beginner": {
    icon: "⚔️",
    desc: "Win your first adventure battle.",
  },
  "Adventure Apprentice": {
    icon: "🗺️",
    desc: "Clear four adventure levels.",
  },
  "Boss Breaker": {
    icon: "👑",
    desc: "Defeat a boss level.",
  },
  "Lesson Explorer": {
    icon: "🧭",
    desc: "Complete all three starter lessons.",
  },
  "Quest Finisher": {
    icon: "✅",
    desc: "Complete every daily quest in one day.",
  },
  "Weekly Warrior": {
    icon: "🛡️",
    desc: "Reach the weekly XP goal.",
  },
  "Study Streak 3": {
    icon: "🔥",
    desc: "Keep a 3-day study streak.",
  },
  "Study Streak 7": {
    icon: "🌟",
    desc: "Keep a 7-day study streak.",
  },
  "XP Collector": {
    icon: "💎",
    desc: "Earn 250 total XP.",
  },
};

const DEFAULT = {
  player: {
    level: 1,
    xp: 0,
    totalXPEarned: 0,
    coins: 0,
    badges: [],
    streak: 0,
    lastLoginDate: null,
    inventory: [],
    equipped: { hat: null, bg: null },
  },
  progress: {
    lessonsDone: 0,
    completedLessonIds: [],
    quizzesDone: 0,
    battlesWon: 0,
    adventureCap: 1,
    recentWork: [],
    jamoStars: {},
  },
  quests: {
    daily: [],
    dailyAllBonusGiven: false,
    weekly: [
      {
        id: "w1",
        desc: "Earn 200 XP this week",
        target: 200,
        progress: 0,
        done: false,
        reward: { coins: 50, badge: "Weekly Warrior" },
      },
    ],
  },
  rsvps: {},
  leaderboard: [
    { name: "Minji Moon", xp: 1180, title: "Streak Queen", badge: "🔥", streak: 19 },
    { name: "Jae Park", xp: 1115, title: "Word Wizard", badge: "📚", streak: 16 },
    { name: "Hana Kim", xp: 1040, title: "Boss Breaker", badge: "👑", streak: 13 },
    { name: "Noah Lee", xp: 990, title: "Quest Climber", badge: "🧭", streak: 12 },
    { name: "Ari Choi", xp: 950, title: "Flashcard Ace", badge: "🃏", streak: 11 },
    { name: "Mina Song", xp: 910, title: "Pronunciation Pro", badge: "🎤", streak: 10 },
    { name: "Luca Shin", xp: 860, title: "Grammar Guard", badge: "🛡️", streak: 9 },
    { name: "Sora Han", xp: 825, title: "Hangul Hero", badge: "🇰🇷", streak: 8 },
    { name: "Ethan Yoo", xp: 780, title: "Adventure Scout", badge: "🗺️", streak: 7 },
    { name: "Nari Lim", xp: 745, title: "Quiz Champ", badge: "🏆", streak: 6 },
    { name: "Daniel Kwon", xp: 700, title: "Streak Saver", badge: "⏰", streak: 6 },
    { name: "Sujin Oh", xp: 660, title: "Lesson Explorer", badge: "📘", streak: 5 },
  ],
};

let KQ = null;
const subs = {};

export function on(topic, fn) {
  (subs[topic] ??= []).push(fn);
}

export function emit(topic, payload) {
  (subs[topic] || []).forEach((fn) => {
    try {
      fn(payload);
    } catch (error) {
      console.error("[KQ state] subscriber error", error);
    }
  });
}

function clone(value) {
  return structuredClone(value);
}

function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function mergeState(saved) {
  const merged = {
    ...clone(DEFAULT),
    ...saved,
    player: {
      ...clone(DEFAULT.player),
      ...(saved?.player || {}),
      equipped: {
        ...clone(DEFAULT.player.equipped),
        ...(saved?.player?.equipped || {}),
      },
    },
    progress: {
      ...clone(DEFAULT.progress),
      ...(saved?.progress || {}),
      completedLessonIds: asArray(saved?.progress?.completedLessonIds),
      recentWork: asArray(saved?.progress?.recentWork),
      jamoStars:
        saved?.progress?.jamoStars && typeof saved.progress.jamoStars === "object"
          ? saved.progress.jamoStars
          : {},
    },
    quests: {
      ...clone(DEFAULT.quests),
      ...(saved?.quests || {}),
      daily: asArray(saved?.quests?.daily),
      weekly: asArray(saved?.quests?.weekly, clone(DEFAULT.quests.weekly)),
    },
    rsvps: saved?.rsvps && typeof saved.rsvps === "object" ? saved.rsvps : {},
    leaderboard: asArray(saved?.leaderboard, clone(DEFAULT.leaderboard)),
  };

  merged.progress.lessonsDone = merged.progress.completedLessonIds.length;
  merged.progress.adventureCap = deriveAdventureCap(merged.progress.completedLessonIds);
  merged.player.totalXPEarned = Number(merged.player.totalXPEarned) || Number(merged.player.xp) || 0;

  return merged;
}

function dailyQuestTemplate() {
  return [
    {
      id: "xp-daily",
      desc: "Earn 30 XP today",
      target: 30,
      progress: 0,
      done: false,
      reward: { coins: 20 },
    },
    {
      id: "lesson-1",
      desc: "Complete 1 lesson",
      target: 1,
      progress: 0,
      done: false,
      reward: { coins: 10, badge: "Hangul Hero" },
    },
    {
      id: "battle-1",
      desc: "Win 1 battle",
      target: 1,
      progress: 0,
      done: false,
      reward: { coins: 10 },
    },
  ];
}

export function nowStr() {
  return new Date().toDateString();
}

export function load() {
  if (KQ) return KQ;

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      KQ = clone(DEFAULT);
      save();
      return KQ;
    }

    KQ = mergeState(JSON.parse(raw));
    return KQ;
  } catch (error) {
    console.warn("[KQ state] Failed to parse saved state. Resetting.", error);
    KQ = clone(DEFAULT);
    save();
    return KQ;
  }
}

export function save() {
  if (!KQ) KQ = clone(DEFAULT);
  localStorage.setItem(KEY, JSON.stringify(KQ));
}

export function resetAll() {
  KQ = clone(DEFAULT);
  save();
  emit("state:changed", KQ);
}

export function ensureDaily() {
  const s = load();
  const today = nowStr();

  if (s.player.lastLoginDate === today) return;

  if (!s.player.lastLoginDate) {
    s.player.streak = 1;
  } else {
    const prev = new Date(s.player.lastLoginDate);
    const curr = new Date(today);
    const diff = Math.round((curr - prev) / 86400000);
    s.player.streak = diff === 1 ? (s.player.streak || 0) + 1 : 1;
  }

  s.player.lastLoginDate = today;
  s.quests.dailyAllBonusGiven = false;
  s.quests.daily = dailyQuestTemplate();
  save();

  if (s.player.streak >= 3) addBadge("Study Streak 3");
  if (s.player.streak >= 7) addBadge("Study Streak 7");

  emit("state:changed", s);
}

export function getPlayer() {
  ensureDaily();
  return load().player;
}

export function getProgress() {
  ensureDaily();
  return load().progress;
}

export function getQuests() {
  ensureDaily();
  return load().quests;
}

export function getRSVPs() {
  ensureDaily();
  return load().rsvps;
}

export function getLeaderboard() {
  return load().leaderboard;
}

export function setStreak(days) {
  const s = load();
  s.player.streak = Math.max(0, Number(days) || 0);
  s.player.lastLoginDate = nowStr();
  save();
  emit("state:changed", s);
}

export function needXP(level) {
  return 100 * level;
}

function updateWeeklyProgress(amount) {
  const s = load();
  const weekly = asArray(s.quests.weekly);
  weekly.forEach((quest) => {
    if (quest.done) return;
    quest.progress = Math.min(quest.target, (Number(quest.progress) || 0) + amount);
    if (quest.progress >= quest.target) {
      quest.done = true;
      if (quest.reward?.coins) addCoins(quest.reward.coins);
      if (quest.reward?.badge) addBadge(quest.reward.badge);
      addRecentWork(`Completed weekly quest: ${quest.desc}`, "Quest");
    }
  });
  save();
}

export function addXP(amount, options = {}) {
  const s = load();
  const safeAmount = Math.max(0, Number(amount) || 0);
  const countForQuest = options.countForQuest !== false;

  s.player.xp += safeAmount;
  s.player.totalXPEarned += safeAmount;

  while (s.player.xp >= needXP(s.player.level)) {
    s.player.xp -= needXP(s.player.level);
    s.player.level += 1;
  }

  updateWeeklyProgress(safeAmount);

  if (s.player.totalXPEarned >= 250) addBadge("XP Collector");

  if (countForQuest) {
    incQuest("xp-daily", safeAmount);
  } else {
    save();
    emit("state:changed", s);
  }
}

export function addCoins(amount) {
  const s = load();
  s.player.coins += Math.max(0, Number(amount) || 0);
  save();
  emit("state:changed", s);
}

export function addBadge(name) {
  const s = load();
  const safe = String(name || "").trim();
  if (!safe) return;

  if (!s.player.badges.includes(safe)) {
    s.player.badges.push(safe);
    save();
    emit("state:changed", s);
  }
}

export function getAchievementMeta(name) {
  return ACHIEVEMENTS[name] || { icon: "🏅", desc: "Achievement unlocked." };
}

export function getAchievements() {
  const s = load();
  return (s.player.badges || []).map((name) => ({
    name,
    ...getAchievementMeta(name),
  }));
}

export function addRecentWork(title, type) {
  const s = load();
  s.progress.recentWork.unshift({
    title: String(title || "Completed activity"),
    type: String(type || "Activity"),
    ts: Date.now(),
  });
  s.progress.recentWork = s.progress.recentWork.slice(0, 8);
  save();
  emit("state:changed", s);
}

export function incQuest(id, amount = 1) {
  const s = load();
  ensureDaily();
  const q = s.quests.daily.find((item) => item.id === id);

  if (!q || q.done) {
    save();
    emit("state:changed", s);
    return;
  }

  q.progress += Number(amount) || 0;

  if (q.progress >= q.target) {
    q.progress = q.target;
    q.done = true;

    if (q.reward?.coins) addCoins(q.reward.coins);
    if (q.reward?.badge) addBadge(q.reward.badge);

    addXP(DAILY_QUEST_XP_BONUS, { countForQuest: false });
    addRecentWork(`Completed daily quest: ${q.desc} (+${DAILY_QUEST_XP_BONUS} XP)`, "Quest");

    const allDone = (s.quests.daily || []).every((item) => item.done);
    if (allDone && !s.quests.dailyAllBonusGiven) {
      s.quests.dailyAllBonusGiven = true;
      save();
      addBadge("Quest Finisher");
      addXP(DAILY_ALL_XP_BONUS, { countForQuest: false });
      addRecentWork(`All daily quests completed! (+${DAILY_ALL_XP_BONUS} XP)`, "Quest");
    }
  }

  save();
  emit("state:changed", s);
}

function deriveAdventureCap(completedLessonIds = []) {
  let cap = 1;
  completedLessonIds.forEach((lessonId) => {
    cap = Math.max(cap, LESSON_UNLOCKS[lessonId]?.cap || cap);
  });
  return cap;
}

function lessonLabelFromCap(cap) {
  if (cap >= 12) return "Adventure Levels 9–12";
  if (cap >= 8) return "Adventure Levels 5–8";
  if (cap >= 4) return "Adventure Levels 1–4";
  return "Level 1 only";
}

export function unlockAdventureTo(cap, reason = "lesson") {
  const s = load();
  const safeCap = Math.max(1, Number(cap) || 1);
  const prev = s.progress.adventureCap || 1;
  s.progress.adventureCap = Math.max(prev, safeCap);
  save();

  if (s.progress.adventureCap > prev) {
    addRecentWork(`Unlocked ${lessonLabelFromCap(s.progress.adventureCap)} from ${reason}`, "Unlock");
  }

  emit("state:changed", s);
}

export function getAdventureProgress() {
  const s = load();
  const completed = new Set(s.progress.completedLessonIds || []);
  const lessons = Object.entries(LESSON_UNLOCKS).map(([id, meta]) => ({
    id,
    cap: meta.cap,
    label: meta.label,
    done: completed.has(id),
  }));

  const nextLesson = lessons.find((lesson) => !lesson.done) || null;

  return {
    cap: s.progress.adventureCap || 1,
    lessons,
    nextLesson,
  };
}

export function markLessonComplete({ id, title, adventureUnlockCap } = {}) {
  const s = load();
  const safeId = String(id || "").trim();
  const safeTitle = String(title || safeId || "Completed lesson").trim();
  let firstCompletion = false;

  if (safeId && !s.progress.completedLessonIds.includes(safeId)) {
    s.progress.completedLessonIds.push(safeId);
    s.progress.lessonsDone = s.progress.completedLessonIds.length;
    s.progress.adventureCap = Math.max(s.progress.adventureCap || 1, adventureUnlockCap || LESSON_UNLOCKS[safeId]?.cap || 1);
    firstCompletion = true;
    save();
  }

  addRecentWork(firstCompletion ? safeTitle : `Reviewed ${safeTitle}`, "Lesson");
  addBadge("Lesson Starter");
  incQuest("lesson-1", 1);

  if (s.progress.completedLessonIds.length >= 3) {
    addBadge("Lesson Explorer");
  }

  if (firstCompletion && (adventureUnlockCap || LESSON_UNLOCKS[safeId]?.cap)) {
    unlockAdventureTo(adventureUnlockCap || LESSON_UNLOCKS[safeId].cap, safeTitle);
  }

  emit("state:changed", load());

  return { firstCompletion };
}

export function markQuizComplete(title = "Completed quiz") {
  const s = load();
  s.progress.quizzesDone += 1;
  save();
  addRecentWork(title, "Quiz");
  emit("state:changed", s);
}

export function markBattleWin(title = "Won 1 battle", options = {}) {
  const s = load();
  s.progress.battlesWon += 1;
  save();
  addRecentWork(title, "Battle");
  incQuest("battle-1", 1);

  if (s.progress.battlesWon >= 1) addBadge("Battle Beginner");
  if (s.progress.battlesWon >= 4) addBadge("Adventure Apprentice");
  if (options?.boss) addBadge("Boss Breaker");

  emit("state:changed", s);
}

export function getJamoStars(ch) {
  return load().progress.jamoStars?.[ch] ?? 0;
}

export function setJamoStars(ch, stars) {
  const s = load();
  const current = s.progress.jamoStars?.[ch] ?? 0;
  s.progress.jamoStars[ch] = Math.max(current, Number(stars) || 0);
  save();
  emit("state:changed", s);
}

export function toggleRSVP(eventId) {
  const s = load();
  s.rsvps[eventId] = s.rsvps[eventId] || { going: false };
  s.rsvps[eventId].going = !s.rsvps[eventId].going;
  save();
  emit("state:changed", s);
}

let bubbleTimer = null;
const GUIDE_STYLE_ID = "kq-guide-bubble-style";

function ensureGuideStyle() {
  if (document.getElementById(GUIDE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = GUIDE_STYLE_ID;
  style.textContent = `
  .kq-guide-bubble {
    position: fixed;
    max-width: 280px;
    z-index: 995;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(255,255,255,0.97);
    color: #1d2430;
    border: 1px solid rgba(90, 110, 150, 0.18);
    box-shadow: 0 12px 32px rgba(22, 34, 56, 0.14);
    font-size: 0.96rem;
    font-weight: 700;
    line-height: 1.45;
    transition: opacity 180ms ease, transform 180ms ease;
    backdrop-filter: blur(10px);
    margin-bottom: 10px;
  }

  .kq-guide-bubble::after {
    content: "";
    position: absolute;
    bottom: -12px;
    width: 20px;
    height: 20px;
    background: inherit;
    transform: rotate(45deg);
  }

  .kq-guide-bubble[data-side="left"]::after {
    left: 22px;
    border-right: 1px solid rgba(90, 110, 150, 0.18);
    border-bottom: 1px solid rgba(90, 110, 150, 0.18);
  }

  .kq-guide-bubble[data-side="right"]::after {
    right: 22px;
    border-right: 1px solid rgba(90, 110, 150, 0.18);
    border-bottom: 1px solid rgba(90, 110, 150, 0.18);
  }

  .kq-guide-bubble.is-hidden {
    opacity: 0;
    transform: translateY(8px);
  }

  .kq-guide-bubble strong {
    display: block;
    margin-bottom: 4px;
    font-size: 0.82rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #5b729f;
  }

  html[data-theme="dark"] .kq-guide-bubble {
    background: rgba(21, 28, 40, 0.95);
    color: #f5f7fb;
    border-color: rgba(255,255,255,0.1);
    box-shadow: 0 12px 34px rgba(0,0,0,0.35);
  }

  @media (max-width: 768px) {
    .kq-guide-bubble {
      left: 16px !important;
      right: 16px !important;
      max-width: none;
      bottom: 98px !important;
    }

    .kq-guide-bubble::after {
      left: 22px !important;
      right: auto !important;
    }
  }
`;
  document.head.appendChild(style);
}

export function areGuideBubblesEnabled() {
  const saved = localStorage.getItem(GUIDE_BUBBLE_PREF_KEY);
  if (saved === null) return true;
  return saved === "true";
}

export function setGuideBubblesEnabled(enabled) {
  localStorage.setItem(GUIDE_BUBBLE_PREF_KEY, String(Boolean(enabled)));

  document.querySelectorAll(".kq-guide-bubble").forEach((bubble) => {
    bubble.hidden = !enabled;
  });
}

export function mountGuideBubbleToggle() {
  if (document.getElementById("kqGuideBubbleToggle")) return;

  const wrap = document.createElement("div");
  wrap.id = "kqGuideBubbleToggle";
  wrap.className = "kq-guide-toggle";

  wrap.innerHTML = `
    <label class="kq-guide-toggle-label">
      <span>Guide Bubbles</span>
      <input type="checkbox" id="kqGuideBubbleCheckbox" ${areGuideBubblesEnabled() ? "checked" : ""}>
      <span class="kq-guide-toggle-slider"></span>
    </label>
  `;

  document.body.appendChild(wrap);

  const checkbox = wrap.querySelector("#kqGuideBubbleCheckbox");
  checkbox?.addEventListener("change", () => {
    setGuideBubblesEnabled(checkbox.checked);
  });
}
export function mountGuideBubble(messages = [], options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) return;
  ensureGuideStyle();
  mountGuideBubbleToggle();

  const label = String(options.label || "Guide");
  const bubbleId = options.id || "kq-guide-bubble";
  const side = options.side || "right";
  let bubble = document.getElementById(bubbleId);

  if (!bubble) {
    bubble = document.createElement("aside");
    bubble.id = bubbleId;
    bubble.className = "kq-guide-bubble";
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    document.body.appendChild(bubble);
  }

  bubble.hidden = !areGuideBubblesEnabled();
  bubble.dataset.side = side;
  bubble.style.left = "";
  bubble.style.right = "";
  bubble.style.bottom = "";

  const chatbotToggle =
    document.querySelector(".chatbot-toggle-btn") ||
    document.querySelector(".chatbot-toggle") ||
    document.querySelector("#chatbotToggle");

  if (chatbotToggle) {
    const rect = chatbotToggle.getBoundingClientRect();
    const bottomGap = window.innerHeight - rect.top + 18;
    bubble.style.bottom = `${Math.max(104, bottomGap)}px`;

    if (side === "right") {
      bubble.style.right = "26px";
      bubble.style.left = "auto";
    } else {
      bubble.style.left = "26px";
      bubble.style.right = "auto";
    }
  } else {
    bubble.style.bottom = "128px";
    if (side === "right") {
      bubble.style.right = "26px";
      bubble.style.left = "auto";
    } else {
      bubble.style.left = "26px";
      bubble.style.right = "auto";
    }
  }

  let idx = 0;
  const paint = () => {
    if (!areGuideBubblesEnabled()) {
      bubble.hidden = true;
      return;
    }

    bubble.hidden = false;
    bubble.classList.add("is-hidden");

    window.setTimeout(() => {
      bubble.innerHTML = `<strong>${label}</strong>${messages[idx % messages.length]}`;
      bubble.classList.remove("is-hidden");
      idx += 1;
    }, 120);
  };

  paint();
  if (bubbleTimer) window.clearInterval(bubbleTimer);
  bubbleTimer = window.setInterval(paint, Number(options.interval) || 7500);

  bubble.addEventListener("mouseenter", () => {
    if (bubbleTimer) window.clearInterval(bubbleTimer);
  });

  bubble.addEventListener("mouseleave", () => {
    if (bubbleTimer) window.clearInterval(bubbleTimer);
    bubbleTimer = window.setInterval(paint, Number(options.interval) || 7500);
  });
}
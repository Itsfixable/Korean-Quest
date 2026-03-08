/* state.js — global game state (XP, coins, badges, quests, recent work, RSVPs) */

export const KQ_VERSION = "1.3.0";

const DAILY_QUEST_XP_BONUS = 15;
const DAILY_ALL_XP_BONUS = 60;

const DEFAULT = {
  player: {
    level: 1,
    xp: 0,
    coins: 0,
    badges: [],
    streak: 0,
    lastLoginDate: null,
    inventory: [],
    equipped: { hat: null, bg: null },
  },

  progress: {
    lessonsDone: 0,
    quizzesDone: 0,
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
    { name: "Ava", xp: 420 },
    { name: "Noah", xp: 380 },
    { name: "Mia", xp: 350 },
    { name: "Liam", xp: 310 },
    { name: "Emma", xp: 290 },
    { name: "Sophia", xp: 270 },
    { name: "Ethan", xp: 250 },
    { name: "Olivia", xp: 220 },
    { name: "James", xp: 180 },
  ],
};

const KEY = "kq-state";
let KQ = null;

function clone(value) {
  return structuredClone(value);
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

    const parsed = JSON.parse(raw);
    KQ = {
      ...clone(DEFAULT),
      ...parsed,
      player: {
        ...clone(DEFAULT.player),
        ...(parsed.player || {}),
      },
      progress: {
        ...clone(DEFAULT.progress),
        ...(parsed.progress || {}),
        recentWork: Array.isArray(parsed.progress?.recentWork)
          ? parsed.progress.recentWork
          : [],
        jamoStars:
          parsed.progress?.jamoStars && typeof parsed.progress.jamoStars === "object"
            ? parsed.progress.jamoStars
            : {},
      },
      quests: {
        ...clone(DEFAULT.quests),
        ...(parsed.quests || {}),
        daily: Array.isArray(parsed.quests?.daily) ? parsed.quests.daily : [],
        weekly: Array.isArray(parsed.quests?.weekly)
          ? parsed.quests.weekly
          : clone(DEFAULT.quests.weekly),
      },
      rsvps: parsed.rsvps && typeof parsed.rsvps === "object" ? parsed.rsvps : {},
      leaderboard: Array.isArray(parsed.leaderboard)
        ? parsed.leaderboard
        : clone(DEFAULT.leaderboard),
    };

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
}

export function nowStr() {
  return new Date().toDateString();
}

/* ---------- XP / Coins / Badges ---------- */

export function needXP(level) {
  return 100 * level;
}

export function addXP(amount) {
  const s = load();
  const safeAmount = Math.max(0, Number(amount) || 0);

  s.player.xp += safeAmount;

  while (s.player.xp >= needXP(s.player.level)) {
    s.player.xp -= needXP(s.player.level);
    s.player.level += 1;
  }

  incQuest("xp-daily", safeAmount);
  save();
  emit("state:changed", s);
}

export function addCoins(amount) {
  const s = load();
  s.player.coins += Math.max(0, Number(amount) || 0);
  save();
  emit("state:changed", s);
}

export function addBadge(name) {
  const s = load();
  const label = String(name || "").trim();
  if (!label) return;

  if (!s.player.badges.includes(label)) {
    s.player.badges.push(label);
    save();
    emit("state:changed", s);
  }
}

/* ---------- Recent Work ---------- */

export function addRecentWork(title, type) {
  const s = load();
  const safeTitle = String(title || "").trim() || "Completed activity";
  const safeType = String(type || "").trim() || "Activity";

  s.progress.recentWork.unshift({
    title: safeTitle,
    type: safeType,
    ts: Date.now(),
  });

  s.progress.recentWork = s.progress.recentWork.slice(0, 6);
  save();
  emit("state:changed", s);
}

/* ---------- Daily quests / streak ---------- */

function buildDailyQuests() {
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

export function ensureDaily() {
  const s = load();
  const today = nowStr();

  if (s.player.lastLoginDate === today) {
    return;
  }

  if (!s.player.lastLoginDate) {
    s.player.streak = 1;
  } else {
    const prev = new Date(s.player.lastLoginDate);
    const curr = new Date(today);
    const diff = Math.round((curr - prev) / 86400000);

    if (diff === 1) {
      s.player.streak = (s.player.streak || 0) + 1;
    } else {
      s.player.streak = 1;
    }
  }

  s.player.lastLoginDate = today;
  s.quests.dailyAllBonusGiven = false;
  s.quests.daily = buildDailyQuests();

  save();
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

/* ---------- Quest progression ---------- */

export function incQuest(id, amount = 1) {
  const s = load();
  ensureDaily();

  const q = s.quests.daily.find((item) => item.id === id);
  if (!q || q.done) {
    save();
    return;
  }

  q.progress += Number(amount) || 0;

  if (q.progress >= q.target && !q.done) {
    q.done = true;

    if (q.reward?.coins) addCoins(q.reward.coins);
    if (q.reward?.badge) addBadge(q.reward.badge);

    addXP(DAILY_QUEST_XP_BONUS);
    addRecentWork(`Completed daily quest: ${q.desc} (+${DAILY_QUEST_XP_BONUS} XP)`, "Quest");

    const allDone = (s.quests.daily || []).every((item) => item.done);
    if (allDone && !s.quests.dailyAllBonusGiven) {
      s.quests.dailyAllBonusGiven = true;
      save();
      addXP(DAILY_ALL_XP_BONUS);
      addRecentWork(`All daily quests completed! (+${DAILY_ALL_XP_BONUS} XP)`, "Quest");
    }
  }

  save();
  emit("state:changed", s);
}

/* ---------- Lessons / Quizzes ---------- */

export function markLessonComplete({ id, title } = {}) {
  const s = load();
  s.progress.lessonsDone += 1;
  save();

  addRecentWork(title || id || "Completed lesson", "Lesson");
  addBadge("Lesson Starter");
  incQuest("lesson-1", 1);
}

export function markQuizComplete(title = "Completed quiz") {
  const s = load();
  s.progress.quizzesDone += 1;
  save();

  addRecentWork(title, "Quiz");
  emit("state:changed", s);
}

/* ---------- Tracing stars ---------- */

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

/* ---------- RSVPs ---------- */

export function toggleRSVP(eventId) {
  const s = load();
  s.rsvps[eventId] = s.rsvps[eventId] || { going: false };
  s.rsvps[eventId].going = !s.rsvps[eventId].going;
  save();
  emit("state:changed", s);
}

/* ---------- Tiny pub/sub ---------- */

const subs = {};

export function on(topic, fn) {
  (subs[topic] ??= []).push(fn);
}

export function emit(topic, payload) {
  (subs[topic] || []).forEach((fn) => fn(payload));
}
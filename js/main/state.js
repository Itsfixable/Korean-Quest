/* state.js — global game state (XP, coins, badges, quests, recent work, RSVPs) */

export const KQ_VERSION = "1.4.0";

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
    battlesWon: 0,
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

/* ---------- tiny pub/sub ---------- */

const subs = {};

export function on(topic, fn) {
  (subs[topic] ??= []).push(fn);
}

export function emit(topic, payload) {
  (subs[topic] || []).forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error("[KQ state] subscriber error", err);
    }
  });
}

/* ---------- helpers ---------- */

function clone(value) {
  return structuredClone(value);
}

function mergeState(saved) {
  return {
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
      recentWork: Array.isArray(saved?.progress?.recentWork)
        ? saved.progress.recentWork
        : [],
      jamoStars:
        saved?.progress?.jamoStars && typeof saved.progress.jamoStars === "object"
          ? saved.progress.jamoStars
          : {},
    },

    quests: {
      ...clone(DEFAULT.quests),
      ...(saved?.quests || {}),
      daily: Array.isArray(saved?.quests?.daily) ? saved.quests.daily : [],
      weekly: Array.isArray(saved?.quests?.weekly)
        ? saved.quests.weekly
        : clone(DEFAULT.quests.weekly),
    },

    rsvps: saved?.rsvps && typeof saved.rsvps === "object" ? saved.rsvps : {},
    leaderboard: Array.isArray(saved?.leaderboard)
      ? saved.leaderboard
      : clone(DEFAULT.leaderboard),
  };
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

/* ---------- load/save ---------- */

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

/* ---------- streak / daily reset ---------- */

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
  emit("state:changed", s);
}

/* ---------- getters ---------- */

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

/* ---------- manual sync helper ---------- */
/* Use once if you want both Home and Dashboard to show 2 days immediately. */
export function setStreak(days) {
  const s = load();
  s.player.streak = Math.max(0, Number(days) || 0);
  s.player.lastLoginDate = nowStr();
  save();
  emit("state:changed", s);
}

/* ---------- xp / coins / badges ---------- */

export function needXP(level) {
  return 100 * level;
}

export function addXP(amount, options = {}) {
  const s = load();
  const safeAmount = Math.max(0, Number(amount) || 0);
  const countForQuest = options.countForQuest !== false;

  s.player.xp += safeAmount;

  while (s.player.xp >= needXP(s.player.level)) {
    s.player.xp -= needXP(s.player.level);
    s.player.level += 1;
  }

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

/* ---------- recent work ---------- */

export function addRecentWork(title, type) {
  const s = load();

  s.progress.recentWork.unshift({
    title: String(title || "Completed activity"),
    type: String(type || "Activity"),
    ts: Date.now(),
  });

  s.progress.recentWork = s.progress.recentWork.slice(0, 6);
  save();
  emit("state:changed", s);
}

/* ---------- daily quest progression ---------- */

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
      addXP(DAILY_ALL_XP_BONUS, { countForQuest: false });
      addRecentWork(`All daily quests completed! (+${DAILY_ALL_XP_BONUS} XP)`, "Quest");
    }
  }

  save();
  emit("state:changed", s);
}

/* ---------- learning / battle hooks ---------- */

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

export function markBattleWin(title = "Won 1 battle") {
  const s = load();
  s.progress.battlesWon += 1;
  save();

  addRecentWork(title, "Battle");
  incQuest("battle-1", 1);
}

/* ---------- tracing stars ---------- */

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

/* ---------- schedule ---------- */

export function toggleRSVP(eventId) {
  const s = load();
  s.rsvps[eventId] = s.rsvps[eventId] || { going: false };
  s.rsvps[eventId].going = !s.rsvps[eventId].going;
  save();
  emit("state:changed", s);
}
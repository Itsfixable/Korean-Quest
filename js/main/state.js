/* state.js — global game state (XP, coins, badges, quests, recent work, RSVPs) */
export const KQ_VERSION = "1.2.0";

/* --- XP bonuses (tune these if you want) --- */
const DAILY_QUEST_XP_BONUS = 15;     // each quest completion
const DAILY_ALL_XP_BONUS   = 60;     // when ALL daily quests are complete

const DEFAULT = {
  player: {
    level: 1, xp: 0, coins: 0,
    badges: [], streak: 0, lastLoginDate: null,
    inventory: [], equipped: { hat:null, bg:null }
  },
  progress: {
    lessonsDone: 0, quizzesDone: 0,
    recentWork: [],                 // unified feed: Adventure / Tracing / Lessons / Quests
    jamoStars: {}                   // { 'ㄱ':3, ... }
  },
  quests: {
    daily: [],
    dailyAllBonusGiven: false,      // one-time bonus flag for the day
    weekly: [
      { id:"w1", desc:"Earn 200 XP this week", target:200, progress:0, done:false, reward:{coins:50,badge:"🌟 Weekly Warrior"} }
    ]
  },
  rsvps: {},
  leaderboard: [
    { name:"Ava", xp:420 }, 
    { name:"Noah", xp:380 }, 
    { name:"Mia", xp:350 },
    { name:"Liam", xp:310 },
    { name:"Emma", xp:290 },
    { name:"Sophia", xp:270 },
    { name:"Ethan", xp:250 },
    { name:"Olivia", xp:220 },
    { name:"James", xp:180 }
  ]
};

const KEY = "kq-state";
let KQ = null;

export function load(){ return KQ ?? (KQ = JSON.parse(localStorage.getItem(KEY) || "null") || structuredClone(DEFAULT)); }
export function save(){ localStorage.setItem(KEY, JSON.stringify(KQ)); }
export function resetAll(){ KQ = structuredClone(DEFAULT); save(); }
export function nowStr(){ return new Date().toDateString(); }

/* ---------- XP / Coins / Badges ---------- */
export function needXP(level){ return 100 * level; }
export function addXP(n){
  const s = load();
  s.player.xp += n;

  // level-up loop (carry extra XP forward)
  while (s.player.xp >= needXP(s.player.level)) {
    s.player.xp -= needXP(s.player.level);
    s.player.level++;
  }
  incQuest("xp-daily", n); // still counts toward daily XP quest
  save();
}
export function addCoins(n){ const s=load(); s.player.coins+=n; save(); }
export function addBadge(name){ const s=load(); if(!s.player.badges.includes(name)) s.player.badges.push(name); save(); }

/* ---------- Recent Work feed ---------- */
export function addRecentWork(title, type){
  const s = load();
  s.progress.recentWork ??= [];
  s.progress.recentWork.unshift({ title, type, ts: Date.now() });
  s.progress.recentWork = s.progress.recentWork.slice(0, 6);
  save();
}

/* ---------- Daily quests / streaks ---------- */
export function ensureDaily(){
  const s = load();
  const today = nowStr();
  if (s.player.lastLoginDate !== today){
    if (s.player.lastLoginDate){
      const prev = new Date(s.player.lastLoginDate);
      const diff = Math.round((new Date(today)-prev)/86400000);
      s.player.streak = (diff===1) ? (s.player.streak||0)+1 : 1;
    } else s.player.streak = 1;

    s.player.lastLoginDate = today;
    s.quests.dailyAllBonusGiven = false;  // reset daily all-complete bonus

    s.quests.daily = [
      { id:"xp-daily",  desc:"Earn 30 XP today",  target:30, progress:0, done:false, reward:{coins:20} },
      { id:"lesson-1",  desc:"Complete 1 lesson", target:1,  progress:0, done:false, reward:{coins:10,badge:"📜 Hangul Hero"} },
      { id:"battle-1",  desc:"Win 1 battle",      target:1,  progress:0, done:false, reward:{coins:10} }
    ];
    save();
  }
}

export function getPlayer(){ ensureDaily(); return load().player; }
export function getProgress(){ ensureDaily(); return load().progress; }
export function getQuests(){ ensureDaily(); return load().quests; }
export function getRSVPs(){ ensureDaily(); return load().rsvps; }
export function getLeaderboard(){ return load().leaderboard; }

/* ---------- Quest progression with XP bonuses ---------- */
export function incQuest(id,val){
  const s = load();
  ensureDaily();
  const q = s.quests.daily.find(q=>q.id===id);
  if(!q || q.done) { save(); return; }

  q.progress += val;
  if (q.progress >= q.target && !q.done){
    q.done = true;

    // Original rewards
    if (q.reward?.coins) addCoins(q.reward.coins);
    if (q.reward?.badge) addBadge(q.reward.badge);

    // 🆕 Per-quest XP bonus + log
    addXP(DAILY_QUEST_XP_BONUS);
    addRecentWork(`Completed daily quest: ${q.desc} (+${DAILY_QUEST_XP_BONUS} XP)`, "Quest");

    // 🆕 Check if ALL daily quests are done; award one-time bigger bonus
    const allDone = (s.quests.daily || []).every(item => item.done);
    if (allDone && !s.quests.dailyAllBonusGiven) {
      s.quests.dailyAllBonusGiven = true;
      addXP(DAILY_ALL_XP_BONUS);
      addRecentWork(`All daily quests completed! (+${DAILY_ALL_XP_BONUS} XP)`, "Quest");
    }
  }
  save();
}

/* ---------- Lessons / Quizzes ---------- */
export function markLessonComplete({id,title}){
  const s=load();
  s.progress.lessonsDone++;
  addRecentWork(title || "Completed lesson", "Lesson");
  addBadge("🏅 Lesson Starter");
  incQuest("lesson-1", 1);
  save();
}
export function markQuizComplete(){ const s=load(); s.progress.quizzesDone++; save(); }

/* ---------- Tracing stars ---------- */
export function getJamoStars(ch){ return load().progress.jamoStars?.[ch] ?? 0; }
export function setJamoStars(ch, stars){
  const s = load();
  const cur = s.progress.jamoStars?.[ch] ?? 0;
  s.progress.jamoStars[ch] = Math.max(cur, stars);
  save();
}

/* ---------- RSVPs (schedule) ---------- */
export function toggleRSVP(eventId){
  const s = load();
  s.rsvps[eventId] = s.rsvps[eventId] || { going:false };
  s.rsvps[eventId].going = !s.rsvps[eventId].going;
  save();
}

/* tiny pub/sub (optional) */
const subs = {};
export function on(topic, fn){ (subs[topic]??=[]).push(fn); }
export function emit(topic, payload){ (subs[topic]||[]).forEach(fn=>fn(payload)); }

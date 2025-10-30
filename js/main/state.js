/* state.js — global game state (XP, coins, badges, quests, jamo stars, RSVPs) */
export const KQ_VERSION = "1.0.2";

const DEFAULT = {
  player: {
    level: 1, xp: 0, coins: 0,
    badges: [], streak: 0, lastLoginDate: null,
    inventory: [], equipped: { hat:null, bg:null }
  },
  progress: {
    lessonsDone: 0, quizzesDone: 0, recentLessons: [],
    // ⭐ per jamo, e.g. { 'ㄱ':3, 'ㅏ':2 }
    jamoStars: {}
  },
  quests: {
    daily: [],
    weekly: [{ id:"w1", desc:"Earn 200 XP this week", target:200, progress:0, done:false, reward:{coins:50,badge:"🌟 Weekly Warrior"} }]
  },
  rsvps: {},
  leaderboard: [{ name:"Ava", xp:420 }, { name:"Noah", xp:380 }, { name:"Mia", xp:350 }]
};

const KEY = "kq-state";
let KQ = null;

export function load(){ return KQ ?? (KQ = JSON.parse(localStorage.getItem(KEY) || "null") || structuredClone(DEFAULT)); }
export function save(){ localStorage.setItem(KEY, JSON.stringify(KQ)); }
export function resetAll(){ KQ = structuredClone(DEFAULT); save(); }
export function nowStr(){ return new Date().toDateString(); }

/* Progression */
export function needXP(level){ return 100 * level; }
export function addXP(n){
  const s = load(); s.player.xp += n;
  while (s.player.xp >= needXP(s.player.level)) s.player.level++;
  incQuest("xp-daily", n);
  save();
}
export function addCoins(n){ const s=load(); s.player.coins+=n; save(); }
export function addBadge(name){ const s=load(); if(!s.player.badges.includes(name)) s.player.badges.push(name); save(); }

/* Daily reset & quests */
export function ensureDaily(){
  const s = load();
  const today = nowStr();
  if (s.player.lastLoginDate !== today){
    if (s.player.lastLoginDate){
      const prev = new Date(s.player.lastLoginDate);
      const diff = (new Date(today)-prev)/86400000;
      s.player.streak = (diff===1) ? (s.player.streak||0)+1 : 1;
    } else s.player.streak = 1;
    s.player.lastLoginDate = today;
    s.quests.daily = [
      { id:"xp-daily", desc:"Earn 30 XP today", target:30, progress:0, done:false, reward:{coins:20} },
      { id:"lesson-1", desc:"Complete 1 lesson", target:1, progress:0, done:false, reward:{coins:10,badge:"📜 Hangul Hero"} },
      { id:"battle-1", desc:"Win 1 battle", target:1, progress:0, done:false, reward:{coins:10} }
    ];
    save();
  }
}

export function getPlayer(){ ensureDaily(); return load().player; }
export function getProgress(){ ensureDaily(); return load().progress; }
export function getQuests(){ ensureDaily(); return load().quests; }
export function getRSVPs(){ ensureDaily(); return load().rsvps; }
export function getLeaderboard(){ return load().leaderboard; }

export function incQuest(id,val){
  const s = load();
  const q = s.quests.daily.find(q=>q.id===id);
  if(!q || q.done) return;
  q.progress += val;
  if (q.progress >= q.target){
    q.done = true;
    if (q.reward?.coins) addCoins(q.reward.coins);
    if (q.reward?.badge) addBadge(q.reward.badge);
  }
  save();
}

export function markLessonComplete({id,title}){
  const s=load();
  s.progress.lessonsDone++;
  s.progress.recentLessons.unshift({id,title,ts:Date.now()});
  s.progress.recentLessons = s.progress.recentLessons.slice(0,5);
  addBadge("🏅 Lesson Starter");
  incQuest("lesson-1", 1);
  save();
}
export function markQuizComplete(){ const s=load(); s.progress.quizzesDone++; save(); }

/* ⭐ Jamo star ratings */
export function getJamoStars(ch){ return load().progress.jamoStars?.[ch] ?? 0; }
export function setJamoStars(ch, stars){
  const s = load();
  const cur = s.progress.jamoStars?.[ch] ?? 0;
  s.progress.jamoStars[ch] = Math.max(cur, stars); // keep best score
  save();
}

/* RSVPs (schedule) */
export function toggleRSVP(eventId){
  const s = load();
  s.rsvps[eventId] = s.rsvps[eventId] || { going:false };
  s.rsvps[eventId].going = !s.rsvps[eventId].going;
  save();
}

/* tiny pub/sub if needed later */
const subs = {};
export function on(topic, fn){ (subs[topic]??=[]).push(fn); }
export function emit(topic, payload){ (subs[topic]||[]).forEach(fn=>fn(payload)); }

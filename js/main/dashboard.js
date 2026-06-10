import {
  getPlayer,
  getQuests,
  getRSVPs,
  getProgress,
  needXP,
} from "./state.js";

const p = getPlayer();
const quests = getQuests();
const rsvps = getRSVPs();
const prog = getProgress();

document.getElementById("dLevel").textContent = p.level;
document.getElementById("dXP").textContent = p.xp;
document.getElementById("dNext").textContent = needXP(p.level);
document.getElementById("dStreak").textContent = p.streak;
document.getElementById("dCoins").textContent = p.coins;
document.getElementById("dBadges").textContent = p.badges.join(" ") || "—";

const percent = Math.min(
  100,
  Math.round((((prog.lessonsDone || 0) + (prog.quizzesDone || 0)) / 2) * 100)
);
document.getElementById("dBar").style.width = percent + "%";

const qList = document.getElementById("questList");
qList.innerHTML = quests.daily
  .map(
    (q) => `
  <li>${q.done ? "✅" : "⬜️"} ${q.desc} — ${Math.min(q.progress, q.target)}/${
      q.target
    }</li>
`
  )
  .join("");

const rList = document.getElementById("rsvpList");
const going = Object.entries(rsvps).filter(([, v]) => v.going);
rList.innerHTML = going.length
  ? going.map(([id]) => `<li>${id} — going</li>`).join("")
  : '<li class="muted">No RSVPs yet.</li>';

const recent = document.getElementById("recentLessons");
recent.innerHTML =
  (prog.recentLessons || [])
    .map((l) => `<li>${new Date(l.ts).toLocaleString()} — ${l.title}</li>`)
    .join("") || '<li class="muted">No lessons yet.</li>';

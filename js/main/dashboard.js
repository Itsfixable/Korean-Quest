// js/main/dashboard.js — uses recentWork feed and live XP bar
import { getPlayer, getQuests, getProgress, needXP } from "./state.js";

function setText(id, val){ const el = document.getElementById(id); if (el) el.textContent = val; }

const p = getPlayer();
const quests = getQuests();
const prog = getProgress();

/* Header stats */
setText("dLevel",  p.level);
setText("dXP",     p.xp);
setText("dNext",   needXP(p.level));
setText("dStreak", p.streak);
setText("dCoins",  p.coins);
document.getElementById("dBadges").textContent = (p.badges || []).join(" ") || "—";

/* XP bar fill (live) */
const pct = Math.min(100, Math.round(100 * (p.xp / needXP(p.level))));
document.getElementById("dBar").style.width = pct + "%";

/* Daily quests list */
const qList = document.getElementById("questList");
qList.innerHTML = (quests.daily || []).map(q => `
  <li>${q.done ? "✅" : "⬜️"} ${q.desc} — ${Math.min(q.progress, q.target)}/${q.target}</li>
`).join("") || '<li class="muted">No quests.</li>';

/* Recent Work feed */
const workList = document.getElementById("recentWork");
workList.innerHTML =
  (prog.recentWork || [])
    .map(w => `
      <li>
        <span class="badge">${w.type}</span>
        ${new Date(w.ts).toLocaleString()} — ${w.title}
      </li>
    `)
    .join("") || '<li class="muted">No work recorded yet.</li>';

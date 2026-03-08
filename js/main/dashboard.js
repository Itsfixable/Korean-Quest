// js/main/dashboard.js
import { getPlayer, getQuests, getProgress, needXP } from "./state.js";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderDashboard() {
  const player = getPlayer();
  const quests = getQuests();
  const progress = getProgress();

  setText("dLevel", player.level);
  setText("dXP", player.xp);
  setText("dNext", needXP(player.level));
  setText("dStreak", `${player.streak} day${player.streak === 1 ? "" : "s"}`);
  setText("dCoins", player.coins);
  setText("dBadges", (player.badges || []).join(" • ") || "—");

  const bar = document.getElementById("dBar");
  if (bar) {
    const pct = Math.min(100, Math.round((player.xp / needXP(player.level)) * 100));
    bar.style.width = `${pct}%`;
  }

  const questList = document.getElementById("questList");
  if (questList) {
    const daily = quests.daily || [];
    questList.innerHTML = daily.length
      ? daily
          .map(
            (q) =>
              `<li>${q.done ? "✅" : "⬜️"} ${q.desc} — ${Math.min(q.progress, q.target)}/${q.target}</li>`
          )
          .join("")
      : "<li>No quests.</li>";
  }

  const workList = document.getElementById("recentWork");
  if (workList) {
    const work = progress.recentWork || [];
    workList.innerHTML = work.length
      ? work
          .map(
            (item) =>
              `<li>${item.type} ${new Date(item.ts).toLocaleString()} — ${item.title}</li>`
          )
          .join("")
      : "<li>No work recorded yet.</li>";
  }
}

renderDashboard();
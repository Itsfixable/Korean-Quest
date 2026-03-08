// js/main/dashboard.js
import { getPlayer, getQuests, getProgress, needXP, on } from "./state.js";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function renderXPBar(player) {
  const bar = document.getElementById("dBar");
  if (!bar) return;

  const pct = clamp(Math.round((player.xp / needXP(player.level)) * 100), 0, 100);
  bar.style.width = `${pct}%`;
  bar.setAttribute("aria-valuenow", String(pct));
}

function renderQuestList(quests) {
  const questList = document.getElementById("questList");
  if (!questList) return;

  const daily = quests.daily || [];

  if (!daily.length) {
    questList.innerHTML = "<li>No quests.</li>";
    return;
  }

  questList.innerHTML = daily
    .map((q) => {
      const progress = Math.min(q.progress, q.target);
      const pct = clamp(Math.round((progress / q.target) * 100), 0, 100);

      return `
        <li style="list-style:none; margin:0 0 14px 0; padding:0;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:6px;">
            <span style="font-weight:700; color:#000;">
              ${q.done ? "✅" : "⬜"} ${q.desc}
            </span>
            <span style="font-weight:700; color:#586071;">
              ${progress}/${q.target}
            </span>
          </div>

          <div
            style="
              width:100%;
              height:12px;
              background:#dfe6f2;
              border-radius:999px;
              overflow:hidden;
              border:1px solid rgba(0,0,0,0.06);
            "
            aria-label="${q.desc} progress"
          >
            <div
              style="
                width:${pct}%;
                height:100%;
                background:${q.done ? "#6a9f71" : "#5b729f"};
                border-radius:999px;
                transition:width 0.25s ease;
              "
            ></div>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderRecentWork(progress) {
  const workList = document.getElementById("recentWork");
  if (!workList) return;

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

  renderXPBar(player);
  renderQuestList(quests);
  renderRecentWork(progress);
}

renderDashboard();
on("state:changed", renderDashboard);
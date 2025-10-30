import { addXP, addCoins, addBadge, incQuest, getPlayer } from "./state.js";

/* Minimal question bank — you can add more and group by skill */
const Q_POOL = [
  { stem: "Pick ㄴ", options: ["ㄱ", "ㄴ", "ㅁ", "ㅂ"], ans: 1 },
  { stem: "ㄱ + ㅏ → ?", options: ["나", "다", "가", "마"], ans: 2 },
  {
    stem: "밥 means…",
    options: ["water", "meal/rice", "bread", "milk"],
    ans: 1,
  },
  {
    stem: "“Hello” (polite) is…",
    options: ["안녕하세요", "감사합니다", "죄송합니다"],
    ans: 0,
  },
];

const mapEl = document.getElementById("kq-map");
const p = getPlayer();
const zones = [
  { id: "forest", title: "Forest (Hangul)", req: 1 },
  { id: "village", title: "Village (Vocab)", req: 3 },
  { id: "market", title: "Market (Phrases)", req: 5 },
  { id: "temple", title: "Temple (Grammar)", req: 7 },
];

if (mapEl) {
  mapEl.innerHTML = zones
    .map(
      (z) =>
        `<button class="map-node ${
          p.level >= z.req ? "" : "locked"
        }" data-zone="${z.id}" data-required-level="${z.req}">${
          z.title
        }</button>`
    )
    .join("");
}

const youHP = document.getElementById("youHP");
const enemyHP = document.getElementById("enemyHP");
const youBar = document.getElementById("youBar");
const enemyBar = document.getElementById("enemyBar");
const qMount = document.getElementById("questionMount");
const res = document.getElementById("battleResult");
const start = document.getElementById("startBattle");

let battle = null;

function setBars() {
  youHP.textContent = Math.max(0, battle.you);
  enemyHP.textContent = Math.max(0, battle.enemy);
  youBar.style.width = `${(Math.max(0, battle.you) / 40) * 100}%`;
  enemyBar.style.width = `${(Math.max(0, battle.enemy) / 50) * 100}%`;
}
function renderMC(q, onAnswer) {
  qMount.innerHTML = `
    <div class="card">
      <div class="stem">${q.stem}</div>
      <div class="flex" style="margin-top:8px">
        ${q.options
          .map(
            (o, i) =>
              `<button class="btn secondary" data-i="${i}">${o}</button>`
          )
          .join("")}
      </div>
    </div>`;
  qMount
    .querySelectorAll("button[data-i]")
    .forEach(
      (b) => (b.onclick = () => onAnswer(Number(b.dataset.i) === q.ans))
    );
}
function pickQ() {
  return Q_POOL[Math.floor(Math.random() * Q_POOL.length)];
}

function runTurn() {
  if (battle.left <= 0 || battle.you <= 0 || battle.enemy <= 0)
    return endBattle();
  const q = pickQ();
  renderMC(q, (ok) => {
    if (ok) {
      battle.enemy -= 10;
    } else {
      battle.you -= 8;
    }
    battle.left--;
    setBars();
    runTurn();
  });
}
function startBattle(zone) {
  res.textContent = "";
  qMount.innerHTML = "";
  battle = { zone, you: 40, enemy: 50, left: 5 };
  setBars();
  runTurn();
}
function endBattle() {
  qMount.innerHTML = "";
  const win = battle.enemy <= 0;
  res.textContent = win
    ? "🎉 Victory! +20 XP, +10 coins"
    : "💥 Defeat — try again!";
  if (win) {
    addXP(20);
    addCoins(10);
    incQuest("battle-1", 1);
    if (battle.zone === "forest") addBadge("🌲 Hangul Starter");
    if (battle.zone === "village") addBadge("🧺 Vocab Ranger");
    if (battle.zone === "market") addBadge("📝 Phrase Tactician");
    if (battle.zone === "temple") addBadge("📜 Sentence Smith");
  }
}

start?.addEventListener("click", () => {
  const chosen =
    document.querySelector(".map-node:not(.locked).active")?.dataset.zone ||
    document.querySelector(".map-node:not(.locked)")?.dataset.zone;
  startBattle(chosen || "forest");
});
document.querySelectorAll(".map-node")?.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("locked"))
      return alert(`Unlocks at Level ${btn.dataset.requiredLevel}`);
    document
      .querySelectorAll(".map-node")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

import {
  addXP,
  addCoins,
  markBattleWin,
  getProgress,
  getPlayer,
  on,
} from "./state.js";

const MAP_KEY = "kq-adventure-treasure-map-v1";

const CHAPTERS = [
  {
    id: 1,
    title: "Level 1",
    subtitle: "Hangul Explorer",
    rewardCoins: 500,
    rewardXP: 80,
    nodes: [
      { id: "l1-n1", label: "1. Basics", x: 58, y: 28, icon: "⭐" },
      { id: "l1-n2", label: "2. Practice", x: 43, y: 50, icon: "💪" },
      { id: "l1-n3", label: "3. Challenge", x: 62, y: 64, icon: "🏆" },
    ],
    path: "M50 18 C52 30 66 27 60 39 C54 50 42 39 43 52 C45 64 61 56 62 68 C63 79 47 78 42 88",
    chest: { x: 42, y: 82 },
  },
  {
    id: 2,
    title: "Level 2",
    subtitle: "Vocabulary Voyager",
    rewardCoins: 750,
    rewardXP: 120,
    nodes: [
      { id: "l2-n1", label: "1. Food", x: 35, y: 30, icon: "🍜" },
      { id: "l2-n2", label: "2. Words", x: 67, y: 44, icon: "📖" },
      { id: "l2-n3", label: "3. Quiz", x: 45, y: 62, icon: "🏆" },
    ],
    path: "M50 18 C54 26 32 25 35 34 C40 48 70 34 67 48 C64 61 44 52 45 66 C46 78 36 76 36 88",
    chest: { x: 36, y: 82 },
  },
  {
    id: 3,
    title: "Level 3",
    subtitle: "Legendary Explorer",
    rewardCoins: 1000,
    rewardXP: 160,
    nodes: [
      { id: "l3-n1", label: "1. Warm Up", x: 73, y: 28, icon: "⭐" },
      { id: "l3-n2", label: "2. Train", x: 50, y: 47, icon: "💪" },
      { id: "l3-n3", label: "3. Learn", x: 75, y: 55, icon: "📖" },
      { id: "l3-n4", label: "4. Boss", x: 48, y: 68, icon: "🏆" },
    ],
    path: "M50 18 C62 22 78 20 74 32 C71 45 49 36 51 49 C53 61 77 50 75 62 C72 75 46 63 48 74 C50 84 42 80 42 88",
    chest: { x: 42, y: 82 },
  },
];

let activeChapter = 1;

function loadMapState() {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMapState(state) {
  localStorage.setItem(MAP_KEY, JSON.stringify(state));
}

function getCompletedSet() {
  return new Set(loadMapState().completedNodes || []);
}

function isChestClaimed(chapterId) {
  return Boolean(loadMapState().claimedChests?.[chapterId]);
}

function completeNode(nodeId) {
  const state = loadMapState();
  const completed = new Set(state.completedNodes || []);
  completed.add(nodeId);
  state.completedNodes = [...completed];
  saveMapState(state);
}

function claimChest(chapter) {
  const state = loadMapState();
  state.claimedChests = state.claimedChests || {};

  if (state.claimedChests[chapter.id]) return false;

  state.claimedChests[chapter.id] = true;
  saveMapState(state);

  addCoins(chapter.rewardCoins);
  addXP(chapter.rewardXP);
  return true;
}

function chapterUnlocked(chapterId) {
  if (chapterId === 1) return true;

  const progress = getProgress();
  const battles = progress.battlesWon || 0;

  if (chapterId === 2) return battles >= 3;
  if (chapterId === 3) return battles >= 6;

  return false;
}

function chapterComplete(chapter) {
  const completed = getCompletedSet();
  return chapter.nodes.every((node) => completed.has(node.id));
}

function nodeUnlocked(chapter, index) {
  if (!chapterUnlocked(chapter.id)) return false;
  if (index === 0) return true;

  const completed = getCompletedSet();
  return completed.has(chapter.nodes[index - 1].id);
}

function getFirstPlayableNode(chapter) {
  return chapter.nodes.find((node, index) => {
    const completed = getCompletedSet();
    return nodeUnlocked(chapter, index) && !completed.has(node.id);
  });
}

function showToast(text) {
  let toast = document.getElementById("kqAdventureToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "kqAdventureToast";
    toast.className = "kq-adventure-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.classList.remove("show");

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function clearNode(nodeId, label, isBoss = false) {
  if (!nodeId) return;

  const completed = getCompletedSet();
  if (completed.has(nodeId)) {
    showToast("You already cleared this node!");
    return;
  }

  completeNode(nodeId);
  markBattleWin(`${label} cleared`, { boss: isBoss });
  addXP(isBoss ? 35 : 20);
  addCoins(isBoss ? 25 : 15);

  showToast(`${label} cleared! +${isBoss ? 35 : 20} XP · +${isBoss ? 25 : 15} coins`);
  renderTreasureMap();
}

function startChapter(chapter) {
  if (!chapterUnlocked(chapter.id)) {
    showToast("Win more battles to unlock this map.");
    return;
  }

  const next = getFirstPlayableNode(chapter);

  if (!next) {
    showToast("All nodes cleared! Claim the treasure chest.");
    return;
  }

  const index = chapter.nodes.findIndex((node) => node.id === next.id);
  clearNode(next.id, next.label, index === chapter.nodes.length - 1);
}

function renderStars(done) {
  return `
    <div class="kq-map-stars" aria-hidden="true">
      <span>${done ? "⭐" : "☆"}</span>
      <span>${done ? "⭐" : "☆"}</span>
      <span>${done ? "⭐" : "☆"}</span>
    </div>
  `;
}

function renderChapterTabs(root) {
  const tabs = document.createElement("div");
  tabs.className = "kq-map-tabs";

  tabs.innerHTML = CHAPTERS.map((chapter) => {
    const unlocked = chapterUnlocked(chapter.id);

    return `
      <button
        class="kq-map-tab ${activeChapter === chapter.id ? "active" : ""}"
        type="button"
        data-chapter="${chapter.id}"
        ${unlocked ? "" : "disabled"}
      >
        ${unlocked ? "🗺️" : "🔒"} ${chapter.title}
      </button>
    `;
  }).join("");

  tabs.querySelectorAll("[data-chapter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeChapter = Number(btn.dataset.chapter);
      renderTreasureMap();
    });
  });

  root.appendChild(tabs);
}

function renderTreasureMap() {
  const mapGrid = document.getElementById("mapGrid");
  if (!mapGrid) return;

  const chapter = CHAPTERS.find((item) => item.id === activeChapter) || CHAPTERS[0];
  const completed = getCompletedSet();
  const unlockedChapter = chapterUnlocked(chapter.id);
  const complete = chapterComplete(chapter);
  const claimed = isChestClaimed(chapter.id);
  const player = getPlayer();

  mapGrid.innerHTML = "";
  mapGrid.classList.add("kq-treasure-map");

  const shell = document.createElement("section");
  shell.className = "kq-map-shell";

  renderChapterTabs(shell);

  const board = document.createElement("div");
  board.className = "kq-map-board";

  board.innerHTML = `
    <div class="kq-map-topbar">
      <button class="kq-map-back" type="button" onclick="location.href='index.html'">← Back Home</button>
      <div class="kq-map-currency">
        <span>🪙 ${player.coins}</span>
        <span>⭐ ${completed.size}</span>
      </div>
    </div>

    <div class="kq-scroll-stage ${unlockedChapter ? "" : "locked"}">
      <img class="kq-scroll-bg" src="favicon/adventure/treasure-scroll.png" alt="" aria-hidden="true" />

      <div class="kq-map-title">
        <div>${chapter.title}</div>
        <small>${chapter.subtitle}</small>
      </div>

      <svg class="kq-dashed-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="${chapter.path}" />
      </svg>

      <button class="kq-start-node" type="button" data-start="true">
        <span class="kq-start-label">START!</span>
        <span class="kq-start-circle">▶</span>
      </button>

      ${chapter.nodes.map((node, index) => {
        const done = completed.has(node.id);
        const unlocked = nodeUnlocked(chapter, index);
        const isBoss = index === chapter.nodes.length - 1;

        return `
          <button
            class="kq-map-node ${done ? "done" : ""} ${unlocked ? "" : "locked"}"
            type="button"
            style="left:${node.x}%; top:${node.y}%;"
            data-node="${node.id}"
            data-label="${node.label}"
            data-boss="${isBoss ? "true" : "false"}"
            ${unlocked ? "" : "disabled"}
          >
            <span class="kq-node-circle">${done ? "✓" : node.icon}</span>
            <span class="kq-node-label">${node.label}</span>
            ${renderStars(done)}
          </button>
        `;
      }).join("")}

      <button
        class="kq-treasure-chest ${complete ? "ready" : ""} ${claimed ? "claimed" : ""}"
        type="button"
        style="left:${chapter.chest.x}%; top:${chapter.chest.y}%;"
        data-chest="true"
      >
        <span class="kq-x-mark">✕</span>
        <span class="kq-chest-icon">${claimed ? "✅" : "🧰"}</span>
        <span class="kq-chest-label">${claimed ? "Claimed!" : "TREASURE!"}</span>
        <small>+${chapter.rewardCoins} coins · +${chapter.rewardXP} XP</small>
      </button>

      ${!unlockedChapter ? `<div class="kq-map-lock">🔒 Win more battles to unlock this map.</div>` : ""}
    </div>

    <div class="kq-map-tip">
      <strong>💡 Adventure Tip</strong>
      <span>Complete every node on the map to unlock the treasure chest bonus.</span>
    </div>
  `;

  shell.appendChild(board);
  mapGrid.appendChild(shell);

  board.querySelector("[data-start]")?.addEventListener("click", () => {
    startChapter(chapter);
  });

  board.querySelectorAll("[data-node]").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearNode(btn.dataset.node, btn.dataset.label, btn.dataset.boss === "true");
    });
  });

  board.querySelector("[data-chest]")?.addEventListener("click", () => {
    if (!complete) {
      showToast("Complete every node first to unlock this treasure!");
      return;
    }

    if (claimed) {
      showToast("You already claimed this treasure.");
      return;
    }

    if (claimChest(chapter)) {
      showToast(`Treasure claimed! +${chapter.rewardCoins} coins · +${chapter.rewardXP} XP`);
      renderTreasureMap();
    }
  });
}

function ensureStyles() {
  if (document.getElementById("kq-adventure-treasure-styles")) return;

  const style = document.createElement("style");
  style.id = "kq-adventure-treasure-styles";
  style.textContent = `
    #mapCard {
      padding: clamp(14px, 2vw, 24px) !important;
    }

    #mapCard > header,
    #mapCard > p,
    #mapCard .kq-adventure-controls {
      display: none !important;
    }

    .adventure-levels-wrapper {
      width: 100% !important;
    }

    .kq-treasure-map {
      width: 100%;
    }

    .kq-map-shell {
      display: grid;
      gap: 16px;
      width: 100%;
    }

    .kq-map-tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .kq-map-tab {
      border: none;
      border-radius: 999px;
      padding: 10px 18px;
      font: inherit;
      font-weight: 900;
      color: #304263;
      background: rgba(91, 114, 159, 0.12);
      cursor: pointer;
    }

    .kq-map-tab.active {
      background: linear-gradient(180deg, #6d84b7, #5971a1);
      color: #fff;
      box-shadow: 0 8px 18px rgba(91,114,159,0.22);
    }

    .kq-map-tab:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .kq-map-board {
      width: min(100%, 1050px);
      margin: 0 auto;
      background: #102027;
      border-radius: 28px;
      padding: clamp(14px, 2vw, 24px);
      box-shadow: 0 18px 42px rgba(0,0,0,0.18);
      display: grid;
      gap: 14px;
    }

    .kq-map-topbar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      color: #fff;
      font-weight: 900;
    }

    .kq-map-back {
      border: none;
      background: transparent;
      color: #fff;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
    }

    .kq-map-currency {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .kq-scroll-stage {
      position: relative;
      width: min(100%, 760px);
      aspect-ratio: 500 / 649;
      margin: 0 auto;
      overflow: hidden;
      border-radius: 24px;
    }

    .kq-scroll-stage.locked {
      filter: grayscale(0.7);
    }

    .kq-scroll-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      z-index: 0;
      pointer-events: none;
    }

    .kq-map-title {
      position: absolute;
      top: 8%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 3;
      text-align: center;
      color: #6a4115;
      font-weight: 1000;
      font-size: clamp(1.8rem, 4vw, 3rem);
      line-height: 1;
      text-shadow: 0 2px 0 rgba(255,255,255,0.4);
      width: 70%;
    }

    .kq-map-title small {
      display: block;
      margin-top: 8px;
      font-size: clamp(0.8rem, 1.6vw, 1.05rem);
      color: #7b5624;
    }

    .kq-dashed-path {
      position: absolute;
      inset: 16% 18% 11% 18%;
      z-index: 1;
      overflow: visible;
      pointer-events: none;
    }

    .kq-dashed-path path {
      fill: none;
      stroke: rgba(119, 82, 37, 0.82);
      stroke-width: ;
      stroke-linecap: round;
      stroke-dasharray: 4 4;
      animation: kqPathDash 1.5s linear infinite;
    }

    @keyframes kqPathDash {
      to { stroke-dashoffset: -16; }
    }

    .kq-start-node,
    .kq-map-node,
    .kq-treasure-chest {
      position: absolute;
      z-index: 4;
      border: none;
      background: transparent;
      transform: translate(-50%, -50%);
      cursor: pointer;
      font-family: "Nunito", sans-serif;
    }

    .kq-start-node {
      left: 50%;
      top: 25%;
      display: grid;
      justify-items: center;
      gap: 2px;
    }

    .kq-start-label {
      background: #f06bb8;
      color: #fff;
      border-radius: 10px;
      padding: 5px 10px;
      font-size: 0.9rem;
      font-weight: 1000;
      box-shadow: 0 4px 0 rgba(157,61,122,0.45);
    }

    .kq-start-circle,
    .kq-node-circle {
      width: clamp(50px, 7vw, 76px);
      height: clamp(50px, 7vw, 76px);
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: clamp(1.25rem, 2.4vw, 2rem);
      font-weight: 1000;
      background: linear-gradient(180deg, #f87ccc, #df57b0);
      color: #fff;
      box-shadow: 0 8px 0 rgba(121,57,101,0.45), 0 10px 20px rgba(0,0,0,0.16);
      transition: transform 160ms ease, filter 160ms ease;
    }

    .kq-start-node:hover .kq-start-circle,
    .kq-map-node:hover .kq-node-circle,
    .kq-treasure-chest:hover .kq-chest-icon {
    transform: scale(1.035);
    filter: brightness(1.04);
    }

    .kq-map-node {
      display: grid;
      justify-items: center;
      gap: 4px;
    }

    .kq-map-node .kq-node-circle {
      background: linear-gradient(180deg, #4e6673, #263942);
      box-shadow: 0 8px 0 rgba(22,31,38,0.45), 0 10px 20px rgba(0,0,0,0.16);
    }

    .kq-map-node.done .kq-node-circle {
      background: linear-gradient(180deg, #35bdf2, #1594d0);
    }

    .kq-map-node.locked {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .kq-node-label,
    .kq-chest-label {
      background: #1c2524;
      color: #fff;
      padding: 5px 9px;
      border-radius: 7px;
      font-size: clamp(0.68rem, 1.2vw, 0.86rem);
      font-weight: 1000;
      box-shadow: 0 3px 0 rgba(0,0,0,0.25);
      white-space: nowrap;
    }

    .kq-map-stars {
      display: flex;
      gap: 1px;
      font-size: clamp(0.9rem, 1.7vw, 1.15rem);
      filter: drop-shadow(0 1px 0 rgba(0,0,0,0.5));
    }

    .kq-treasure-chest {
      display: grid;
      justify-items: center;
      gap: 2px;
      color: #fff;
    }

    .kq-x-mark {
      font-size: clamp(2rem, 4vw, 3rem);
      color: #ee4c2f;
      line-height: 0.8;
      text-shadow: 0 3px 0 rgba(85,28,17,0.3);
    }

    .kq-chest-icon {
      font-size: clamp(2.7rem, 5.5vw, 4.4rem);
      line-height: 1;
      transition: transform 160ms ease, filter 160ms ease;
    }

    .kq-treasure-chest small {
      background: #1c2524;
      color: #ffeaa7;
      padding: 5px 9px;
      border-radius: 7px;
      font-size: clamp(0.65rem, 1.2vw, 0.78rem);
      font-weight: 900;
      white-space: nowrap;
    }

    .kq-treasure-chest:not(.ready) {
      opacity: 0.68;
    }

    .kq-treasure-chest.ready {
      animation: kqTreasurePulse 1.1s ease-in-out infinite;
    }

    @keyframes kqTreasurePulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.035); }
    }

    .kq-map-lock {
      position: absolute;
      inset: 44% 18% auto;
      z-index: 6;
      text-align: center;
      padding: 14px;
      border-radius: 18px;
      background: rgba(20,27,33,0.88);
      color: #fff;
      font-weight: 1000;
    }

    .kq-map-tip {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      color: #fff;
      font-weight: 800;
      text-align: center;
    }

    .kq-map-tip strong {
      background: rgba(255,255,255,0.12);
      padding: 10px 14px;
      border-radius: 14px;
    }

    .kq-adventure-toast {
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%) translateY(20px);
      z-index: 5000;
      background: #1c2524;
      color: #fff;
      padding: 12px 16px;
      border-radius: 999px;
      font-weight: 1000;
      box-shadow: 0 12px 28px rgba(0,0,0,0.25);
      opacity: 0;
      pointer-events: none;
      transition: opacity 180ms ease, transform 180ms ease;
    }

    .kq-adventure-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 640px) {
      .kq-map-board {
        width: 100%;
        padding: 12px;
        border-radius: 22px;
      }

      .kq-scroll-stage {
        width: 100%;
      }

      .kq-map-topbar {
        font-size: 0.86rem;
      }
    }

  `;

  document.head.appendChild(style);
}

ensureStyles();
renderTreasureMap();

on("state:changed", () => {
  renderTreasureMap();
});
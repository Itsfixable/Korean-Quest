import {
  addXP,
  addCoins,
  getAdventureProgress,
  markBattleWin,
  on,
} from "./state.js";

const STORE_KEY = "kq_node_adv_progress_v1";
const BOSS_LEVELS = new Set([4, 8, 12]);

const HANGUL = [
  { char: "ㄱ", roman: "g/k" },
  { char: "ㄴ", roman: "n" },
  { char: "ㄷ", roman: "d/t" },
  { char: "ㅁ", roman: "m" },
  { char: "ㅂ", roman: "b/p" },
  { char: "ㅅ", roman: "s" },
  { char: "ㅏ", roman: "a" },
  { char: "ㅓ", roman: "eo" },
  { char: "ㅗ", roman: "o" },
  { char: "ㅣ", roman: "i" },
];

const VOCAB = [
  { ko: "학교", en: "school" },
  { ko: "선생님", en: "teacher" },
  { ko: "학생", en: "student" },
  { ko: "책", en: "book" },
  { ko: "물", en: "water" },
  { ko: "사과", en: "apple" },
  { ko: "친구", en: "friend" },
  { ko: "집", en: "house" },
  { ko: "버스", en: "bus" },
  { ko: "공원", en: "park" },
  { ko: "도서관", en: "library" },
  { ko: "병원", en: "hospital" },
  { ko: "밥", en: "meal" },
  { ko: "커피", en: "coffee" },
  { ko: "오늘", en: "today" },
  { ko: "내일", en: "tomorrow" },
];

const ENEMIES = [
  { name: "Slime", sprite: "🟢" },
  { name: "Mushling", sprite: "🍄" },
  { name: "Imp", sprite: "😈" },
  { name: "Kappa", sprite: "🐢" },
  { name: "Bat", sprite: "🦇" },
  { name: "Goblin", sprite: "👹" },
  { name: "Wisp", sprite: "✨" },
  { name: "Wolf", sprite: "🐺" },
  { name: "Drake", sprite: "🐉" },
  { name: "Sentinel", sprite: "🛡️" },
  { name: "Oni", sprite: "👺" },
  { name: "Tiger Spirit", sprite: "🐯" },
];

const WORLDS = [
  {
    id: 1,
    title: "Hangul Hills",
    rangeLabel: "World 1",
    levels: [1, 2, 3, 4],
    bgClass: "world-bg-1",
  },
  {
    id: 2,
    title: "Food Forest",
    rangeLabel: "World 2",
    levels: [5, 6, 7, 8],
    bgClass: "world-bg-2",
  },
  {
    id: 3,
    title: "Greeting Kingdom",
    rangeLabel: "World 3",
    levels: [9, 10, 11, 12],
    bgClass: "world-bg-3",
  },
];

const mapGrid = document.getElementById("mapGrid");
const topicSelect = document.getElementById("topicSelect");
const diffSelect = document.getElementById("difficultySelect");
const mapCard = document.getElementById("mapCard");
const battleCard = document.getElementById("battleCard");
const enemyNameEl = document.getElementById("enemyName");
const enemySpriteEl = document.getElementById("enemySprite");
const enemyHPBar = document.getElementById("enemyHPBar");
const enemyHPText = document.getElementById("enemyHPText");
const playerHPBar = document.getElementById("playerHPBar");
const playerHPText = document.getElementById("playerHPText");
const qTitle = document.getElementById("qTitle");
const qPrompt = document.getElementById("qPrompt");
const qChoices = document.getElementById("qChoices");
const qFeedback = document.getElementById("qFeedback");
const speedFill = document.getElementById("speedFill");
const exitBattleBtn = document.getElementById("exitBattleBtn");
const turnHint = document.getElementById("turnHint");
const encounterTitle = document.getElementById("encounterTitle");

let battle = null;
let currentQuestion = null;
let answerLocked = false;
let speedFrame = 0;
let speedPercent = 100;
let activeWorldId = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return {
      unlocked: Math.max(1, Number(data?.unlocked) || 1),
      cleared: data?.cleared && typeof data.cleared === "object" ? data.cleared : {},
    };
  } catch {
    return { unlocked: 1, cleared: {} };
  }
}

const P = loadProgress();

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify(P));
}

function getWorldForLevel(level) {
  if (level >= 1 && level <= 4) return 1;
  if (level >= 5 && level <= 8) return 2;
  return 3;
}

function isWorldComplete(worldId) {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world) return false;
  return world.levels.every((lvl) => P.cleared[lvl]);
}

function isWorldUnlocked(worldId) {
  if (worldId === 1) return true;
  if (worldId === 2) return isWorldComplete(1);
  if (worldId === 3) return isWorldComplete(2);
  return false;
}
function getVisibleWorld() {
  const active = WORLDS.find((w) => w.id === activeWorldId);
  if (active && isWorldUnlocked(active.id)) return active;

  if (isWorldUnlocked(3)) return WORLDS[2];
  if (isWorldUnlocked(2)) return WORLDS[1];
  return WORLDS[0];
}

function ensureStyles() {
  if (document.getElementById("kq-adventure-enhancements")) return;

  const style = document.createElement("style");
  style.id = "kq-adventure-enhancements";
  style.textContent = `
    .kq-adventure-summary {
      margin: 0 0 18px;
      padding: 18px 20px;
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(246,249,255,.95));
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    }

    .kq-adventure-summary p {
      margin: 6px 0 0;
      color: var(--muted, #5e6678);
      line-height: 1.55;
      font-weight: 700;
    }

    .kq-adventure-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
    }

    .kq-adventure-pill {
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 900;
      background: rgba(91, 114, 159, 0.10);
      color: var(--brand, #5b729f);
      transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
    }

    .kq-adventure-pill:hover {
      transform: translateY(-1px);
      background: rgba(91, 114, 159, 0.16);
    }

    .kq-adventure-pill.is-active {
      background: linear-gradient(180deg, #7089bc 0%, #5d76aa 100%);
      color: #fff;
      box-shadow: 0 8px 20px rgba(55, 76, 119, 0.18);
    }

    .kq-adventure-controls,
    .kq-aventure-controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin: 10px 0 18px;
    }

    .kq-adventure-controls select,
    .kq-aventure-controls select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      min-width: 150px;
      padding: 12px 40px 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(91, 114, 159, 0.18);
      background-color: #f7f9fd;
      color: #273142;
      font-size: 0.95rem;
      font-weight: 800;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      cursor: pointer;
      background-image:
        linear-gradient(45deg, transparent 50%, #5b729f 50%),
        linear-gradient(135deg, #5b729f 50%, transparent 50%);
      background-position:
        calc(100% - 20px) calc(50% - 3px),
        calc(100% - 14px) calc(50% - 3px);
      background-size: 6px 6px, 6px 6px;
      background-repeat: no-repeat;
    }

    .kq-adventure-controls select:focus,
    .kq-aventure-controls select:focus {
      outline: none;
      border-color: #7c98d1;
      box-shadow: 0 0 0 4px rgba(124, 152, 209, 0.16);
    }

    #mapGrid {
      display: block;
      margin-top: 30px;
    }

    .kq-world-section {
      margin: 0 auto 24px;
      max-width: 940px;
      padding: 22px;
      border-radius: 24px;
      border: 1px solid rgba(0,0,0,0.08);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      overflow: hidden;
    }

    .kq-world-section::before {
      content: "";
      position: absolute;
      inset: 0;
      background: rgba(255, 252, 246, 0.66);
      z-index: 0;
    }

    .kq-world-section > * {
      position: relative;
      z-index: 1;
    }

    .kq-world-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .kq-world-header h3 {
      margin: 0;
      font-size: 1.35rem;
    }

    .kq-world-header p {
      margin: 4px 0 0;
      color: var(--muted, #5e6678);
      font-weight: 700;
    }

    .kq-world-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(91, 114, 159, 0.10);
      color: var(--brand, #5b729f);
      font-size: 0.82rem;
      font-weight: 900;
      white-space: nowrap;
    }

    .kq-world-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-top: 5px;  
    }

    .world-bg-1,
    .world-bg-2,
    .world-bg-3 {
      background-image: none;
    }
    .map-node {
      ext-align: left;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      min-height: 165px;
      padding: 16px 28px 16px 16px; /* more space on right */
      border-radius: 20px;
      border: 1px solid rgba(0,0,0,0.08);
      background: linear-gradient(180deg, #6d86b8 0%, #5f78ab 100%);
      color: #ffffff;
      box-shadow: 0 10px 24px rgba(55, 76, 119, 0.20);
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
      position: relative;
      overflow: hidden;
    }

    .map-node:hover {
      transform: translateY(-3px);
      box-shadow: 0 18px 34px rgba(55, 76, 119, 0.26);
      filter: brightness(1.03);
    }

    .map-node.playable {
      background: linear-gradient(180deg, #7089bc 0%, #5d76aa 100%);
      color: #ffffff;
    }

    .map-node.cleared {
      background: linear-gradient(180deg, #6b80b2 0%, #5871a3 100%);
      color: #ffffff;
      box-shadow: 0 14px 28px rgba(67, 95, 148, 0.26);
    }

    .map-node.locked {
      cursor: not-allowed;
      background: linear-gradient(180deg, rgba(245,245,248,.96), rgba(233,236,242,.95));
      color: #2d3442;
      border: 1px dashed rgba(80, 96, 130, 0.16);
      box-shadow: none;
      opacity: 1;
    }

    .map-node.locked:hover {
      transform: none;
      filter: none;
      box-shadow: none;
    }

    .map-node.boss-node.playable,
    .map-node.boss-node.cleared {
      background: linear-gradient(180deg, #a66b2f 0%, #8d5722 100%);
      color: #ffffff;
      box-shadow: 0 14px 28px rgba(137, 89, 37, 0.28);
    }

    .kq-node-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      font-weight: 900;
      font-size: 1rem;
      line-height: 1.15;
      color: inherit;
    }

    .kq-node-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: inherit;
    }

    .kq-node-label {
      font-size: 1.08rem;
      font-weight: 900;
      color: inherit;
    }

    .kq-node-sub {
      font-size: 0.78rem;
      font-weight: 800;
      opacity: 0.92;
      color: inherit;
      letter-spacing: 0.02em;
    }

    .kq-node-emoji {
      font-size: 1.1rem;
      opacity: 0.95;
      flex-shrink: 0;
    }

    .kq-node-meta {
      font-size: 0.98rem;
      line-height: 1.45;
      font-weight: 800;
      color: inherit;
      opacity: 0.96;
    }

    .kq-node-status {
      font-size: 0.98rem;
      font-weight: 900;
      color: inherit;
      margin-top: auto;
    }

    .map-node.playable .kq-node-top,
    .map-node.playable .kq-node-label,
    .map-node.playable .kq-node-sub,
    .map-node.playable .kq-node-meta,
    .map-node.playable .kq-node-status,
    .map-node.cleared .kq-node-top,
    .map-node.cleared .kq-node-label,
    .map-node.cleared .kq-node-sub,
    .map-node.cleared .kq-node-meta,
    .map-node.cleared .kq-node-status,
    .map-node.boss-node.playable .kq-node-top,
    .map-node.boss-node.playable .kq-node-label,
    .map-node.boss-node.playable .kq-node-sub,
    .map-node.boss-node.playable .kq-node-meta,
    .map-node.boss-node.playable .kq-node-status,
    .map-node.boss-node.cleared .kq-node-top,
    .map-node.boss-node.cleared .kq-node-label,
    .map-node.boss-node.cleared .kq-node-sub,
    .map-node.boss-node.cleared .kq-node-meta,
    .map-node.boss-node.cleared .kq-node-status {
      color: #ffffff;
    }

    .map-node.locked .kq-node-top,
    .map-node.locked .kq-node-label,
    .map-node.locked .kq-node-sub,
    .map-node.locked .kq-node-meta,
    .map-node.locked .kq-node-status {
      color: #2a2a2a;
    }

    .map-node.locked .kq-node-status {
      color: #5b729f;
    }

    .map-node.cleared .kq-node-status {
      color: #c7ffd8;
    }

    .map-node.boss-node.playable .kq-node-status,
    .map-node.boss-node.cleared .kq-node-status {
      color: #fff1cc;
    }

    .kq-answer-btn {
      width: 100%;
      text-align: left;
      margin-bottom: 10px;
    }

    .kq-answer-btn.correct {
      outline: 2px solid rgba(106, 159, 113, 0.55);
      background: rgba(106, 159, 113, 0.12);
    }

    .kq-answer-btn.wrong {
      outline: 2px solid rgba(205, 74, 74, 0.45);
      background: rgba(205, 74, 74, 0.12);
    }
      .kq-adventure-controls select option,
      .kq-aventure-controls select option {
        background: #f7f9fd;
        color: #273142;
        font-weight: 700;
      }

    @media (max-width: 980px) {
      .kq-world-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

  @media (max-width: 640px) {
  .kq-world-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .kq-world-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .kq-world-section {
    padding: 16px;
  }

  .map-node {
    min-height: 110px;
    padding: 14px 12px;
    border-radius: 18px;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .kq-node-top {
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .kq-node-title {
    align-items: center;
    text-align: center;
  }

  .kq-node-sub,
  .kq-node-meta {
    display: none;
  }

  .kq-node-label {
    font-size: 1rem;
    line-height: 1.2;
  }

  .kq-node-status {
    margin-top: 0;
    font-size: 0.95rem;
    line-height: 1.2;
  }
}
  @media (max-width: 640px) {
  .world-bg-1,
  .world-bg-2,
  .world-bg-3 {
    background-image: none !important;
  }

  .kq-world-section {
    background-image: none !important;
  }

  .kq-world-section::before {
    background: rgba(255, 252, 246, 0.94);
  }
}
  @media (max-width: 1024px) {
  .world-bg-1,
  .world-bg-2,
  .world-bg-3,
  .kq-world-section {
    background-image: none !important;
  }

  .kq-world-section::before {
    background: rgba(255, 252, 246, 0.96) !important;
  }
}
#mapCard > header,
#mapCard > p,
#mapCard .kq-adventure-controls {
  display: none !important;
}

#mapGrid {
  margin-top: 0 !important;
}

.kq-treasure-adventure {
  width: 100%;
  display: grid;
  gap: 16px;
}

.kq-map-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
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
  width: 100%;
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
  width: min(100%, 980px);
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
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
}

.kq-dashed-path path {
  fill: none;
  stroke: rgba(119, 82, 37, 0.82);
  stroke-width: 1.15;
  stroke-linecap: round;
  stroke-dasharray: 3 3.8;
  vector-effect: non-scaling-stroke;
  animation: kqPathDash 3s linear infinite;
}

@keyframes kqPathDash {
  to {
    stroke-dashoffset: -16;
  }
}

.kq-start-node,
.kq-map-node,
.kq-treasure-chest {
  position: absolute;
  z-index: 4;
  border: none;
  background: transparent;
  transform: translate(-50%, -50%) !important;
  cursor: pointer;
  font-family: "Nunito", sans-serif;
}

.kq-start-node {
  position: absolute;
  left: 55%;
  top: 26%;
  transform: translate(-50%, -50%) !important;
  pointer-events: none;
  z-index: 7;
  display: grid;
  justify-items: center;
  gap: 3px;
}

.kq-start-circle,
.kq-start-label {
  pointer-events: auto;
}

.kq-start-circle {
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
  animation: kqStartPulse 1.4s ease-in-out infinite;
}

.kq-start-label {
  font-size: 0.7rem;
  padding: 4px 8px;
}

.kq-start-label {
  background: #f06bb8;
  color: #fff;
  border-radius: 10px;
  font-weight: 1000;
  box-shadow: 0 4px 0 rgba(157,61,122,0.45);
}

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
  transition: transform 260ms var(--ease-pop), filter 260ms var(--ease-kq);
}

.kq-start-circle,
.kq-node-circle {
  transition: transform 260ms var(--ease-pop), filter 260ms var(--ease-kq);
}

@keyframes kqStartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
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

.kq-map-node.boss .kq-node-circle {
  background: linear-gradient(180deg, #c78a3e, #9b6124);
}

.kq-start-node:hover,
.kq-map-node:hover,
.kq-treasure-chest:hover {
  transform: translate(-50%, -50%) !important;
}

.kq-start-node:hover .kq-start-circle,
.kq-map-node:hover .kq-node-circle,
.kq-treasure-chest:hover .kq-chest-icon {
  transform: scale(1.035);
  filter: brightness(1.04);
}

.kq-node-label {
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

.kq-treasure-chest:not(.ready) {
  opacity: 0.68;
}

.kq-treasure-chest.ready {
  animation: kqTreasurePulse 1.1s ease-in-out infinite;
}

@keyframes kqTreasurePulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.035);
  }
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

.kq-map-decoration {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  object-fit: contain;
  pointer-events: none;
  opacity: 0.92;
  /* CLEAN FLOAT */
  animation: kqFloatY 4.2s ease-in-out infinite;
  will-change: transform;
}

@keyframes kqFloatY {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-6px);
  }
}

.kq-map-decoration:nth-child(odd) {
  animation-duration: 4.6s;
}

.kq-map-decoration:nth-child(even) {
  animation-duration: 3.8s;
}

.kq-map-decoration:nth-child(3n) {
  animation-delay: 0.6s;
}

.kq-map-decoration:nth-child(4n) {
  animation-delay: 1.2s;
}

.kq-map-node {
  animation: kqNodeFloat 5s ease-in-out infinite;
}

.kq-map-node:nth-of-type(2n) {
  animation-delay: 0.45s;
}

.kq-map-node:nth-of-type(3n) {
  animation-delay: 0.85s;
}

@keyframes kqNodeFloat {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }

  50% {
    transform: translate(-50%, -50%) translateY(-3px);
  }
}

.kq-dashed-path path {
  fill: none;
  stroke: rgba(119, 82, 37, 0.9);
  stroke-width: 2.1;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 5 5.5;
  vector-effect: non-scaling-stroke;
  animation: kqPathDash 3.4s linear infinite;
}

.kq-treasure-chest {
  left: 46%;
  top: 86%;
  display: grid;
  justify-items: center;
  gap: 4px;
  color: #fff;
}

.kq-x-mark {
  position: absolute;

  /* move it LEFT and DOWN away from boss */
  left: -18px;
  top: -12px;

  z-index: 4;
  font-size: clamp(2rem, 4vw, 3rem);
  color: #ee4c2f;
  line-height: 0.8;
  text-shadow: 0 3px 0 rgba(85,28,17,0.3);
  transform: rotate(-10deg);
}

.kq-chest-bubble {
  position: absolute;
  left: 82%;
  top: 40%;
  transform: translateY(-50%);
  min-width: 132px;
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 9px 10px 8px;
  border-radius: 16px;
  background: rgba(28, 37, 36, 0.96);
  box-shadow: 0 8px 16px rgba(0,0,0,0.24);
}

.kq-chest-bubble::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 45%;
  width: 18px;
  height: 18px;
  background: inherit;
  transform: translateY(-50%) rotate(45deg);
  border-radius: 4px;
}

.kq-chest-icon {
  position: relative;
  z-index: 2;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
  transition: transform 160ms ease, filter 160ms ease;
}

.kq-chest-label {
  position: relative;
  z-index: 2;
  background: transparent;
  color: #fff;
  padding: 0;
  border-radius: 0;
  font-size: clamp(0.72rem, 1.2vw, 0.9rem);
  font-weight: 1000;
  box-shadow: none;
  white-space: nowrap;
}

.kq-chest-bubble small {
  position: relative;
  z-index: 2;
  background: rgba(255, 234, 167, 0.14);
  color: #ffeaa7;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: clamp(0.62rem, 1vw, 0.75rem);
  font-weight: 900;
  white-space: nowrap;
}

.kq-treasure-chest:hover .kq-chest-bubble {
  transform: translateY(-50%) scale(1.035);
}

.kq-treasure-chest:hover .kq-x-mark {
  transform: rotate(-8deg) scale(1.08);
}

.kq-adventure-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Make Adventure page fill the available width beside sidebar */
body:has(.kq-treasure-adventure) main.container,
body:has(.kq-treasure-adventure) .container:not(.site-header) {
  width: 100% !important;
  max-width: none !important;
}

body:has(.kq-treasure-adventure) #mapCard {
  width: 100% !important;
  max-width: none !important;
}

body:has(.kq-treasure-adventure) .adventure-levels-wrapper,
body:has(.kq-treasure-adventure) #mapGrid,
body:has(.kq-treasure-adventure) .kq-treasure-adventure {
  width: 100% !important;
  max-width: none !important;
}

body:has(.kq-treasure-adventure) .kq-map-board {
  width: 100% !important;
  max-width: none !important;
}

body:has(.kq-treasure-adventure) .kq-scroll-stage {
  width: min(100%, 980px) !important;
}

/* ========================= Treasure Map Premium Motion Parallax + wind + sparkle ========================= */

/* subtle depth layers */
.kq-scroll-stage {
  perspective: 900px;
}

.kq-map-decoration {
  animation: kqFloatY 4.2s ease-in-out infinite;
  will-change: transform, filter;
}

/* trees gently sway like wind */
.kq-map-decoration[src*="tree"] {
  animation: kqTreeSway 4.8s ease-in-out infinite;
  transform-origin: 50% 90%;
}

/* rocks/stone barely move */
.kq-map-decoration[src*="rock"],
.kq-map-decoration[src*="stone"] {
  animation: kqHeavyFloat 5.6s ease-in-out infinite;
}

/* skulls glow/flicker slightly */
.kq-map-decoration[src*="skull"] {
  animation: kqSkullFloat 4.4s ease-in-out infinite;
  filter: drop-shadow(0 4px 5px rgba(88, 56, 25, 0.18)) drop-shadow(0 0 8px rgba(255, 235, 180, 0.22));
}

/* wood drifts gently */
.kq-map-decoration[src*="wood"] {
  animation: kqWoodBob 5s ease-in-out infinite;
}

@keyframes kqTreeSway {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0) rotate(-1deg);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-5px) rotate(1.5deg);
  }
}

@keyframes kqHeavyFloat {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-2px);
  }
}

@keyframes kqSkullFloat {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0) scale(1);
    opacity: 0.9;
  }
  50% {
    transform: translate(-50%, -50%) translateY(-5px) scale(1.03);
    opacity: 1;
  }
}

@keyframes kqWoodBob {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0) rotate(0deg);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-4px) rotate(-1deg);
  }
}

/* treasure sparkle particles */
.kq-treasure-chest::before,
.kq-treasure-chest::after {
  content: "✦";
  position: absolute;
  z-index: 8;
  color: #ffeaa7;
  font-size: 1.1rem;
  pointer-events: none;
  opacity: 0;
  text-shadow: 0 0 8px rgba(255, 234, 167, 0.75);
  animation: kqSparkle 1.8s ease-in-out infinite;
}

.kq-treasure-chest::before {
  left: -26px;
  top: -28px;
}

.kq-treasure-chest::after {
  right: -34px;
  top: 8px;
  animation-delay: 0.7s;
}

@keyframes kqSparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5) translateY(4px);
  }
  45% {
    opacity: 1;
    transform: scale(1.15) translateY(-4px);
  }
}

/* animated treasure bubble */
.kq-chest-bubble {
  animation: kqBubbleFloat 3.8s ease-in-out infinite;
}

@keyframes kqBubbleFloat {
  0%, 100% {
    transform: translateY(-50%) translateY(0);
  }
  50% {
    transform: translateY(-50%) translateY(-5px);
  }
}
  `;
  document.head.appendChild(style);

}

function ensureSummary() {
  let summary = document.getElementById("kqAdventureSummary");
  if (summary) return summary;

  summary = document.createElement("section");
  summary.id = "kqAdventureSummary";
  summary.className = "kq-adventure-summary";

  const main = document.querySelector("main") || document.body;
  const h1 = main.querySelector("h1, h2");
  if (h1?.parentElement) {
    h1.parentElement.insertBefore(summary, h1.nextSibling);
  } else {
    main.prepend(summary);
  }

  return summary;
}

function renderSummary() {
  const adventure = getAdventureProgress();
  const summary = ensureSummary();

  const world2Unlocked = isWorldUnlocked(2);
  const world3Unlocked = isWorldUnlocked(3);

  const nextText = !world2Unlocked
    ? "Beat every level in Hangul Hills to unlock Food Forest."
    : !world3Unlocked
    ? "Beat every level in Food Forest to unlock Greeting Kingdom."
    : "All worlds are unlocked — clear every level to complete the map.";

  summary.innerHTML = `
    <strong>Adventure unlocks now follow lesson progress</strong>
    <p>
      Beat every level in each world to unlock the next one.
      ${nextText}
    </p>
    <div class="kq-adventure-pills">
      <button type="button"
        class="kq-adventure-pill ${activeWorldId === 1 ? "is-active" : ""}"
        data-world-tab="1">
        🌍 Hangul Hills
      </button>

      <button type="button"
        class="kq-adventure-pill ${activeWorldId === 2 ? "is-active" : ""}"
        data-world-tab="2">
        ${world2Unlocked ? "🌍" : "🔒"} Food Forest
      </button>

      <button type="button"
        class="kq-adventure-pill ${activeWorldId === 3 ? "is-active" : ""}"
        data-world-tab="3">
        ${world3Unlocked ? "🌍" : "🔒"} Greeting Kingdom
      </button>
    </div>
  `;

  summary.querySelectorAll("[data-world-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.worldTab);
      if (!isWorldUnlocked(id)) {
        setFeedback(
          id === 2
            ? "🔒 Beat all of Hangul Hills to unlock Food Forest."
            : "🔒 Beat all of Food Forest to unlock Greeting Kingdom."
        );
        return;
      }

      activeWorldId = id;
      renderSummary();
      buildMap();
    });
  });
}

const TREASURE_KEY = "kq_adventure_treasure_claimed_v1";

const TREASURE_REWARDS = {
  1: { coins: 500, xp: 80 },
  2: { coins: 750, xp: 120 },
  3: { coins: 1000, xp: 160 },
};

const TREASURE_LAYOUTS = {
  1: [
    { x: 55, y: 31 }, // Level 1
    { x: 38, y: 48 }, // Level 2
    { x: 63, y: 61 }, // Level 3
    { x: 42, y: 78 }, // Boss 4
  ],
  2: [
    { x: 38, y: 31 },
    { x: 66, y: 45 },
    { x: 46, y: 63 },
    { x: 39, y: 79 },
  ],
  3: [
    { x: 62, y: 31 },
    { x: 40, y: 47 },
    { x: 67, y: 59 },
    { x: 43, y: 75 },
  ],
};

const TREASURE_PATHS = {
  1: `
    M55 31
    C44 32 39 37 43 42
    C48 48 31 48 38 54
    C45 60 62 52 63 61
    C64 68 48 67 47 72
    C46 76 43 76 42 78
  `,
  2: `
    M38 31
    C48 34 58 34 66 45
    C73 55 52 53 48 59
    C43 66 32 67 39 74
    C45 80 39 78 39 79
  `,
  3: `
    M62 31
    C54 38 43 37 40 47
    C37 57 65 49 67 59
    C70 70 49 65 45 70
    C41 74 43 75 43 75
  `,
};

const MAP_DECORATIONS = {
  1: [
    { src: "favicon/adventure/tree1.png", x: 28, y: 26, size: 42, delay: "0s" },
    { src: "favicon/adventure/skull1.png", x: 33, y: 36, size: 46, delay: ".4s" },
    { src: "favicon/adventure/rock1.png", x: 67, y: 43, size: 34, delay: ".8s" },
    { src: "favicon/adventure/tree2.png", x: 27, y: 63, size: 48, delay: "1.1s" },
    { src: "favicon/adventure/wood1.png", x: 32, y: 84, size: 58, delay: ".6s" },
    { src: "favicon/adventure/stone1.png", x: 70, y: 72, size: 34, delay: "1.4s" },
  ],
  2: [
    { src: "favicon/adventure/tree1.png", x: 30, y: 28, size: 44, delay: ".2s" },
    { src: "favicon/adventure/rock1.png", x: 68, y: 34, size: 36, delay: ".9s" },
    { src: "favicon/adventure/skull2.png", x: 30, y: 68, size: 44, delay: ".5s" },
    { src: "favicon/adventure/tree2.png", x: 70, y: 70, size: 50, delay: "1.2s" },
    { src: "favicon/adventure/wood1.png", x: 36, y: 84, size: 56, delay: ".7s" },
  ],
  3: [
    { src: "favicon/adventure/skull1.png", x: 30, y: 30, size: 48, delay: ".1s" },
    { src: "favicon/adventure/tree1.png", x: 70, y: 34, size: 48, delay: ".5s" },
    { src: "favicon/adventure/rock1.png", x: 38, y: 57, size: 34, delay: ".9s" },
    { src: "favicon/adventure/skull2.png", x: 72, y: 70, size: 44, delay: "1.2s" },
    { src: "favicon/adventure/tree2.png", x: 32, y: 82, size: 52, delay: ".4s" },
  ],
};

function loadTreasureClaims() {
  try {
    return JSON.parse(localStorage.getItem(TREASURE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveTreasureClaims(claims) {
  localStorage.setItem(TREASURE_KEY, JSON.stringify(claims));
}

function isTreasureClaimed(worldId) {
  return Boolean(loadTreasureClaims()[worldId]);
}

function showAdventureToast(message) {
  let toast = document.getElementById("kqAdventureToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "kqAdventureToast";
    toast.className = "kq-adventure-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("show");

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function startLevelFromMap(level) {
  if (level > P.unlocked) {
    showAdventureToast(`🔒 Clear Level ${level - 1} first.`);
    return;
  }

  if (P.cleared[level]) {
    showAdventureToast("You already cleared this level!");
    return;
  }

  const enemy = ENEMIES[(level - 1) % ENEMIES.length];
  const boss = BOSS_LEVELS.has(level);
  const hp = 16 + Math.floor(level * 2.1);

  startBattle({
    level,
    hp,
    boss,
    enemy,
    topic: topicSelect?.value || "mixed",
    difficulty: diffSelect?.value || "easy",
  });
}

function startNextPlayableLevel(world) {
  const nextLevel = world.levels.find((level) => {
    return level <= P.unlocked && !P.cleared[level];
  });

  if (!nextLevel) {
    showAdventureToast("All nodes cleared! Claim the treasure chest.");
    return;
  }

  startLevelFromMap(nextLevel);
}

function claimWorldTreasure(world) {
  if (!isWorldComplete(world.id)) {
    showAdventureToast("Complete every node first to unlock the treasure!");
    return;
  }

  if (isTreasureClaimed(world.id)) {
    showAdventureToast("You already claimed this treasure.");
    return;
  }

  const rewards = TREASURE_REWARDS[world.id] || { coins: 250, xp: 50 };
  const claims = loadTreasureClaims();

  claims[world.id] = true;
  saveTreasureClaims(claims);

  addCoins(rewards.coins);
  addXP(rewards.xp);

  showAdventureToast(`🎁 Treasure claimed! +${rewards.coins} coins · +${rewards.xp} XP`);
  buildMap();
}

function buildMap() {
  if (!mapGrid) return;

  const world = getVisibleWorld();
  activeWorldId = world.id;

  mapGrid.innerHTML = "";

  const completedCount = world.levels.filter((lvl) => P.cleared[lvl]).length;
  const worldUnlocked = isWorldUnlocked(world.id);
  const worldComplete = isWorldComplete(world.id);
  const treasureClaimed = isTreasureClaimed(world.id);
  const rewards = TREASURE_REWARDS[world.id] || { coins: 250, xp: 50 };
  const positions = TREASURE_LAYOUTS[world.id] || TREASURE_LAYOUTS[1];

  const section = document.createElement("section");
  section.className = "kq-treasure-adventure";

  section.innerHTML = `
    <div class="kq-map-tabs">
      ${WORLDS.map((w) => `
        <button
          type="button"
          class="kq-map-tab ${activeWorldId === w.id ? "active" : ""}"
          data-world-tab="${w.id}"
          ${isWorldUnlocked(w.id) ? "" : "disabled"}
        >
          ${isWorldUnlocked(w.id) ? "🗺️" : "🔒"} Level ${w.id}
        </button>
      `).join("")}
    </div>

    <div class="kq-map-board">
      <div class="kq-map-topbar">
        <button class="kq-map-back" type="button" onclick="location.href='index.html'">← Back Home</button>
        <div class="kq-map-currency">
          <span>🪙 ${TREASURE_REWARDS[world.id]?.coins || 0}</span>
          <span>⭐ ${completedCount}</span>
        </div>
      </div>

      <div class="kq-scroll-stage ${worldUnlocked ? "" : "locked"}">
        <img class="kq-scroll-bg" src="favicon/adventure/treasure-scroll.png" alt="" aria-hidden="true" />

        ${(MAP_DECORATIONS[world.id] || []).map((obj, index) => `
          <img
            class="kq-map-decoration"
            src="${obj.src}"
            alt=""
            aria-hidden="true"
            style="
              left:${obj.x}%;
              top:${obj.y}%;
              width:${obj.size}px;
              animation-delay:${obj.delay};
              --float-distance:${index % 2 === 0 ? "6px" : "4px"};
            "
          />
        `).join("")}

        <div class="kq-map-title">
          <div>Level ${world.id}</div>
          <small>${world.title}</small>
        </div>

        <svg class="kq-dashed-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="${TREASURE_PATHS[world.id] || TREASURE_PATHS[1]}" />
        </svg>

        <button class="kq-start-node" type="button" data-start="true">
          <span class="kq-start-label">START!</span>
          <span class="kq-start-circle">▶</span>
        </button>

        ${world.levels.map((level, index) => {
          const enemy = ENEMIES[(level - 1) % ENEMIES.length];
          const boss = BOSS_LEVELS.has(level);
          const cleared = Boolean(P.cleared[level]);
          const locked = level > P.unlocked;
          const pos = positions[index] || positions[positions.length - 1];

          return `
            <button
              class="kq-map-node ${cleared ? "done" : ""} ${locked ? "locked" : ""} ${boss ? "boss" : ""}"
              type="button"
              style="left:${pos.x}%; top:${pos.y}%;"
              data-level="${level}"
              ${locked ? "disabled" : ""}
            >
              <span class="kq-node-circle">${cleared ? "✓" : boss ? "👑" : enemy.sprite}</span>
              <span class="kq-node-label">${boss ? `Boss ${level}` : `Level ${level}`}</span>
              <div class="kq-map-stars" aria-hidden="true">
                <span>${cleared ? "⭐" : "☆"}</span>
                <span>${cleared ? "⭐" : "☆"}</span>
                <span>${cleared ? "⭐" : "☆"}</span>
              </div>
            </button>
          `;
        }).join("")}

        <button
          class="kq-treasure-chest ${worldComplete ? "ready" : ""} ${treasureClaimed ? "claimed" : ""}"
          type="button"
          data-chest="true"
        >
          <span class="kq-x-mark">✕</span>

          <span class="kq-chest-bubble">
            <span class="kq-chest-icon">${treasureClaimed ? "✅" : "🧰"}</span>
            <span class="kq-chest-label">${treasureClaimed ? "CLAIMED!" : "TREASURE!"}</span>
            <small>+${rewards.coins} coins · +${rewards.xp} XP</small>
          </span>
        </button>
      </div>

      <div class="kq-map-tip">
        <strong>💡 Adventure Tip</strong>
        <span>Complete every node on the map to unlock the treasure chest bonus.</span>
      </div>
    </div>
  `;

  mapGrid.appendChild(section);

  section.querySelectorAll("[data-world-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.worldTab);

      if (!isWorldUnlocked(id)) {
        showAdventureToast("🔒 Complete the previous map first.");
        return;
      }

      activeWorldId = id;
      renderSummary();
      buildMap();
    });
  });

  section.querySelector("[data-start]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    startNextPlayableLevel(world);
  });

  section.querySelectorAll("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      startLevelFromMap(Number(btn.dataset.level));
    });
  });

  section.querySelector("[data-chest]")?.addEventListener("click", () => {
    claimWorldTreasure(world);
  });
}

function setFeedback(message) {
  if (qFeedback) qFeedback.textContent = message;
}

function setTurnHint(message) {
  if (turnHint) turnHint.textContent = message;
}

function difficultyDurations(level) {
  if (level === "hard") return 2600;
  if (level === "normal") return 3800;
  return 5200;
}

function dmgFor(level) {
  if (level === "hard") return 7;
  if (level === "normal") return 6;
  return 5;
}

function enemyDmgFor(level) {
  if (level === "hard") return 6;
  if (level === "normal") return 5;
  return 4;
}

function updateBars() {
  if (!battle) return;

  const playerPct = clamp((battle.playerHP / battle.playerHPMax) * 100, 0, 100);
  const enemyPct = clamp((battle.enemyHP / battle.enemyHPMax) * 100, 0, 100);

  if (playerHPBar) playerHPBar.style.width = `${playerPct}%`;
  if (enemyHPBar) enemyHPBar.style.width = `${enemyPct}%`;
  if (playerHPText) playerHPText.textContent = `${battle.playerHP}/${battle.playerHPMax}`;
  if (enemyHPText) enemyHPText.textContent = `${battle.enemyHP}/${battle.enemyHPMax}`;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeHangulQuestion() {
  const promptType = Math.random() < 0.5 ? "sound" : "symbol";
  const picked = randomFrom(HANGUL);

  if (promptType === "sound") {
    const distractors = shuffle(HANGUL.filter((item) => item.roman !== picked.roman))
      .slice(0, 3)
      .map((item) => item.roman);

    return {
      title: "Hangul Sound Match",
      prompt: `What sound matches ${picked.char}?`,
      answer: picked.roman,
      choices: shuffle([picked.roman, ...distractors]),
    };
  }

  const distractors = shuffle(HANGUL.filter((item) => item.char !== picked.char))
    .slice(0, 3)
    .map((item) => item.char);

  return {
    title: "Hangul Symbol Match",
    prompt: `Which letter matches “${picked.roman}”?`,
    answer: picked.char,
    choices: shuffle([picked.char, ...distractors]),
  };
}

function makeVocabQuestion() {
  const promptType = Math.random() < 0.5 ? "koToEn" : "enToKo";
  const picked = randomFrom(VOCAB);

  if (promptType === "koToEn") {
    const distractors = shuffle(VOCAB.filter((item) => item.en !== picked.en))
      .slice(0, 3)
      .map((item) => item.en);

    return {
      title: "Vocabulary Match",
      prompt: `What does “${picked.ko}” mean?`,
      answer: picked.en,
      choices: shuffle([picked.en, ...distractors]),
    };
  }

  const distractors = shuffle(VOCAB.filter((item) => item.ko !== picked.ko))
    .slice(0, 3)
    .map((item) => item.ko);

  return {
    title: "Vocabulary Match",
    prompt: `Which Korean word means “${picked.en}”?`,
    answer: picked.ko,
    choices: shuffle([picked.ko, ...distractors]),
  };
}

function makeQuestion(topic) {
  if (topic === "hangul") return makeHangulQuestion();
  if (topic === "vocab" || topic === "vocabulary") return makeVocabQuestion();
  return Math.random() < 0.5 ? makeHangulQuestion() : makeVocabQuestion();
}

function stopSpeedBar() {
  if (speedFrame) cancelAnimationFrame(speedFrame);
  speedFrame = 0;
}

function startSpeedBar() {
  stopSpeedBar();
  speedPercent = 100;
  const total = difficultyDurations(battle?.difficulty || "easy");
  const start = performance.now();

  const tick = (now) => {
    const elapsed = now - start;
    speedPercent = clamp(100 - (elapsed / total) * 100, 0, 100);

    if (speedFill) speedFill.style.width = `${speedPercent}%`;

    if (speedPercent <= 0) {
      handleAnswer(false, null, true);
      return;
    }

    speedFrame = requestAnimationFrame(tick);
  };

  speedFrame = requestAnimationFrame(tick);
}

function nextQuestion() {
  if (!battle || !qChoices) return;

  answerLocked = false;
  currentQuestion = makeQuestion(battle.topic);
  qChoices.innerHTML = "";
  setFeedback("");
  setTurnHint("Answer quickly for bonus damage.");

  if (qTitle) qTitle.textContent = currentQuestion.title;
  if (qPrompt) qPrompt.textContent = currentQuestion.prompt;

  currentQuestion.choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn kq-answer-btn";
    button.textContent = choice;
    button.addEventListener("click", () => handleAnswer(choice === currentQuestion.answer, button, false));
    qChoices.appendChild(button);
  });

  startSpeedBar();
}

function endBattle(win) {
  if (!battle) return;
  stopSpeedBar();

  if (win) {
    const xp = (battle.boss ? 24 : 16) + Math.floor(battle.level / 2) + Math.floor(battle.streak / 2);
    const coins = (battle.boss ? 18 : 10) + Math.floor(battle.level / 3);

    addXP(xp);
    addCoins(coins);
    markBattleWin(`Cleared ${battle.boss ? `Boss ${battle.level}` : `Level ${battle.level}`}`, {
      boss: battle.boss,
    });

    P.cleared[battle.level] = true;
    P.unlocked = Math.max(P.unlocked, battle.level + 1);
    saveProgress();

    const clearedWorld = getWorldForLevel(battle.level);
    if (clearedWorld === 1 && isWorldComplete(1)) {
      activeWorldId = 2;
    } else if (clearedWorld === 2 && isWorldComplete(2)) {
      activeWorldId = 3;
    }

    setFeedback(`✅ Victory! +${xp} XP • +${coins} coins`);
    setTurnHint("Map updated — your next level is ready.");
  } else {
    setFeedback("💥 Defeat. Try an easier topic or go finish another lesson to unlock a new chapter.");
    setTurnHint("No worries — your progress is still saved.");
  }

  window.setTimeout(() => {
    battle = null;
    if (battleCard) battleCard.hidden = true;
    if (mapCard) mapCard.hidden = false;
    renderSummary();
    buildMap();
  }, 1300);
}

function handleAnswer(correct, clickedButton = null, timedOut = false) {
  if (answerLocked || !battle || !qChoices) return;
  answerLocked = true;
  stopSpeedBar();

  Array.from(qChoices.children).forEach((button) => {
    button.disabled = true;
    if (button.textContent === currentQuestion?.answer) button.classList.add("correct");
  });

  if (clickedButton && !correct) clickedButton.classList.add("wrong");
  if (clickedButton && correct) clickedButton.classList.add("correct");

  if (correct) {
    battle.streak += 1;
    const crit = speedPercent >= 68 ? 3 : 0;
    const combo = Math.min(Math.max(0, battle.streak - 1), 4);
    const damage = dmgFor(battle.difficulty) + combo + crit;
    battle.enemyHP = clamp(battle.enemyHP - damage, 0, battle.enemyHPMax);
    updateBars();
    setFeedback(`⚔️ Correct! You dealt ${damage} damage${crit ? " with a speed bonus" : ""}.`);
    setTurnHint("Keep the streak alive for bigger hits.");

    if (battle.enemyHP <= 0) {
      endBattle(true);
      return;
    }
  } else {
    battle.streak = 0;
    const damage = enemyDmgFor(battle.difficulty) + (timedOut ? 1 : 0);
    battle.playerHP = clamp(battle.playerHP - damage, 0, battle.playerHPMax);
    updateBars();

    setFeedback(
      timedOut
        ? `⏳ Too slow. The enemy hit you for ${damage}.`
        : `❌ Not quite. The enemy hit you for ${damage}.`
    );
    setTurnHint(`Correct answer: ${currentQuestion?.answer || "—"}`);

    if (battle.playerHP <= 0) {
      endBattle(false);
      return;
    }
  }

  window.setTimeout(nextQuestion, 720);
}

function startBattle(config) {
  battle = {
    level: config.level,
    boss: config.boss,
    enemyHPMax: config.hp,
    enemyHP: config.hp,
    playerHPMax: config.difficulty === "hard" ? 18 : config.difficulty === "normal" ? 20 : 22,
    playerHP: config.difficulty === "hard" ? 18 : config.difficulty === "normal" ? 20 : 22,
    topic: config.topic,
    difficulty: config.difficulty,
    streak: 0,
  };

  if (mapCard) mapCard.hidden = true;
  if (battleCard) battleCard.hidden = false;
  if (enemyNameEl) enemyNameEl.textContent = config.enemy.name;
  if (enemySpriteEl) enemySpriteEl.textContent = config.enemy.sprite;
  if (encounterTitle) {
    encounterTitle.textContent = `${config.boss ? "Boss" : "Level " + config.level} • ${config.enemy.name}`;
  }

  updateBars();
  nextQuestion();
}

function exitBattle() {
  stopSpeedBar();
  battle = null;
  if (battleCard) battleCard.hidden = true;
  if (mapCard) mapCard.hidden = false;
  setFeedback("");
}

function boot() {
  if (!mapGrid) return;
  ensureStyles();
  renderSummary();
  buildMap();
  if (battleCard) battleCard.hidden = true;
  if (mapCard) mapCard.hidden = false;
}

boot();
on("state:changed", () => {
  renderSummary();
  buildMap();
});

exitBattleBtn?.addEventListener("click", exitBattle);

topicSelect?.addEventListener("change", buildMap);
diffSelect?.addEventListener("change", buildMap);
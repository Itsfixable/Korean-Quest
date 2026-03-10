import {
  addXP,
  addCoins,
  getAdventureProgress,
  markBattleWin,
  mountGuideBubble,
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
        grid-template-columns: 1fr;
      }

      .kq-world-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .map-node {
        min-height: 150px;
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

function buildMap() {
  if (!mapGrid) return;

  const adventure = getAdventureProgress();
  const world = getVisibleWorld();
  activeWorldId = world.id;

  mapGrid.innerHTML = "";

  const worldUnlocked = isWorldUnlocked(world.id);
  const completedCount = world.levels.filter((lvl) => P.cleared[lvl]).length;

  const section = document.createElement("section");
  section.className = `kq-world-section ${world.bgClass}`;

  section.innerHTML = `
    <div class="kq-world-header">
      <div>
        <h3>${world.rangeLabel} — ${world.title}</h3>
        <p>${completedCount}/${world.levels.length} levels cleared</p>
      </div>
      <span class="kq-world-badge">
        ${worldUnlocked ? "🌍 Unlocked" : "🔒 Locked"}
      </span>
    </div>
    <div class="kq-world-grid" id="kq-world-grid-${world.id}"></div>
  `;

  mapGrid.appendChild(section);

  const worldGrid = section.querySelector(`#kq-world-grid-${world.id}`);

  world.levels.forEach((level) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "map-node";

    const enemy = ENEMIES[(level - 1) % ENEMIES.length];
    const boss = BOSS_LEVELS.has(level);
    const hp = 16 + Math.floor(level * 2.1);
    const sequentialLocked = level > P.unlocked;

    let statusText = "Ready";
    let reasonText = `HP ${hp} • ${enemy.name}`;

    if (boss) {
      statusText = "Boss Battle";
      node.classList.add("boss-node");
    }

    if (P.cleared[level]) {
      statusText = "✅ Cleared";
      node.classList.add("cleared");
    } else if (!sequentialLocked) {
      node.classList.add("playable");
    }

    if (sequentialLocked) {
      node.classList.add("locked");
      statusText = "Clear previous level";
      reasonText = `Beat Level ${level - 1} first to continue.`;
    }

    node.innerHTML = `
      <div class="kq-node-top">

        <div class="kq-node-title">
          <span class="kq-node-sub">
            ${boss ? "👑" : "🗺️"} ${enemy.sprite}
            ${boss ? "Boss Stage" : "Adventure Stage"}
          </span>

          <span class="kq-node-label">
            ${boss ? `Boss ${level}` : `Level ${level}`}
          </span>
        </div>

      </div>

      <div class="kq-node-meta">${reasonText}</div>
      <div class="kq-node-status">${statusText}</div>
    `;

    node.addEventListener("click", () => {
      if (sequentialLocked) {
        setFeedback(`🔒 Clear Level ${level - 1} first.`);
        return;
      }

      startBattle({
        level,
        hp,
        boss,
        enemy,
        topic: topicSelect?.value || "mixed",
        difficulty: diffSelect?.value || "easy",
      });
    });

    worldGrid.appendChild(node);
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

mountGuideBubble(
  [
    "World 1 starts in Hangul Hills. Beat all 4 levels to unlock Food Forest.",
    "Only one world shows at a time now, so the map stays clean and readable.",
    "Beat each boss level to move through the worlds faster.",
  ],
  { label: "Map Guide", id: "kq-adventure-bubble", side: "right" }
);
// js/main/adventure.js
// Prodigy-style battles + Locked Level Select with Keys
// Integrates with state.js: addXP, addCoins, incQuest, addRecentWork

import { addXP, addCoins, incQuest, addRecentWork } from "./state.js";

/* ========================= Persisted Progress ========================= */
const STORE_KEY = "kq_node_adv_progress_v1";
/* shape:
{
  keys: number,
  unlocked: number,
  cleared: { [level]: true }
}
*/
const P = loadProgress();
function loadProgress(){
  try{
    const d = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!d) return { keys: 0, unlocked: 1, cleared: {} };
    return { keys: d.keys|0, unlocked: Math.max(1, d.unlocked|0), cleared: d.cleared || {} };
  }catch{ return { keys: 0, unlocked: 1, cleared: {} }; }
}
function saveProgress(){ localStorage.setItem(STORE_KEY, JSON.stringify(P)); }

/* ============================= Data ============================= */
const BOSS_LEVELS = new Set([4, 8, 12]);

const CONSONANTS = [
  { roman: "g/k", char: "ㄱ" }, { roman: "n", char: "ㄴ" }, { roman: "d/t", char: "ㄷ" }, { roman: "r/l", char: "ㄹ" },
  { roman: "m", char: "ㅁ" }, { roman: "b/p", char: "ㅂ" }, { roman: "s", char: "ㅅ" }, { roman: "", char: "ㅇ" },
  { roman: "j", char: "ㅈ" }, { roman: "ch", char: "ㅊ" }, { roman: "k", char: "ㅋ" }, { roman: "t", char: "ㅌ" },
  { roman: "p", char: "ㅍ" }, { roman: "h", char: "ㅎ" }
];

const VOCAB = [
  { ko: "학교", en: "school" }, { ko: "선생님", en: "teacher" }, { ko: "학생", en: "student" },
  { ko: "책", en: "book" }, { ko: "물", en: "water" }, { ko: "사과", en: "apple" },
  { ko: "친구", en: "friend" }, { ko: "시간", en: "time" }, { ko: "집", en: "house" },
  { ko: "버스", en: "bus" }, { ko: "공원", en: "park" }, { ko: "도서관", en: "library" },
  { ko: "병원", en: "hospital" }, { ko: "밥", en: "rice/meal" }, { ko: "커피", en: "coffee" },
  { ko: "아침", en: "morning" }, { ko: "저녁", en: "evening" }, { ko: "오늘", en: "today" },
  { ko: "내일", en: "tomorrow" }, { ko: "어제", en: "yesterday" }
];

/* ============================= Utilities ============================= */
const $ = (id)=>document.getElementById(id);
const shuffle = (a)=>a.sort(()=>Math.random()-0.5);
const sample = (arr, n)=>shuffle(arr.slice()).slice(0,n);
const clamp = (x,min,max)=>Math.max(min,Math.min(max,x));

/* ========================== Map Generation =========================== */
const mapGrid = $("mapGrid");
const topicSelect = $("topicSelect");
const diffSelect  = $("difficultySelect");

const keyBadgeId = "kqKeyBadge";

function buildMap() {
  // header key "badge" — we style it as a compact button pill
  let badge = document.getElementById(keyBadgeId);
  if (!badge) {
    const header = mapGrid?.closest("section")?.querySelector("header");
    if (header) {
      badge = document.createElement("span");
      badge.id = keyBadgeId;
      badge.className = "btn id-badge";   // ← use button styling, not badge
      badge.style.marginLeft = "8px";
      header.querySelector("h2")?.appendChild(badge);
    }
  }
  if (badge) {
    badge.className = "btn id-badge";
    badge.textContent = `🔑 Keys: ${P.keys}`;
  }

  mapGrid.innerHTML = "";

  for (let level=1; level<=12; level++){
    const node = document.createElement("button");
    node.className = "map-node";
    node.type = "button";

    const isBoss = BOSS_LEVELS.has(level);
    const hp = 14 + Math.floor(level*1.8);
    const locked = level > P.unlocked;

    node.innerHTML = `
      <div style="font-weight:800; margin-bottom:4px;">${isBoss ? `Boss ${level}` : `Level ${level}`}</div>
      <div class="muted" style="font-size:.9rem">${locked ? "🔒 Locked" : (P.cleared[level] ? "✅ Cleared" : "Ready")}</div>
      <div class="muted" style="margin-top:4px;">HP: ${hp}</div>
    `;

    if (locked) {
      node.classList.add("locked");
      node.addEventListener("click", ()=> {
        if (P.keys > 0) {
          const ok = confirm(`Use 1 key to unlock Level ${level}?`);
          if (ok) {
            P.keys -= 1;
            P.unlocked = Math.max(P.unlocked, level);
            saveProgress();
            buildMap();
          }
        } else {
          alert("Locked. Defeat earlier levels or obtain a key from battles.");
        }
      });
    } else {
      node.addEventListener("click", ()=>startBattle({
        name: pickEnemyName(level),
        hp,
        sprite: pickEnemySprite(level),
        level,
        topic: topicSelect?.value || "mixed",
        difficulty: diffSelect?.value || "easy",
        boss: isBoss
      }));
    }

    mapGrid.appendChild(node);
  }
}

function pickEnemyName(i){
  const names = ["Slime","Imp","Mushling","Bat","Goblin","Golem","Wisp","Oni","Wolf","Kappa","Drake","Sentinel"];
  return names[(i-1)%names.length];
}
function pickEnemySprite(i){
  const sprites = ["👾","🧟","🦇","🧌","🪵","🌀","👹","🐺","🐉","💀","🔥","🪨"];
  return sprites[(i-1)%sprites.length];
}

/* =========================== Battle State ============================ */
const mapCard = $("mapCard");
const battleCard = $("battleCard");

const enemyNameEl = $("enemyName");
const enemySpriteEl = $("enemySprite");
const enemyHPBar = $("enemyHPBar");
const enemyHPText = $("enemyHPText");
const playerHPBar = $("playerHPBar");
const playerHPText = $("playerHPText");
const qTitle = $("qTitle");
const qPrompt = $("qPrompt");
const qChoices = $("qChoices");
const qFeedback = $("qFeedback");
const speedFill = $("speedFill");
const exitBattleBtn = $("exitBattleBtn");
const turnHint = $("turnHint");
const encounterTitle = $("encounterTitle");

let state = null;

/* ============================== Battle ============================== */
function startBattle(cfg){
  mapCard.hidden = true;
  battleCard.hidden = false;

  state = {
    playerHPMax: 22, playerHP: 22,
    enemyHPMax: cfg.hp, enemyHP: cfg.hp,
    topic: cfg.topic, difficulty: cfg.difficulty,
    level: cfg.level, boss: !!cfg.boss,
    streak: 0, fastWindow: 4000,
  };
  enemyNameEl.textContent = cfg.name;
  enemySpriteEl.textContent = cfg.sprite;
  encounterTitle.textContent = `${cfg.boss ? "Boss" : "Lv." + cfg.level} ${cfg.name}`;
  updateBars();
  nextQuestion();
}

function endBattle(win){
  if (win){
    const baseXP = state.boss ? 22 : 15;
    const xp = baseXP + Math.floor(state.streak*1.2);
    const coins = (state.boss ? 16 : 10) + Math.floor(state.streak/2);
    addXP(xp);
    addCoins(coins);
    incQuest?.("battle-1", 1);

    // Log to Recent Work
    addRecentWork(`Cleared ${state.boss ? "Boss" : "Level"} ${state.level}`, "Adventure");

    let keyMsg = "";
    if (state.boss) {
      P.keys += 1;
      keyMsg = " + 🔑1 (boss)";
    } else {
      if (Math.random() < 0.30){ P.keys += 1; keyMsg = " + 🔑1 (drop)"; }
    }

    P.cleared[state.level] = true;
    P.unlocked = Math.max(P.unlocked, state.level + 1);
    saveProgress();

    qFeedback.textContent = `✅ Victory! +${xp} XP, +${coins} coins${keyMsg}`;
  } else {
    qFeedback.textContent = `💥 You were defeated. Try an easier node or use keys to unlock.`;
  }

  setTimeout(()=>{
    battleCard.hidden = true;
    mapCard.hidden = false;
    buildMap();
  }, 1200);
}

exitBattleBtn.addEventListener("click", ()=>{
  battleCard.hidden = true;
  mapCard.hidden = false;
});

/* ========================== Question Engine ========================= */
function nextQuestion(){
  qFeedback.textContent = "";
  qChoices.innerHTML = "";
  turnHint.textContent = "Answer to attack!";
  startSpeedBar();

  const q = makeQuestion(state.topic, state.difficulty);
  qTitle.textContent = q.title;
  qPrompt.textContent = q.prompt;

  const answers = shuffle(q.choices.map((c)=>({text:c, correct: c===q.answer})));
  for (const ans of answers){
    const b = document.createElement("button");
    b.className = "btn";
    b.type = "button";
    b.textContent = ans.text;
    b.addEventListener("click", ()=>onAnswer(ans.correct, q));
    qChoices.appendChild(b);
  }
}

function onAnswer(correct, q){
  stopSpeedBar();
  [...qChoices.children].forEach((b)=>b.disabled = true);
  event?.target?.classList?.add(correct ? "correct" : "wrong");

  if (correct){
    state.streak++;
    const base = dmgFor(state.difficulty);
    const streakBonus = Math.min(state.streak-1, 4);
    const crit = speedPercent > 70 ? 4 : 0;
    const dmg = base + streakBonus + crit;
    qFeedback.textContent = `⚔️ Correct! -${dmg} HP ${crit? "(crit!)":""} ${streakBonus? `(+${streakBonus} streak)`: ""}`;
    state.enemyHP = clamp(state.enemyHP - dmg, 0, state.enemyHPMax);
    updateBars();
    if (state.enemyHP <= 0) return endBattle(true);
    setTimeout(nextQuestion, 600);
  } else {
    state.streak = 0;
    const edmg = enemyDmgFor(state.difficulty);
    qFeedback.textContent = `😵 Wrong. Enemy hits for ${edmg}. ${explain(q)}`;
    state.playerHP = clamp(state.playerHP - edmg, 0, state.playerHPMax);
    updateBars();
    if (state.playerHP <= 0) return endBattle(false);
    setTimeout(nextQuestion, 800);
  }
}

function dmgFor(diff){ if (diff==="easy") return 6; if (diff==="normal") return 7; return 8; }
function enemyDmgFor(diff){ if (diff==="easy") return 5; if (diff==="normal") return 6; return 7; }
function explain(q){
  if (q.kind==="roman_to_hangul"){ return `Correct mapping: ${q.answer} represents /${q.meta.roman}/.`; }
  if (q.kind==="ko_to_en"){ return `“${q.meta.ko}” means “${q.meta.en}”.`; }
  return "";
}

function makeQuestion(topic){
  const pool = topic==="hangul" ? ["roman_to_hangul"]
            : topic==="vocab" ? ["ko_to_en"]
            : ["roman_to_hangul","ko_to_en"];
  const kind = pool[Math.floor(Math.random()*pool.length)];
  if (kind==="roman_to_hangul"){
    const choices = sample(CONSONANTS, 4);
    let target = choices[Math.floor(Math.random()*choices.length)];
    if (!target.roman) {
      const c2 = sample(CONSONANTS.filter(c=>c.roman), 4);
      target = c2[Math.floor(Math.random()*c2.length)];
      return { kind, title:"Sounds → Hangul", prompt:`Which Hangul letter represents “${target.roman}”?`, choices:c2.map(c=>c.char), answer:target.char, meta:target };
    }
    return { kind, title:"Sounds → Hangul", prompt:`Which Hangul letter represents “${target.roman}”?`, choices:choices.map(c=>c.char), answer:target.char, meta:target };
  }
  const choices = sample(VOCAB, 4);
  const target = choices[Math.floor(Math.random()*choices.length)];
  return { kind:"ko_to_en", title:"Vocabulary → Meaning", prompt:`What does this Hangul word mean in English? “${target.ko}”`, choices:choices.map(v=>v.en), answer:target.en, meta:target };
}

/* ====================== UI: HP bars & speed timer ===================== */
function updateBars(){
  playerHPBar.style.width = `${Math.round(100*state.playerHP/state.playerHPMax)}%`;
  enemyHPBar.style.width  = `${Math.round(100*state.enemyHP/state.enemyHPMax)}%`;
  playerHPText.textContent = `${state.playerHP}/${state.playerHPMax}`;
  enemyHPText.textContent = `${state.enemyHP}/${state.enemyHPMax}`;
}

let speedTimer = null;
let speedStart = 0;
let speedPercent = 100;

function startSpeedBar(){
  speedStart = performance.now();
  speedPercent = 100;
  speedFill.style.width = "100%";
  if (speedTimer) cancelAnimationFrame(speedTimer);
  const loop = (t)=>{
    const dt = t - speedStart;
    speedPercent = clamp(100 - Math.round(100*dt/state.fastWindow), 0, 100);
    speedFill.style.width = `${speedPercent}%`;
    speedTimer = speedPercent>0 ? requestAnimationFrame(loop) : null;
  };
  speedTimer = requestAnimationFrame(loop);
}
function stopSpeedBar(){
  if (speedTimer) cancelAnimationFrame(speedTimer);
  speedTimer = null;
}

/* ============================== Boot ============================== */
buildMap();
topicSelect?.addEventListener("change", buildMap);
diffSelect?.addEventListener("change", buildMap);

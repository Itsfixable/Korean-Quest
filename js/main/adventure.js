// js/main/adventure.js
// Prodigy-style battles: answer -> attack. Miss -> enemy attacks.
// Integrates with state.js: addXP, addCoins, incQuest, etc.

import { addXP, addCoins, incQuest } from "./state.js";

// --------------------- Data: letters & vocab ---------------------

// Hangul consonants (initial sounds). No answer leaks in prompt.
const CONSONANTS = [
  { roman: "g/k", char: "ㄱ" }, { roman: "n", char: "ㄴ" }, { roman: "d/t", char: "ㄷ" }, { roman: "r/l", char: "ㄹ" },
  { roman: "m", char: "ㅁ" }, { roman: "b/p", char: "ㅂ" }, { roman: "s", char: "ㅅ" }, { roman: "", char: "ㅇ" }, // ㅇ initial is silent
  { roman: "j", char: "ㅈ" }, { roman: "ch", char: "ㅊ" }, { roman: "k", char: "ㅋ" }, { roman: "t", char: "ㅌ" },
  { roman: "p", char: "ㅍ" }, { roman: "h", char: "ㅎ" }
];

// Light starter vocab. You can expand freely.
const VOCAB = [
  { ko: "학교", en: "school" }, { ko: "선생님", en: "teacher" }, { ko: "학생", en: "student" },
  { ko: "책", en: "book" }, { ko: "물", en: "water" }, { ko: "사과", en: "apple" },
  { ko: "친구", en: "friend" }, { ko: "시간", en: "time" }, { ko: "집", en: "house" },
  { ko: "버스", en: "bus" }, { ko: "공원", en: "park" }, { ko: "도서관", en: "library" },
  { ko: "병원", en: "hospital" }, { ko: "밥", en: "rice/meal" }, { ko: "커피", en: "coffee" },
  { ko: "아침", en: "morning" }, { ko: "저녁", en: "evening" }, { ko: "오늘", en: "today" },
  { ko: "내일", en: "tomorrow" }, { ko: "어제", en: "yesterday" }
];

// --------------------- Utilities ---------------------

const $ = (id)=>document.getElementById(id);
const shuffle = (a)=>a.sort(()=>Math.random()-0.5);
const sample = (arr, n)=>shuffle(arr.slice()).slice(0,n);
const clamp = (x,min,max)=>Math.max(min,Math.min(max,x));

// --------------------- Map Generation ---------------------

const mapGrid = $("mapGrid");
const topicSelect = $("topicSelect");
const diffSelect  = $("difficultySelect");

function buildMap() {
  mapGrid.innerHTML = "";
  // 12 nodes with escalating enemy HP
  for (let i=1;i<=12;i++){
    const node = document.createElement("button");
    node.className = "map-node";
    node.type = "button";
    node.textContent = `Node ${i}`;
    node.dataset.hp = 14 + Math.floor(i*1.5);
    node.dataset.level = i;
    node.addEventListener("click", ()=>startBattle({
      name: pickEnemyName(i),
      hp: Number(node.dataset.hp),
      sprite: pickEnemySprite(i),
      level: Number(node.dataset.level),
      topic: topicSelect.value,
      difficulty: diffSelect.value
    }));
    mapGrid.appendChild(node);
  }
}

function pickEnemyName(i){
  const names = ["Slime","Imp","Mushling","Bat","Goblin","Golem","Wisp","Oni","Wolf","Kappa","Drake","Sentinel"];
  return names[(i-1)%names.length];
}
function pickEnemySprite(i){
  const sprites = ["👾","🧟","🦇","🧌","🪵","🌀","👹","🐺","🐉","💀"];
  return sprites[(i-1)%sprites.length];
}

// --------------------- Battle State ---------------------

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
// state = { playerHP, playerHPMax, enemyHP, enemyHPMax, topic, difficulty, streak, fastWindow, turnTimerId }

function startBattle(cfg){
  mapCard.hidden = true;
  battleCard.hidden = false;

  state = {
    playerHPMax: 22, playerHP: 22,
    enemyHPMax: cfg.hp, enemyHP: cfg.hp,
    topic: cfg.topic, difficulty: cfg.difficulty,
    streak: 0, fastWindow: 4000, // 4s for crit
  };
  enemyNameEl.textContent = cfg.name;
  enemySpriteEl.textContent = cfg.sprite;
  encounterTitle.textContent = `Lv.${cfg.level} ${cfg.name}`;
  updateBars();
  nextQuestion();
}

function endBattle(win){
  if (win){
    const xp = 15 + Math.floor(state.streak*1.5);
    const coins = 10 + Math.floor(state.streak/2);
    addXP(xp);
    addCoins(coins);
    incQuest?.("battle-1", 1);
    qFeedback.textContent = `✅ Victory! +${xp} XP, +${coins} coins`;
  } else {
    qFeedback.textContent = `💥 You were defeated. Try an easier node or topic!`;
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

// --------------------- Question Engine ---------------------

function nextQuestion(){
  qFeedback.textContent = "";
  qChoices.innerHTML = "";
  turnHint.textContent = "Answer to attack!";
  // start speed timer (crit if quick)
  startSpeedBar();
  const q = makeQuestion(state.topic, state.difficulty);
  qTitle.textContent = q.title;
  qPrompt.textContent = q.prompt;

  const answers = shuffle(q.choices.map((c,i)=>({text:c, correct: c===q.answer})));
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
  // disable buttons
  [...qChoices.children].forEach((b)=>b.disabled = true);
  // mark chosen (visual)
  event?.target?.classList?.add(correct ? "correct" : "wrong");
  if (correct){
    state.streak++;
    const base = dmgFor(state.difficulty);
    const streakBonus = Math.min(state.streak-1, 4); // up to +4
    const crit = speedPercent > 70 ? 4 : 0;          // fast answer bonus
    const dmg = base + streakBonus + crit;
    qFeedback.textContent = `⚔️ Correct! -${dmg} HP ${crit? "(crit!)":""} ${streakBonus? `(+${streakBonus} streak bonus)`: ""}`;
    state.enemyHP = clamp(state.enemyHP - dmg, 0, state.enemyHPMax);
    updateBars();
    if (state.enemyHP <= 0) return endBattle(true);
    // next question soon
    setTimeout(nextQuestion, 600);
  } else {
    state.streak = 0;
    const edmg = enemyDmgFor(state.difficulty);
    qFeedback.textContent = `😵 Wrong. The enemy hits you for ${edmg}. ${explain(q)}`;
    state.playerHP = clamp(state.playerHP - edmg, 0, state.playerHPMax);
    updateBars();
    if (state.playerHP <= 0) return endBattle(false);
    setTimeout(nextQuestion, 800);
  }
}

function dmgFor(diff){
  if (diff==="easy") return 6;
  if (diff==="normal") return 7;
  return 8; // hard
}
function enemyDmgFor(diff){
  if (diff==="easy") return 5;
  if (diff==="normal") return 6;
  return 7;
}

// Explain correct answer without leaking beforehand
function explain(q){
  if (q.kind==="roman_to_hangul"){
    return `Correct mapping: ${q.answer} represents /${q.meta.roman}/.`;
  }
  if (q.kind==="ko_to_en"){
    return `“${q.meta.ko}” means “${q.meta.en}”.`;
  }
  return "";
}

// Question builder that NEVER uses the answer text in the prompt.
function makeQuestion(topic, diff){
  // pick one of 2 safe types, or mix
  const pool = topic==="hangul" ? ["roman_to_hangul"]
              : topic==="vocab" ? ["ko_to_en"]
              : ["roman_to_hangul","ko_to_en"];
  const kind = pool[Math.floor(Math.random()*pool.length)];
  if (kind==="roman_to_hangul"){
    // Ask: which Hangul jamo matches romanized sound X?
    const choices = sample(CONSONANTS, 4);
    const pick = choices[Math.floor(Math.random()*choices.length)];
    // Ensure roman text isn't empty (ㅇ initial is silent). If so, re-pick pool without ㅇ.
    let target = pick;
    if (!target.roman) {
      const withoutSilent = CONSONANTS.filter(c=>c.roman);
      const c2 = sample(withoutSilent, 4);
      target = c2[Math.floor(Math.random()*c2.length)];
      return {
        kind, title:"Sounds → Hangul", prompt:`Which Hangul letter represents the romanized sound “${target.roman}”?`,
        choices: c2.map(c=>c.char), answer: target.char, meta: target
      };
    }
    return {
      kind, title:"Sounds → Hangul",
      prompt:`Which Hangul letter represents the romanized sound “${target.roman}”?`,
      choices: choices.map(c=>c.char), answer: target.char, meta: target
    };
  }
  // ko_to_en: show a Korean word; ask for English meaning (no romanization in prompt)
  if (kind==="ko_to_en"){
    const choices = sample(VOCAB, 4);
    const target = choices[Math.floor(Math.random()*choices.length)];
    return {
      kind, title:"Vocabulary → Meaning",
      prompt:`What does this Hangul word mean in English?  “${target.ko}”`,
      choices: choices.map(v=>v.en), answer: target.en, meta: target
    };
  }
}

// --------------------- UI: HP bars & speed timer ---------------------

function updateBars(){
  playerHPBar.style.width = `${Math.round(100*state.playerHP/state.playerHPMax)}%`;
  enemyHPBar.style.width  = `${Math.round(100*state.enemyHP/state.enemyHPMax)}%`;
  playerHPText.textContent = `${state.playerHP}/${state.playerHPMax}`;
  enemyHPText.textContent = `${state.enemyHP}/${state.enemyHPMax}`;
}

// simple “answer fast” bar: starts full, drains to 0 over state.fastWindow ms
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

// --------------------- Boot ---------------------

buildMap();
topicSelect.addEventListener("change", buildMap);
diffSelect.addEventListener("change", buildMap);

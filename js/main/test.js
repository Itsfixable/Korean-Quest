// js/main/test.js
import { FLASHCARD_SETS } from "../levels/flashcard-sets.js";
import { addXP, addCoins, addRecentWork } from "./state.js";

const $ = (id) => document.getElementById(id);

// uses same key as flashcards.js
const FLASH_STORE_KEY = "kq-flashcards-progress";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function loadFlashProgress() {
  try {
    return JSON.parse(localStorage.getItem(FLASH_STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function getSetById(id) {
  return FLASHCARD_SETS.find((s) => s.id === id) || FLASHCARD_SETS[0];
}

function stagePulse(kind) {
  const stage = $("qStage");
  if (!stage) return;

  stage.classList.remove("anim-next", "anim-wrong");
  stage.offsetHeight;
  stage.classList.add(kind);

  window.setTimeout(() => stage.classList.remove(kind), 280);
}

/**
 * Build questions from selected cards
 */
function makeQuestions(cards, count, modeChoice) {
  const pool = shuffle(cards);
  const picked = pool.slice(0, Math.min(count, pool.length)); // unique per card

  const allTerms = cards.map((c) => c.term);
  const allDefs = cards.map((c) => c.def);

  return picked.map((c) => {
    const dir = Math.random() < 0.5 ? "termToDef" : "defToTerm";
    const type =
      modeChoice === "mixed"
        ? (Math.random() < 0.5 ? "mc" : "written")
        : modeChoice;

    if (dir === "termToDef") {
      const answer = c.def;
      const prompt = `What does “${c.term}” mean?`;

      const distractors = shuffle(allDefs.filter((d) => d !== answer)).slice(0, 3);
      const choices = shuffle([answer, ...distractors]).slice(0, 4);

      return { type, dir, prompt, answer, choices, card: c };
    } else {
      const answer = c.term;
      const prompt = `Which Korean matches: “${c.def}”?`;

      const distractors = shuffle(allTerms.filter((t) => t !== answer)).slice(0, 3);
      const choices = shuffle([answer, ...distractors]).slice(0, 4);

      return { type, dir, prompt, answer, choices, card: c };
    }
  });
}

let currentSet = getSetById(FLASHCARD_SETS[0].id);
let questions = [];
let wrongOnly = null;
let qIndex = 0;
let correct = 0;
let review = []; // {prompt, given, answer, ok, term, def}

function renderSetSelect() {
  const sel = $("setSelect");
  sel.innerHTML = "";
  for (const s of FLASHCARD_SETS) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.title;
    sel.appendChild(opt);
  }
  sel.value = currentSet.id;
}

function getScopedCards(set, scope) {
  const progress = loadFlashProgress();
  const prog = progress?.[set.id] || { known: {}, learning: {} };

  if (scope === "all") return set.cards;

  if (scope === "learning") {
    const terms = new Set(Object.keys(prog.learning || {}).filter((t) => prog.learning[t]));
    return set.cards.filter((c) => terms.has(c.term));
  }

  if (scope === "known") {
    const terms = new Set(Object.keys(prog.known || {}).filter((t) => prog.known[t]));
    return set.cards.filter((c) => terms.has(c.term));
  }

  return set.cards;
}

function updateSetupNote() {
  const scope = $("scopeSelect").value;
  const set = getSetById($("setSelect").value);
  const scoped = getScopedCards(set, scope);

  if (scope !== "all" && scoped.length === 0) {
    $("setupNote").textContent =
      "No cards in this scope yet. Go to Flashcards and mark some cards as Known or Still learning.";
  } else {
    $("setupNote").textContent = "";
  }
}

function showQuestion() {
  const q = questions[qIndex];

  $("testCard").hidden = false;
  $("resultCard").hidden = true;

  $("feedback").textContent = "";
  $("writtenInput").value = "";

  $("qProgress").textContent = `${qIndex + 1} / ${questions.length}`;
  $("scoreMini").textContent = `Score: ${correct}`;
  $("prompt").textContent = q.prompt;

  const pct = questions.length ? Math.round((qIndex / questions.length) * 100) : 0;
  $("testProgressBar").style.width = `${pct}%`;

  $("mcArea").hidden = true;
  $("writtenArea").hidden = true;
  $("mcArea").innerHTML = "";

  if (q.type === "mc") {
    $("mcArea").hidden = false;

    q.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.textContent = choice;
      btn.addEventListener("click", () => grade(choice, btn));
      $("mcArea").appendChild(btn);
    });
  } else {
    $("writtenArea").hidden = false;
    $("writtenInput").focus();
  }

  stagePulse("anim-next");
}

function lockChoices() {
  const buttons = $("mcArea").querySelectorAll("button.choice");
  buttons.forEach((b) => (b.disabled = true));
}

function grade(givenRaw, clickedBtn = null) {
  const q = questions[qIndex];
  const given = normalize(givenRaw);
  const ans = normalize(q.answer);

  const ok = given === ans;

  if (ok) {
    correct++;
    $("feedback").textContent = "✅ Correct!";
  } else {
    $("feedback").textContent = `❌ Not quite. Correct answer: ${q.answer}`;
    stagePulse("anim-wrong");
  }

  review.push({
    prompt: q.prompt,
    given: givenRaw,
    answer: q.answer,
    ok,
    term: q.card.term,
    def: q.card.def,
  });

  if (q.type === "mc") {
    lockChoices();
    const buttons = Array.from($("mcArea").querySelectorAll("button.choice"));
    for (const b of buttons) {
      if (normalize(b.textContent) === ans) b.classList.add("correct");
    }
    if (clickedBtn && !ok) clickedBtn.classList.add("wrong");
    if (clickedBtn && ok) clickedBtn.classList.add("correct");
  }

  window.setTimeout(() => {
    qIndex++;
    if (qIndex >= questions.length) finish();
    else showQuestion();
  }, 520);
}

function submitWritten() {
  const val = $("writtenInput").value;
  if (!val.trim()) {
    $("feedback").textContent = "Type an answer (or press Skip).";
    return;
  }
  grade(val);
}

function skip() {
  const q = questions[qIndex];
  review.push({
    prompt: q.prompt,
    given: "(skipped)",
    answer: q.answer,
    ok: false,
    term: q.card.term,
    def: q.card.def,
  });

  qIndex++;
  if (qIndex >= questions.length) finish();
  else showQuestion();
}

function computeWrongTerms() {
  const wrong = review.filter((r) => !r.ok).map((r) => r.term);
  return Array.from(new Set(wrong));
}

/* ===== Score ring ===== */
function setRingPercent(p) {
  const ring = $("ringFg");
  const label = $("ringPercent");
  if (!ring || !label) return;

  const r = 44;
  const C = 2 * Math.PI * r; // 276.46
  const pct = Math.max(0, Math.min(100, p));

  const offset = C * (1 - pct / 100);
  ring.style.strokeDasharray = `${C}`;
  ring.style.strokeDashoffset = `${offset}`;

  label.textContent = `${Math.round(pct)}%`;

  const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#22c55e";
  const danger = getComputedStyle(document.documentElement).getPropertyValue("--danger").trim() || "#ff6b6b";
  ring.style.stroke = pct >= 70 ? brand : danger;
}

function animateRingTo(targetPct) {
  const duration = 900;
  const start = performance.now();
  const to = Math.max(0, Math.min(100, targetPct));

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const cur = to * eased;
    setRingPercent(cur);
    if (t < 1) requestAnimationFrame(tick);
  }

  setRingPercent(0);
  requestAnimationFrame(tick);
}

/* ===== Missed list ===== */
function renderMissed() {
  const missed = review.filter((r) => !r.ok);
  const grid = $("missedGrid");
  const note = $("missedNote");
  if (!grid || !note) return;

  grid.innerHTML = "";

  if (missed.length === 0) {
    note.textContent = "Perfect score — you didn’t miss any questions 🎉";
    return;
  }

  note.textContent = `You missed ${missed.length} question(s). Review them below:`;

  for (const r of missed) {
    const div = document.createElement("div");
    div.className = "review-item bad";
    div.innerHTML = `
      <strong>${escapeHtml(r.prompt)}</strong>
      <div>Your answer: <code>${escapeHtml(String(r.given))}</code></div>
      <div>Correct answer: <code>${escapeHtml(String(r.answer))}</code></div>
      <div class="muted">Card: ${escapeHtml(r.term)} → ${escapeHtml(r.def)}</div>
    `;
    grid.appendChild(div);
  }
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function finish() {
  $("testCard").hidden = true;
  $("resultCard").hidden = false;

  const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  $("resultText").textContent = `Score: ${correct}/${questions.length} (${pct}%)`;

  animateRingTo(pct);
  renderMissed();

  if (pct >= 80) {
    addXP(20);
    addCoins(10);
    addRecentWork(`Test: scored ${pct}% on "${currentSet.title}" (+20 XP, +10 coins)`, "Lesson");
  } else {
    addRecentWork(`Test: scored ${pct}% on "${currentSet.title}"`, "Lesson");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function start(isWrongRetry = false) {
  currentSet = getSetById($("setSelect").value);

  const mode = $("modeSelect").value;
  const scope = $("scopeSelect").value;
  const requestedCount = parseInt($("countSelect").value, 10) || 10;

  const scopedCards = getScopedCards(currentSet, scope);

  let cardsToUse = scopedCards;
  if (isWrongRetry && wrongOnly && wrongOnly.length) {
    const terms = new Set(wrongOnly);
    cardsToUse = currentSet.cards.filter((c) => terms.has(c.term));
  }

  if (cardsToUse.length === 0) {
    $("setupNote").textContent =
      "No cards available for this test selection. Choose 'All cards' or mark some terms in Flashcards first.";
    return;
  }

  const actualCount = Math.min(requestedCount, cardsToUse.length);
  if (actualCount < requestedCount) {
    $("setupNote").textContent = `Only ${cardsToUse.length} cards available in this set, so your test will have ${actualCount} questions. Add more vocab to reach ${requestedCount}.`;
  } else {
    $("setupNote").textContent = "";
  }

  questions = makeQuestions(cardsToUse, actualCount, mode);
  qIndex = 0;
  correct = 0;
  review = [];
  wrongOnly = null;

  $("resultCard").hidden = true;
  $("testCard").hidden = false;

  showQuestion();
}

function wire() {
  renderSetSelect();
  updateSetupNote();

  $("setSelect").addEventListener("change", updateSetupNote);
  $("scopeSelect").addEventListener("change", updateSetupNote);

  $("startBtn").addEventListener("click", () => start(false));

  $("retryBtn").addEventListener("click", () => start(false));

  $("retryWrongBtn").addEventListener("click", () => {
    wrongOnly = computeWrongTerms();
    start(true);
  });

  $("submitBtn").addEventListener("click", submitWritten);
  $("skipBtn").addEventListener("click", skip);

  $("writtenInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitWritten();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wire);
} else {
  wire();
}
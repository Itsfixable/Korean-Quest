// js/main/flashcards.js
import { FLASHCARD_SETS } from "../levels/flashcard-sets.js";
import { addXP, addCoins, addRecentWork } from "./state.js";

const $ = (id) => document.getElementById(id);

const STORE_KEY = "kq-flashcards-progress";
// shape: { [setId]: { known: { [term]: true }, learning: { [term]: true }, order: [term...] } }

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function getSetById(id) {
  return FLASHCARD_SETS.find((s) => s.id === id) || FLASHCARD_SETS[0];
}

function ensureSetProgress(store, set) {
  store[set.id] ??= {
    known: {},
    learning: {},
    order: set.cards.map((c) => c.term),
  };

  // Ensure order includes all current cards (if you update the set later)
  const terms = set.cards.map((c) => c.term);
  const seen = new Set(store[set.id].order);
  for (const t of terms) if (!seen.has(t)) store[set.id].order.push(t);

  // Remove deleted terms
  store[set.id].order = store[set.id].order.filter((t) => terms.includes(t));
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let store = loadStore();
let currentSet = getSetById(FLASHCARD_SETS[0].id);
let idx = 0;
let showingDef = false;

// 3D flip elements (new)
const flash3d = () => $("flash3d");
const termTextEl = () => $("termText");
const defTextEl = () => $("defText");

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

function setCurrentSet(setId) {
  currentSet = getSetById(setId);
  ensureSetProgress(store, currentSet);
  saveStore(store);

  idx = 0;
  showingDef = false;
  if (flash3d()) flash3d().classList.remove("flipped");

  $("setDesc").textContent = currentSet.description || "Study and track progress.";
  renderCard();
  renderProgress();
}

function termAt(i) {
  const order = store[currentSet.id].order;
  return order[Math.max(0, Math.min(i, order.length - 1))];
}

function cardForTerm(term) {
  return currentSet.cards.find((c) => c.term === term);
}

/**
 * Renders BOTH sides (term + def) and syncs the flip animation class.
 */
function renderCard() {
  const total = store[currentSet.id].order.length;
  const term = termAt(idx);
  const card = cardForTerm(term);

  $("cardCount").textContent = `${idx + 1} / ${total}`;
  $("cardSide").textContent = showingDef ? "DEF" : "TERM";

  // Write BOTH sides every time (for the flip animation)
  if (termTextEl()) termTextEl().textContent = card?.term ?? "—";
  if (defTextEl()) defTextEl().textContent = card?.def ?? "—";

  // Sync animation state
  if (flash3d()) flash3d().classList.toggle("flipped", showingDef);
}

function renderProgress() {
  const prog = store[currentSet.id];
  const terms = currentSet.cards.map((c) => c.term);

  const known = terms.filter((t) => prog.known[t]).length;
  const learning = terms.filter((t) => prog.learning[t]).length;

  $("knownCount").textContent = known;
  $("learningCount").textContent = learning;

  const pct = terms.length ? Math.round((known / terms.length) * 100) : 0;
  $("progressText").textContent = `${pct}%`;
  $("progressBar").style.width = `${pct}%`;
}

function flip() {
  showingDef = !showingDef;

  $("cardSide").textContent = showingDef ? "DEF" : "TERM";
  if (flash3d()) flash3d().classList.toggle("flipped", showingDef);
}

function next() {
  const total = store[currentSet.id].order.length;
  idx = (idx + 1) % total;
  showingDef = false;
  if (flash3d()) flash3d().classList.remove("flipped");
  renderCard();
}

function prev() {
  const total = store[currentSet.id].order.length;
  idx = (idx - 1 + total) % total;
  showingDef = false;
  if (flash3d()) flash3d().classList.remove("flipped");
  renderCard();
}

function markKnow(isKnow) {
  const term = termAt(idx);
  const prog = store[currentSet.id];

  if (isKnow) {
    prog.known[term] = true;
    delete prog.learning[term];
  } else {
    prog.learning[term] = true;
    delete prog.known[term];
  }

  saveStore(store);
  renderProgress();

  // small reward the first time a term becomes "known"
  if (isKnow) {
    addXP(2);
    addCoins(1);
    addRecentWork(
      `Flashcards: marked "${term}" as known (+2 XP, +1 coin)`,
      "Lesson"
    );
  }

  next();
}

function doShuffle() {
  const prog = store[currentSet.id];
  prog.order = shuffle(prog.order);
  saveStore(store);

  idx = 0;
  showingDef = false;
  if (flash3d()) flash3d().classList.remove("flipped");

  renderCard();
}

function resetProgress() {
  store[currentSet.id] = {
    known: {},
    learning: {},
    order: currentSet.cards.map((c) => c.term),
  };
  saveStore(store);

  idx = 0;
  showingDef = false;
  if (flash3d()) flash3d().classList.remove("flipped");

  renderCard();
  renderProgress();
}

function wire() {
  renderSetSelect();
  setCurrentSet(currentSet.id);

  $("setSelect").addEventListener("change", (e) => setCurrentSet(e.target.value));
  $("flipBtn").addEventListener("click", flip);
  $("nextBtn").addEventListener("click", next);
  $("prevBtn").addEventListener("click", prev);
  $("shuffleBtn").addEventListener("click", doShuffle);
  $("resetBtn").addEventListener("click", resetProgress);

  $("knowBtn").addEventListener("click", () => markKnow(true));
  $("learnBtn").addEventListener("click", () => markKnow(false));

  $("flashcard").addEventListener("click", flip);
  $("flashcard").addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      flip();
    }
    if (e.code === "ArrowRight") next();
    if (e.code === "ArrowLeft") prev();
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
else wire();
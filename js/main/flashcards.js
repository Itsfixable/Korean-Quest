// js/main/flashcards.js
import { FLASHCARD_SETS } from "../levels/flashcard-sets.js";
import { addXP, addCoins, addRecentWork } from "./state.js";

const $ = (id) => document.getElementById(id);

const STORE_KEY = "kq-flashcards-progress";
/**
 * store shape:
 * {
 *   [setId]: {
 *     known: { [term]: true },
 *     learning: { [term]: true },
 *     order: [term...],
 *     knownOrder: [term...]   // NEW: for pile display / modal order
 *   }
 * }
 */

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
    knownOrder: [],
  };

  store[set.id].knownOrder ??= [];

  const terms = set.cards.map((c) => c.term);

  // keep order up to date
  const seen = new Set(store[set.id].order);
  for (const t of terms) if (!seen.has(t)) store[set.id].order.push(t);
  store[set.id].order = store[set.id].order.filter((t) => terms.includes(t));

  // keep knownOrder up to date
  store[set.id].knownOrder = store[set.id].knownOrder.filter((t) => terms.includes(t));
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
let isAnimating = false;

// Elements for 3D + stage animations
const flashStage = () => $("flashStage");
const flash3d = () => $("flash3d");
const incoming3d = () => $("incoming3d");
const termTextEl = () => $("termText");
const defTextEl = () => $("defText");
const incomingTermEl = () => $("incomingTerm");
const incomingDefEl = () => $("incomingDef");

// Known stack UI
const knownStackBtn = () => $("knownStack");
const miniStack = () => $("miniStack");
const knownModal = () => $("knownModal");
const knownList = () => $("knownList");
const knownClose = () => $("knownClose");

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
  clearAnimClasses();

  $("setDesc").textContent = currentSet.description || "Study and track progress.";
  renderCard();
  renderProgress();
  renderKnownStack();
}

function termAt(i) {
  const order = store[currentSet.id].order;
  return order[Math.max(0, Math.min(i, order.length - 1))];
}

function cardForTerm(term) {
  return currentSet.cards.find((c) => c.term === term);
}

function clearAnimClasses() {
  if (flashStage()) {
    flashStage().classList.remove("anim-next", "anim-prev");
  }
  if (flash3d()) flash3d().classList.remove("flipped");
  if (incoming3d()) {
    incoming3d().classList.remove("flipped");
    incoming3d().style.opacity = "";
    incoming3d().style.transform = "";
  }
}

function setCurrentCardContent(card) {
  if (termTextEl()) termTextEl().textContent = card?.term ?? "—";
  if (defTextEl()) defTextEl().textContent = card?.def ?? "—";
  if (flash3d()) flash3d().classList.toggle("flipped", showingDef);
}

function setIncomingCardContent(card, incomingIsDef) {
  if (incomingTermEl()) incomingTermEl().textContent = card?.term ?? "—";
  if (incomingDefEl()) incomingDefEl().textContent = card?.def ?? "—";
  if (incoming3d()) incoming3d().classList.toggle("flipped", incomingIsDef);
}

function renderCard() {
  const total = store[currentSet.id].order.length;
  const term = termAt(idx);
  const card = cardForTerm(term);

  $("cardCount").textContent = `${idx + 1} / ${total}`;
  $("cardSide").textContent = showingDef ? "DEF" : "TERM";

  setCurrentCardContent(card);
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

/* ===== Flip ===== */
function flip() {
  if (isAnimating) return;
  showingDef = !showingDef;
  $("cardSide").textContent = showingDef ? "DEF" : "TERM";
  if (flash3d()) flash3d().classList.toggle("flipped", showingDef);
}

/* ===== Stack slide animations for next/prev ===== */
function animateSwap(newIdx, direction /* "next" | "prev" */) {
  if (isAnimating) return;
  isAnimating = true;

  const total = store[currentSet.id].order.length;
  const bounded = (newIdx + total) % total;

  const newTerm = termAt(bounded);
  const newCard = cardForTerm(newTerm);

  // incoming should start unflipped (TERM)
  setIncomingCardContent(newCard, false);

  // reset flips and stage classes
  showingDef = false;
  if (flash3d()) flash3d().classList.remove("flipped");
  if (incoming3d()) incoming3d().classList.remove("flipped");

  const stage = flashStage();
  if (!stage) {
    idx = bounded;
    renderCard();
    isAnimating = false;
    return;
  }

  stage.classList.remove("anim-next", "anim-prev");
  stage.offsetHeight; // force reflow

  stage.classList.add(direction === "next" ? "anim-next" : "anim-prev");

  // swap after animation
  window.setTimeout(() => {
    idx = bounded;
    renderCard();

    // clear stage and hide incoming
    stage.classList.remove("anim-next", "anim-prev");
    if (incoming3d()) {
      incoming3d().style.opacity = "0";
      incoming3d().style.transform = "";
      // reset opacity after a beat so CSS handles future animations
      window.setTimeout(() => {
        if (incoming3d()) incoming3d().style.opacity = "";
      }, 20);
    }

    isAnimating = false;
  }, 430);
}

function next() {
  animateSwap(idx + 1, "next");
}

function prev() {
  animateSwap(idx - 1, "prev");
}

/* ===== Toss animation helpers ===== */
function makeTossClone(fromRect, text) {
  const el = document.createElement("div");
  el.className = "toss-clone";
  el.style.left = `${fromRect.left}px`;
  el.style.top = `${fromRect.top}px`;
  el.style.width = `${fromRect.width}px`;
  el.style.height = `${fromRect.height}px`;

  el.innerHTML = `<div class="toss-term">${escapeHtml(text)}</div>`;
  document.body.appendChild(el);
  return el;
}

function animateCloneTo(el, toRect, rotateDeg = 12, shrink = 0.45) {
  const fromLeft = parseFloat(el.style.left);
  const fromTop = parseFloat(el.style.top);
  const fromW = parseFloat(el.style.width);
  const fromH = parseFloat(el.style.height);

  const dx = toRect.left - fromLeft;
  const dy = toRect.top - fromTop;
  const sx = (toRect.width / fromW) * shrink;
  const sy = (toRect.height / fromH) * shrink;

  el.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotate(${rotateDeg}deg)`, opacity: 0.15 },
    ],
    { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
  );

  window.setTimeout(() => el.remove(), 540);
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

/* ===== Known stack rendering ===== */
function getKnownTerms() {
  const prog = store[currentSet.id];
  const knownTerms = Object.keys(prog.known || {}).filter((t) => prog.known[t]);
  // preserve knownOrder priority, then append any missing
  const ordered = (prog.knownOrder || []).filter((t) => prog.known[t]);
  const missing = knownTerms.filter((t) => !ordered.includes(t));
  return [...ordered, ...missing];
}

function renderKnownStack() {
  const prog = store[currentSet.id];
  const terms = getKnownTerms();

  if (!miniStack()) return;
  miniStack().innerHTML = "";

  const top3 = terms.slice(-3).reverse(); // show newest on top
  if (top3.length === 0) {
    const empty = document.createElement("div");
    empty.className = "mini-card";
    empty.textContent = "No known cards yet";
    miniStack().appendChild(empty);
    return;
  }

  for (const t of top3) {
    const c = cardForTerm(t);
    const div = document.createElement("div");
    div.className = "mini-card";
    div.textContent = c?.term ?? t;
    miniStack().appendChild(div);
  }

  // keep knownOrder synced
  prog.knownOrder = getKnownTerms();
  saveStore(store);
}

/* ===== Known modal ===== */
function openKnownModal() {
  if (!knownModal()) return;
  renderKnownModalList();
  knownModal().hidden = false;
}

function closeKnownModal() {
  if (!knownModal()) return;
  knownModal().hidden = true;
}

function renderKnownModalList() {
  const terms = getKnownTerms();
  if (!knownList()) return;

  knownList().innerHTML = "";

  if (terms.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No known cards yet — mark some cards as Known.";
    knownList().appendChild(p);
    return;
  }

  // show newest first
  const newestFirst = [...terms].reverse();

  for (const t of newestFirst) {
    const c = cardForTerm(t);
    const item = document.createElement("div");
    item.className = "known-item";
    item.innerHTML = `
      <strong>${escapeHtml(c?.term ?? t)}</strong>
      <div class="muted">${escapeHtml(c?.def ?? "")}</div>
    `;
    item.addEventListener("click", () => tossKnownBackToLearning(t, item));
    knownList().appendChild(item);
  }
}

/* ===== Know / Learning actions ===== */
function markKnow() {
  if (isAnimating) return;

  const term = termAt(idx);
  const card = cardForTerm(term);
  const prog = store[currentSet.id];

  // already known? just move on
  if (prog.known[term]) {
    next();
    return;
  }

  // Toss animation: from flashcard stage to knownStack button
  const from = flashStage()?.getBoundingClientRect();
  const to = knownStackBtn()?.getBoundingClientRect();

  if (from && to) {
    const clone = makeTossClone(from, card?.term ?? term);
    animateCloneTo(clone, to, 18, 0.6);
  }

  prog.known[term] = true;
  delete prog.learning[term];

  // push into knownOrder (newest at end)
  prog.knownOrder = (prog.knownOrder || []).filter((x) => x !== term);
  prog.knownOrder.push(term);

  saveStore(store);
  renderProgress();
  renderKnownStack();

  addXP(2);
  addCoins(1);
  addRecentWork(`Flashcards: marked "${term}" as known (+2 XP, +1 coin)`, "Lesson");

  next();
}

function markLearning() {
  if (isAnimating) return;

  const term = termAt(idx);
  const prog = store[currentSet.id];

  prog.learning[term] = true;
  delete prog.known[term];
  prog.knownOrder = (prog.knownOrder || []).filter((x) => x !== term);

  saveStore(store);
  renderProgress();
  renderKnownStack();

  next();
}

/* Toss a chosen known card back into learning and bring it to front */
function tossKnownBackToLearning(term, clickedEl) {
  if (isAnimating) return;

  const prog = store[currentSet.id];

  // remove from known
  delete prog.known[term];
  prog.learning[term] = true;
  prog.knownOrder = (prog.knownOrder || []).filter((x) => x !== term);

  // Bring back into deck near current position (so it appears next)
  const order = prog.order;
  const curTerm = termAt(idx);
  const curPos = order.indexOf(curTerm);
  const existingPos = order.indexOf(term);
  if (existingPos !== -1) order.splice(existingPos, 1);

  // insert right after current
  const insertAt = Math.max(0, curPos + 1);
  order.splice(insertAt, 0, term);

  saveStore(store);
  renderProgress();
  renderKnownStack();

  // Toss animation: from clicked known item to flash stage
  const from = clickedEl?.getBoundingClientRect();
  const to = flashStage()?.getBoundingClientRect();
  if (from && to) {
    const clone = makeTossClone(from, term);
    animateCloneTo(clone, to, -16, 0.75);
  }

  // Close modal and jump to that card (as the next card)
  closeKnownModal();

  // Animate into view (as "next" swap)
  const newIndex = insertAt;
  animateSwap(newIndex, "next");
}

/* ===== Controls ===== */
function doShuffle() {
  if (isAnimating) return;
  const prog = store[currentSet.id];
  prog.order = shuffle(prog.order);
  saveStore(store);

  idx = 0;
  showingDef = false;
  clearAnimClasses();
  renderCard();
}

function resetProgress() {
  if (isAnimating) return;

  store[currentSet.id] = {
    known: {},
    learning: {},
    order: currentSet.cards.map((c) => c.term),
    knownOrder: [],
  };
  saveStore(store);

  idx = 0;
  showingDef = false;
  clearAnimClasses();
  renderCard();
  renderProgress();
  renderKnownStack();
}

function wireModal() {
  if (!knownModal()) return;

  knownModal().addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.close === "true") closeKnownModal();
  });

  if (knownClose()) knownClose().addEventListener("click", closeKnownModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && knownModal() && !knownModal().hidden) closeKnownModal();
  });
}

function wire() {
  renderSetSelect();
  setCurrentSet(currentSet.id);

  $("setSelect").addEventListener("change", (e) => setCurrentSet(e.target.value));

  $("flipBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    flip();
  });

  $("nextBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    next();
  });

  $("prevBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    prev();
  });

  $("shuffleBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    doShuffle();
  });

  $("resetBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    resetProgress();
  });

  $("knowBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    markKnow();
  });

  $("learnBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    markLearning();
  });

  // card click flips
  $("flashcard").addEventListener("click", flip);

  $("flashcard").addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      flip();
    }
    if (e.code === "ArrowRight") next();
    if (e.code === "ArrowLeft") prev();
  });

  // known stack opens modal
  if (knownStackBtn()) knownStackBtn().addEventListener("click", openKnownModal);

  wireModal();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
else wire();
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FLASHCARD_SETS } from "@/lib/constants/flashcard-sets";
import type { FlashcardProgress, FlashcardSet } from "@/lib/types";
import { useFlashcardStore } from "@/stores/useFlashcardStore";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/flashcards.css";

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m] || m,
  );
}

function ensureSetProgress(prog: FlashcardProgress, set: FlashcardSet): FlashcardProgress {
  const terms = set.cards.map((c) => c.term);
  let order = prog.order.length ? [...prog.order] : [...terms];
  const seen = new Set(order);
  terms.forEach((t) => {
    if (!seen.has(t)) order.push(t);
  });
  order = order.filter((t) => terms.includes(t));
  const knownOrder = (prog.knownOrder || []).filter((t) => terms.includes(t) && prog.known.includes(t));
  return {
    known: prog.known.filter((t) => terms.includes(t)),
    learning: prog.learning.filter((t) => terms.includes(t)),
    order,
    knownOrder,
  };
}

export default function FlashcardsView() {
  const getSetProgress = useFlashcardStore((s) => s.getSetProgress);
  const saveSetProgress = useFlashcardStore((s) => s.saveSetProgress);
  const addXP = useGameStore((s) => s.addXP);
  const addCoins = useGameStore((s) => s.addCoins);
  const addRecentWork = useGameStore((s) => s.addRecentWork);

  const [currentSetId, setCurrentSetId] = useState(FLASHCARD_SETS[0].id);
  const [idx, setIdx] = useState(0);
  const [showingDef, setShowingDef] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animClass, setAnimClass] = useState<"" | "anim-next" | "anim-prev">("");
  const [flipped, setFlipped] = useState(false);
  const [incomingFlipped, setIncomingFlipped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  const currentSet = FLASHCARD_SETS.find((s) => s.id === currentSetId) || FLASHCARD_SETS[0];
  const prog = ensureSetProgress(getSetProgress(currentSet.id), currentSet);

  const termAt = useCallback(
    (i: number) => {
      const order = prog.order;
      if (!order.length) return "";
      return order[Math.max(0, Math.min(i, order.length - 1))];
    },
    [prog.order],
  );

  const cardForTerm = (term: string) => currentSet.cards.find((c) => c.term === term);

  const term = termAt(idx);
  const card = cardForTerm(term);
  const total = prog.order.length;

  const knownCount = currentSet.cards.filter((c) => prog.known.includes(c.term)).length;
  const learningCount = currentSet.cards.filter((c) => prog.learning.includes(c.term)).length;
  const pct = currentSet.cards.length ? Math.round((knownCount / currentSet.cards.length) * 100) : 0;

  const getKnownTerms = () => {
    const knownTerms = prog.known;
    const ordered = prog.knownOrder.filter((t) => prog.known.includes(t));
    const missing = knownTerms.filter((t) => !ordered.includes(t));
    return [...ordered, ...missing];
  };

  const knownTerms = getKnownTerms();
  const miniStack = knownTerms.slice(-3).reverse();

  const updateProgress = (next: FlashcardProgress) => {
    saveSetProgress(currentSet.id, next);
  };

  const flip = () => {
    if (isAnimating || shuffling) return;
    setShowingDef((v) => !v);
    setFlipped((v) => !v);
  };

  const animateSwap = (newIdx: number, direction: "next" | "prev") => {
    if (isAnimating || !total) return;
    setIsAnimating(true);
    const bounded = (newIdx + total) % total;
    const newTerm = termAt(bounded);
    const newCard = cardForTerm(newTerm);

    setIncomingFlipped(false);
    setShowingDef(false);
    setFlipped(false);
    setAnimClass(direction === "next" ? "anim-next" : "anim-prev");

    window.setTimeout(() => {
      setIdx(bounded);
      setAnimClass("");
      setIsAnimating(false);
    }, 430);

    void newCard;
  };

  const next = () => animateSwap(idx + 1, "next");
  const prev = () => animateSwap(idx - 1, "prev");

  const makeTossClone = (fromRect: DOMRect, text: string) => {
    const el = document.createElement("div");
    el.className = "toss-clone";
    el.style.left = `${fromRect.left}px`;
    el.style.top = `${fromRect.top}px`;
    el.style.width = `${fromRect.width}px`;
    el.style.height = `${fromRect.height}px`;
    el.innerHTML = `<div class="toss-term">${escapeHtml(text)}</div>`;
    document.body.appendChild(el);
    return el;
  };

  const animateCloneTo = (el: HTMLElement, toRect: DOMRect, rotateDeg = 12, shrink = 0.45) => {
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
      { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
    );
    window.setTimeout(() => el.remove(), 540);
  };

  const markKnow = () => {
    if (isAnimating || !term) return;
    if (prog.known.includes(term)) {
      next();
      return;
    }

    const stage = document.getElementById("flashStage");
    const stackBtn = document.getElementById("knownStack");
    if (stage && stackBtn) {
      const clone = makeTossClone(stage.getBoundingClientRect(), card?.term ?? term);
      animateCloneTo(clone, stackBtn.getBoundingClientRect(), 18, 0.6);
    }

    const nextProg: FlashcardProgress = {
      ...prog,
      known: [...prog.known.filter((x) => x !== term), term],
      learning: prog.learning.filter((x) => x !== term),
      knownOrder: [...prog.knownOrder.filter((x) => x !== term), term],
    };
    updateProgress(nextProg);
    addXP(2);
    addCoins(1);
    addRecentWork(`Flashcards: marked "${term}" as known (+2 XP, +1 coin)`, "Flashcard");
    next();
  };

  const markLearning = () => {
    if (isAnimating || !term) return;
    updateProgress({
      ...prog,
      learning: [...prog.learning.filter((x) => x !== term), term],
      known: prog.known.filter((x) => x !== term),
      knownOrder: prog.knownOrder.filter((x) => x !== term),
    });
    next();
  };

  const tossKnownBackToLearning = (knownTerm: string, clickedEl: HTMLElement | null) => {
    if (isAnimating) return;
    const order = [...prog.order];
    const curTerm = termAt(idx);
    const curPos = order.indexOf(curTerm);
    const existingPos = order.indexOf(knownTerm);
    if (existingPos !== -1) order.splice(existingPos, 1);
    const insertAt = Math.max(0, curPos + 1);
    order.splice(insertAt, 0, knownTerm);

    updateProgress({
      ...prog,
      order,
      known: prog.known.filter((x) => x !== knownTerm),
      learning: [...prog.learning.filter((x) => x !== knownTerm), knownTerm],
      knownOrder: prog.knownOrder.filter((x) => x !== knownTerm),
    });

    const stage = document.getElementById("flashStage");
    if (clickedEl && stage) {
      const clone = makeTossClone(clickedEl.getBoundingClientRect(), knownTerm);
      animateCloneTo(clone, stage.getBoundingClientRect(), -16, 0.75);
    }

    setModalOpen(false);
    animateSwap(insertAt, "next");
  };

  const doShuffle = () => {
    if (isAnimating || shuffling) return;
    setShuffling(true);
    setShowingDef(false);
    setFlipped(false);
    // Reorder mid-riffle so the new top card is revealed as the cards settle.
    window.setTimeout(() => {
      updateProgress({ ...prog, order: shuffle(prog.order) });
      setIdx(0);
    }, 280);
    window.setTimeout(() => setShuffling(false), 640);
  };

  const resetProgress = () => {
    if (isAnimating) return;
    updateProgress({
      known: [],
      learning: [],
      order: currentSet.cards.map((c) => c.term),
      knownOrder: [],
    });
    setIdx(0);
    setShowingDef(false);
    setFlipped(false);
  };

  const changeSet = (setId: string) => {
    setCurrentSetId(setId);
    setIdx(0);
    setShowingDef(false);
    setFlipped(false);
  };

  return (
    <>
      <div className="grid flash-layout">
        <section className="card flash-main-card">
          <header className="flash-header">
            <div className="flash-header-copy">
              <h1>Flashcards</h1>
              <p className="muted" id="setDesc">
                {currentSet.description || "Study and track progress."}
              </p>
            </div>
            <Link href="/resources" className="btn secondary back-btn">
              ← Back to Resources
            </Link>
          </header>

          <div className="flash-toolbar">
            <label className="flash-set-label" htmlFor="setSelect">
              <span className="muted">Set</span>
              <select
                id="setSelect"
                className="select flash-set-select"
                value={currentSetId}
                onChange={(e) => changeSet(e.target.value)}
              >
                {FLASHCARD_SETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="flash-toolbar-actions">
              <button
                className={`btn secondary${shuffling ? " is-shuffling" : ""}`}
                id="shuffleBtn"
                type="button"
                onClick={doShuffle}
                disabled={shuffling || isAnimating}
              >
                🔀 Shuffle
              </button>
              <button className="btn secondary" id="resetBtn" type="button" onClick={resetProgress}>
                Reset progress
              </button>
            </div>
          </div>

          <div
            className="flash-deck"
            id="flashcard"
            role="button"
            tabIndex={0}
            aria-label="Flashcard (click to flip)"
            onClick={flip}
            onKeyDown={(e) => {
              if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                flip();
              }
              if (e.code === "ArrowRight") next();
              if (e.code === "ArrowLeft") prev();
            }}
          >
            <div className="flash-meta">
              <span className={`flash-side-badge${showingDef ? " is-def" : ""}`} id="cardSide">
                {showingDef ? "Definition" : "Term"}
              </span>
              <span className="flash-count" id="cardCount">
                Card {total ? idx + 1 : 0} of {total || 0}
              </span>
            </div>

            <div
              className={`flash-stage${animClass ? ` ${animClass}` : ""}${shuffling ? " is-shuffling" : ""}`}
              id="flashStage"
              aria-hidden="true"
            >
              <div className={`flash-3d${flipped ? " flipped" : ""}`} id="flash3d">
                <div className="flash-face flash-front">
                  <div className="flash-label muted">Korean</div>
                  <div className="flash-text" id="termText">
                    {card?.term ?? "—"}
                  </div>
                </div>
                <div className="flash-face flash-back">
                  <div className="flash-label muted">English</div>
                  <div className="flash-text flash-text-def" id="defText">
                    {card?.def ?? "—"}
                  </div>
                </div>
              </div>

              <div className={`flash-3d incoming${incomingFlipped ? " flipped" : ""}`} id="incoming3d" aria-hidden="true">
                <div className="flash-face flash-front">
                  <div className="flash-text" id="incomingTerm">
                    —
                  </div>
                </div>
                <div className="flash-face flash-back">
                  <div className="flash-text" id="incomingDef">
                    —
                  </div>
                </div>
              </div>

              {shuffling && (
                <div className="flash-shuffle" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className={`flash-shuffle-card sc-${i}`} />
                  ))}
                </div>
              )}
            </div>

            <div className="flash-progress-strip" aria-hidden="true">
              <div className="flash-progress-fill" style={{ width: `${pct}%` }} />
            </div>

            <div className="flash-hint">
              <span>Click or press Space to flip</span>
              <span className="flash-hint-keys">← → to navigate</span>
            </div>
          </div>

          <div className="flash-actions">
            <div className="flash-action-group flash-action-nav">
              <span className="flash-action-label muted">Navigate</span>
              <div className="flash-action-buttons">
                <button className="btn secondary" id="prevBtn" type="button" onClick={(e) => { e.stopPropagation(); prev(); }}>
                  ← Prev
                </button>
                <button className="btn" id="flipBtn" type="button" onClick={(e) => { e.stopPropagation(); flip(); }}>
                  Flip
                </button>
                <button className="btn secondary" id="nextBtn" type="button" onClick={(e) => { e.stopPropagation(); next(); }}>
                  Next →
                </button>
              </div>
            </div>

            <div className="flash-action-group flash-action-grade">
              <span className="flash-action-label muted">Rate card</span>
              <div className="flash-action-buttons">
                <button className="btn secondary" id="learnBtn" type="button" onClick={(e) => { e.stopPropagation(); markLearning(); }}>
                  Still learning
                </button>
                <button className="btn" id="knowBtn" type="button" onClick={(e) => { e.stopPropagation(); markKnow(); }}>
                  Know it ✓
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="card flash-progress-card">
          <h2>Progress</h2>

          <div className="flash-stat-grid kq-stagger">
            <div className="flash-stat flash-stat-known">
              <div className="flash-stat-label">Known</div>
              <div className="flash-stat-value" id="knownCount">
                {knownCount}
              </div>
            </div>
            <div className="flash-stat flash-stat-learning">
              <div className="flash-stat-label">Still learning</div>
              <div className="flash-stat-value" id="learningCount">
                {learningCount}
              </div>
            </div>
          </div>

          <div className="flash-completion">
            <div className="flash-completion-head">
              <span className="muted">Completion</span>
              <strong id="progressText">{pct}%</strong>
            </div>
            <div className="progress flash-progress-bar">
              <i id="progressBar" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="known-wrap">
            <div className="known-header">
              <h3>Known stack</h3>
              <span className="muted" id="knownHint">
                Tap to review
              </span>
            </div>

            <button
              className="known-stack"
              id="knownStack"
              type="button"
              aria-label="Open known cards"
              onClick={() => setModalOpen(true)}
            >
              <div className="mini-stack" id="miniStack">
                {miniStack.length === 0 ? (
                  <div className="mini-card">No known cards yet</div>
                ) : (
                  miniStack.map((t) => (
                    <div key={t} className="mini-card">
                      <span>{escapeHtml(cardForTerm(t)?.term ?? t)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="muted known-stack-hint">
                Click to open and bring a card back.
              </div>
            </button>
          </div>

          <div className="flash-next-step">
            <h3>Next step</h3>
            <p className="muted">Ready to test yourself?</p>
            <Link className="btn flash-test-btn" href="/test">
              Go to Test
            </Link>
          </div>
        </aside>
      </div>

      <div className="kq-modal" id="knownModal" hidden={!modalOpen}>
        <div className="kq-modal-backdrop" data-close="true" onClick={() => setModalOpen(false)} />
        <div className="kq-modal-card" role="dialog" aria-modal="true" aria-label="Known cards">
          <div className="kq-modal-top">
            <div>
              <h2 style={{ margin: 0 }}>Known Cards</h2>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                Click a card to toss it back into learning.
              </p>
            </div>
            <button className="btn secondary" id="knownClose" type="button" onClick={() => setModalOpen(false)}>
              Close
            </button>
          </div>

          <div className="known-list kq-stagger" id="knownList">
            {knownTerms.length === 0 ? (
              <p className="muted">No known cards yet — mark some cards as Known.</p>
            ) : (
              [...knownTerms].reverse().map((t) => {
                const c = cardForTerm(t);
                return (
                  <div
                    key={t}
                    className="known-item"
                    onClick={(e) => tossKnownBackToLearning(t, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        tossKnownBackToLearning(t, e.currentTarget);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <strong>{c?.term ?? t}</strong>
                    <div className="muted">{c?.def ?? ""}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

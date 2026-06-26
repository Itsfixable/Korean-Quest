"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FLASHCARD_SETS } from "@/lib/constants/flashcard-sets";
import type { FlashcardSet } from "@/lib/types";
import { useFlashcardStore } from "@/stores/useFlashcardStore";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/test.css";

type QuestionMode = "mc" | "written" | "mixed";
type QuestionScope = "all" | "learning" | "known";

interface Question {
  type: "mc" | "written";
  dir: "termToDef" | "defToTerm";
  prompt: string;
  answer: string;
  choices: string[];
  card: { term: string; def: string };
}

interface ReviewItem {
  prompt: string;
  given: string;
  answer: string;
  ok: boolean;
  term: string;
  def: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string) {
  return (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m] || m,
  );
}

function makeQuestions(cards: FlashcardSet["cards"], count: number, modeChoice: QuestionMode): Question[] {
  const pool = shuffle(cards);
  const picked = pool.slice(0, Math.min(count, pool.length));
  const allTerms = cards.map((c) => c.term);
  const allDefs = cards.map((c) => c.def);

  return picked.map((c) => {
    const dir = Math.random() < 0.5 ? "termToDef" : "defToTerm";
    const type: "mc" | "written" =
      modeChoice === "mixed" ? (Math.random() < 0.5 ? "mc" : "written") : modeChoice;

    if (dir === "termToDef") {
      const answer = c.def;
      const prompt = `What does “${c.term}” mean?`;
      const distractors = shuffle(allDefs.filter((d) => d !== answer)).slice(0, 3);
      const choices = shuffle([answer, ...distractors]).slice(0, 4);
      return { type, dir, prompt, answer, choices, card: c };
    }

    const answer = c.term;
    const prompt = `Which Korean matches: “${c.def}”?`;
    const distractors = shuffle(allTerms.filter((t) => t !== answer)).slice(0, 3);
    const choices = shuffle([answer, ...distractors]).slice(0, 4);
    return { type, dir, prompt, answer, choices, card: c };
  });
}

export default function TestView() {
  const getSetProgress = useFlashcardStore((s) => s.getSetProgress);
  const addXP = useGameStore((s) => s.addXP);
  const addCoins = useGameStore((s) => s.addCoins);
  const addRecentWork = useGameStore((s) => s.addRecentWork);

  const [setId, setSetId] = useState(FLASHCARD_SETS[0].id);
  const [scope, setScope] = useState<QuestionScope>("all");
  const [mode, setMode] = useState<QuestionMode>("mc");
  const [count, setCount] = useState("10");
  const [setupNote, setSetupNote] = useState("");

  const [testActive, setTestActive] = useState(false);
  const [resultActive, setResultActive] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [writtenInput, setWrittenInput] = useState("");
  const [stagePulse, setStagePulse] = useState<"" | "anim-next" | "anim-wrong">("");
  const [lockedChoices, setLockedChoices] = useState<string[]>([]);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [ringPct, setRingPct] = useState(0);
  const wrongOnlyRef = useMemo(() => ({ current: null as string[] | null }), []);

  const currentSet = FLASHCARD_SETS.find((s) => s.id === setId) || FLASHCARD_SETS[0];

  const getScopedCards = useCallback(
    (set: FlashcardSet, scopeValue: QuestionScope) => {
      const prog = getSetProgress(set.id);
      if (scopeValue === "all") return set.cards;
      if (scopeValue === "learning") {
        const terms = new Set(prog.learning);
        return set.cards.filter((c) => terms.has(c.term));
      }
      const terms = new Set(prog.known);
      return set.cards.filter((c) => terms.has(c.term));
    },
    [getSetProgress],
  );

  const updateSetupNote = useCallback(() => {
    const scoped = getScopedCards(currentSet, scope);
    if (scope !== "all" && scoped.length === 0) {
      setSetupNote("No cards in this scope yet. Go to Flashcards and mark some cards as Known or Still learning.");
    } else {
      setSetupNote("");
    }
  }, [currentSet, scope, getScopedCards]);

  useEffect(() => {
    updateSetupNote();
  }, [updateSetupNote]);

  const pulse = (kind: "anim-next" | "anim-wrong") => {
    setStagePulse("");
    requestAnimationFrame(() => {
      setStagePulse(kind);
      window.setTimeout(() => setStagePulse(""), 280);
    });
  };

  const animateRingTo = (targetPct: number) => {
    const duration = 900;
    const start = performance.now();
    const to = Math.max(0, Math.min(100, targetPct));
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setRingPct(to * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    setRingPct(0);
    requestAnimationFrame(tick);
  };

  const finish = (finalCorrect: number, finalQuestions: Question[], finalReview: ReviewItem[]) => {
    setTestActive(false);
    setResultActive(true);
    const pct = finalQuestions.length ? Math.round((finalCorrect / finalQuestions.length) * 100) : 0;
    animateRingTo(pct);
    if (pct >= 80) {
      addXP(20);
      addCoins(10);
      addRecentWork(`Test: scored ${pct}% on "${currentSet.title}" (+20 XP, +10 coins)`, "Lesson");
    } else {
      addRecentWork(`Test: scored ${pct}% on "${currentSet.title}"`, "Lesson");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showQuestion = (index: number, qs: Question[], score: number) => {
    const q = qs[index];
    setFeedback("");
    setWrittenInput("");
    setLockedChoices([]);
    setWrongChoice(null);
    pulse("anim-next");
    void q;
    void score;
  };

  const grade = (givenRaw: string, qs: Question[], index: number, score: number, rev: ReviewItem[]) => {
    const q = qs[index];
    const given = normalize(givenRaw);
    const ans = normalize(q.answer);
    const ok = given === ans;
    const nextScore = ok ? score + 1 : score;

    setFeedback(ok ? "✅ Correct!" : `❌ Not quite. Correct answer: ${q.answer}`);
    if (!ok) pulse("anim-wrong");

    const nextReview: ReviewItem[] = [
      ...rev,
      { prompt: q.prompt, given: givenRaw, answer: q.answer, ok, term: q.card.term, def: q.card.def },
    ];
    setReview(nextReview);
    setCorrect(nextScore);

    if (q.type === "mc") {
      setLockedChoices(q.choices);
      if (!ok && givenRaw) setWrongChoice(givenRaw);
    }

    window.setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex >= qs.length) {
        finish(nextScore, qs, nextReview);
      } else {
        setQIndex(nextIndex);
        showQuestion(nextIndex, qs, nextScore);
      }
    }, 520);
  };

  const start = (isWrongRetry = false) => {
    const set = FLASHCARD_SETS.find((s) => s.id === setId) || FLASHCARD_SETS[0];
    const requestedCount = parseInt(count, 10) || 10;
    let scopedCards = getScopedCards(set, scope);

    if (isWrongRetry && wrongOnlyRef.current?.length) {
      const terms = new Set(wrongOnlyRef.current);
      scopedCards = set.cards.filter((c) => terms.has(c.term));
    }

    if (scopedCards.length === 0) {
      setSetupNote(
        "No cards available for this test selection. Choose 'All cards' or mark some terms in Flashcards first.",
      );
      return;
    }

    const actualCount = Math.min(requestedCount, scopedCards.length);
    if (actualCount < requestedCount) {
      setSetupNote(
        `Only ${scopedCards.length} cards available in this set, so your test will have ${actualCount} questions. Add more vocab to reach ${requestedCount}.`,
      );
    } else {
      setSetupNote("");
    }

    const qs = makeQuestions(scopedCards, actualCount, mode);
    wrongOnlyRef.current = null;
    setQuestions(qs);
    setQIndex(0);
    setCorrect(0);
    setReview([]);
    setResultActive(false);
    setTestActive(true);
    showQuestion(0, qs, 0);
  };

  const q = questions[qIndex];
  const progressPct = questions.length ? Math.round((qIndex / questions.length) * 100) : 0;
  const resultPct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const missed = review.filter((r) => !r.ok);

  const ringR = 44;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - ringPct / 100);
  const ringColor = ringPct >= 70 ? "var(--brand, #22c55e)" : "var(--danger, #ff6b6b)";

  return (
    <>
      <section className="card">
        <div className="flex setup-top">
          <div>
            <h1>Test</h1>
            <Link href="/resources" className="btn secondary back-btn">
              ← Back to Resources
            </Link>
            <p className="muted">Auto-generated from your flashcard sets.</p>
          </div>

          <div className="setup-grid">
            <div className="setup-field">
              <label className="muted" htmlFor="setSelect">
                Set
              </label>
              <select id="setSelect" className="select" value={setId} onChange={(e) => setSetId(e.target.value)}>
                {FLASHCARD_SETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="setup-field">
              <label className="muted" htmlFor="scopeSelect">
                Scope
              </label>
              <select
                id="scopeSelect"
                className="select"
                value={scope}
                onChange={(e) => setScope(e.target.value as QuestionScope)}
              >
                <option value="all">All cards</option>
                <option value="learning">Only learning</option>
                <option value="known">Only known</option>
              </select>
            </div>

            <div className="setup-field">
              <label className="muted" htmlFor="modeSelect">
                Mode
              </label>
              <select
                id="modeSelect"
                className="select"
                value={mode}
                onChange={(e) => setMode(e.target.value as QuestionMode)}
              >
                <option value="mc">Multiple Choice</option>
                <option value="written">Written</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="setup-field">
              <label className="muted" htmlFor="countSelect">
                Questions
              </label>
              <select id="countSelect" className="select" value={count} onChange={(e) => setCount(e.target.value)}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </div>

            <div className="setup-field setup-start">
              <button className="btn" id="startBtn" type="button" onClick={() => start(false)}>
                Start
              </button>
            </div>
          </div>
        </div>

        <p className="muted" id="setupNote" style={{ marginTop: 10 }}>
          {setupNote}
        </p>
      </section>

      {testActive && q ? (
        <section className="card test-card" id="testCard">
          <div className="test-top">
            <div className="muted" id="qProgress">
              {qIndex + 1} / {questions.length}
            </div>
            <div className="progress test-progress">
              <i id="testProgressBar" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="muted" id="scoreMini">
              Score: {correct}
            </div>
          </div>

          <div className={`q-stage${stagePulse ? ` ${stagePulse}` : ""}`} id="qStage">
            <div className="q-panel" id="qPanel">
              <div className="muted" id="qLabel">
                Question
              </div>
              <h2 id="prompt" style={{ marginTop: 10 }}>
                {q.prompt}
              </h2>

              {q.type === "mc" ? (
                <div id="mcArea" className="choices">
                  {q.choices.map((choice) => {
                    const isCorrect = normalize(choice) === normalize(q.answer);
                    const isWrong = wrongChoice && normalize(choice) === normalize(wrongChoice);
                    const disabled = lockedChoices.length > 0;
                    return (
                      <button
                        key={choice}
                        className={`choice${isCorrect && disabled ? " correct" : ""}${isWrong ? " wrong" : ""}`}
                        type="button"
                        disabled={disabled}
                        onClick={() => grade(choice, questions, qIndex, correct, review)}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div id="writtenArea" style={{ marginTop: 12 }}>
                  <input
                    id="writtenInput"
                    className="text-input"
                    aria-label="Your answer"
                    placeholder="Type your answer…"
                    autoComplete="off"
                    value={writtenInput}
                    onChange={(e) => setWrittenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (!writtenInput.trim()) {
                          setFeedback("Type an answer (or press Skip).");
                          return;
                        }
                        grade(writtenInput, questions, qIndex, correct, review);
                      }
                    }}
                  />
                  <div className="muted" style={{ marginTop: 6 }}>
                    Tip: spacing/case doesn&apos;t matter.
                  </div>
                </div>
              )}

              <div className="test-actions">
                <button
                  className="btn secondary"
                  id="skipBtn"
                  type="button"
                  onClick={() => {
                    const nextReview: ReviewItem[] = [
                      ...review,
                      {
                        prompt: q.prompt,
                        given: "(skipped)",
                        answer: q.answer,
                        ok: false,
                        term: q.card.term,
                        def: q.card.def,
                      },
                    ];
                    setReview(nextReview);
                    const nextIndex = qIndex + 1;
                    if (nextIndex >= questions.length) finish(correct, questions, nextReview);
                    else {
                      setQIndex(nextIndex);
                      showQuestion(nextIndex, questions, correct);
                    }
                  }}
                >
                  Skip
                </button>
                <span className="spacer" />
                {q.type === "written" ? (
                  <button
                    className="btn"
                    id="submitBtn"
                    type="button"
                    onClick={() => {
                      if (!writtenInput.trim()) {
                        setFeedback("Type an answer (or press Skip).");
                        return;
                      }
                      grade(writtenInput, questions, qIndex, correct, review);
                    }}
                  >
                    Submit
                  </button>
                ) : null}
              </div>

              <p className="muted" id="feedback" style={{ marginTop: 10, minHeight: 22 }}>
                {feedback}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {resultActive ? (
        <section className="card" id="resultCard">
          <div className="report-top">
            <div className="report-left">
              <h2 style={{ margin: 0 }}>Report</h2>
              <p className="muted" id="resultText" style={{ marginTop: 6 }}>
                Score: {correct}/{questions.length} ({resultPct}%)
              </p>

              <div className="flex report-actions" style={{ gap: 10, marginTop: 10 }}>
                <button className="btn secondary" id="retryBtn" type="button" onClick={() => start(false)}>
                  Retry full test
                </button>
                <button
                  className="btn"
                  id="retryWrongBtn"
                  type="button"
                  onClick={() => {
                    wrongOnlyRef.current = Array.from(new Set(review.filter((r) => !r.ok).map((r) => r.term)));
                    start(true);
                  }}
                >
                  Retry wrong only
                </button>
              </div>
            </div>

            <div className="ring-wrap ring-large" aria-label="Score ring">
              <svg className="ring" viewBox="0 0 120 120" role="img" aria-label="Score percentage">
                <circle className="ring-bg" cx="60" cy="60" r="44" />
                <circle
                  className="ring-fg"
                  cx="60"
                  cy="60"
                  r="44"
                  id="ringFg"
                  style={{
                    strokeDasharray: ringC,
                    strokeDashoffset: ringOffset,
                    stroke: ringColor,
                  }}
                />
              </svg>
              <div className="ring-text">
                <div className="ring-percent" id="ringPercent">
                  {Math.round(ringPct)}%
                </div>
                <div className="muted" id="ringSub">
                  Score
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-weak)", margin: "16px 0" }} />

          <h3>Missed Questions</h3>
          <p className="muted" id="missedNote" style={{ marginTop: 6 }}>
            {missed.length === 0
              ? "Perfect score — you didn’t miss any questions 🎉"
              : `You missed ${missed.length} question(s). Review them below:`}
          </p>

          <div className="review-grid" id="missedGrid">
            {missed.map((r, i) => (
              <div key={`${r.prompt}-${i}`} className="review-item bad">
                <strong>{r.prompt}</strong>
                <div>
                  Your answer: <code>{escapeHtml(String(r.given))}</code>
                </div>
                <div>
                  Correct answer: <code>{escapeHtml(String(r.answer))}</code>
                </div>
                <div className="muted">
                  Card: {escapeHtml(r.term)} → {escapeHtml(r.def)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

import {
  addXP,
  addCoins,
  getProgress,
  getAdventureProgress,
  markLessonComplete,
  markQuizComplete,
  mountGuideBubble,
  on,
} from "./state.js";

const LESSONS = [
  {
    id: "L1_hangul",
    title: "Hangul 1: ㄱ ㄴ ㄷ ㅁ ㅂ + ㅏ",
    unlockCap: 4,
    unlockLabel: "Unlocks Adventure Levels 1–4",
    rewardText: "+12 XP • +6 coins",
  },
  {
    id: "L2_vocab_food",
    title: "Vocab: Food Basics",
    unlockCap: 8,
    unlockLabel: "Unlocks Adventure Levels 5–8",
    rewardText: "+12 XP • +6 coins",
  },
  {
    id: "L3_greetings",
    title: "Phrases: Greetings & Intros",
    unlockCap: 12,
    unlockLabel: "Unlocks Adventure Levels 9–12",
    rewardText: "+12 XP • +6 coins",
  },
];

const DOWNLOADABLES = [
  {
    title: "Korean Words List",
    filename: "resources/KoreanWordsList.pdf",
    note: "Ready to download from your current repo file.",
  },
  {
    title: "Hangul Trace Pack",
    filename: "resources/HangulTracePack.pdf",
    note: "Add this file manually to /resources when ready.",
  },
  {
    title: "Food Basics Study Pack",
    filename: "resources/FoodBasicsStudyPack.pdf",
    note: "Add this file manually to /resources when ready.",
  },
];

function ensureStyles() {
  if (document.getElementById("kq-resources-enhancements")) return;
  const style = document.createElement("style");
  style.id = "kq-resources-enhancements";
  style.textContent = `
    .kq-resources-summary {
      margin: 0 0 20px;
      padding: 18px 20px;
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(246,249,255,.95));
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    }
    .kq-resources-summary strong {
      display: block;
      margin-bottom: 6px;
      font-size: 1rem;
    }
    .kq-resources-summary p {
      margin: 0;
      color: var(--muted, #5e6678);
      font-weight: 700;
      line-height: 1.55;
    }
    .kq-unlock-pill,
    .kq-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 8px 8px 0 0;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: .82rem;
      font-weight: 900;
      letter-spacing: .02em;
      background: rgba(91, 114, 159, 0.1);
      color: var(--brand, #5b729f);
    }
    .kq-status-pill.done {
      background: rgba(106, 159, 113, 0.12);
      color: #4f7c56;
    }
    .kq-lesson-footer {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kq-download-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 16px;
    }
    .kq-pdf-card {
      padding: 16px;
      border-radius: 18px;
      background: var(--surface-2, #f7f9fd);
      border: 1px solid rgba(0,0,0,0.08);
      display: grid;
      gap: 8px;
    }
    .kq-pdf-card h3 {
      margin: 0;
      font-size: 1rem;
    }
    .kq-pdf-card p {
      margin: 0;
      color: var(--muted, #5e6678);
      line-height: 1.45;
      font-size: 0.92rem;
    }
    .kq-pdf-file {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.82rem;
      color: var(--brand, #5b729f);
      word-break: break-word;
    }
    .kq-pdf-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: fit-content;
      min-width: 140px;
      padding: 10px 14px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 900;
      color: #fff;
      background: var(--brand, #5b729f);
    }
    .kq-toast {
      position: fixed;
      right: 20px;
      bottom: 24px;
      z-index: 1200;
      max-width: 340px;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(21, 28, 40, 0.96);
      color: #fff;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 180ms ease, transform 180ms ease;
    }
    .kq-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

function lessonById(id) {
  return LESSONS.find((lesson) => lesson.id === id) || null;
}

function ensureSummaryBanner() {
  let banner = document.getElementById("kqResourcesSummary");
  if (banner) return banner;

  banner = document.createElement("section");
  banner.id = "kqResourcesSummary";
  banner.className = "kq-resources-summary";

  const main = document.querySelector("main") || document.body;
  const firstHeading = main.querySelector("h1");
  if (firstHeading?.parentElement) {
    firstHeading.parentElement.insertBefore(banner, firstHeading.nextSibling);
  } else {
    main.prepend(banner);
  }

  return banner;
}

function renderSummary() {
  const banner = ensureSummaryBanner();
  const progress = getProgress();
  const adventure = getAdventureProgress();
  const completed = progress.completedLessonIds?.length || 0;

  const nextText = adventure.nextLesson
    ? `Next adventure chapter unlock: ${adventure.nextLesson.label}.`
    : "All adventure chapters are unlocked now.";

  banner.innerHTML = `
    <strong>Lesson unlock system is live</strong>
    <p>
      You have completed <strong>${completed}/3</strong> core lessons and unlocked Adventure through
      <strong>Level ${adventure.cap}</strong>. ${nextText}
    </p>
  `;
}

function showToast(message) {
  let toast = document.getElementById("kqResourcesToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "kqResourcesToast";
    toast.className = "kq-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => toast.classList.remove("show"), 2200);
}
showToast.timerId = 0;

function renderLessonStatus(card, lesson) {
  const progress = getProgress();
  const completed = new Set(progress.completedLessonIds || []);
  const isDone = completed.has(lesson.id);

  let footer = card.querySelector(".kq-lesson-footer");
  if (!footer) {
    footer = document.createElement("div");
    footer.className = "kq-lesson-footer";
    card.appendChild(footer);
  }

  let unlock = footer.querySelector(`[data-pill="unlock-${lesson.id}"]`);
  if (!unlock) {
    unlock = document.createElement("span");
    unlock.dataset.pill = `unlock-${lesson.id}`;
    unlock.className = "kq-unlock-pill";
    footer.prepend(unlock);
  }
  unlock.textContent = `🗺️ ${lesson.unlockLabel}`;

  let status = footer.querySelector(`[data-pill="status-${lesson.id}"]`);
  if (!status) {
    status = document.createElement("span");
    status.dataset.pill = `status-${lesson.id}`;
    status.className = "kq-status-pill";
    footer.appendChild(status);
  }

  status.classList.toggle("done", isDone);
  status.textContent = isDone ? `✅ Completed • ${lesson.rewardText}` : `✨ Start lesson • ${lesson.rewardText}`;
}

function enhanceLessons() {
  const lessonCards = document.querySelectorAll("[data-lesson-id]");
  lessonCards.forEach((card) => {
    const lesson = lessonById(card.dataset.lessonId);
    if (!lesson) return;

    renderLessonStatus(card, lesson);

    card.querySelectorAll('[data-action="start-lesson"]').forEach((btn) => {
      if (btn.dataset.kqBound === "true") return;
      btn.dataset.kqBound = "true";

      btn.addEventListener("click", () => {
        addXP(12);
        addCoins(6);
        const result = markLessonComplete({
          id: lesson.id,
          title: lesson.title,
          adventureUnlockCap: lesson.unlockCap,
        });

        renderLessonStatus(card, lesson);
        renderSummary();

        showToast(
          result.firstCompletion
            ? `${lesson.title} complete — ${lesson.unlockLabel} is now open.`
            : `${lesson.title} reviewed again. Rewards applied.`,
        );
      });
    });
  });
}

function ensureDownloadables() {
  let grid = document.getElementById("kqDownloadablesGrid");
  if (grid) return grid;

  grid = document.createElement("div");
  grid.id = "kqDownloadablesGrid";
  grid.className = "kq-download-grid";

  const heading = Array.from(document.querySelectorAll("h2, h3")).find((el) =>
    /downloadables/i.test(el.textContent || ""),
  );

  if (heading?.parentElement) {
    heading.parentElement.insertBefore(grid, heading.nextSibling);
  } else {
    (document.querySelector("main") || document.body).appendChild(grid);
  }

  return grid;
}

function renderDownloadables() {
  const grid = ensureDownloadables();
  grid.innerHTML = DOWNLOADABLES.map(
    (pdf) => `
      <article class="kq-pdf-card">
        <div aria-hidden="true" style="font-size:1.55rem;">📄</div>
        <h3>${pdf.title}</h3>
        <p>${pdf.note}</p>
        <div class="kq-pdf-file">${pdf.filename}</div>
        <a class="kq-pdf-link" href="${pdf.filename}" download>Download PDF</a>
      </article>
    `,
  ).join("");
}

function bindQuiz() {
  const quiz = document.getElementById("quiz");
  if (!quiz || quiz.dataset.kqBound === "true") return;
  quiz.dataset.kqBound = "true";

  quiz.addEventListener("submit", (event) => {
    event.preventDefault();

    let score = 0;
    const a1 = quiz.querySelector('input[name="q1"]:checked')?.value;
    const a2 = quiz.querySelector('input[name="q2"]:checked')?.value;

    if (a1 === "1") score += 1;
    if (a2 === "0") score += 1;

    const pct = Math.round((100 * score) / 2);
    const result = document.getElementById("quizResult");
    if (result) result.textContent = `Score: ${score}/2 (${pct}%)`;

    if (pct >= 50) {
      addXP(10);
      addCoins(5);
      markQuizComplete("Completed resources quiz");
      showToast("Quiz complete — +10 XP and +5 coins.");
    }
  });
}

function boot() {
  ensureStyles();
  renderSummary();
  enhanceLessons();
  renderDownloadables();
  bindQuiz();
}

boot();
on("state:changed", () => {
  renderSummary();
  enhanceLessons();
});

mountGuideBubble(
  [
    "Lessons now unlock Adventure chapters, so Resources is part of the progression loop now.",
    "The PDF download cards are ready. Add your files into /resources with the shown filenames.",
    "Start with Hangul 1, then Food Basics, then Greetings to open the whole map through Level 12.",
  ],
  { label: "Study Buddy", id: "kq-resources-bubble" },
);
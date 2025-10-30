import {
  addXP,
  addCoins,
  markLessonComplete,
  markQuizComplete,
} from "./state.js";

/* ---------- Lessons scaffold ---------- */
const LESSONS = [
  {
    id: "L1_hangul",
    title: "Hangul 1: ㄱ ㄴ ㄷ ㅁ ㅂ + ㅏ",
    minutes: 6,
    actions: [{ type: "trace", char: "ㄱ" }],
  },
  {
    id: "L2_vocab_food",
    title: "Vocab: Food Basics",
    minutes: 7,
    actions: [
      { type: "vocab", words: ["밥", "물", "김치", "빵", "우유", "사과"] },
    ],
  },
  {
    id: "L3_greetings",
    title: "Phrases: Greetings & Intros",
    minutes: 8,
    actions: [{ type: "phrases" }],
  },
];

const list = document.getElementById("lesson-list");
if (list) {
  // they already exist in HTML; we only attach click handlers
  list.querySelectorAll('[data-action="start-lesson"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const article = e.currentTarget.closest(".lesson");
      const id = article?.dataset.lessonId;
      const lesson = LESSONS.find((l) => l.id === id);
      if (!lesson) return;
      addXP(10);
      addCoins(5);
      markLessonComplete({ id: lesson.id, title: lesson.title });
      alert(`Started: ${lesson.title}\n(+10 XP, +5 coins)`);
    });
  });
}

/* ---------- Quiz ---------- */
const quiz = document.getElementById("quiz");
if (quiz) {
  quiz.addEventListener("submit", (e) => {
    e.preventDefault();
    let score = 0;
    const a1 = quiz.querySelector('input[name="q1"]:checked')?.value;
    const a2 = quiz.querySelector('input[name="q2"]:checked')?.value;
    if (a1 === "1") score++; // math refresher
    if (a2 === "0") score++; // 안녕하세요
    const pct = Math.round((100 * score) / 2);
    document.getElementById(
      "quizResult"
    ).textContent = `Score: ${score}/2 (${pct}%)`;
    if (pct >= 50) {
      addXP(10);
      addCoins(5);
      markQuizComplete();
    }
  });
}

/* ---------- Downloadables (generate client-side) ---------- */
const dlWorksheet = document.getElementById("dl-worksheet");
if (dlWorksheet) {
  dlWorksheet.addEventListener("click", (e) => {
    e.preventDefault();
    const blob = new Blob(
      [
        "Hangul Practice\n\n",
        "1) Trace ㄱ ㄴ ㄷ ㅁ ㅂ\n",
        "2) Build: 가 나 다 마 바\n",
        "3) Vowels: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ\n",
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hangul-practice.txt";
    a.click();
    URL.revokeObjectURL(url);
  });
}
const dlFlash = document.getElementById("dl-flashcards");
if (dlFlash) {
  dlFlash.addEventListener("click", (e) => {
    e.preventDefault();
    const blob = new Blob(
      [
        "밥\tmeal/rice\n물\twater\n김치\tkimchi\n빵\tbread\n우유\tmilk\n사과\tapple\n",
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "korean-flashcards.txt";
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ---------- API Demo: simple translation (keyless) ----------
   MyMemory (free) — good enough for a demo; swap to Papago/Google later.
   We’ll show translations for L2 food words when user clicks a word.
*/
async function translateKOtoEN(text) {
  // free & public (rate-limited). For production, replace with your own backend.
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=ko|en`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.responseData?.translatedText || "(no translation)";
}

// Add clickable translations to any list items that look like vocab
list
  ?.querySelectorAll('[data-lesson-id="L2_vocab_food"]')[0]
  ?.querySelectorAll(".lesson-actions, header")
  ?.forEach((sec) => {
    const words = ["밥", "물", "김치", "빵", "우유", "사과"];
    const wrap = document.createElement("div");
    wrap.className = "flex";
    wrap.style.marginTop = "8px";
    wrap.innerHTML = words
      .map(
        (w) => `<button class="btn secondary" data-word="${w}">${w}</button>`
      )
      .join("");
    sec.parentElement.appendChild(wrap);
    wrap.querySelectorAll("button[data-word]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const en = await translateKOtoEN(btn.dataset.word);
        btn.textContent = `${btn.dataset.word} → ${en}`;
        btn.disabled = false;
      });
    });
  });

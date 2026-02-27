// js/levels/flashcard-sets.js
// Shared flashcard sets (Quizlet-style). Add more sets here anytime.

export const FLASHCARD_SETS = [
  {
    id: "food-basics",
    title: "Food Basics",
    description: "High-frequency food words (Resources page set).",
    cards: [
      { term: "밥", def: "rice / meal" },
      { term: "물", def: "water" },
      { term: "김치", def: "kimchi" },
      { term: "빵", def: "bread" },
      { term: "우유", def: "milk" },
      { term: "사과", def: "apple" },
    ],
  },
  {
    id: "greetings",
    title: "Greetings",
    description: "Common greetings & polite basics.",
    cards: [
      { term: "안녕하세요", def: "hello (polite)" },
      { term: "감사합니다", def: "thank you (polite)" },
      { term: "죄송합니다", def: "sorry (polite)" },
      { term: "네", def: "yes" },
      { term: "아니요", def: "no" },
      { term: "좋아요", def: "good / I like it" },
    ],
  },
];
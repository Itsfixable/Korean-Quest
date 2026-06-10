export const ACHIEVEMENTS: Record<string, { icon: string; desc: string }> = {
  "Lesson Starter": { icon: "📘", desc: "Complete your first lesson." },
  "Hangul Hero": { icon: "🇰🇷", desc: "Finish your first lesson quest." },
  "Tracing Starter": { icon: "✍️", desc: "Trace your first Korean character." },
  "Battle Beginner": { icon: "⚔️", desc: "Win your first adventure battle." },
  "Adventure Apprentice": { icon: "🗺️", desc: "Clear four adventure levels." },
  "Boss Breaker": { icon: "👑", desc: "Defeat a boss level." },
  "Lesson Explorer": { icon: "🧭", desc: "Complete all three starter lessons." },
  "Quest Finisher": { icon: "✅", desc: "Complete every daily quest in one day." },
  "Weekly Warrior": { icon: "🛡️", desc: "Reach the weekly XP goal." },
  "Study Streak 3": { icon: "🔥", desc: "Keep a 3-day study streak." },
  "Study Streak 7": { icon: "🌟", desc: "Keep a 7-day study streak." },
  "XP Collector": { icon: "💎", desc: "Earn 250 total XP." },
};

export const LESSON_UNLOCKS: Record<string, { cap: number; label: string }> = {
  L1_hangul: { cap: 4, label: "Adventure Levels 1–4" },
  L2_vocab_food: { cap: 8, label: "Adventure Levels 5–8" },
  L3_greetings: { cap: 12, label: "Adventure Levels 9–12" },
};

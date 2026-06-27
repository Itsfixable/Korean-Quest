export interface EquippedCosmetics {
  hat: string | null;
  bg: string | null;
  avatar: string | null;
  frame: string | null;
  background: string | null;
  flair: string | null;
  pet: string | null;
  title: string | null;
  initialsBg: string | null;
}

export interface Player {
  level: number;
  xp: number;
  totalXPEarned: number;
  coins: number;
  badges: string[];
  streak: number;
  lastLoginDate: string | null;
  inventory: string[];
  equipped: EquippedCosmetics;
  profileUsesInitials?: boolean;
  /** Custom hex color chosen via the legendary initials color picker. */
  initialsBgCustom?: string;
  /** Set once after starter cosmetics are applied so unequips persist. */
  shopInitialized?: boolean;
}

export interface RecentWork {
  title: string;
  type: string;
  ts: number;
}

export interface Progress {
  lessonsDone: number;
  completedLessonIds: string[];
  quizzesDone: number;
  battlesWon: number;
  adventureCap: number;
  recentWork: RecentWork[];
  jamoStars: Record<string, number>;
  /** Active study minutes accrued today (resets when the day changes). */
  studyMinutes?: number;
  /** Day key (toDateString) the studyMinutes counter belongs to. */
  studyMinutesDay?: string | null;
}

export interface QuestReward {
  coins?: number;
  badge?: string;
}

export interface Quest {
  id: string;
  desc: string;
  target: number;
  progress: number;
  done: boolean;
  reward: QuestReward;
}

export interface LeaderboardEntry {
  name: string;
  xp: number;
  title: string;
  badge: string;
  streak: number;
}

export interface GameState {
  player: Player;
  progress: Progress;
  quests: {
    daily: Quest[];
    dailyAllBonusGiven: boolean;
    weekly: Quest[];
  };
  rsvps: Record<string, { going: boolean }>;
  leaderboard: LeaderboardEntry[];
}

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  image: string;
  category: string;
  slot: string;
  cost: number;
  rarity: string;
  description: string;
  /** Solid color for initials-background swatch items. */
  color?: string;
}

export interface FakeUser {
  name: string;
  email?: string;
  password?: string;
  loggedIn: boolean;
  avatarInitials?: string;
  avatarImage?: string;
}

export interface Flashcard {
  term: string;
  def: string;
}

export interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
}

export interface FlashcardProgress {
  known: string[];
  learning: string[];
  order: string[];
  knownOrder: string[];
}

export interface Booking {
  date: string;
  time: string;
  room: string;
  going: boolean;
  createdAt: number;
}

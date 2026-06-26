"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS, LESSON_UNLOCKS } from "@/lib/constants/achievements";
import { KQ_SHOP_CATALOG, KQ_SHOP_STARTERS } from "@/lib/constants/shop-catalog";
import type { GameState, ShopItem } from "@/lib/types";

export const KQ_VERSION = "1.6.0";
const DAILY_QUEST_XP_BONUS = 15;
const DAILY_ALL_XP_BONUS = 60;

const DEFAULT_STATE: GameState = {
  player: {
    level: 1,
    xp: 0,
    totalXPEarned: 0,
    coins: 0,
    badges: [],
    streak: 0,
    lastLoginDate: null,
    inventory: [],
    equipped: {
      hat: null,
      bg: null,
      avatar: null,
      frame: null,
      background: null,
      flair: null,
      pet: null,
      title: null,
      initialsBg: null,
    },
    profileUsesInitials: false,
    shopInitialized: false,
  },
  progress: {
    lessonsDone: 0,
    completedLessonIds: [],
    quizzesDone: 0,
    battlesWon: 0,
    adventureCap: 1,
    recentWork: [],
    jamoStars: {},
  },
  quests: {
    daily: [],
    dailyAllBonusGiven: false,
    weekly: [
      {
        id: "w1",
        desc: "Earn 200 XP this week",
        target: 200,
        progress: 0,
        done: false,
        reward: { coins: 50, badge: "Weekly Warrior" },
      },
    ],
  },
  rsvps: {},
  leaderboard: [
    { name: "Minji Moon", xp: 1180, title: "Streak Queen", badge: "🔥", streak: 19 },
    { name: "Jae Park", xp: 1115, title: "Word Wizard", badge: "📚", streak: 16 },
    { name: "Hana Kim", xp: 1040, title: "Boss Breaker", badge: "👑", streak: 13 },
    { name: "Noah Lee", xp: 990, title: "Quest Climber", badge: "🧭", streak: 12 },
    { name: "Ari Choi", xp: 950, title: "Flashcard Ace", badge: "🃏", streak: 11 },
    { name: "Mina Song", xp: 910, title: "Pronunciation Pro", badge: "🎤", streak: 10 },
    { name: "Luca Shin", xp: 860, title: "Grammar Guard", badge: "🛡️", streak: 9 },
    { name: "Sora Han", xp: 825, title: "Hangul Hero", badge: "🇰🇷", streak: 8 },
    { name: "Ethan Yoo", xp: 780, title: "Adventure Scout", badge: "🗺️", streak: 7 },
    { name: "Nari Lim", xp: 745, title: "Quiz Champ", badge: "🏆", streak: 6 },
    { name: "Daniel Kwon", xp: 700, title: "Streak Saver", badge: "⏰", streak: 6 },
    { name: "Sujin Oh", xp: 660, title: "Lesson Explorer", badge: "📘", streak: 5 },
    { name: "Yuna Bae", xp: 620, title: "Vocab Voyager", badge: "🧳", streak: 5 },
    { name: "Tae Jeong", xp: 585, title: "Combo Crafter", badge: "⚡", streak: 4 },
    { name: "Bo-ram Seo", xp: 540, title: "Daily Devotee", badge: "🌙", streak: 4 },
    { name: "Kai Jung", xp: 505, title: "Rookie Reader", badge: "🔰", streak: 3 },
    { name: "Seoyeon Ahn", xp: 470, title: "Syllable Seeker", badge: "🧩", streak: 3 },
    { name: "Min-jun Cho", xp: 430, title: "Fresh Challenger", badge: "🎒", streak: 2 },
  ],
};

function dailyQuestTemplate() {
  return [
    { id: "xp-daily", desc: "Earn 30 XP today", target: 30, progress: 0, done: false, reward: { coins: 20 } },
    { id: "lesson-1", desc: "Complete 1 lesson", target: 1, progress: 0, done: false, reward: { coins: 10, badge: "Hangul Hero" } },
    { id: "battle-1", desc: "Win 1 battle", target: 1, progress: 0, done: false, reward: { coins: 10 } },
  ];
}

export function nowStr() {
  return new Date().toDateString();
}

function deriveAdventureCap(completedLessonIds: string[] = []) {
  let cap = 1;
  completedLessonIds.forEach((lessonId) => {
    cap = Math.max(cap, LESSON_UNLOCKS[lessonId]?.cap || cap);
  });
  return cap;
}

function lessonLabelFromCap(cap: number) {
  if (cap >= 12) return "Adventure Levels 9–12";
  if (cap >= 8) return "Adventure Levels 5–8";
  if (cap >= 4) return "Adventure Levels 1–4";
  return "Level 1 only";
}

function ensureShopState(state: GameState): GameState {
  const player = { ...state.player };
  if (!Array.isArray(player.inventory)) player.inventory = [];
  player.equipped = {
    hat: player.equipped?.hat || null,
    bg: player.equipped?.bg || null,
    avatar: player.equipped?.avatar || null,
    frame: player.equipped?.frame || null,
    background: player.equipped?.background || null,
    flair: player.equipped?.flair || null,
    pet: player.equipped?.pet || null,
    title: player.equipped?.title || null,
    initialsBg: player.equipped?.initialsBg || null,
  };
  KQ_SHOP_STARTERS.forEach((id) => {
    if (!player.inventory.includes(id)) player.inventory.push(id);
  });
  // Starter cosmetics are equipped only on first init. After that, the player
  // can freely unequip a slot and have it stay empty.
  if (!player.shopInitialized) {
    if (!player.equipped.avatar) player.equipped.avatar = "avatar-sejong";
    if (!player.equipped.frame) player.equipped.frame = "frame-cloud";
    if (!player.equipped.background) player.equipped.background = player.equipped.bg || "bg-hanok";
    if (!player.equipped.title) player.equipped.title = "title-rookie";
    player.shopInitialized = true;
  }
  return { ...state, player };
}

interface GameStore extends GameState {
  rewardMessage: string | null;
  hydrated: boolean;
  setHydrated: () => void;
  ensureDaily: () => void;
  needXP: (level: number) => number;
  addXP: (amount: number, options?: { countForQuest?: boolean }) => void;
  addCoins: (amount: number) => void;
  addBadge: (name: string) => void;
  addRecentWork: (title: string, type: string) => void;
  incQuest: (id: string, amount?: number) => void;
  claimQuest: (id: string) => void;
  markLessonComplete: (opts?: { id?: string; title?: string; adventureUnlockCap?: number }) => { firstCompletion: boolean };
  markQuizComplete: (title?: string) => void;
  markBattleWin: (title?: string, options?: { boss?: boolean }) => void;
  getJamoStars: (ch: string) => number;
  setJamoStars: (ch: string, stars: number) => void;
  toggleRSVP: (eventId: string) => void;
  unlockAdventureTo: (cap: number, reason?: string) => void;
  getAdventureProgress: () => {
    cap: number;
    lessons: { id: string; cap: number; label: string; done: boolean }[];
    nextLesson: { id: string; cap: number; label: string; done: boolean } | null;
  };
  getAchievementMeta: (name: string) => { icon: string; desc: string };
  getAchievements: () => { name: string; icon: string; desc: string }[];
  getShopCatalog: (category?: string) => ShopItem[];
  getShopItem: (itemId: string) => ShopItem | null;
  getOwnedItemIds: () => string[];
  getEquippedCosmetics: () => GameState["player"]["equipped"];
  getEquippedProfile: () => Record<string, ShopItem | null | undefined>;
  purchaseShopItem: (itemId: string) => { ok: boolean; reason?: string; item?: ShopItem };
  equipShopItem: (itemId: string) => { ok: boolean; reason?: string; item?: ShopItem };
  unequipShopSlot: (slot: string) => { ok: boolean; reason?: string };
  setProfileUsesInitials: (value: boolean) => void;
  setInitialsBgCustom: (color: string) => void;
  getInitialsBgColor: () => string | null;
  getCurrentDisplayTitle: () => string;
  getCurrentDisplayEmoji: () => string;
  clearReward: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      rewardMessage: null,
      hydrated: false,
      setHydrated: () => {
        const s = ensureShopState(get());
        set({ ...s, hydrated: true });
      },

      ensureDaily: () => {
        const state = get();
        const today = nowStr();
        if (state.player.lastLoginDate === today) return;

        const player = { ...state.player };
        if (!player.lastLoginDate) {
          player.streak = 1;
        } else {
          const prev = new Date(player.lastLoginDate);
          const curr = new Date(today);
          const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
          player.streak = diff === 1 ? (player.streak || 0) + 1 : 1;
        }
        player.lastLoginDate = today;

        set({
          player,
          quests: {
            ...state.quests,
            dailyAllBonusGiven: false,
            daily: dailyQuestTemplate(),
          },
        });

        const s = get();
        if (s.player.streak >= 3) get().addBadge("Study Streak 3");
        if (s.player.streak >= 7) get().addBadge("Study Streak 7");
      },

      needXP: (level) => 100 * level,

      clearReward: () => set({ rewardMessage: null }),

      addXP: (amount, options = {}) => {
        const safeAmount = Math.max(0, Number(amount) || 0);
        const countForQuest = options.countForQuest !== false;
        const state = get();
        const player = { ...state.player };
        player.xp += safeAmount;
        player.totalXPEarned += safeAmount;

        while (player.xp >= get().needXP(player.level)) {
          player.xp -= get().needXP(player.level);
          player.level += 1;
        }

        set({ player, rewardMessage: safeAmount > 0 ? `+${safeAmount} XP` : get().rewardMessage });

        const weekly = state.quests.weekly.map((quest) => {
          if (quest.done) return quest;
          const progress = Math.min(quest.target, (Number(quest.progress) || 0) + safeAmount);
          const done = progress >= quest.target;
          if (done) {
            if (quest.reward?.coins) get().addCoins(quest.reward.coins);
            if (quest.reward?.badge) get().addBadge(quest.reward.badge);
            get().addRecentWork(`Completed weekly quest: ${quest.desc}`, "Quest");
          }
          return { ...quest, progress, done };
        });
        set((s) => ({ quests: { ...s.quests, weekly } }));

        if (get().player.totalXPEarned >= 250) get().addBadge("XP Collector");
        if (countForQuest) get().incQuest("xp-daily", safeAmount);
      },

      addCoins: (amount) => {
        const amountValue = Math.max(0, Number(amount) || 0);
        set((s) => ({
          player: { ...s.player, coins: s.player.coins + amountValue },
          rewardMessage: amountValue > 0 ? `+${amountValue} coins` : s.rewardMessage,
        }));
      },

      addBadge: (name) => {
        const safe = String(name || "").trim();
        if (!safe) return;
        set((s) => {
          if (s.player.badges.includes(safe)) return s;
          return { player: { ...s.player, badges: [...s.player.badges, safe] } };
        });
      },

      addRecentWork: (title, type) => {
        set((s) => ({
          progress: {
            ...s.progress,
            recentWork: [
              { title: String(title || "Completed activity"), type: String(type || "Activity"), ts: Date.now() },
              ...s.progress.recentWork,
            ].slice(0, 8),
          },
        }));
      },

      incQuest: (id, amount = 1) => {
        get().ensureDaily();
        const state = get();
        // Only track progress here — rewards are granted when the user clicks
        // "Claim" (see claimQuest). Progress caps at the target and the quest
        // stays unclaimed (done stays false) until then.
        const daily = state.quests.daily.map((q) => {
          if (q.id !== id || q.done) return q;
          const progress = Math.min(q.target, q.progress + (Number(amount) || 0));
          return { ...q, progress };
        });
        set((s) => ({ quests: { ...s.quests, daily } }));
      },

      claimQuest: (id) => {
        get().ensureDaily();
        const quest = get().quests.daily.find((q) => q.id === id);
        // Only claimable once progress has reached the target and it isn't
        // already claimed.
        if (!quest || quest.done || quest.progress < quest.target) return;

        const daily = get().quests.daily.map((q) =>
          q.id === id ? { ...q, progress: q.target, done: true } : q,
        );
        set((s) => ({ quests: { ...s.quests, daily } }));

        if (quest.reward?.coins) get().addCoins(quest.reward.coins);
        if (quest.reward?.badge) get().addBadge(quest.reward.badge);
        get().addXP(DAILY_QUEST_XP_BONUS, { countForQuest: false });
        get().addRecentWork(`Claimed daily quest: ${quest.desc} (+${DAILY_QUEST_XP_BONUS} XP)`, "Quest");

        const allDone = get().quests.daily.every((item) => item.done);
        if (allDone && !get().quests.dailyAllBonusGiven) {
          set((s) => ({ quests: { ...s.quests, dailyAllBonusGiven: true } }));
          get().addBadge("Quest Finisher");
          get().addXP(DAILY_ALL_XP_BONUS, { countForQuest: false });
          get().addRecentWork(`All daily quests completed! (+${DAILY_ALL_XP_BONUS} XP)`, "Quest");
        }
      },

      unlockAdventureTo: (cap, reason = "lesson") => {
        const safeCap = Math.max(1, Number(cap) || 1);
        const prev = get().progress.adventureCap || 1;
        const newCap = Math.max(prev, safeCap);
        set((s) => ({ progress: { ...s.progress, adventureCap: newCap } }));
        if (newCap > prev) {
          get().addRecentWork(`Unlocked ${lessonLabelFromCap(newCap)} from ${reason}`, "Unlock");
        }
      },

      getAdventureProgress: () => {
        const completed = new Set(get().progress.completedLessonIds || []);
        const lessons = Object.entries(LESSON_UNLOCKS).map(([id, meta]) => ({
          id,
          cap: meta.cap,
          label: meta.label,
          done: completed.has(id),
        }));
        return {
          cap: get().progress.adventureCap || 1,
          lessons,
          nextLesson: lessons.find((l) => !l.done) || null,
        };
      },

      markLessonComplete: (opts = {}) => {
        const safeId = String(opts.id || "").trim();
        const safeTitle = String(opts.title || safeId || "Completed lesson").trim();
        let firstCompletion = false;

        if (safeId && !get().progress.completedLessonIds.includes(safeId)) {
          const completedLessonIds = [...get().progress.completedLessonIds, safeId];
          const adventureCap = Math.max(
            get().progress.adventureCap || 1,
            opts.adventureUnlockCap || LESSON_UNLOCKS[safeId]?.cap || 1,
          );
          set((s) => ({
            progress: {
              ...s.progress,
              completedLessonIds,
              lessonsDone: completedLessonIds.length,
              adventureCap,
            },
          }));
          firstCompletion = true;
        }

        get().addRecentWork(firstCompletion ? safeTitle : `Reviewed ${safeTitle}`, "Lesson");
        get().addBadge("Lesson Starter");
        get().incQuest("lesson-1", 1);

        if (get().progress.completedLessonIds.length >= 3) get().addBadge("Lesson Explorer");
        if (firstCompletion && (opts.adventureUnlockCap || LESSON_UNLOCKS[safeId]?.cap)) {
          get().unlockAdventureTo(opts.adventureUnlockCap || LESSON_UNLOCKS[safeId].cap, safeTitle);
        }

        return { firstCompletion };
      },

      markQuizComplete: (title = "Completed quiz") => {
        set((s) => ({ progress: { ...s.progress, quizzesDone: s.progress.quizzesDone + 1 } }));
        get().addRecentWork(title, "Quiz");
      },

      markBattleWin: (title = "Won 1 battle", options = {}) => {
        set((s) => ({ progress: { ...s.progress, battlesWon: s.progress.battlesWon + 1 } }));
        get().addRecentWork(title, "Battle");
        get().incQuest("battle-1", 1);
        const battlesWon = get().progress.battlesWon;
        if (battlesWon >= 1) get().addBadge("Battle Beginner");
        if (battlesWon >= 4) get().addBadge("Adventure Apprentice");
        if (options?.boss) get().addBadge("Boss Breaker");
      },

      getJamoStars: (ch) => get().progress.jamoStars?.[ch] ?? 0,

      setJamoStars: (ch, stars) => {
        const current = get().progress.jamoStars?.[ch] ?? 0;
        set((s) => ({
          progress: {
            ...s.progress,
            jamoStars: { ...s.progress.jamoStars, [ch]: Math.max(current, Number(stars) || 0) },
          },
        }));
      },

      toggleRSVP: (eventId) => {
        set((s) => ({
          rsvps: {
            ...s.rsvps,
            [eventId]: { going: !(s.rsvps[eventId]?.going) },
          },
        }));
      },

      getAchievementMeta: (name) => {
        if (ACHIEVEMENTS[name]) return ACHIEVEMENTS[name];
        // Legacy badges were stored with an emoji prefix (e.g. "✍️ Tracing
        // Starter"); match on the known achievement name contained within.
        const key = Object.keys(ACHIEVEMENTS).find((k) => name.includes(k));
        return key ? ACHIEVEMENTS[key] : { icon: "🏅", desc: "Achievement unlocked." };
      },

      getAchievements: () =>
        get().player.badges.map((stored) => {
          const cleanName = Object.keys(ACHIEVEMENTS).find((k) => stored === k || stored.includes(k)) || stored;
          return { name: cleanName, ...get().getAchievementMeta(stored) };
        }),

      getShopCatalog: (category = "all") => {
        if (!category || category === "all") return [...KQ_SHOP_CATALOG];
        return KQ_SHOP_CATALOG.filter((item) => item.category === category);
      },

      getShopItem: (itemId) => KQ_SHOP_CATALOG.find((item) => item.id === itemId) || null,

      getOwnedItemIds: () => ensureShopState(get()).player.inventory,

      getEquippedCosmetics: () => ensureShopState(get()).player.equipped,

      getEquippedProfile: () => {
        const equipped = get().getEquippedCosmetics();
        return {
          avatar: get().getShopItem(equipped.avatar || ""),
          frame: get().getShopItem(equipped.frame || ""),
          background: get().getShopItem(equipped.background || ""),
          flair: get().getShopItem(equipped.flair || ""),
          pet: get().getShopItem(equipped.pet || ""),
          title: get().getShopItem(equipped.title || ""),
        };
      },

      purchaseShopItem: (itemId) => {
        const s = ensureShopState(get());
        const item = get().getShopItem(itemId);
        if (!item) return { ok: false, reason: "missing-item" };
        if (s.player.inventory.includes(itemId)) return { ok: false, reason: "owned", item };
        if ((Number(s.player.coins) || 0) < item.cost) return { ok: false, reason: "coins", item };
        set({
          player: {
            ...s.player,
            coins: s.player.coins - item.cost,
            inventory: [...s.player.inventory, itemId],
          },
        });
        get().addRecentWork(`Bought ${item.name} for ${item.cost} coins`, "Shop");
        return { ok: true, item };
      },

      equipShopItem: (itemId) => {
        const s = ensureShopState(get());
        const item = get().getShopItem(itemId);
        if (!item) return { ok: false, reason: "missing-item" };
        if (!item.slot) return { ok: false, reason: "not-equipable", item };
        if (!s.player.inventory.includes(itemId)) return { ok: false, reason: "not-owned", item };
        const equipped = { ...s.player.equipped, [item.slot]: itemId };
        if (item.slot === "background") {
          equipped.bg = itemId === "bg-palace" ? "bgPalace" : itemId;
        }
        set({ player: { ...s.player, equipped } });
        get().addRecentWork(`Equipped ${item.name}`, "Shop");
        return { ok: true, item };
      },

      unequipShopSlot: (slot) => {
        if (!slot) return { ok: false, reason: "missing-slot" };
        const s = ensureShopState(get());
        set({ player: { ...s.player, equipped: { ...s.player.equipped, [slot]: null } } });
        return { ok: true };
      },

      setProfileUsesInitials: (value) => {
        set((s) => ({ player: { ...s.player, profileUsesInitials: value } }));
      },

      setInitialsBgCustom: (color) => {
        set((s) => ({ player: { ...s.player, initialsBgCustom: color } }));
      },

      getInitialsBgColor: () => {
        const equippedId = get().getEquippedCosmetics().initialsBg;
        if (!equippedId) return null;
        if (equippedId === "initials-custom") return get().player.initialsBgCustom || "#cfe0ff";
        return get().getShopItem(equippedId)?.color || null;
      },

      getCurrentDisplayTitle: () => {
        const profile = get().getEquippedProfile();
        return profile.title?.name || get().player.badges?.[0] || "New Challenger";
      },

      getCurrentDisplayEmoji: () => {
        const profile = get().getEquippedProfile();
        return profile.avatar?.emoji || "👑";
      },

      resetAll: () => set({ ...DEFAULT_STATE, rewardMessage: null, hydrated: true }),
    }),
    {
      name: "kq-state",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        state?.ensureDaily();
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameState> | undefined;
        if (!saved) return current;
        const merged = {
          ...current,
          ...saved,
          player: { ...current.player, ...saved.player, equipped: { ...current.player.equipped, ...saved.player?.equipped } },
          progress: {
            ...current.progress,
            ...saved.progress,
            completedLessonIds: Array.isArray(saved.progress?.completedLessonIds) ? saved.progress.completedLessonIds : [],
            recentWork: Array.isArray(saved.progress?.recentWork) ? saved.progress.recentWork : [],
            jamoStars: saved.progress?.jamoStars && typeof saved.progress.jamoStars === "object" ? saved.progress.jamoStars : {},
          },
          quests: {
            ...current.quests,
            ...saved.quests,
            daily: Array.isArray(saved.quests?.daily) ? saved.quests.daily : [],
            weekly: Array.isArray(saved.quests?.weekly) ? saved.quests.weekly : current.quests.weekly,
          },
        };
        merged.progress.lessonsDone = merged.progress.completedLessonIds.length;
        merged.progress.adventureCap = deriveAdventureCap(merged.progress.completedLessonIds);
        merged.player.totalXPEarned = Number(merged.player.totalXPEarned) || Number(merged.player.xp) || 0;
        return merged as GameStore;
      },
    },
  ),
);

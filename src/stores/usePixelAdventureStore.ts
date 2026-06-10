"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PixelQuest {
  id: string;
  title: string;
  desc: string;
  progress: number;
  target: number;
  done: boolean;
}

export interface PixelInvItem {
  id: string;
  name: string;
  kind: "item" | "skin";
}

export interface PixelAdventureState {
  coins: number;
  gems: number;
  xp: number;
  skin: string;
  inv: PixelInvItem[];
  keys: number;
  discovered: string[];
  unlocked: string[];
  wheelLast: number;
  quest: PixelQuest;
  world: { rx: number; ry: number };
}

const DEFAULT: PixelAdventureState = {
  coins: 120,
  gems: 2,
  xp: 0,
  skin: "Default",
  inv: [],
  keys: 0,
  discovered: ["Town"],
  unlocked: ["Town"],
  wheelLast: 0,
  quest: {
    id: "q1",
    title: "Meet the Merchant",
    desc: "Walk to a shop (red roof) and press E.",
    progress: 0,
    target: 1,
    done: false,
  },
  world: { rx: 0, ry: 0 },
};

interface PixelAdventureStore extends PixelAdventureState {
  setState: (partial: Partial<PixelAdventureState>) => void;
  reset: () => void;
}

export const usePixelAdventureStore = create<PixelAdventureStore>()(
  persist(
    (set) => ({
      ...DEFAULT,
      setState: (partial) => set((s) => ({ ...s, ...partial })),
      reset: () => set(DEFAULT),
    }),
    { name: "kq-adv-overworld-v3" },
  ),
);

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FlashcardProgress } from "@/lib/types";

interface FlashcardStore {
  progress: Record<string, FlashcardProgress>;
  getSetProgress: (setId: string) => FlashcardProgress;
  saveSetProgress: (setId: string, data: FlashcardProgress) => void;
}

const emptyProgress = (): FlashcardProgress => ({
  known: [],
  learning: [],
  order: [],
  knownOrder: [],
});

export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      progress: {},
      getSetProgress: (setId) => get().progress[setId] || emptyProgress(),
      saveSetProgress: (setId, data) =>
        set((s) => ({ progress: { ...s.progress, [setId]: data } })),
    }),
    { name: "kq-flashcards-progress" },
  ),
);

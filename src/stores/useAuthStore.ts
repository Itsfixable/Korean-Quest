"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FakeUser } from "@/lib/types";

function getInitials(name: string) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "KQ";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "KQ";
}

interface AuthStore {
  user: FakeUser | null;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (name: string, email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      authModalOpen: false,
      openAuthModal: () => set({ authModalOpen: true }),
      closeAuthModal: () => set({ authModalOpen: false }),
      login: (name, email, password) => {
        const trimmed = String(name || "").trim();
        if (!trimmed) return;
        set({
          user: {
            name: trimmed,
            email: String(email || "").trim(),
            password: String(password || "").trim(),
            loggedIn: true,
            avatarInitials: getInitials(trimmed),
          },
          authModalOpen: false,
        });
      },
      logout: () => set({ user: null }),
    }),
    { name: "kq_fake_user" },
  ),
);

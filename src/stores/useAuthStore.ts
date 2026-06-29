"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import type { FakeUser } from "@/lib/types";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

function getInitials(name: string) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "KQ";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "KQ";
}

function mapSupabaseUser(user: User): FakeUser {
  const meta = user.user_metadata ?? {};
  const name =
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (user.email ? user.email.split("@")[0] : "Learner");
  return {
    name,
    email: user.email ?? "",
    loggedIn: true,
    avatarInitials: getInitials(name),
    avatarImage: (meta.avatar_url as string) || undefined,
  };
}

interface AuthResult {
  ok: boolean;
  error?: string;
  needsConfirmation?: boolean;
}

interface AuthStore {
  user: FakeUser | null;
  userId: string | null;
  authModalOpen: boolean;
  authLoading: boolean;
  authError: string | null;
  initialized: boolean;
  init: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  clearError: () => void;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  /** Legacy local-only login used when Supabase isn't configured. */
  login: (name: string, email: string, password: string) => void;
  logout: () => Promise<void>;
}

let authSubscribed = false;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      authModalOpen: false,
      authLoading: false,
      authError: null,
      initialized: false,

      init: () => {
        const supabase = getSupabase();
        if (!supabase || authSubscribed) {
          set({ initialized: true });
          return;
        }
        authSubscribed = true;

        supabase.auth.getSession().then(({ data }) => {
          const sessionUser = data.session?.user ?? null;
          set({
            user: sessionUser ? mapSupabaseUser(sessionUser) : null,
            userId: sessionUser?.id ?? null,
            initialized: true,
          });
        });

        supabase.auth.onAuthStateChange((_event, session) => {
          const sessionUser = session?.user ?? null;
          set({
            user: sessionUser ? mapSupabaseUser(sessionUser) : null,
            userId: sessionUser?.id ?? null,
          });
        });
      },

      openAuthModal: () => set({ authModalOpen: true, authError: null }),
      closeAuthModal: () => set({ authModalOpen: false, authError: null }),
      clearError: () => set({ authError: null }),

      signUp: async (name, email, password) => {
        const supabase = getSupabase();
        if (!supabase) {
          get().login(name, email, password);
          return { ok: true };
        }
        set({ authLoading: true, authError: null });
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) {
          set({ authLoading: false, authError: error.message });
          return { ok: false, error: error.message };
        }
        const needsConfirmation = !data.session;
        set({ authLoading: false, authModalOpen: needsConfirmation ? true : false });
        return { ok: true, needsConfirmation };
      },

      signIn: async (email, password) => {
        const supabase = getSupabase();
        if (!supabase) {
          get().login(email.split("@")[0], email, password);
          return { ok: true };
        }
        set({ authLoading: true, authError: null });
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          set({ authLoading: false, authError: error.message });
          return { ok: false, error: error.message };
        }
        set({ authLoading: false, authModalOpen: false });
        return { ok: true };
      },

      signInWithGoogle: async () => {
        const supabase = getSupabase();
        if (!supabase) return { ok: false, error: "Supabase is not configured." };
        // Always redirect back to a clean base URL (origin + basePath) so any
        // leftover OAuth params (?error=…#access_token=…) from a previous attempt
        // are never carried into the new flow — that mismatch causes the
        // "bad_oauth_state / OAuth state not found or expired" error.
        let redirectTo: string | undefined;
        if (typeof window !== "undefined") {
          const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
          redirectTo = `${window.location.origin}${basePath}/`;
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) {
          set({ authError: error.message });
          return { ok: false, error: error.message };
        }
        return { ok: true };
      },

      login: (name, email, password) => {
        const trimmed = String(name || "").trim();
        if (!trimmed) return;
        void password;
        set({
          user: {
            name: trimmed,
            email: String(email || "").trim(),
            loggedIn: true,
            avatarInitials: getInitials(trimmed),
          },
          userId: `local:${String(email || trimmed).trim()}`,
          authModalOpen: false,
        });
      },

      logout: async () => {
        // Clear local auth state first so the UI reflects the sign-out
        // instantly, instead of waiting on the Supabase network round-trip.
        set({ user: null, userId: null });
        const supabase = getSupabase();
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {
            /* The local session is already cleared; ignore network errors. */
          }
        }
      },
    }),
    {
      name: "kq_auth",
      // Only persist the legacy local user. Supabase manages its own session;
      // re-persisting it would fight with the SDK on reload.
      partialize: (state) => (isSupabaseConfigured ? {} : { user: state.user, userId: state.userId }),
    },
  ),
);

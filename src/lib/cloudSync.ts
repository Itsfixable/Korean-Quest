"use client";

import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchProfile, saveProfile } from "@/lib/cloud";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import type { Player, Progress } from "@/lib/types";

let started = false;
let activeUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastSerialized = "";

function isCloudUser(id: string | null): id is string {
  return Boolean(id) && !String(id).startsWith("local:");
}

function mergePlayer(base: Player, incoming: Partial<Player>): Player {
  return {
    ...base,
    ...incoming,
    equipped: { ...base.equipped, ...(incoming.equipped ?? {}) },
    badges: Array.isArray(incoming.badges) ? incoming.badges : base.badges,
    inventory: Array.isArray(incoming.inventory) ? incoming.inventory : base.inventory,
  };
}

function mergeProgress(base: Progress, incoming: Partial<Progress>): Progress {
  return {
    ...base,
    ...incoming,
    completedLessonIds: Array.isArray(incoming.completedLessonIds) ? incoming.completedLessonIds : base.completedLessonIds,
    recentWork: Array.isArray(incoming.recentWork) ? incoming.recentWork : base.recentWork,
    jamoStars: incoming.jamoStars && typeof incoming.jamoStars === "object" ? incoming.jamoStars : base.jamoStars,
  };
}

function schedulePush() {
  if (!isCloudUser(activeUserId)) return;
  const { player, progress } = useGameStore.getState();
  const serialized = JSON.stringify({ player, progress });
  if (serialized === lastSerialized) return;
  lastSerialized = serialized;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const id = activeUserId;
    if (!isCloudUser(id)) return;
    void saveProfile(id, { player, progress });
  }, 1200);
}

async function reconcileOnLogin(userId: string) {
  const game = useGameStore.getState();
  const cloud = await fetchProfile(userId);

  if (cloud && Object.keys(cloud.player ?? {}).length > 0) {
    // Returning user: cloud state wins.
    useGameStore.setState({
      player: mergePlayer(game.player, cloud.player),
      progress: mergeProgress(game.progress, cloud.progress),
    });
    useGameStore.getState().setHydrated();
  } else {
    // New account (empty row): seed it with whatever is in this browser.
    const seeded = useGameStore.getState();
    await saveProfile(userId, { player: seeded.player, progress: seeded.progress });
  }
  lastSerialized = JSON.stringify({
    player: useGameStore.getState().player,
    progress: useGameStore.getState().progress,
  });
}

/**
 * Wires the game store to Supabase: pulls profile on login, pushes changes
 * (debounced) while signed in. Safe no-op when Supabase isn't configured.
 * Returns an unsubscribe function.
 */
export function startCloudSync(): () => void {
  if (!isSupabaseConfigured || started) return () => {};
  started = true;

  const handleUser = (userId: string | null) => {
    if (userId === activeUserId) return;
    activeUserId = userId;
    if (isCloudUser(userId)) {
      void reconcileOnLogin(userId);
    }
  };

  // React to login/logout.
  const unsubAuth = useAuthStore.subscribe((state) => handleUser(state.userId));
  handleUser(useAuthStore.getState().userId);

  // React to game progress changes.
  const unsubGame = useGameStore.subscribe(() => schedulePush());

  return () => {
    unsubAuth();
    unsubGame();
    if (pushTimer) clearTimeout(pushTimer);
    started = false;
  };
}

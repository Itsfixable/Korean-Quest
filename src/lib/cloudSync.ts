"use client";

import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchProfile, saveProfile } from "@/lib/cloud";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import { useFlashcardStore } from "@/stores/useFlashcardStore";
import type { Player, Progress } from "@/lib/types";

// Tracks which account the locally-persisted game state belongs to, so we can
// wipe it when a different account signs in (otherwise the previous account's
// data, cached in localStorage, bleeds into — and gets uploaded to — the new
// account).
const OWNER_KEY = "kq-state-owner";

let started = false;
let activeUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let lastSerialized = "";

function isCloudUser(id: string | null): id is string {
  return Boolean(id) && !String(id).startsWith("local:");
}

function getStateOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

function setStateOwner(id: string | null): void {
  try {
    if (id) localStorage.setItem(OWNER_KEY, id);
    else localStorage.removeItem(OWNER_KEY);
  } catch {
    /* localStorage unavailable (private mode / SSR) — nothing to persist. */
  }
}

// Adventure map progress is persisted on its own localStorage key (see
// AdventureView's STORE_KEY) rather than in a synced store, so it must be
// cleared explicitly. Keep this string in sync with AdventureView.
const ADVENTURE_STORE_KEY = "kq_node_adv_progress_v1";

/** Wipe all locally-persisted learner data back to a clean slate. */
function resetLocalData(): void {
  useGameStore.getState().resetAll();
  useFlashcardStore.setState({ progress: {} });
  try {
    localStorage.removeItem(ADVENTURE_STORE_KEY);
  } catch {
    /* localStorage unavailable (private mode / SSR) — nothing to clear. */
  }
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
  const owner = getStateOwner();
  // The local state belongs to a different cloud account — clear it before
  // loading this account so nothing carries over between accounts.
  if (owner && isCloudUser(owner) && owner !== userId) {
    resetLocalData();
  }

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
    // Empty cloud row. Only carry the browser's progress into it when the data
    // belonged to a guest (no prior cloud owner) — i.e. a first-time signup
    // keeps the warm-up progress they made before creating an account. A switch
    // from another account was already reset above, so this seeds a clean row.
    const seeded = useGameStore.getState();
    await saveProfile(userId, { player: seeded.player, progress: seeded.progress });
  }

  setStateOwner(userId);
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
    } else {
      // Signed out (or a legacy local user). If the cached state belongs to a
      // cloud account, wipe it so the signed-out view doesn't keep showing —
      // and a later account doesn't inherit — that account's data.
      const owner = getStateOwner();
      if (owner && isCloudUser(owner)) {
        resetLocalData();
        setStateOwner(null);
        lastSerialized = JSON.stringify({
          player: useGameStore.getState().player,
          progress: useGameStore.getState().progress,
        });
      }
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

"use client";

import { getSupabase } from "@/lib/supabase";
import type { Player, Progress } from "@/lib/types";

export interface CloudProfile {
  id: string;
  email: string | null;
  displayName: string;
  avatarImage: string | null;
  player: Partial<Player>;
  progress: Partial<Progress>;
  updatedAt: string | null;
}

export interface LeaderboardRow {
  id: string;
  displayName: string;
  avatarImage: string | null;
  xp: number;
  level: number;
  streak: number;
}

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_image: string | null;
  player: Partial<Player> | null;
  progress: Partial<Progress> | null;
  updated_at: string | null;
}

function rowToProfile(row: ProfileRow): CloudProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || "Learner",
    avatarImage: row.avatar_image,
    player: row.player ?? {},
    progress: row.progress ?? {},
    updatedAt: row.updated_at,
  };
}

/** Load a single profile (the signed-in user's game state). */
export async function fetchProfile(id: string): Promise<CloudProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_image, player, progress, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[cloud] fetchProfile failed:", error.message);
    return null;
  }
  return data ? rowToProfile(data as ProfileRow) : null;
}

export interface ProfilePatch {
  displayName?: string;
  avatarImage?: string | null;
  player?: Partial<Player>;
  progress?: Partial<Progress>;
}

/** Persist the player's game state. Upserts so it works even if the row is missing. */
export async function saveProfile(id: string, patch: ProfilePatch): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const row: Record<string, unknown> = { id };
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.avatarImage !== undefined) row.avatar_image = patch.avatarImage;
  if (patch.player !== undefined) row.player = patch.player;
  if (patch.progress !== undefined) row.progress = patch.progress;

  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[cloud] saveProfile failed:", error.message);
    return false;
  }
  return true;
}

/** Public leaderboard, sorted by XP descending (sorted client-side for numeric order). */
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_image, player")
    .limit(500);
  if (error) {
    console.error("[cloud] fetchLeaderboard failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<Pick<ProfileRow, "id" | "display_name" | "avatar_image" | "player">>;
  return rows
    .map((row) => {
      const player = row.player ?? {};
      return {
        id: row.id,
        displayName: row.display_name || "Learner",
        avatarImage: row.avatar_image,
        xp: Number(player.xp) || 0,
        level: Number(player.level) || 1,
        streak: Number(player.streak) || 0,
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

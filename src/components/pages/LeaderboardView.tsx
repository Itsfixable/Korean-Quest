"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchLeaderboard, type LeaderboardRow as CloudLeaderboardRow } from "@/lib/cloud";
import { ShopImage, useEquippedProfileVisuals } from "@/components/shared/ProfileAvatar";
import { SHOP_ASSETS, HEAD_IMAGE_CONSTRAINTS, imageSettingsToStyle } from "@/lib/shop-visuals";
import "@/styles/pages/leaderboard.css";

type DisplayMode = "picture" | "initials";
const DISPLAY_MODE_KEY = "kq_lb_avatar_mode";

// Stable hash so each made-up / cloud member always gets the same avatar.
function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

interface LeaderboardRow {
  rank: number;
  name: string;
  badge: string;
  title: string;
  xp: number;
  streak: number;
  isUser: boolean;
  rankTheme: "gold" | "silver" | "bronze" | "user" | "";
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function getInitials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export default function LeaderboardView() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const player = useGameStore((s) => s.player);
  const displayTitle = useGameStore((s) => s.getCurrentDisplayTitle());
  const displayEmoji = useGameStore((s) => s.getCurrentDisplayEmoji());
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.userId);
  const displayName = user?.loggedIn ? user.name : "You";
  const userVisuals = useEquippedProfileVisuals();

  const [cloudRows, setCloudRows] = useState<CloudLeaderboardRow[] | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("picture");

  useEffect(() => {
    const saved = localStorage.getItem(DISPLAY_MODE_KEY);
    if (saved === "initials" || saved === "picture") setDisplayMode(saved);
  }, []);

  const chooseMode = (mode: DisplayMode) => {
    setDisplayMode(mode);
    try {
      localStorage.setItem(DISPLAY_MODE_KEY, mode);
    } catch {
      /* ignore storage errors */
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    fetchLeaderboard(50).then((rows) => {
      if (alive) setCloudRows(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo<LeaderboardRow[]>(() => {
    const useCloud = Boolean(cloudRows && cloudRows.length > 0);

    type RawRow = { name: string; xp: number; title: string; badge: string; streak: number; isUser: boolean };

    // Always seed the board with the made-up members so it stays populated even
    // when there are few (or no) real signed-in players in the cloud.
    const seeded: RawRow[] = leaderboard.map((row) => ({ ...row, isUser: false }));

    // When the cloud is available, fold in real players (minus the signed-in
    // user, who is added explicitly below) alongside the made-up members.
    const cloudOthers: RawRow[] = useCloud
      ? (cloudRows ?? [])
          .filter((row) => !(userId && row.id === userId))
          .map((row): RawRow => ({
            name: row.displayName,
            xp: row.xp,
            title: `Level ${row.level}`,
            badge: getInitials(row.displayName),
            streak: row.streak,
            isUser: false,
          }))
      : [];

    const combined: RawRow[] = [
      ...seeded,
      ...cloudOthers,
      {
        name: displayName,
        xp: player.totalXPEarned,
        title: displayTitle,
        badge: displayEmoji,
        streak: player.streak,
        isUser: true,
      },
    ].sort((a, b) => b.xp - a.xp);

    return combined.map((row, index) => {
      const isUser = row.isUser;
      let rankTheme: LeaderboardRow["rankTheme"] = "";
      if (index === 0) rankTheme = "gold";
      else if (index === 1) rankTheme = "silver";
      else if (index === 2) rankTheme = "bronze";
      else if (isUser) rankTheme = "user";

      return {
        rank: index + 1,
        name: row.name,
        badge: row.badge,
        title: row.title,
        xp: row.xp,
        streak: Number(row.streak) || 0,
        isUser,
        rankTheme,
      };
    });
  }, [cloudRows, userId, leaderboard, displayName, displayTitle, displayEmoji, player.totalXPEarned, player.streak]);

  // Resolve a profile picture for a row: the signed-in user gets their equipped
  // avatar; everyone else gets a deterministic head shot keyed off their name.
  const avatarFor = (row: LeaderboardRow): { src: string; fallback: string; style: React.CSSProperties } | null => {
    if (row.isUser) {
      const av = userVisuals.avatar;
      const src = av?.headImage || av?.rawImage || av?.image;
      if (!src) return null;
      return {
        src,
        fallback: av?.rawImage || av?.image || src,
        style: imageSettingsToStyle(av?.headSettings ?? null),
      };
    }
    const heads = SHOP_ASSETS.headAvatars;
    if (!heads.length) return null;
    const hash = hashName(row.name);
    // Make some members fall back to initials (like real users who never set a
    // profile picture) so the board feels more authentic. ~40% show initials.
    if (hash % 5 < 2) return null;
    const i = hash % heads.length;
    return {
      src: heads[i],
      fallback: heads[i],
      style: imageSettingsToStyle(HEAD_IMAGE_CONSTRAINTS[i] ?? null),
    };
  };

  const showPictures = displayMode === "picture";

  const topThree = data.slice(0, 3);
  const rest = data.slice(3);
  const you = data.find((row) => row.isUser);

  // Podium visual order: 2nd, 1st, 3rd so the champion sits center + elevated.
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <section className="card lb-page-card">
      <div className="lb-header">
        <div className="lb-header-copy">
          <span className="lb-eyebrow">Weekly standings</span>
          <h1>Leaderboard</h1>
          <p className="muted">
            XP standings update as you complete lessons, win battles, and keep your streak alive.
          </p>
        </div>
        <div className="lb-header-side">
          <div className="lb-display-toggle" role="group" aria-label="Avatar display style">
            <button
              type="button"
              className={showPictures ? "is-active" : ""}
              aria-pressed={showPictures}
              onClick={() => chooseMode("picture")}
            >
              Pictures
            </button>
            <button
              type="button"
              className={!showPictures ? "is-active" : ""}
              aria-pressed={!showPictures}
              onClick={() => chooseMode("initials")}
            >
              Initials
            </button>
          </div>
          {you ? (
            <div className="lb-you-chip" aria-label="Your current rank">
              <span className="lb-you-chip__rank">#{you.rank}</span>
              <span className="lb-you-chip__copy">
                <span className="lb-you-chip__label">Your rank</span>
                <span className="lb-you-chip__xp">{you.xp.toLocaleString()} XP</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {podiumOrder.length === 3 ? (
        <div className="lb-podium">
          {podiumOrder.map((row) => (
            <article
              key={row.name + row.rank}
              className={`lb-podium-card lb-podium--${row.rank} ${row.isUser ? "is-you" : ""}`}
            >
              <span className="lb-podium-medal">{MEDALS[row.rank]}</span>
              <div className="lb-podium-avatar">
                {(() => {
                  const av = showPictures ? avatarFor(row) : null;
                  return av ? (
                    <span className="lb-avatar-img-wrap">
                      <ShopImage src={av.src} fallbackSrc={av.fallback} alt="" className="lb-avatar-img" style={av.style} />
                    </span>
                  ) : (
                    <span className="lb-podium-emoji">{getInitials(row.name)}</span>
                  );
                })()}
                <span className="lb-podium-rank">{row.rank}</span>
              </div>
              <h3 className="lb-podium-name">
                {row.name}
                {row.isUser ? <span className="lb-you-tag">You</span> : null}
              </h3>
              <span className="lb-podium-title">{row.title}</span>
              <div className="lb-podium-xp">
                <strong>{row.xp.toLocaleString()}</strong>
                <span>XP</span>
              </div>
              <span className="lb-podium-streak">🔥 {row.streak} day streak</span>
            </article>
          ))}
        </div>
      ) : null}

      {rest.length ? (
        <ol className="lb-list kq-stagger" aria-label="Leaderboard standings">
          {rest.map((row) => (
            <li
              key={row.name + row.rank}
              className={`lb-row ${row.isUser ? "is-you" : ""}`}
            >
              <span className="lb-row-rank">{row.rank}</span>
              {(() => {
                const av = showPictures ? avatarFor(row) : null;
                return av ? (
                  <span className="lb-row-avatar has-img" aria-hidden="true">
                    <ShopImage src={av.src} fallbackSrc={av.fallback} alt="" className="lb-avatar-img" style={av.style} />
                  </span>
                ) : (
                  <span className="lb-row-avatar" aria-hidden="true">
                    {getInitials(row.name)}
                  </span>
                );
              })()}
              <div className="lb-row-meta">
                <span className="lb-row-name">
                  {row.name}
                  {row.isUser ? <span className="lb-you-tag">You</span> : null}
                </span>
                <span className="lb-row-title">{row.title}</span>
              </div>
              <span className="lb-row-streak">🔥 {row.streak}</span>
              <span className="lb-row-xp">
                {row.xp.toLocaleString()}
                <small>XP</small>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchLeaderboard, type LeaderboardRow as CloudLeaderboardRow } from "@/lib/cloud";
import { ShopImage, useEquippedProfileVisuals } from "@/components/shared/ProfileAvatar";
import { SHOP_ASSETS, HEAD_IMAGE_CONSTRAINTS, imageSettingsToStyle, initialsBackgroundStyle, initialsBgClass } from "@/lib/shop-visuals";
import { KQ_SHOP_CATALOG } from "@/lib/constants/shop-catalog";
import "@/styles/pages/leaderboard.css";

// The initials background colors / animated gradients from the shop, reused to
// give made-up leaderboard members varied (and occasionally legendary) initials.
const INITIALS_BG_VALUES = KQ_SHOP_CATALOG.filter(
  (item) => item.category === "initials" && item.color,
).map((item) => item.color as string);

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
  const displayEmoji = useGameStore((s) => s.getCurrentDisplayEmoji());
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.userId);
  const displayName = user?.loggedIn ? user.name : "You";
  const userVisuals = useEquippedProfileVisuals();
  const profileUsesInitials = useGameStore((s) => s.player.profileUsesInitials);
  const initialsBgColor = useGameStore((s) => s.getInitialsBgColor());

  const [cloudRows, setCloudRows] = useState<CloudLeaderboardRow[] | null>(null);

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

    type RawRow = { name: string; xp: number; badge: string; streak: number; isUser: boolean };

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
        xp: row.xp,
        streak: Number(row.streak) || 0,
        isUser,
        rankTheme,
      };
    });
  }, [cloudRows, userId, leaderboard, displayName, displayEmoji, player.totalXPEarned, player.streak]);

  // Resolve a profile picture for a row: the signed-in user gets their equipped
  // avatar; everyone else gets a deterministic head shot keyed off their name.
  const avatarFor = (row: LeaderboardRow): { src: string; fallback: string; style: React.CSSProperties } | null => {
    if (row.isUser) {
      if (profileUsesInitials) return null;
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

  // Initials background for a row: the signed-in user gets their equipped color
  // (if any); made-up / cloud members get a deterministic color or animated
  // gradient from the shop palette so the board shows the new colors off.
  const initialsBgFor = (row: LeaderboardRow): string | null => {
    if (row.isUser) return initialsBgColor;
    if (!INITIALS_BG_VALUES.length) return null;
    return INITIALS_BG_VALUES[hashName(`${row.name}#bg`) % INITIALS_BG_VALUES.length];
  };

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
            XP standings update as you take quizzes, win battles, and keep your streak alive.
          </p>
        </div>
        <div className="lb-header-side">
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
                  const av = avatarFor(row);
                  return av ? (
                    <span className="lb-avatar-img-wrap">
                      <ShopImage src={av.src} fallbackSrc={av.fallback} alt="" className="lb-avatar-img" style={av.style} />
                    </span>
                  ) : (
                    (() => {
                      const bg = initialsBgFor(row);
                      return (
                        <span
                          className={`lb-podium-emoji ${initialsBgClass(bg)}`}
                          style={bg ? initialsBackgroundStyle(bg) : undefined}
                        >
                          {getInitials(row.name)}
                        </span>
                      );
                    })()
                  );
                })()}
                <span className="lb-podium-rank">{row.rank}</span>
              </div>
              <h3 className="lb-podium-name">
                {row.name}
                {row.isUser ? <span className="lb-you-tag">You</span> : null}
              </h3>
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
                const av = avatarFor(row);
                return av ? (
                  <span className="lb-row-avatar has-img" aria-hidden="true">
                    <ShopImage src={av.src} fallbackSrc={av.fallback} alt="" className="lb-avatar-img" style={av.style} />
                  </span>
                ) : (
                  (() => {
                    const bg = initialsBgFor(row);
                    return (
                      <span
                        className={`lb-row-avatar ${initialsBgClass(bg)}`}
                        aria-hidden="true"
                        style={bg ? initialsBackgroundStyle(bg) : undefined}
                      >
                        {getInitials(row.name)}
                      </span>
                    );
                  })()
                );
              })()}
              <div className="lb-row-meta">
                <span className="lb-row-name">
                  {row.name}
                  {row.isUser ? <span className="lb-you-tag">You</span> : null}
                </span>
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

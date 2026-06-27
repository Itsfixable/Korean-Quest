"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ProfileStack, useEquippedProfileVisuals } from "@/components/shared/ProfileAvatar";
import ProgressReport from "@/components/pages/ProgressReport";
import { asset } from "@/lib/asset";
import "@/styles/pages/dashboard.css";
import "@/styles/pages/dashboard-enhancements.css";

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

// Map a framed shop avatar (…/avatars/avatarN.png) to its raw full-body
// cutout (…/avatars/raw/rawAvatarN.png) for the dashboard scene.
function rawAvatarSrc(image?: string) {
  if (!image) return "";
  return image.replace("/avatars/avatar", "/avatars/raw/rawAvatar");
}

// Map a framed shop pet (…/pets/bunny.png) to its no-background cutout
// (…/pets/raw/bunnyRaw.png) so it sits cleanly in the dashboard scene.
function rawPetSrc(image?: string) {
  if (!image) return "";
  return image.replace(/\/pets\/([^/]+)\.png$/i, "/pets/raw/$1Raw.png");
}

export default function DashboardView() {
  const player = useGameStore((s) => s.player);
  const quests = useGameStore((s) => s.quests);
  const progress = useGameStore((s) => s.progress);
  const needXP = useGameStore((s) => s.needXP);
  const getAchievements = useGameStore((s) => s.getAchievements);
  const getEquippedProfile = useGameStore((s) => s.getEquippedProfile);
  const ensureDaily = useGameStore((s) => s.ensureDaily);
  const claimQuest = useGameStore((s) => s.claimQuest);
  const profileVisuals = useEquippedProfileVisuals();
  const authUser = useAuthStore((s) => s.user);
  const profileUsesInitials = useGameStore((s) => s.player.profileUsesInitials);
  const initialsBgColor = useGameStore((s) => s.getInitialsBgColor());
  const profileInitials =
    authUser?.avatarInitials ||
    (authUser?.name
      ? authUser.name
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "KQ");

  const [xpPct, setXpPct] = useState(0);

  const achievements = getAchievements();
  const profile = getEquippedProfile();
  const profileName = authUser?.name || "Your Profile";
  const nextXp = needXP(player.level);

  const avatarRawSrc = rawAvatarSrc(profile.avatar?.image);
  // Only show a companion when a pet is actually equipped (profile.pet truthy);
  // profileVisuals.pet resolves the matching artwork.
  const petRawSrc = profile.pet ? rawPetSrc(profileVisuals.pet?.image) : "";

  useEffect(() => {
    ensureDaily();
  }, [ensureDaily]);

  useEffect(() => {
    const pct = clamp(Math.round((player.xp / nextXp) * 100), 0, 100);
    setXpPct(0);
    const t = window.setTimeout(() => setXpPct(pct), 50);
    return () => window.clearTimeout(t);
  }, [player.xp, nextXp]);

  const recentWork = (progress.recentWork || []).filter((item) => item.type !== "Shop");
  const dailyQuests = quests.daily || [];

  return (
    <>
      <section className="card dashboard-card student-dashboard-card kq-dashboard-hero">
        <div className="kq-dashboard-hero-scene" aria-hidden="true">
          {profile.background?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset(profile.background.image)} alt="" className="kq-dashboard-hero-bg" />
          ) : (
            <div className="kq-dashboard-hero-bg kq-dashboard-hero-bg--emoji">
              {profile.background?.emoji || "🏯"}
            </div>
          )}
          {profileUsesInitials ? null : avatarRawSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset(avatarRawSrc)}
              alt=""
              className="kq-hero-avatar-img"
              onError={(e) => {
                const img = e.currentTarget;
                const fallback = asset(profile.avatar?.image);
                if (fallback && img.src !== fallback) {
                  img.src = fallback;
                }
              }}
            />
          ) : (
            <span className="kq-hero-avatar-emoji">{profile.avatar?.emoji || "👑"}</span>
          )}
          {petRawSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset(petRawSrc)}
              alt=""
              className="kq-hero-pet-img"
              onError={(e) => {
                const img = e.currentTarget;
                const fallback = asset(profileVisuals.pet?.image || "");
                if (fallback && img.src !== fallback) {
                  img.src = fallback;
                }
              }}
            />
          ) : null}
        </div>
        <div className="kq-dashboard-hero-veil" aria-hidden="true" />

        <div className="kq-dashboard-hero-content">
          <div className="student-dashboard-header">
            <span className="student-dashboard-icon" aria-hidden="true">
              🎯
            </span>
            <h1>Student Dashboard</h1>
          </div>

          <div className="dashboard-stats kq-stagger">
            <div className="stat-box">
              <span className="stat-label">Level</span>
              <strong className="stat-value">{player.level}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">XP</span>
              <strong className="stat-value">
                {player.xp} / {nextXp}
              </strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">Streak</span>
              <strong className="stat-value">
                {player.streak} day{player.streak === 1 ? "" : "s"}
              </strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">Coins</span>
              <strong className="stat-value">{player.coins}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">Badges</span>
              <strong id="dBadges" className="stat-value">
                {achievements.length === 0
                  ? "—"
                  : achievements.slice(0, 3).map((badge) => (
                      <span
                        key={badge.name}
                        className="kq-badge-tip"
                        tabIndex={0}
                        aria-label={`${badge.name}: ${badge.desc}`}
                      >
                        <span className="kq-inline-badge" aria-hidden="true">
                          {badge.icon}
                        </span>
                        <span className="kq-badge-tip__bubble" role="tooltip" aria-hidden="true">
                          <span className="kq-badge-tip__name">{badge.name}</span>
                          <span className="kq-badge-tip__desc">{badge.desc}</span>
                        </span>
                      </span>
                    ))}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <div className="xp-progress" aria-label="XP progress">
        <div className="xp-progress__track">
          <div
            id="dBar"
            className="xp-progress__fill"
            style={{ width: `${xpPct}%` }}
            aria-valuenow={xpPct}
          />
        </div>
      </div>

      <section id="kqProfileCard" className="dashboard-card kq-profile-card">
        <div className="section-head">
          <span className="section-icon" aria-hidden="true">
            🛍️
          </span>
          <h2>Quest Profile</h2>
        </div>
        <div id="kqProfileBody">
          <div className="kq-profile-main">
            <div className="kq-profile-top">
              <div className="kq-profile-head">
                <div className="kq-profile-avatar-wrap">
                  <ProfileStack
                    avatar={profileVisuals.avatar}
                    frame={profileVisuals.frame}
                    background={profileVisuals.background}
                    initials={profileUsesInitials ? profileInitials : null}
                    initialsBg={initialsBgColor}
                  />
                </div>
                <div>
                  <h3 className="kq-profile-title">{profileName}</h3>
                  <p className="kq-profile-sub">
                    {player.coins} coins · Level {player.level}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="kq-profile-actions">
            <Link className="kq-profile-shop-link" href="/shop">
              Open Shop
            </Link>
          </div>
        </div>
      </section>

      <ProgressReport />

      <section className="dashboard-columns">
        <section className="card recent-card">
          <div className="section-head">
            <span className="section-icon" aria-hidden="true">
              📝
            </span>
            <h2>Recent Work</h2>
          </div>
          <ul id="recentWorkList" className="recent-list kq-stagger">
            {recentWork.length === 0 ? (
              <li className="kq-empty">
                <span className="kq-empty-title">Nothing here yet</span>
                <span className="kq-empty-hint">
                  Complete a flashcard session or quiz and your activity will show up
                  here.
                </span>
                <Link className="btn kq-empty-cta" href="/resources">
                  Start studying
                </Link>
              </li>
            ) : (
              recentWork.map((item) => (
                <li key={`${item.ts}-${item.title}`}>
                  <span className="kq-recent-pill">{item.type}</span>
                  {new Date(item.ts).toLocaleString()} — {item.title}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="card quests-card">
          <div className="section-head">
            <span className="section-icon" aria-hidden="true">
              🔥
            </span>
            <h2>Daily Quests</h2>
          </div>
          <ul id="dailyQuestList" className="quest-list kq-stagger">
            {dailyQuests.length === 0 ? (
              <li className="kq-empty">
                <span className="kq-empty-title">No quests yet</span>
                <span className="kq-empty-hint">
                  Today&apos;s quests will appear here — check back soon.
                </span>
              </li>
            ) : (
              dailyQuests.map((q) => {
                const prog = Math.min(q.progress, q.target);
                const pct = clamp(Math.round((prog / q.target) * 100), 0, 100);
                const ready = !q.done && prog >= q.target;
                return (
                  <li key={q.id} className={`kq-quest-item ${ready ? "is-ready" : ""}`}>
                    <div className="kq-quest-top">
                      <span>
                        {q.done ? "✅" : ready ? "🎁" : "⬜"} {q.desc}
                      </span>
                      {ready ? (
                        <button
                          type="button"
                          className="kq-quest-claim"
                          onClick={() => claimQuest(q.id)}
                        >
                          Claim
                        </button>
                      ) : (
                        <span className="kq-quest-status">
                          {q.done ? "Claimed" : `${prog}/${q.target}`}
                        </span>
                      )}
                    </div>
                    <div className="kq-quest-mini-bar" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </section>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useGameStore } from "@/stores/useGameStore";
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

// Frame artwork is assigned by catalog order in the shop, so we mirror that
// ordering here to render the equipped frame on the profile picture.
const FRAME_IMAGES = [
  "/favicon/shop/frames/cloud-frame.png",
  "/favicon/shop/frames/night-frame.png",
  "/favicon/shop/frames/traditional-frame.png",
  "/favicon/shop/frames/frame4.png",
];

// Zoom into the head of the full-body avatar cutout so the circular profile
// picture frames the face (matching the shop's profile preview).
const PFP_AVATAR_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  objectPosition: "center top",
  transformOrigin: "center top",
  transform: "translate(0px, -16%) scale(2.7)",
};

function computeJourneyPercent(
  completedLessonIds: string[],
  battlesWon: number,
  badgeCount: number,
) {
  const lessonScore = Math.min(completedLessonIds.length / 3, 1) * 45;
  const battleScore = Math.min(battlesWon / 12, 1) * 35;
  const badgeScore = Math.min(badgeCount / 8, 1) * 20;
  return Math.round(lessonScore + battleScore + badgeScore);
}

export default function DashboardView() {
  const player = useGameStore((s) => s.player);
  const quests = useGameStore((s) => s.quests);
  const progress = useGameStore((s) => s.progress);
  const needXP = useGameStore((s) => s.needXP);
  const getAchievements = useGameStore((s) => s.getAchievements);
  const getAdventureProgress = useGameStore((s) => s.getAdventureProgress);
  const getEquippedProfile = useGameStore((s) => s.getEquippedProfile);
  const getCurrentDisplayTitle = useGameStore((s) => s.getCurrentDisplayTitle);
  const getShopCatalog = useGameStore((s) => s.getShopCatalog);
  const ensureDaily = useGameStore((s) => s.ensureDaily);

  const [xpPct, setXpPct] = useState(0);
  const [journeyPct, setJourneyPct] = useState(0);

  const achievements = getAchievements();
  const adventure = getAdventureProgress();
  const profile = getEquippedProfile();
  const displayTitle = getCurrentDisplayTitle();
  const nextXp = needXP(player.level);

  const frameImage = useMemo(() => {
    const frames = getShopCatalog("frames");
    const idx = frames.findIndex((f) => f.id === profile.frame?.id);
    return FRAME_IMAGES[idx >= 0 ? idx : 0] || "";
  }, [getShopCatalog, profile.frame?.id]);

  const avatarRawSrc = rawAvatarSrc(profile.avatar?.image);

  const journeyPercent = useMemo(
    () => computeJourneyPercent(progress.completedLessonIds, progress.battlesWon, achievements.length),
    [progress.completedLessonIds, progress.battlesWon, achievements.length],
  );

  useEffect(() => {
    ensureDaily();
  }, [ensureDaily]);

  useEffect(() => {
    const pct = clamp(Math.round((player.xp / nextXp) * 100), 0, 100);
    setXpPct(0);
    const t = window.setTimeout(() => setXpPct(pct), 50);
    return () => window.clearTimeout(t);
  }, [player.xp, nextXp]);

  useEffect(() => {
    setJourneyPct(0);
    const t = window.setTimeout(() => setJourneyPct(journeyPercent), 50);
    return () => window.clearTimeout(t);
  }, [journeyPercent]);

  const nextUnlockText = adventure.nextLesson
    ? `Complete the next lesson to unlock ${adventure.nextLesson.label}.`
    : "All adventure chapters are unlocked — now clear every boss node.";

  const recentWork = progress.recentWork || [];
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
          {avatarRawSrc ? (
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
                      <span key={badge.name} className="kq-inline-badge" title={badge.name}>
                        {badge.icon}
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
          <div className="kq-profile-top">
            <div className="kq-profile-head">
              <div className="kq-profile-avatar-wrap">
                <div className="kq-dash-pfp">
                  <div className="kq-dash-pfp-clip">
                    {profile.background?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="kq-dash-pfp-bg" src={asset(profile.background.image)} alt="" />
                    ) : null}
                    {avatarRawSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="kq-dash-pfp-avatar"
                        src={asset(avatarRawSrc)}
                        alt={profile.avatar?.name || "Your avatar"}
                        style={PFP_AVATAR_STYLE}
                        onError={(e) => {
                          const img = e.currentTarget;
                          const fallback = asset(profile.avatar?.image);
                          if (fallback && img.src !== fallback) {
                            img.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      <span className="kq-dash-pfp-emoji">{profile.avatar?.emoji || "👑"}</span>
                    )}
                  </div>
                  {frameImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="kq-dash-pfp-frame"
                      src={asset(frameImage)}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
              </div>
              <div>
                <h3 className="kq-profile-title">{displayTitle}</h3>
                <p className="kq-profile-sub">
                  {profile.background?.name || "Hanok Courtyard"} · {player.coins} coins · Level {player.level}
                </p>
              </div>
            </div>
            <div className="kq-profile-actions">
              <Link className="kq-profile-shop-link" href="/shop">
                Open Shop
              </Link>
            </div>
          </div>
          <div className="kq-profile-tags">
            <span className="kq-profile-tag">
              {profile.avatar?.emoji || "👑"} {profile.avatar?.name || "Starter Avatar"}
            </span>
            <span className="kq-profile-tag">
              {profile.frame?.emoji || "☁️"} {profile.frame?.name || "Cloud Frame"}
            </span>
            <span className="kq-profile-tag">
              {profile.background?.emoji || "🏯"} {profile.background?.name || "Hanok Courtyard"}
            </span>
            {profile.pet ? (
              <span className="kq-profile-tag">
                {profile.pet.emoji} {profile.pet.name}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section id="kqLearningJourneyCard" className="dashboard-card kq-learning-card">
        <div className="section-head">
          <span className="section-icon" aria-hidden="true">
            📈
          </span>
          <h2>Learning Journey</h2>
        </div>

        <div className="kq-learning-row">
          <div>
            <div className="kq-learning-meta">
              <span id="kqJourneyLabel">{journeyPercent}% complete</span>
              <span id="kqJourneyUnlock">Adventure unlocked through Level {adventure.cap}</span>
            </div>
            <div className="kq-overall-bar" aria-hidden="true">
              <span id="kqJourneyBar" style={{ width: `${journeyPct}%` }} />
            </div>
            <p id="kqJourneyNote" className="kq-journey-note">
              {nextUnlockText}
            </p>
          </div>

          <div className="kq-stat-grid">
            <div className="kq-mini-stat">
              <strong id="kqLessonsDone">{progress.completedLessonIds.length}</strong>
              <span>Lessons completed</span>
            </div>
            <div className="kq-mini-stat">
              <strong id="kqBattlesWon">{progress.battlesWon}</strong>
              <span>Battles won</span>
            </div>
            <div className="kq-mini-stat">
              <strong id="kqBadgeCount">{achievements.length}</strong>
              <span>Badges earned</span>
            </div>
          </div>
        </div>

        <div>
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="section-icon" aria-hidden="true">
              🏅
            </span>
            <h2 style={{ fontSize: "1.35rem" }}>Achievement Badges</h2>
          </div>
          <div id="kqAchievementGrid" className="kq-achievement-grid kq-stagger">
            {achievements.length === 0 ? (
              <div className="kq-achievement-empty">
                No badges yet — finish a lesson or win a battle to start collecting achievements.
              </div>
            ) : (
              achievements.map((badge) => (
                <article key={badge.name} className="kq-achievement-chip">
                  <div className="kq-achievement-icon" aria-hidden="true">
                    {badge.icon}
                  </div>
                  <div>
                    <h3>{badge.name}</h3>
                    <p>{badge.desc}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

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
                  Complete a lesson or flashcard session and your activity will show up
                  here.
                </span>
                <Link className="btn kq-empty-cta" href="/resources">
                  Start a lesson
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
                return (
                  <li key={q.id} className="kq-quest-item">
                    <div className="kq-quest-top">
                      <span>
                        {q.done ? "✅" : "⬜"} {q.desc}
                      </span>
                      <span className="kq-quest-status">
                        {prog}/{q.target}
                      </span>
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

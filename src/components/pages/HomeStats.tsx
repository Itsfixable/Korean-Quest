"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { asset } from "@/lib/asset";
import CountUp from "@/components/reactbits/CountUp";

export function HomeStats() {
  const ensureDaily = useGameStore((s) => s.ensureDaily);
  const player = useGameStore((s) => s.player);
  const getAchievements = useGameStore((s) => s.getAchievements);

  useEffect(() => {
    ensureDaily();
  }, [ensureDaily]);

  const badges = getAchievements().slice(0, 3);

  return (
    <div className="kq-hero-stats" role="region" aria-label="Key progress">
      <div className="metric">
        <div className="muted">Level</div>
        <div className="kpi-value">
          <CountUp to={player.level} duration={1.4} />
        </div>
      </div>
      <div className="metric">
        <div className="kpi-value streak-value">
          <Image
            src={asset("/favicon/index/streakEmoji.png")}
            alt="Streak fire icon"
            className="streak-icon"
            width={24}
            height={24}
          />
          <CountUp to={player.streak} duration={1.4} />
        </div>
        <div className="muted">Day Streak</div>
      </div>
      <div className="metric">
        <div className="muted">Badges</div>
        <div className="kq-home-badges">
          {badges.length === 0 ? (
            "—"
          ) : (
            badges.map((badge) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Compact read-only view of today's quests for the Home page; claiming
// rewards happens on the Dashboard.
export function HomeQuests() {
  const dailyQuests = useGameStore((s) => s.quests.daily);

  if (dailyQuests.length === 0) return null;

  return (
    <ul className="kq-home-quests">
      {dailyQuests.map((q) => {
        const prog = Math.min(q.progress, q.target);
        const ready = !q.done && prog >= q.target;
        return (
          <li key={q.id}>
            <span>
              {q.done ? "✅" : ready ? "🎁" : "⬜"} {q.desc}
            </span>
            <span className="muted">
              {q.done ? "Claimed" : ready ? "Ready to claim" : `${prog}/${q.target}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

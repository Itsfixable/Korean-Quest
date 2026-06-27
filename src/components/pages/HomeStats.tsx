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

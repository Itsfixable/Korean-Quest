"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { asset } from "@/lib/asset";

export function HomeStats() {
  const ensureDaily = useGameStore((s) => s.ensureDaily);
  const player = useGameStore((s) => s.player);

  useEffect(() => {
    ensureDaily();
  }, [ensureDaily]);

  const badges = player.badges.length
    ? player.badges.slice(0, 3).join(" · ")
    : "—";

  return (
    <div className="kq-hero-stats" role="region" aria-label="Key progress">
      <div className="metric">
        <div className="muted">Level</div>
        <div className="kpi-value">{player.level}</div>
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
          <span>{player.streak}</span>
        </div>
        <div className="muted">Day Streak</div>
      </div>
      <div className="metric">
        <div className="muted">Badges</div>
        <div>{badges}</div>
      </div>
    </div>
  );
}

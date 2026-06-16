"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";

export function RewardToast() {
  const rewardMessage = useGameStore((s) => s.rewardMessage);
  const clearReward = useGameStore((s) => s.clearReward);

  useEffect(() => {
    if (!rewardMessage) return;
    const timer = window.setTimeout(() => clearReward(), 1800);
    return () => window.clearTimeout(timer);
  }, [rewardMessage, clearReward]);

  if (!rewardMessage) return null;

  return (
    <div className="kq-floating-reward" role="status" aria-live="polite">
      {rewardMessage}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { startCloudSync } from "@/lib/cloudSync";
import { AuthModal } from "@/components/layout/AuthModal";
import { AppDialog } from "@/components/layout/AppDialog";
import { Chatbot } from "@/components/layout/Chatbot";
import { RewardToast } from "@/components/layout/RewardToast";
import { MotionProvider } from "@/components/layout/MotionProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const ensureDaily = useGameStore((s) => s.ensureDaily);
  const setHydrated = useGameStore((s) => s.setHydrated);
  const hydrated = useGameStore((s) => s.hydrated);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    setHydrated();
    ensureDaily();
    document.documentElement.setAttribute("data-theme", "light");
    initAuth();
    const stopSync = startCloudSync();

    // Easter egg: type daebak() in the console for a coin jackpot. 대박! 🪙
    const eggWindow = window as unknown as {
      daebak?: (amount?: number) => string;
    };
    eggWindow.daebak = (amount = 1_000_000) => {
      const safe = Math.max(1, Math.floor(Number(amount) || 0));
      useGameStore.getState().addCoins(safe);
      return `대박! 🎉 +${safe.toLocaleString()} coins added. Go treat yourself in the shop.`;
    };
   

    return stopSync;
  }, [ensureDaily, setHydrated, initAuth]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#edf4fa]" aria-hidden="true" />
    );
  }

  return (
    <MotionProvider>
      {children}
      <AuthModal />
      <AppDialog />
      <Chatbot />
      <RewardToast />
    </MotionProvider>
  );
}

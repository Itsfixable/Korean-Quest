"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { startCloudSync } from "@/lib/cloudSync";
import { AuthModal } from "@/components/layout/AuthModal";
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
      <Chatbot />
      <RewardToast />
    </MotionProvider>
  );
}

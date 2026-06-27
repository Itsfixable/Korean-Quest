"use client";

/**
 * Tracks active time spent on study/work pages and feeds it into the daily
 * "Work for 15 minutes" quest. Time only accrues while the tab is visible and
 * the user is on a learning route. Whole minutes are logged as they add up.
 *
 * Mounted once globally (AppProviders) so the running total survives
 * client-side navigation between study pages.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGameStore } from "@/stores/useGameStore";

const STUDY_PATHS = [
  "/resources",
  "/flashcards",
  "/jamo",
  "/jamo-select",
  "/tracing",
  "/adventure",
  "/video",
  "/sources",
  "/test",
];

function isStudyPath(pathname: string | null) {
  if (!pathname) return false;
  return STUDY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const TICK_MS = 5000;
const MINUTE_MS = 60000;
// Guard against large jumps (device sleep, throttled timers) counting as work.
const MAX_DELTA_MS = TICK_MS * 2;

export function useStudyTimeTracker() {
  const pathname = usePathname();
  const logStudyMinutes = useGameStore((s) => s.logStudyMinutes);

  const accumRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const studyRef = useRef(false);

  useEffect(() => {
    const study = isStudyPath(pathname);
    studyRef.current = study;
    // Reset the active-time anchor on every route change so we never count
    // time spent away from study pages.
    lastRef.current = study ? Date.now() : null;
  }, [pathname]);

  useEffect(() => {
    const flush = () => {
      if (accumRef.current < MINUTE_MS) return;
      const minutes = Math.floor(accumRef.current / MINUTE_MS);
      accumRef.current -= minutes * MINUTE_MS;
      logStudyMinutes(minutes);
    };

    const tick = () => {
      const visible = document.visibilityState === "visible";
      if (!studyRef.current || !visible) {
        lastRef.current = null;
        return;
      }
      const now = Date.now();
      if (lastRef.current != null) {
        const delta = Math.min(now - lastRef.current, MAX_DELTA_MS);
        if (delta > 0) accumRef.current += delta;
      }
      lastRef.current = now;
      flush();
    };

    const onVisibility = () => {
      lastRef.current =
        document.visibilityState === "visible" && studyRef.current ? Date.now() : null;
    };

    const id = window.setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [logStudyMinutes]);
}

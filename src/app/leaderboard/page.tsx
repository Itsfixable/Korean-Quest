import type { Metadata } from "next";
import LeaderboardView from "@/components/pages/LeaderboardView";

export const metadata: Metadata = {
  title: "Korean Quest — Leaderboard",
};

export default function LeaderboardPage() {
  return (
    <main className="container grid">
      <LeaderboardView />
    </main>
  );
}

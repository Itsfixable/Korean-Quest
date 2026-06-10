import type { Metadata } from "next";
import FlashcardsView from "@/components/pages/FlashcardsView";

export const metadata: Metadata = {
  title: "Korean Quest — Flashcards",
};

export default function FlashcardsPage() {
  return (
    <main className="container">
      <FlashcardsView />
    </main>
  );
}

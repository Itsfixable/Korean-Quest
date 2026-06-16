import type { Metadata } from "next";
import AdventureView from "@/components/pages/AdventureView";

export const metadata: Metadata = {
  title: "Korean Quest — Adventure",
};

export default function AdventurePage() {
  return (
    <main className="container grid">
      <AdventureView />
    </main>
  );
}

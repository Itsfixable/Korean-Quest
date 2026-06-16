import type { Metadata } from "next";
import TracingView from "@/components/pages/TracingView";

export const metadata: Metadata = {
  title: "Korean Quest — Tracing",
};

export default function TracingPage() {
  return (
    <main className="container grid">
      <TracingView />
    </main>
  );
}

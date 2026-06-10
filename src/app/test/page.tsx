import type { Metadata } from "next";
import TestView from "@/components/pages/TestView";

export const metadata: Metadata = {
  title: "Korean Quest — Test",
};

export default function TestPage() {
  return (
    <main className="container">
      <TestView />
    </main>
  );
}

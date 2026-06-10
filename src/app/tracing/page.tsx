import type { Metadata } from "next";
import TracingView from "@/components/pages/TracingView";

export const metadata: Metadata = {
  title: "Korean Quest — Tracing",
};

export default async function TracingPage({
  searchParams,
}: {
  searchParams: Promise<{ char?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="container grid">
      <TracingView char={params.char} />
    </main>
  );
}

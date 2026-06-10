import type { Metadata } from "next";
import ScheduleView from "@/components/pages/ScheduleView";

export const metadata: Metadata = {
  title: "Korean Quest — Schedule",
};

export default function SchedulePage() {
  return (
    <main className="container grid">
      <ScheduleView />
    </main>
  );
}

import type { Metadata } from "next";
import DashboardView from "@/components/pages/DashboardView";

export const metadata: Metadata = {
  title: "Korean Quest — Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="container dashboard-page">
      <DashboardView />
    </main>
  );
}

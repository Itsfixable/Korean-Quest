import type { Metadata } from "next";
import ResourcesView from "@/components/pages/ResourcesView";

export const metadata: Metadata = {
  title: "Korean Quest — Resources",
};

export default function ResourcesPage() {
  return (
    <main className="container resources-page">
      <ResourcesView />
    </main>
  );
}

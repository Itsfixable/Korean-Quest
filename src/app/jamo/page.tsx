import type { Metadata } from "next";
import JamoView from "@/components/pages/JamoView";

export const metadata: Metadata = {
  title: "Korean Quest — Syllable Builder",
};

export default function JamoPage() {
  return (
    <main className="container grid">
      <JamoView />
    </main>
  );
}

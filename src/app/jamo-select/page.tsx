import type { Metadata } from "next";
import JamoSelectView from "@/components/pages/JamoSelectView";

export const metadata: Metadata = {
  title: "Korean Quest — Jamo Level Select",
};

export default function JamoSelectPage() {
  return (
    <main className="container grid">
      <JamoSelectView />
    </main>
  );
}

import type { Metadata } from "next";
import ShopView from "@/components/pages/ShopView";

export const metadata: Metadata = {
  title: "Korean Quest — Shop",
};

export default function ShopPage() {
  return (
    <main className="container grid">
      <ShopView />
    </main>
  );
}

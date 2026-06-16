import type { Metadata } from "next";
import VideoView from "@/components/pages/VideoView";

export const metadata: Metadata = {
  title: "Korean Quest — Video Practice",
};

export default function VideoPage() {
  return (
    <main className="container video-page">
      <VideoView />
    </main>
  );
}

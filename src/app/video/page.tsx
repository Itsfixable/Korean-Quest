import type { Metadata } from "next";
import VideoView from "@/components/pages/VideoView";

export const metadata: Metadata = {
  title: "Korean Quest — Video Practice",
};

export default async function VideoPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="container video-page">
      <VideoView room={params.room} />
    </main>
  );
}

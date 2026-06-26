import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { PageTransition } from "@/components/layout/PageTransition";
import { Sidebar } from "@/components/layout/Sidebar";
import { asset } from "@/lib/asset";
import "./globals.css";

const fontApp = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  variable: "--font-app",
});

export const metadata: Metadata = {
  title: "Korean Quest",
  description: "Learn Korean through interactive lessons, game battles, and daily challenges.",
  icons: {
    icon: asset("/favicon/logoImage.png"),
    shortcut: asset("/favicon/logoImage.png"),
    apple: asset("/favicon/logoImage.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={fontApp.variable}>
      <body className="kq-motion-loading min-h-full antialiased">
        <AppProviders>
          <Sidebar />
          <PageTransition>{children}</PageTransition>
        </AppProviders>
      </body>
    </html>
  );
}

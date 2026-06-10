import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { PageTransition } from "@/components/layout/PageTransition";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Korean Quest",
  description: "Learn Korean through interactive lessons, game battles, and daily challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={nunito.variable}>
      <body className="kq-motion-loading min-h-full antialiased">
        <AppProviders>
          <Sidebar />
          <PageTransition>{children}</PageTransition>
        </AppProviders>
      </body>
    </html>
  );
}

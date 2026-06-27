import type { Metadata } from "next";
import Image from "next/image";
import { asset } from "@/lib/asset";
import "@/styles/pages/sources.css";

export const metadata: Metadata = {
  title: "Korean Quest — Sources",
};

type Source = {
  label: string;
  detail: string;
  meta?: string;
  href?: string | null;
};

type SourceGroup = {
  id: string;
  tag: string;
  title: string;
  intro: string;
  emoji: string;
  accent: string;
  sources: Source[];
};

const GROUPS: SourceGroup[] = [
  {
    id: "learning",
    tag: "Learning content",
    title: "Lessons, videos & references",
    intro:
      "The teaching material that informs Korean Quest. Third-party content is embedded or linked with credit to its creators.",
    emoji: "📚",
    accent: "#6a9f71",
    sources: [
      {
        label: "Billy Go's Beginner Korean Course",
        detail:
          "Video lessons embedded from “Learn Korean with GO! Billy Korean” on YouTube. All video content belongs to its creator and is shown with credit.",
        meta: "YouTube · video",
        href: "https://www.youtube.com/playlist?list=PLbFrQnW0BNMUkAFj4MjYauXBPtO3I9O_k",
      },
      {
        label: "Hangul Stroke Order Guide",
        detail:
          "“Korean Hangul Stroke Order” PDF by Linguajunkie.com, shared as a free learning resource and offered for download on the Learn page.",
        meta: "Linguajunkie.com · PDF",
        href: "https://www.linguajunkie.com",
      },
      {
        label: "Lessons, vocabulary & quizzes",
        detail:
          "All lesson text, vocabulary sets, flashcard decks, and test questions are original content written by the Korean Quest team.",
        meta: "Original · student-written",
        href: null,
      },
    ],
  },
  {
    id: "downloads",
    tag: "Downloadable materials",
    title: "Worksheets & references",
    intro:
      "PDFs offered for download in the Learn page's Downloadables section.",
    emoji: "📄",
    accent: "#e5a93d",
    sources: [
      {
        label: "Korean Words List",
        detail:
          "Student-compiled vocabulary reference covering the words used across Korean Quest lessons.",
        meta: "Original · student-compiled",
        href: "/resources/KoreanWordsList.pdf",
      },
      {
        label: "Hangul Practice Worksheet",
        detail:
          "Printable worksheet for practicing Hangul letters by hand.",
        meta: "Original · printable",
        href: "/resources/Korean_hangul_practice_worksheet.pdf",
      },
      {
        label: "Linguajunkie Stroke Order Guide",
        detail:
          "Stroke order reference for every Hangul consonant and vowel, by Linguajunkie.com.",
        meta: "Linguajunkie.com · PDF",
        href: "/resources/Linguajunkie-Korean-Hangul-Stroke-Order.pdf",
      },
    ],
  },
  {
    id: "design",
    tag: "Design & typography",
    title: "Fonts and visual assets",
    intro:
      "Typefaces and artwork used throughout the interface.",
    emoji: "🎨",
    accent: "#b06fd0",
    sources: [
      {
        label: "Nunito typeface",
        detail:
          "Designed by Vernon Adams and served via Google Fonts under the SIL Open Font License.",
        meta: "Google Fonts · SIL OFL",
        href: "https://fonts.google.com/specimen/Nunito",
      },
      {
        label: "Illustrations & icons",
        detail:
          "Avatars, pets, frames, banners, and navigation icons were created for Korean Quest as original artwork.",
        meta: "Original · custom artwork",
        href: null,
      },
    ],
  },
  {
    id: "software",
    tag: "Software & libraries",
    title: "Open-source frameworks",
    intro:
      "Korean Quest is built on open-source software. Each project is used under its respective license (MIT unless noted).",
    emoji: "⚙️",
    accent: "#7490c8",
    sources: [
      {
        label: "Next.js",
        detail: "React framework used for routing, rendering, and the static export.",
        meta: "MIT License",
        href: "https://nextjs.org",
      },
      {
        label: "React & React DOM",
        detail: "Component library powering the interface.",
        meta: "MIT License",
        href: "https://react.dev",
      },
      {
        label: "Zustand",
        detail: "Lightweight state management for game progress, the player, and dialogs.",
        meta: "MIT License",
        href: "https://github.com/pmndrs/zustand",
      },
      {
        label: "Motion",
        detail: "Animation library used for page transitions and reveal effects.",
        meta: "MIT License",
        href: "https://motion.dev",
      },
      {
        label: "TanStack Table",
        detail: "Headless table utilities used for the leaderboard and data views.",
        meta: "MIT License",
        href: "https://tanstack.com/table",
      },
      {
        label: "React Bits",
        detail: "Animated UI components (split text, gradient text, spotlight cards) adapted into the app.",
        meta: "MIT License",
        href: "https://www.reactbits.dev",
      },
      {
        label: "Tailwind CSS",
        detail: "Utility-first CSS framework used alongside the custom stylesheets.",
        meta: "MIT License",
        href: "https://tailwindcss.com",
      },
      {
        label: "TypeScript",
        detail: "Typed JavaScript used across the codebase.",
        meta: "Apache-2.0 License",
        href: "https://www.typescriptlang.org",
      },
    ],
  },
  {
    id: "infra",
    tag: "AI & infrastructure",
    title: "Services that power the app",
    intro:
      "Backend services and AI models behind sign-in, the chatbot, and live tutoring tools.",
    emoji: "🤖",
    accent: "#d07a7a",
    sources: [
      {
        label: "Supabase",
        detail: "Authentication (including Google sign-in) and cloud sync for learner progress.",
        meta: "Apache-2.0 · hosted service",
        href: "https://supabase.com",
      },
      {
        label: "OpenAI",
        detail:
          "Language models that power the in-app chatbot and AI session summaries, reached from the app's serverless workers.",
        meta: "OpenAI · hosted service",
        href: "https://openai.com",
      },
      {
        label: "Cloudflare Workers & Pages",
        detail:
          "Host the serverless chat, call-summary, and transcription endpoints, and serve the static site.",
        meta: "Hosted service",
        href: "https://workers.cloudflare.com",
      },
    ],
  },
];

export default function SourcesPage() {
  return (
    <main className="container grid sources-page">
      <section className="card sources-hero">
        <div className="sources-hero-glow sources-hero-glow--1" aria-hidden="true" />
        <div className="sources-hero-glow sources-hero-glow--2" aria-hidden="true" />
        <div className="sources-hero-copy">
          <span className="sources-eyebrow">Credits &amp; attribution</span>
          <h1 className="sources-hero-title">Sources</h1>
          <p className="sources-lede">
            Korean Quest is built on original, student-written content. Where we
            rely on third-party lessons, fonts, software, or services, we credit
            them here. Everything else — the curriculum, artwork, and game
            systems — is our own work.
          </p>
        </div>
        <div className="sources-hero-art">
          <Image
            src={asset("/favicon/nav/newNavIcons/sourceIcon1.png")}
            alt="A stack of books with a magnifying glass"
            width={220}
            height={220}
            priority
          />
        </div>
      </section>

      {GROUPS.map((group) => (
        <section
          key={group.id}
          className="card sources-section"
          style={{ "--accent": group.accent } as React.CSSProperties}
        >
          <div className="sources-section-head">
            <span className="sources-section-emoji" aria-hidden="true">
              {group.emoji}
            </span>
            <div>
              <span className="sources-section-tag">{group.tag}</span>
              <h2 className="sources-section-title">{group.title}</h2>
              <p className="muted">{group.intro}</p>
            </div>
          </div>

          <ul className="sources-list">
            {group.sources.map((source) => (
              <li key={source.label} className="sources-item">
                <div className="sources-item-main">
                  <h3>{source.label}</h3>
                  <p>{source.detail}</p>
                </div>
                <div className="sources-item-side">
                  {source.meta ? (
                    <span className="sources-item-meta">{source.meta}</span>
                  ) : null}
                  {source.href ? (
                    <a
                      className="sources-item-link"
                      href={source.href}
                      target={source.href.startsWith("http") ? "_blank" : undefined}
                      rel={source.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {source.href.startsWith("http") ? "Visit source ↗" : "Open file ↓"}
                    </a>
                  ) : (
                    <span className="sources-item-badge">Original</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

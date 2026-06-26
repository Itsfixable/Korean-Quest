import type { Metadata } from "next";
import Image from "next/image";
import { asset } from "@/lib/asset";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import "@/styles/pages/about.css";

export const metadata: Metadata = {
  title: "Korean Quest — About",
};

const FACTS = [
  "Covers Hangul → full sentences",
  "6 ways to study",
  "Built by two students",
];

const FEATURES = [
  {
    icon: "/favicon/nav/nav-learn.png",
    title: "Structured Lessons",
    text: "A guided sequence from Hangul strokes to real sentence patterns, so there's always a clear next step.",
  },
  {
    icon: "/favicon/nav/nav-adventure.png",
    title: "Adventure & Battles",
    text: "Practice is framed as a game with worlds to explore, boss battles, XP, coins, and unlockables.",
  },
  {
    icon: "/favicon/resources/brainEmoji.png",
    title: "Spaced-Repetition Flashcards",
    text: "Vocabulary moves from the New stack to Known as learners review and master each card.",
  },
  {
    icon: "/favicon/nav/nav-schedule.png",
    title: "Live Tutoring",
    text: "Learners can book one-on-one sessions from the Schedule page to practice speaking with tutors.",
  },
];

const JOURNEY = [
  { step: "01", title: "Hangul", text: "Read & write consonants, vowels, and full syllable blocks." },
  { step: "02", title: "Common Words", text: "Numbers, family, food, school, and everyday essentials." },
  { step: "03", title: "Phrases", text: "Greetings, introductions, requests, and likes / dislikes." },
  { step: "04", title: "Sentences", text: "SOV order, particles (은/는, 이/가, 을/를), time & tense." },
];

const TEAM = [
  {
    role: "Curriculum & Content",
    name: "Jiah Lee",
    detail: "Designed the lesson sequence, vocabulary sets, and study materials.",
    emoji: "📚",
    accent: "#6a9f71",
  },
  {
    role: "Design & Front-End Styling",
    name: "Jiah Lee & Koji Tanaka",
    detail: "Crafted the visual identity, illustrations, and page layouts.",
    emoji: "🎨",
    accent: "#7490c8",
  },
  {
    role: "Interactives & Framework",
    name: "Koji Tanaka",
    detail: "Built the app framework, adventure mode, flashcards, and game systems.",
    emoji: "⚙️",
    accent: "#b06fd0",
  },
];

const METRICS = [
  {
    title: "Engagement",
    emoji: "🔥",
    accent: "#e5a93d",
    items: [
      "Daily and weekly active users (DAU / WAU ratio)",
      "Average session duration per study visit",
      "Streak retention — how many learners keep a 7-day streak",
    ],
  },
  {
    title: "Learning Outcomes",
    emoji: "🧠",
    accent: "#6a9f71",
    items: [
      "Lesson completion rate across the Hangul-to-phrases sequence",
      "Flashcard mastery rate (cards moved to the Known stack)",
      "Test score improvement between first and latest attempts",
    ],
  },
  {
    title: "Technical Performance",
    emoji: "⚡",
    accent: "#7490c8",
    items: [
      "Lighthouse performance and accessibility scores (target: 90+)",
      "Core Web Vitals — LCP, CLS, and INP within \u201cgood\u201d thresholds",
      "Error-free interactivity across desktop, tablet, and mobile",
    ],
  },
  {
    title: "Growth & Satisfaction",
    emoji: "🌱",
    accent: "#b06fd0",
    items: [
      "30-day learner retention rate",
      "Net Promoter Score (NPS) from student feedback surveys",
      "Tutoring session bookings made through the Schedule page",
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="container grid about-page">
      <AnimatedContent distance={40} duration={0.7}>
        <section className="card about-hero">
          <div className="about-hero-glow about-hero-glow--1" aria-hidden="true" />
          <div className="about-hero-glow about-hero-glow--2" aria-hidden="true" />
          <div className="about-hero-copy">
            <span className="about-eyebrow">About the project</span>
            <h1 className="about-hero-title">About Korean Quest</h1>
            <p className="about-mission">
              <strong>Our mission:</strong> make Korean learning engaging,
              collaborative, and accessible through gamified lessons and
              peer-to-peer support.
            </p>
            <p className="about-lede">
              Korean Quest is a student-built study platform that blends structured
              Hangul lessons, spaced-repetition flashcards, and an adventure mode
              that rewards consistent practice with XP, coins, and unlockables.
            </p>
            <ul className="about-facts">
              {FACTS.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>
          <div className="about-hero-art">
            <Image
              src={asset("/favicon/dashboard/archery.png")}
              alt="Korean Quest mascot drawing a bow"
              width={260}
              height={260}
              priority
            />
          </div>
        </section>
      </AnimatedContent>

      <AnimatedContent distance={50} duration={0.7} delay={0.05}>
        <section className="card about-section">
          <div className="about-section-head">
            <span className="about-section-tag">What's inside</span>
            <h2 className="about-section-title">The parts that make up Korean Quest</h2>
            <p className="muted">
              Four pieces work together to take a learner from their very first
              Korean letter to confident, everyday sentences.
            </p>
          </div>
          <div className="about-features">
            {FEATURES.map((item) => (
              <article key={item.title} className="about-feature-card">
                <div className="about-feature-icon">
                  <Image src={asset(item.icon)} alt="" width={44} height={44} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </AnimatedContent>

      <AnimatedContent distance={50} duration={0.7} delay={0.05}>
        <section className="card about-section">
          <div className="about-section-head">
            <span className="about-section-tag">The curriculum</span>
            <h2 className="about-section-title">How the learning path is structured</h2>
            <p className="muted">
              Lessons follow a deliberate order so each stage builds on the last.
            </p>
          </div>
          <ol className="about-journey">
            {JOURNEY.map((stage) => (
              <li key={stage.step} className="about-journey-step">
                <span className="about-journey-num">{stage.step}</span>
                <div className="about-journey-body">
                  <h3>{stage.title}</h3>
                  <p>{stage.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </AnimatedContent>

      <AnimatedContent distance={50} duration={0.7} delay={0.05}>
        <section className="card about-section">
          <div className="about-section-head">
            <span className="about-section-tag">The team</span>
            <h2 className="about-section-title">Meet the people behind it</h2>
          </div>
          <div className="about-team">
            {TEAM.map((member) => (
              <article
                key={member.role}
                className="about-team-card"
                style={{ "--accent": member.accent } as React.CSSProperties}
              >
                <div className="about-team-avatar" aria-hidden="true">
                  {member.emoji}
                </div>
                <h3>{member.role}</h3>
                <div className="about-team-name">{member.name}</div>
                <p className="muted">{member.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </AnimatedContent>

      <AnimatedContent distance={50} duration={0.7} delay={0.05}>
        <section className="card about-section">
          <div className="about-section-head">
            <span className="about-section-tag">How we measure success</span>
            <h2 className="about-section-title">The indicators we track</h2>
            <p className="muted">
              Korean Quest watches measurable indicators across four areas to see
              whether the site keeps students engaged, learning, and coming back.
            </p>
          </div>
          <div className="about-metrics">
            {METRICS.map((group) => (
              <article
                key={group.title}
                className="about-metric-card"
                style={{ "--accent": group.accent } as React.CSSProperties}
              >
                <div className="about-metric-head">
                  <span className="about-metric-emoji">{group.emoji}</span>
                  <h3>{group.title}</h3>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </AnimatedContent>

      <section className="card about-attribution">
        <h2 className="about-section-title">Attribution</h2>
        <p className="muted">
          Third-party videos and assets are cited in the Credits &amp; Sources section of
          the Learn page. All other content is student-written.
        </p>
      </section>
    </main>
  );
}

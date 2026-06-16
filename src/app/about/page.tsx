import type { Metadata } from "next";
import Image from "next/image";
import "@/styles/pages/about.css";

export const metadata: Metadata = {
  title: "Korean Quest — About",
};

const METRICS = [
  {
    title: "Engagement",
    items: [
      "Daily and weekly active users (DAU / WAU ratio)",
      "Average session duration per study visit",
      "Streak retention — how many learners keep a 7-day streak",
    ],
  },
  {
    title: "Learning Outcomes",
    items: [
      "Lesson completion rate across the Hangul-to-phrases sequence",
      "Flashcard mastery rate (cards moved to the Known stack)",
      "Test score improvement between first and latest attempts",
    ],
  },
  {
    title: "Technical Performance",
    items: [
      "Lighthouse performance and accessibility scores (target: 90+)",
      "Core Web Vitals — LCP, CLS, and INP within \u201cgood\u201d thresholds",
      "Error-free interactivity verified across desktop, tablet, and mobile",
    ],
  },
  {
    title: "Growth & Satisfaction",
    items: [
      "30-day learner retention rate",
      "Net Promoter Score (NPS) from student feedback surveys",
      "Tutoring session bookings made through the Schedule page",
    ],
  },
];

const TEAM = [
  {
    name: "Jiah Lee",
    role: "Curriculum & Content",
    detail: "Designed the lesson sequence, vocabulary sets, and study materials.",
  },
  {
    name: "Jiah Lee & Koji Tanaka",
    role: "Design & Front-End Styling",
    detail: "Crafted the visual identity, illustrations, and page layouts.",
  },
  {
    name: "Koji Tanaka",
    role: "Front-End Interactives & Framework",
    detail: "Built the app framework, adventure mode, flashcards, and game systems.",
  },
];

export default function AboutPage() {
  return (
    <main className="container grid about-page">
      <section className="card about-hero">
        <div className="about-hero-copy">
          <h1>About Korean Quest</h1>
          <p className="about-mission">
            <strong>Our mission:</strong> make Korean learning engaging, collaborative,
            and accessible through gamified lessons and peer-to-peer support.
          </p>
          <p className="muted">
            Korean Quest combines structured Hangul lessons, spaced-repetition
            flashcards, and an adventure mode that rewards consistent practice with
            XP, coins, and unlockables.
          </p>
        </div>
        <div className="about-hero-art">
          <Image
            src="/favicon/dashboard/archery.png"
            alt="Korean Quest mascot"
            width={260}
            height={260}
            priority
          />
        </div>
      </section>

      <section className="card">
        <h2 className="about-section-title">Meet the Team</h2>
        <div className="about-team">
          {TEAM.map((member) => (
            <article key={member.role} className="about-team-card">
              <h3>{member.role}</h3>
              <div className="about-team-name">{member.name}</div>
              <p className="muted">{member.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="about-section-title">How We Measure Success</h2>
        <p className="muted">
          Korean Quest tracks measurable indicators across four areas to evaluate
          whether the site keeps students engaged, learning, and coming back.
        </p>
        <div className="about-metrics">
          {METRICS.map((group) => (
            <article key={group.title} className="about-metric-card">
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="about-section-title">Attribution</h2>
        <p className="muted">
          Third-party videos and assets are cited in the Credits &amp; Sources section of
          the Learn page. All other content is student-written.
        </p>
      </section>
    </main>
  );
}

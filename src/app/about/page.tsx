import type { Metadata } from "next";
import Image from "next/image";
import "@/styles/pages/about.css";

export const metadata: Metadata = {
  title: "Korean Quest — About",
};

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
            src="/favicon/index/welcome.png"
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
        <h2 className="about-section-title">Attribution</h2>
        <p className="muted">
          Any third-party videos or assets are cited on the Resources page. This demo
          uses student-written content.
        </p>
      </section>
    </main>
  );
}

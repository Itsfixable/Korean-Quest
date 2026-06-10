import Link from "next/link";
import { HomePageStyles } from "@/components/PageStyles";
import { HomeStats } from "@/components/pages/HomeStats";

export default function HomePage() {
  return (
    <>
      <HomePageStyles />
      <main className="container grid">
        <section className="card kq-hero kq-sparkles">
          <div className="kq-hero-left">
            <p className="kq-hero-tag">🚀 Learn Korean Faster</p>
            <h1 className="kq-hero-title">
              Learn Korean in <span className="kq-highlight">3 Minutes a Day</span>
            </h1>
            <p className="kq-hero-sub">
              Master Hangul, vocabulary, and real Korean phrases through{" "}
              <strong>interactive lessons</strong>, <strong>game battles</strong>, and{" "}
              <strong>daily challenges</strong>.
            </p>
            <div className="kq-hero-cta">
              <Link className="btn kq-cta-primary" href="/resources">
                Start Learning →
              </Link>
              <Link className="btn secondary" href="/adventure">
                Try the Adventure
              </Link>
            </div>
            <HomeStats />
          </div>
          <div className="kq-hero-right" aria-hidden="true" />
        </section>

        <section className="card kq-feature-band kq-sparkles">
          <div className="kq-feature-intro">
            <p className="kq-section-tag">Why Korean Quest?</p>
            <h2>Everything you need to start learning — right away.</h2>
            <p className="muted">
              No scavenger hunt. No confusing menus. Just a clear path from your first
              Korean letter to useful words, phrases, and sentence patterns.
            </p>
          </div>
          <div className="kq-feature-grid">
            <article className="kq-feature-card">
              <div className="kq-feature-icon">📝</div>
              <h3>Quick Lessons</h3>
              <p>Learn the essentials in short, beginner-friendly lessons built for fast progress.</p>
            </article>
            <article className="kq-feature-card">
              <div className="kq-feature-icon">🎮</div>
              <h3>Game Adventure</h3>
              <p>Turn practice into motivation with battles, unlocks, and world progression.</p>
            </article>
            <article className="kq-feature-card">
              <div className="kq-feature-icon">🔥</div>
              <h3>Daily Momentum</h3>
              <p>Build streaks, complete quests, and stay consistent with bite-sized daily goals.</p>
            </article>
          </div>
        </section>

        <section className="card kq-quests kq-sparkles">
          <div className="kq-quests__content">
            <p className="kq-section-tag">Daily Motivation</p>
            <h2>Today&apos;s Quests</h2>
            <p className="muted kq-quests__desc">
              Complete daily quests to earn coins, grow your streak, and build a habit that makes Korean stick.
            </p>
            <Link className="btn secondary kq-view-quests" href="/dashboard">
              View Quests ›
            </Link>
          </div>
        </section>

        <section id="learningPathSection" className="card kq-bg kq-bg--path kq-sparkles">
          <p className="kq-section-tag">Your Roadmap</p>
          <h2>Follow a clear path from beginner to confident learner</h2>
          <ol className="learning-path kq-stagger">
            <li><strong>Hangul</strong> — write & read consonants (초성/종성), vowels (중성), and build syllables.</li>
            <li><strong>Common Words</strong> — numbers, family, food, school, and everyday essentials.</li>
            <li><strong>Phrases</strong> — greetings, introductions, requests, and likes/dislikes.</li>
            <li><strong>Sentence Structure</strong> — SOV order, particles (은/는, 이/가, 을/를), time/location, and present tense.</li>
          </ol>
          <div className="kq-path-cta">
            <Link className="btn" href="/resources">Start with Lesson 1</Link>
          </div>
        </section>

        <section className="card kq-final-cta kq-sparkles">
          <div className="kq-final-cta__content">
            <p className="kq-section-tag">Ready to Begin?</p>
            <h2>Start learning Korean now — not someday.</h2>
            <p className="muted">
              Whether you want to read Hangul, speak basic phrases, or stay motivated with game-style progress,
              Korean Quest gives you a simple place to start.
            </p>
            <div className="grid grid-actions">
              <Link className="btn" href="/resources">Start a Lesson</Link>
              <Link className="btn secondary" href="/adventure">Enter Adventure</Link>
              <Link className="btn secondary" href="/schedule">Join Study Session</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { asset } from "@/lib/asset";
import "@/styles/pages/resources.css";
import "@/styles/pages/resources-enhancements.css";

const LESSONS = [
  {
    id: "L1_hangul",
    title: "Hangul 1: ㄱ ㄴ ㄷ ㅁ ㅂ + ㅏ",
    description: "Identify basic consonants and construct syllables with ㅏ.",
    unlockCap: 4,
    actions: [{ href: "/jamo-select", label: "Trace ㄱ", primary: true }],
    showStartLesson: false,
  },
  {
    id: "L2_vocab_food",
    title: "Vocab: Food Basics (밥, 물, 김치, 빵, 우유, 사과)",
    description: "Learn high-frequency food words with picture matching and timed drills.",
    unlockCap: 8,
    actions: [
      { href: "/adventure", label: "Adventure", primary: true },
      { href: "/flashcards", label: "Flashcards", primary: false },
    ],
    showStartLesson: false,
  },
];

const DOWNLOADABLES = [
  {
    title: "Korean Words List",
    filename: "/resources/KoreanWordsList.pdf",
    note: "Student-compiled vocabulary reference covering the words used across Korean Quest lessons.",
  },
  {
    title: "Hangul Practice Worksheet",
    filename: "/resources/Korean_hangul_practice_worksheet.pdf",
    note: "Printable worksheet for practicing Hangul letters by hand.",
  },
  {
    title: "Hangul Stroke Order Guide",
    filename: "/resources/Linguajunkie-Korean-Hangul-Stroke-Order.pdf",
    note: "Stroke order reference for every Hangul consonant and vowel. Source: Linguajunkie.com.",
  },
];

const CREDITS = [
  {
    label: "Video lessons",
    detail:
      "Billy Go's Beginner Korean Course — Learn Korean with GO! Billy Korean (YouTube). Embedded with credit; all video content belongs to its creator.",
    href: "https://www.youtube.com/playlist?list=PLbFrQnW0BNMUkAFj4MjYauXBPtO3I9O_k",
  },
  {
    label: "Stroke order guide",
    detail:
      "\"Korean Hangul Stroke Order\" PDF by Linguajunkie.com, shared as a free learning resource.",
    href: "https://www.linguajunkie.com",
  },
  {
    label: "Typography",
    detail:
      "Nunito typeface by Vernon Adams, served via Google Fonts under the SIL Open Font License.",
    href: "https://fonts.google.com/specimen/Nunito",
  },
  {
    label: "Lessons & artwork",
    detail:
      "All lessons, vocabulary sets, quizzes, and page illustrations are original, student-written content created by the Korean Quest team.",
    href: null,
  },
];

export default function ResourcesView() {
  const progress = useGameStore((s) => s.progress);
  const addXP = useGameStore((s) => s.addXP);
  const addCoins = useGameStore((s) => s.addCoins);
  const markLessonComplete = useGameStore((s) => s.markLessonComplete);

  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const startLesson = (lesson: (typeof LESSONS)[number]) => {
    addXP(12);
    addCoins(6);
    const result = markLessonComplete({
      id: lesson.id,
      title: lesson.title,
      adventureUnlockCap: lesson.unlockCap,
    });
    showToast(
      result.firstCompletion
        ? `${lesson.title} complete — +12 XP and +6 coins earned.`
        : `${lesson.title} reviewed again. Rewards applied.`,
    );
  };

  return (
    <>
      <section className="card study-tools-card">
        <div className="study-tools-banner">
          <Image
            src={asset("/favicon/resources/resourcesBanner.png")}
            alt="Resources banner"
            width={900}
            height={200}
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        <h1 className="section-title">
          <Image
            src={asset("/favicon/resources/brainEmoji.png")}
            alt=""
            width={32}
            height={32}
            className="section-title__icon"
          />
          <span>Study Tools</span>
        </h1>

        <p className="muted">Quizlet-style flashcards and tests to help you master vocabulary fast.</p>

        <div className="lesson-actions study-tools-actions">
          <Link className="btn" href="/flashcards">
            Flashcards
          </Link>
          <Link className="btn secondary" href="/test">
            Take a Test
          </Link>
        </div>
      </section>

      <section className="card">
        <h1 className="section-title">
          <Image
            src={asset("/favicon/resources/bookEmoji.png")}
            alt=""
            width={32}
            height={32}
            className="section-title__icon"
          />
          <span>Lessons</span>
        </h1>

        <p className="muted">Short, student-written lessons that build from Hangul to full sentences.</p>

        <div className="lesson-list kq-stagger" id="lesson-list">
          {LESSONS.map((lesson) => (
            <article key={lesson.id} className="lesson" data-lesson-id={lesson.id}>
              <header>
                <h2>{lesson.title}</h2>
              </header>
              <p>{lesson.description}</p>
              <div className="lesson-actions">
                {lesson.actions.map((action) => (
                  <Link
                    key={action.href}
                    className={action.primary ? "btn" : "btn secondary"}
                    href={action.href}
                  >
                    {action.label}
                  </Link>
                ))}
                {lesson.showStartLesson ? (
                  <button className="btn secondary" type="button" onClick={() => startLesson(lesson)}>
                    Start lesson
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Videos</h2>
        <p className="muted">
          Short explainers and pronunciation tips from Billy Go&apos;s Beginner Korean
          Course, embedded with credit to the creator.
        </p>

        <div className="video-wrap">
          <iframe
            src="https://www.youtube-nocookie.com/embed/videoseries?list=PLbFrQnW0BNMUkAFj4MjYauXBPtO3I9O_k"
            title="Korean Quest Playlist"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        </div>

        <p className="muted video-help-text">
          Having trouble?{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.youtube.com/playlist?list=PLbFrQnW0BNMUkAFj4MjYauXBPtO3I9O_k"
          >
            Open the playlist on YouTube
          </a>
          .
        </p>
      </section>

      <section className="card">
        <h2>Downloadables</h2>
        <div id="kqDownloadablesGrid" className="kq-download-grid">
          {DOWNLOADABLES.map((pdf) => (
            <article key={pdf.filename} className="kq-pdf-card">
              <div aria-hidden="true" style={{ fontSize: "1.55rem" }}>
                📄
              </div>
              <h3>{pdf.title}</h3>
              <p>{pdf.note}</p>
              <a className="kq-pdf-link" href={pdf.filename} download>
                Download PDF
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Credits &amp; Sources</h2>
        <p className="muted">
          Korean Quest is built on student-written content. Third-party materials used on
          this site are credited below — see the{" "}
          <Link href="/sources">Sources</Link> page for the full list.
        </p>
        <ul className="kq-credits-list">
          {CREDITS.map((credit) => (
            <li key={credit.label} className="kq-credit-item">
              <strong>{credit.label}:</strong> {credit.detail}{" "}
              {credit.href ? (
                <a href={credit.href} target="_blank" rel="noopener noreferrer">
                  View source
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <div id="kqResourcesToast" className={`kq-resources-toast${toastVisible ? " show" : ""}`}>
        {toast}
      </div>
    </>
  );
}

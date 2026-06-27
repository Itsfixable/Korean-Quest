"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useGameStore } from "@/stores/useGameStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFlashcardStore } from "@/stores/useFlashcardStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { FLASHCARD_SETS } from "@/lib/constants/flashcard-sets";
import { BarChart, CHART_CATEGORIES, DonutChart, RadialGauge, GROUP_COLORS } from "./ProgressCharts";
import "@/styles/pages/dashboard-report.css";

type RangeKey = "all" | "7" | "30";
type GroupKey = "engagement" | "learning" | "progress";

type Metric = {
  key: string;
  label: string;
  value: string;
  group: GroupKey;
  /** Optional 0–100 completion used to render a progress bar. */
  pct?: number;
  hint?: string;
};

const ADVENTURE_MAX_CAP = 12;

const GROUP_LABELS: Record<GroupKey, string> = {
  engagement: "Engagement",
  learning: "Learning",
  progress: "Progress",
};


const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "7", label: "Last 7 days" },
];

/** Collapse recorded activity types into the four breakdown categories. */
function normalizeActivityType(type: string): string | null {
  switch (type) {
    case "Battle":
      return "Battle";
    case "Flashcard":
    case "Flashcards":
      return "Flashcard";
    case "Test":
    case "Quiz":
      return "Test";
    case "Trace":
    case "Tracing":
      return "Trace";
    default:
      return null;
  }
}

function computeJourneyPercent(
  completedLessonIds: string[],
  battlesWon: number,
  badgeCount: number,
) {
  const lessonScore = Math.min(completedLessonIds.length / 3, 1) * 45;
  const battleScore = Math.min(battlesWon / 12, 1) * 35;
  const badgeScore = Math.min(badgeCount / 8, 1) * 20;
  return Math.round(lessonScore + battleScore + badgeScore);
}

export default function ProgressReport() {
  const player = useGameStore((s) => s.player);
  const progress = useGameStore((s) => s.progress);
  const getAchievements = useGameStore((s) => s.getAchievements);
  const getAdventureProgress = useGameStore((s) => s.getAdventureProgress);
  const flashProgress = useFlashcardStore((s) => s.progress);
  const bookings = useBookingStore((s) => s.bookings);
  const authUser = useAuthStore((s) => s.user);

  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<RangeKey>("all");
  const [groups, setGroups] = useState<Record<GroupKey, boolean>>({
    engagement: true,
    learning: true,
    progress: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const achievements = getAchievements();
  const adventure = getAdventureProgress();

  const journeyPercent = useMemo(
    () =>
      computeJourneyPercent(
        progress.completedLessonIds,
        progress.battlesWon,
        achievements.length,
      ),
    [progress.completedLessonIds, progress.battlesWon, achievements.length],
  );

  const nextUnlockText = adventure.nextLesson
    ? `Keep going to unlock ${adventure.nextLesson.label}.`
    : "All adventure chapters are unlocked — now clear every boss node.";

  const activities = useMemo(() => {
    const list = (progress.recentWork || []).filter((item) => item.type !== "Shop");
    if (range === "all") return list;
    const cutoff = Date.now() - Number(range) * 86400000;
    return list.filter((item) => item.ts >= cutoff);
  }, [progress.recentWork, range]);

  const chartSlices = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach((item) => {
      const label = normalizeActivityType(item.type);
      if (label) counts[label] = (counts[label] || 0) + 1;
    });
    return CHART_CATEGORIES.map((cat) => ({
      label: cat.label,
      value: counts[cat.label] || 0,
      color: cat.color,
    }));
  }, [activities]);

  const chartTotal = chartSlices.reduce((sum, slice) => sum + slice.value, 0);

  const metrics = useMemo<Metric[]>(() => {
    const achievements = getAchievements();
    const adventure = getAdventureProgress();

    const totalCards = FLASHCARD_SETS.reduce((sum, set) => sum + set.cards.length, 0);
    const knownCards = Math.min(
      Object.values(flashProgress).reduce((sum, p) => sum + (p.known?.length || 0), 0),
      totalCards,
    );
    const masteryPct = totalCards ? Math.round((knownCards / totalCards) * 100) : 0;

    const advPct = Math.round((Math.min(adventure.cap, ADVENTURE_MAX_CAP) / ADVENTURE_MAX_CAP) * 100);

    const sessionsBooked = Object.keys(bookings).length;
    const sessionsGoing = Object.values(bookings).filter((b) => b?.going).length;

    return [
      {
        key: "level",
        label: "Current level",
        value: String(player.level),
        group: "engagement",
      },
      {
        key: "totalXp",
        label: "Total XP earned",
        value: player.totalXPEarned.toLocaleString(),
        group: "engagement",
      },
      {
        key: "streak",
        label: "Day streak",
        value: `${player.streak} day${player.streak === 1 ? "" : "s"}`,
        group: "engagement",
      },
      {
        key: "activities",
        label: "Logged activities",
        value: String(activities.length),
        group: "engagement",
        hint: range === "all" ? "All time" : `Last ${range} days`,
      },
      {
        key: "mastery",
        label: "Flashcard mastery",
        value: `${masteryPct}%`,
        group: "learning",
        pct: masteryPct,
        hint: `${knownCards} / ${totalCards} cards known`,
      },
      {
        key: "quizzes",
        label: "Quizzes completed",
        value: String(progress.quizzesDone),
        group: "learning",
      },
      {
        key: "badges",
        label: "Badges earned",
        value: String(achievements.length),
        group: "learning",
      },
      {
        key: "adventure",
        label: "Adventure unlocked",
        value: `${advPct}%`,
        group: "progress",
        pct: advPct,
        hint: `Level cap ${adventure.cap} / ${ADVENTURE_MAX_CAP}`,
      },
      {
        key: "battles",
        label: "Battles won",
        value: String(progress.battlesWon),
        group: "progress",
      },
      {
        key: "sessions",
        label: "Tutoring sessions booked",
        value: String(sessionsBooked),
        group: "progress",
        hint: sessionsBooked ? `${sessionsGoing} marked going` : undefined,
      },
    ];
  }, [
    player.level,
    player.totalXPEarned,
    player.streak,
    progress.completedLessonIds,
    progress.quizzesDone,
    progress.battlesWon,
    flashProgress,
    bookings,
    activities.length,
    range,
    getAchievements,
    getAdventureProgress,
  ]);

  const visibleMetrics = useMemo(
    () => metrics.filter((m) => groups[m.group]),
    [metrics, groups],
  );

  const toggleGroup = (group: GroupKey) =>
    setGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  if (!mounted) {
    return (
      <section className="dashboard-card kq-report-card">
        <div className="section-head">
          <span className="section-icon" aria-hidden="true">
            📊
          </span>
          <h2>Progress Report</h2>
        </div>
        <p className="muted">Crunching your stats…</p>
      </section>
    );
  }

  const generatedFor = authUser?.loggedIn ? authUser.name : "Guest Learner";
  const minutesActive =
    progress.studyMinutesDay === new Date().toDateString()
      ? progress.studyMinutes || 0
      : 0;

  return (
    <section className="dashboard-card kq-report-card">
      <div className="kq-report-head">
        <div className="section-head" style={{ margin: 0 }}>
          <span className="section-icon" aria-hidden="true">
            📈
          </span>
          <h2>Learning Journey</h2>
        </div>
        <div className="kq-report-controls">
          <div className="kq-report-clock" title="Active study time today">
            <span className="kq-report-clock-icon" aria-hidden="true">
              ⏱️
            </span>
            <span className="kq-report-clock-value">{minutesActive}</span>
            <span className="kq-report-clock-unit">min active today</span>
          </div>
          <label className="kq-report-range">
            <span>Range</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeKey)}
              aria-label="Report date range"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="kq-report-meta muted">
        Generated for <strong>{generatedFor}</strong> on {new Date().toLocaleDateString()} ·
        showing {visibleMetrics.length} metrics
      </p>

      <div className="kq-journey-band">
        <div className="kq-journey-band-head">
          <span className="kq-journey-band-pct">{journeyPercent}%</span>
          <div className="kq-journey-band-text">
            <strong>Overall journey complete</strong>
            <span>Adventure unlocked through Level {adventure.cap}</span>
          </div>
        </div>
        <div className="kq-journey-band-track" aria-hidden="true">
          <motion.span
            className="kq-journey-band-fill"
            initial={{ width: 0 }}
            animate={{ width: `${journeyPercent}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="kq-journey-band-note">{nextUnlockText}</p>
      </div>

      <div className="kq-report-filters" role="group" aria-label="Metric categories">
        {(Object.keys(GROUP_LABELS) as GroupKey[]).map((group) => (
          <label
            key={group}
            className={`kq-report-chip kq-group-${group}${groups[group] ? " is-active" : ""}`}
          >
            <input
              type="checkbox"
              checked={groups[group]}
              onChange={() => toggleGroup(group)}
            />
            {GROUP_LABELS[group]}
          </label>
        ))}
      </div>

      {visibleMetrics.length === 0 ? (
        <p className="muted">Select at least one category to show metrics.</p>
      ) : (
        <div className="kq-report-grid">
          {visibleMetrics.map((metric, index) =>
            typeof metric.pct === "number" ? (
              <article
                key={metric.key}
                className={`kq-report-stat is-gauge kq-group-${metric.group}`}
              >
                <RadialGauge
                  value={metric.pct}
                  color={GROUP_COLORS[metric.group]}
                  delay={0.05 * index}
                  size={66}
                />
                <div className="kq-report-stat-body">
                  <span className="kq-report-stat-label">{metric.label}</span>
                  <strong className="kq-report-stat-value">{metric.value}</strong>
                  {metric.hint ? (
                    <span className="kq-report-stat-hint">{metric.hint}</span>
                  ) : null}
                </div>
              </article>
            ) : (
              <article
                key={metric.key}
                className={`kq-report-stat kq-group-${metric.group}`}
              >
                <span className="kq-report-stat-label">{metric.label}</span>
                <strong className="kq-report-stat-value">{metric.value}</strong>
                {metric.hint ? (
                  <span className="kq-report-stat-hint">{metric.hint}</span>
                ) : null}
              </article>
            ),
          )}
        </div>
      )}

      <div className="kq-report-activity">
        <h3>Activity breakdown</h3>
        {chartTotal === 0 ? (
          <p className="muted">
            No activity recorded for this range yet. Win a battle, study flashcards, take a
            test, or trace characters to populate your report.
          </p>
        ) : (
          <div className="kq-report-charts">
            <div className="kq-report-chart-card">
              <span className="kq-report-chart-title">Distribution</span>
              <DonutChart data={chartSlices} />
            </div>
            <div className="kq-report-chart-card">
              <span className="kq-report-chart-title">Counts by type</span>
              <BarChart data={chartSlices} />
            </div>
          </div>
        )}
      </div>

      <div className="kq-report-badges">
        <h3>Achievement badges</h3>
        <div className="kq-achievement-grid kq-stagger">
          {achievements.length === 0 ? (
            <div className="kq-achievement-empty">
              No badges yet — finish a quiz or win a battle to start collecting achievements.
            </div>
          ) : (
            achievements.map((badge) => (
              <article key={badge.name} className="kq-achievement-chip">
                <div className="kq-achievement-icon" aria-hidden="true">
                  {badge.icon}
                </div>
                <div>
                  <h3>{badge.name}</h3>
                  <p>{badge.desc}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

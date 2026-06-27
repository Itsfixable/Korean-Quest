"use client";

import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFlashcardStore } from "@/stores/useFlashcardStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { FLASHCARD_SETS } from "@/lib/constants/flashcard-sets";
import { LESSON_UNLOCKS } from "@/lib/constants/achievements";
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

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
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

  const activities = useMemo(() => {
    const list = progress.recentWork || [];
    if (range === "all") return list;
    const cutoff = Date.now() - Number(range) * 86400000;
    return list.filter((item) => item.ts >= cutoff);
  }, [progress.recentWork, range]);

  const activityByType = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activities]);

  const metrics = useMemo<Metric[]>(() => {
    const achievements = getAchievements();
    const adventure = getAdventureProgress();

    const totalLessons = Object.keys(LESSON_UNLOCKS).length;
    const lessonsCompleted = Math.min(progress.completedLessonIds.length, totalLessons);
    const lessonPct = totalLessons ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

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
        key: "lessons",
        label: "Lessons completed",
        value: `${lessonsCompleted} / ${totalLessons}`,
        group: "learning",
        pct: lessonPct,
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

  const handleExportCsv = () => {
    const generatedFor = authUser?.loggedIn ? authUser.name : "Guest Learner";
    const header = `# Korean Quest progress report\n# Learner: ${generatedFor}\n# Generated: ${new Date().toLocaleString()}\n# Range: ${
      range === "all" ? "All time" : `Last ${range} days`
    }\n`;
    const rows = [
      ["Metric", "Value", "Category"],
      ...visibleMetrics.map((m) => [m.label, m.value, GROUP_LABELS[m.group]]),
      ...activityByType.map(([type, count]) => [`Activity: ${type}`, String(count), "Activity"]),
    ];
    const csv = header + rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `korean-quest-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

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

  const maxActivity = activityByType.reduce((max, [, count]) => Math.max(max, count), 0) || 1;
  const generatedFor = authUser?.loggedIn ? authUser.name : "Guest Learner";

  return (
    <section className="dashboard-card kq-report-card">
      <div className="kq-report-head">
        <div className="section-head" style={{ margin: 0 }}>
          <span className="section-icon" aria-hidden="true">
            📊
          </span>
          <h2>Progress Report</h2>
        </div>
        <div className="kq-report-controls">
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
          <button type="button" className="kq-report-btn" onClick={handleExportCsv}>
            ⬇ Export CSV
          </button>
          <button type="button" className="kq-report-btn secondary" onClick={() => window.print()}>
            🖨 Print
          </button>
        </div>
      </div>

      <p className="kq-report-meta muted">
        Generated for <strong>{generatedFor}</strong> on {new Date().toLocaleDateString()} ·
        showing {visibleMetrics.length} metrics
      </p>

      <div className="kq-report-filters" role="group" aria-label="Metric categories">
        {(Object.keys(GROUP_LABELS) as GroupKey[]).map((group) => (
          <label
            key={group}
            className={`kq-report-chip${groups[group] ? " is-active" : ""}`}
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
          {visibleMetrics.map((metric) => (
            <article key={metric.key} className="kq-report-stat">
              <span className="kq-report-stat-label">{metric.label}</span>
              <strong className="kq-report-stat-value">{metric.value}</strong>
              {typeof metric.pct === "number" ? (
                <div className="kq-report-bar" aria-hidden="true">
                  <span style={{ width: `${metric.pct}%` }} />
                </div>
              ) : null}
              {metric.hint ? <span className="kq-report-stat-hint">{metric.hint}</span> : null}
            </article>
          ))}
        </div>
      )}

      <div className="kq-report-activity">
        <h3>Activity breakdown</h3>
        {activityByType.length === 0 ? (
          <p className="muted">
            No activity recorded for this range yet. Complete a lesson, quiz, or battle to
            populate your report.
          </p>
        ) : (
          <ul className="kq-report-activity-list">
            {activityByType.map(([type, count]) => (
              <li key={type} className="kq-report-activity-row">
                <span className="kq-report-activity-type">{type}</span>
                <span className="kq-report-activity-track" aria-hidden="true">
                  <span style={{ width: `${Math.round((count / maxActivity) * 100)}%` }} />
                </span>
                <span className="kq-report-activity-count">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

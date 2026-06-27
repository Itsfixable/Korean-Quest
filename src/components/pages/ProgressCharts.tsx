"use client";

/**
 * Animated SVG charts for the Progress Report.
 * Built on motion/react so everything draws in smoothly when scrolled into view.
 */
import { useId } from "react";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** One accent color per metric category (matches the filter chips + card tints). */
export const GROUP_COLORS: Record<string, string> = {
  engagement: "#7cc4f5",
  learning: "#f6a9a9",
  progress: "#9ee6c4",
};

/** Fixed activity categories shown in the breakdown charts, in display order. */
export const CHART_CATEGORIES: { label: string; color: string }[] = [
  { label: "Battle", color: "#ff6b6b" },
  { label: "Flashcard", color: "#5b7bff" },
  { label: "Test", color: "#f59e0b" },
  { label: "Trace", color: "#14b8a6" },
];

/** Shared palette so activity types keep a stable, friendly color. */
export const ACTIVITY_COLORS: Record<string, string> = {
  Flashcards: "#5b7bff",
  Test: "#6366f1",
  Study: "#0ea5e9",
  Quiz: "#8b5cf6",
  Battle: "#ff6b6b",
  Shop: "#22c55e",
  Quest: "#f59e0b",
  Unlock: "#14b8a6",
};

const FALLBACK_PALETTE = [
  "#5b7bff",
  "#8b5cf6",
  "#ff6b6b",
  "#22c55e",
  "#f59e0b",
  "#14b8a6",
  "#ec4899",
  "#06b6d4",
];

export function colorForType(type: string, index: number) {
  return ACTIVITY_COLORS[type] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

/** Lighten (positive) or darken (negative) a hex color by a percentage. */
function shade(hex: string, percent: number) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized.split("").map((c) => c + c).join("")
      : normalized;
  const num = parseInt(full, 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/* ---------------------------------------------------------------- */
/* Radial gauge — a single animated arc for percentage metrics.     */
/* ---------------------------------------------------------------- */
const GAUGE_RADIUS = 30;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_RADIUS;

export function RadialGauge({
  value,
  color = "#5b7bff",
  delay = 0,
  size = 78,
}: {
  value: number;
  color?: string;
  delay?: number;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const offset = GAUGE_CIRC * (1 - pct / 100);

  return (
    <svg
      className="kq-gauge"
      width={size}
      height={size}
      viewBox="0 0 78 78"
      role="img"
      aria-label={`${Math.round(pct)} percent`}
    >
      <circle className="kq-gauge-track" cx="39" cy="39" r={GAUGE_RADIUS} strokeWidth="9" fill="none" />
      <motion.circle
        cx="39"
        cy="39"
        r={GAUGE_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={GAUGE_CIRC}
        transform="rotate(-90 39 39)"
        initial={{ strokeDashoffset: GAUGE_CIRC }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, delay, ease: EASE }}
      />
      <motion.text
        x="39"
        y="39"
        className="kq-gauge-text"
        textAnchor="middle"
        dominantBaseline="central"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.4 }}
      >
        {Math.round(pct)}%
      </motion.text>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* Donut chart — animated segments for the activity distribution.   */
/* ---------------------------------------------------------------- */
type Slice = { label: string; value: number; color: string };

const DONUT_RADIUS = 54;
const DONUT_STROKE = 22;
const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS;
const DONUT_GAP_DEG = 5; // small gap between segments

export function DonutChart({ data, size = 176 }: { data: Slice[]; size?: number }) {
  const labelId = useId();
  const shadowId = useId();
  const gradientPrefix = useId();
  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1;

  // Only draw segments that actually have activity — a zero-value segment with
  // round caps would otherwise render as a stray colored dot on the ring.
  const drawn = data.filter((slice) => slice.value > 0);
  const multiple = drawn.length > 1;
  const gradId = (index: number) => `${gradientPrefix}-grad-${index}`.replace(/[^a-zA-Z0-9_-]/g, "");

  let cumulativeDeg = 0;

  return (
    <div className="kq-donut" role="img" aria-labelledby={labelId}>
      <svg width={size} height={size} viewBox="0 0 140 140">
        <defs>
          <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#3d4f7d" floodOpacity="0.28" />
          </filter>
          {drawn.map((slice, index) => (
            <linearGradient
              key={slice.label}
              id={gradId(index)}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor={shade(slice.color, 20)} />
              <stop offset="55%" stopColor={slice.color} />
              <stop offset="100%" stopColor={shade(slice.color, -14)} />
            </linearGradient>
          ))}
        </defs>
        <circle className="kq-donut-track" cx="70" cy="70" r={DONUT_RADIUS} strokeWidth={DONUT_STROKE} fill="none" />
        <g filter={`url(#${shadowId})`}>
          {drawn.map((slice, index) => {
            const fractionDeg = (slice.value / total) * 360;
            const visibleDeg = multiple ? Math.max(0.0001, fractionDeg - DONUT_GAP_DEG) : fractionDeg;
            const dash = (visibleDeg / 360) * DONUT_CIRC;
            const rotation = cumulativeDeg + (multiple ? DONUT_GAP_DEG / 2 : 0) - 90;
            cumulativeDeg += fractionDeg;

            return (
              <motion.circle
                key={slice.label}
                cx="70"
                cy="70"
                r={DONUT_RADIUS}
                fill="none"
                stroke={`url(#${gradId(index)})`}
                strokeWidth={DONUT_STROKE}
                strokeLinecap="butt"
                transform={`rotate(${rotation} 70 70)`}
                initial={{ strokeDasharray: `0 ${DONUT_CIRC}` }}
                whileInView={{ strokeDasharray: `${dash} ${DONUT_CIRC}` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.9, delay: 0.12 * index, ease: EASE }}
              />
            );
          })}
        </g>
        <circle className="kq-donut-hole" cx="70" cy="70" r={DONUT_RADIUS - DONUT_STROKE / 2 - 1} fill="none" />
        <motion.text
          x="70"
          y="66"
          className="kq-donut-total"
          textAnchor="middle"
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
          style={{ transformOrigin: "70px 62px" }}
        >
          {total}
        </motion.text>
        <text x="70" y="83" className="kq-donut-sub" textAnchor="middle">
          ACTIVITIES
        </text>
      </svg>
      <ul className="kq-donut-legend" id={labelId}>
        {data.map((slice) => {
          const pct = Math.round((slice.value / total) * 100);
          const empty = slice.value === 0;
          return (
            <li key={slice.label} className={empty ? "is-empty" : undefined}>
              <span
                className="kq-donut-dot"
                style={{ background: empty ? "transparent" : slice.color, borderColor: slice.color }}
              />
              <span className="kq-donut-legend-label">{slice.label}</span>
              <span className="kq-donut-legend-pct">{pct}%</span>
              <span className="kq-donut-legend-value">{slice.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Bar chart — animated vertical bars for activity counts.          */
/* ---------------------------------------------------------------- */
export function BarChart({ data }: { data: Slice[] }) {
  const max = data.reduce((m, d) => Math.max(m, d.value), 0) || 1;

  return (
    <div className="kq-bars" role="img" aria-label="Activity counts">
      {data.map((slice, index) => {
        const heightPct = (slice.value / max) * 100;
        return (
          <div className="kq-bar-col" key={slice.label}>
            <span className="kq-bar-value">{slice.value}</span>
            <div className="kq-bar-track">
              <motion.div
                className="kq-bar-fill"
                style={{ background: slice.color }}
                initial={{ height: 0 }}
                whileInView={{ height: `${heightPct}%` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.8, delay: 0.08 * index, ease: EASE }}
              />
            </div>
            <span className="kq-bar-label">{slice.label}</span>
          </div>
        );
      })}
    </div>
  );
}

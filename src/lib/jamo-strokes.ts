import { qCurve, type Stroke, type StrokeSeg } from "@/lib/pixel-adventure/strokes";

export type { Stroke, StrokeSeg };

export type JamoKind = "Consonant" | "Vowel";

// Approximates a circle (for ㅇ / ㅎ) as a single stroke of short segments.
function circleStroke(cx: number, cy: number, r: number, steps = 48): Stroke {
  const segs: Stroke = [];
  for (let i = 0; i < steps; i += 1) {
    const a0 = (i / steps) * Math.PI * 2;
    const a1 = ((i + 1) / steps) * Math.PI * 2;
    segs.push([cx + r * Math.cos(a0), cy + r * Math.sin(a0), cx + r * Math.cos(a1), cy + r * Math.sin(a1)]);
  }
  return segs;
}

/**
 * Builds a ㅅ ("s") shape centered at `cx` with the given half-width. The left
 * leg sweeps from the apex and bows gently outward to the lower-left; the right
 * leg branches just below the apex and bows out to the lower-right — matching
 * how ㅅ is actually handwritten. Reused for ㅆ (double s).
 */
function siotPair(cx: number, halfW: number, topY = 0.18, botY = 0.84): Stroke[] {
  const midY = (topY + botY) / 2;
  const left = qCurve(
    { x: cx, y: topY },
    { x: cx - halfW * 0.28, y: midY - 0.02 },
    { x: cx - halfW, y: botY },
    32,
  );
  const right = qCurve(
    { x: cx + halfW * 0.08, y: topY + 0.07 },
    { x: cx + halfW * 0.34, y: midY + 0.01 },
    { x: cx + halfW, y: botY },
    32,
  );
  return [left, right];
}

/**
 * Stroke data for every jamo in the Korean alphabet. Coordinates are normalized
 * (0–1) within the tracing square. Each entry is an ordered list of strokes, and
 * each stroke is a polyline of [x1, y1, x2, y2] segments drawn in writing order.
 */
export const JAMO_STROKE_DB: Record<string, Stroke[]> = {
  // ----- Basic consonants -----
  "ㄱ": [[[0.2, 0.25, 0.78, 0.25]], [[0.78, 0.25, 0.78, 0.78]]],
  "ㄴ": [[[0.25, 0.22, 0.25, 0.78]], [[0.25, 0.78, 0.78, 0.78]]],
  "ㄷ": [[[0.22, 0.22, 0.78, 0.22]], [[0.22, 0.22, 0.22, 0.78]], [[0.22, 0.78, 0.78, 0.78]]],
  "ㄹ": [
    [
      [0.24, 0.24, 0.74, 0.24],
      [0.74, 0.24, 0.74, 0.5],
    ],
    [[0.24, 0.5, 0.74, 0.5]],
    [
      [0.24, 0.5, 0.24, 0.78],
      [0.24, 0.78, 0.74, 0.78],
    ],
  ],
  "ㅁ": [[[0.22, 0.22, 0.22, 0.78]], [[0.22, 0.22, 0.78, 0.22]], [[0.78, 0.22, 0.78, 0.78]], [[0.22, 0.78, 0.78, 0.78]]],
  "ㅂ": [[[0.28, 0.2, 0.28, 0.78]], [[0.72, 0.2, 0.72, 0.78]], [[0.28, 0.5, 0.72, 0.5]], [[0.28, 0.78, 0.72, 0.78]]],
  "ㅅ": siotPair(0.5, 0.27),
  "ㅇ": [circleStroke(0.5, 0.5, 0.27)],
  "ㅈ": [
    [[0.22, 0.3, 0.78, 0.3]],
    qCurve({ x: 0.5, y: 0.32 }, { x: 0.4, y: 0.55 }, { x: 0.27, y: 0.78 }),
    qCurve({ x: 0.5, y: 0.32 }, { x: 0.6, y: 0.55 }, { x: 0.73, y: 0.78 }),
  ],
  "ㅊ": [
    [[0.42, 0.16, 0.58, 0.16]],
    [[0.22, 0.36, 0.78, 0.36]],
    qCurve({ x: 0.5, y: 0.38 }, { x: 0.4, y: 0.58 }, { x: 0.27, y: 0.8 }),
    qCurve({ x: 0.5, y: 0.38 }, { x: 0.6, y: 0.58 }, { x: 0.73, y: 0.8 }),
  ],
  "ㅋ": [
    [
      [0.22, 0.25, 0.75, 0.25],
      [0.75, 0.25, 0.75, 0.78],
    ],
    [[0.24, 0.5, 0.75, 0.5]],
  ],
  "ㅌ": [
    [[0.22, 0.24, 0.78, 0.24]],
    [[0.22, 0.51, 0.78, 0.51]],
    [
      [0.22, 0.24, 0.22, 0.78],
      [0.22, 0.78, 0.78, 0.78],
    ],
  ],
  "ㅍ": [[[0.2, 0.3, 0.8, 0.3]], [[0.36, 0.3, 0.36, 0.7]], [[0.64, 0.3, 0.64, 0.7]], [[0.2, 0.7, 0.8, 0.7]]],
  "ㅎ": [[[0.42, 0.14, 0.58, 0.14]], [[0.26, 0.34, 0.74, 0.34]], circleStroke(0.5, 0.64, 0.17)],

  // ----- Double consonants -----
  "ㄲ": [[[0.12, 0.27, 0.45, 0.27]], [[0.45, 0.27, 0.45, 0.75]], [[0.55, 0.27, 0.88, 0.27]], [[0.88, 0.27, 0.88, 0.75]]],
  "ㄸ": [
    [[0.12, 0.24, 0.45, 0.24]],
    [[0.12, 0.24, 0.12, 0.76]],
    [[0.12, 0.76, 0.45, 0.76]],
    [[0.55, 0.24, 0.88, 0.24]],
    [[0.55, 0.24, 0.55, 0.76]],
    [[0.55, 0.76, 0.88, 0.76]],
  ],
  "ㅃ": [
    [[0.12, 0.22, 0.12, 0.78]],
    [[0.42, 0.22, 0.42, 0.78]],
    [[0.12, 0.52, 0.42, 0.52]],
    [[0.12, 0.78, 0.42, 0.78]],
    [[0.58, 0.22, 0.58, 0.78]],
    [[0.88, 0.22, 0.88, 0.78]],
    [[0.58, 0.52, 0.88, 0.52]],
    [[0.58, 0.78, 0.88, 0.78]],
  ],
  "ㅆ": [...siotPair(0.28, 0.16, 0.22, 0.8), ...siotPair(0.72, 0.16, 0.22, 0.8)],
  "ㅉ": [
    [[0.1, 0.3, 0.46, 0.3]],
    qCurve({ x: 0.28, y: 0.32 }, { x: 0.2, y: 0.54 }, { x: 0.12, y: 0.75 }),
    qCurve({ x: 0.28, y: 0.32 }, { x: 0.36, y: 0.54 }, { x: 0.44, y: 0.75 }),
    [[0.54, 0.3, 0.9, 0.3]],
    qCurve({ x: 0.72, y: 0.32 }, { x: 0.64, y: 0.54 }, { x: 0.56, y: 0.75 }),
    qCurve({ x: 0.72, y: 0.32 }, { x: 0.8, y: 0.54 }, { x: 0.88, y: 0.75 }),
  ],

  // ----- Basic vowels -----
  "ㅏ": [[[0.45, 0.16, 0.45, 0.84]], [[0.45, 0.5, 0.66, 0.5]]],
  "ㅑ": [[[0.45, 0.16, 0.45, 0.84]], [[0.45, 0.38, 0.66, 0.38]], [[0.45, 0.62, 0.66, 0.62]]],
  "ㅓ": [[[0.34, 0.5, 0.55, 0.5]], [[0.55, 0.16, 0.55, 0.84]]],
  "ㅕ": [[[0.34, 0.38, 0.55, 0.38]], [[0.34, 0.62, 0.55, 0.62]], [[0.55, 0.16, 0.55, 0.84]]],
  "ㅗ": [[[0.5, 0.34, 0.5, 0.56]], [[0.22, 0.56, 0.78, 0.56]]],
  "ㅛ": [[[0.38, 0.34, 0.38, 0.56]], [[0.62, 0.34, 0.62, 0.56]], [[0.22, 0.56, 0.78, 0.56]]],
  "ㅜ": [[[0.22, 0.44, 0.78, 0.44]], [[0.5, 0.44, 0.5, 0.66]]],
  "ㅠ": [[[0.22, 0.42, 0.78, 0.42]], [[0.4, 0.42, 0.4, 0.64]], [[0.6, 0.42, 0.6, 0.64]]],
  "ㅡ": [[[0.22, 0.5, 0.78, 0.5]]],
  "ㅣ": [[[0.5, 0.16, 0.5, 0.84]]],

  // ----- Complex vowels -----
  "ㅐ": [[[0.4, 0.16, 0.4, 0.84]], [[0.4, 0.5, 0.58, 0.5]], [[0.66, 0.16, 0.66, 0.84]]],
  "ㅒ": [[[0.38, 0.16, 0.38, 0.84]], [[0.38, 0.38, 0.56, 0.38]], [[0.38, 0.62, 0.56, 0.62]], [[0.66, 0.16, 0.66, 0.84]]],
  "ㅔ": [[[0.34, 0.5, 0.5, 0.5]], [[0.5, 0.16, 0.5, 0.84]], [[0.66, 0.16, 0.66, 0.84]]],
  "ㅖ": [[[0.32, 0.38, 0.5, 0.38]], [[0.32, 0.62, 0.5, 0.62]], [[0.5, 0.16, 0.5, 0.84]], [[0.66, 0.16, 0.66, 0.84]]],
  // ㅗ-based (vertical stub points up): ㅘ ㅙ ㅚ
  "ㅘ": [
    [[0.31, 0.54, 0.31, 0.7]], // ㅗ stub
    [[0.1, 0.7, 0.52, 0.7]], // ㅗ bar
    [[0.68, 0.12, 0.68, 0.88]], // ㅏ stem
    [[0.68, 0.5, 0.86, 0.5]], // ㅏ tick
  ],
  "ㅙ": [
    [[0.27, 0.54, 0.27, 0.7]], // ㅗ stub
    [[0.08, 0.7, 0.46, 0.7]], // ㅗ bar
    [[0.6, 0.12, 0.6, 0.88]], // ㅐ stem
    [[0.6, 0.5, 0.74, 0.5]], // ㅐ tick
    [[0.84, 0.12, 0.84, 0.88]], // ㅐ outer stem
  ],
  "ㅚ": [
    [[0.31, 0.54, 0.31, 0.7]], // ㅗ stub
    [[0.1, 0.7, 0.54, 0.7]], // ㅗ bar
    [[0.72, 0.12, 0.72, 0.88]], // ㅣ stem
  ],
  // ㅜ-based (vertical stub points down): ㅝ ㅞ ㅟ
  "ㅝ": [
    [[0.1, 0.6, 0.52, 0.6]], // ㅜ bar
    [[0.31, 0.6, 0.31, 0.78]], // ㅜ stub
    [[0.56, 0.5, 0.72, 0.5]], // ㅓ tick
    [[0.72, 0.12, 0.72, 0.88]], // ㅓ stem
  ],
  "ㅞ": [
    [[0.08, 0.6, 0.46, 0.6]], // ㅜ bar
    [[0.27, 0.6, 0.27, 0.78]], // ㅜ stub
    [[0.5, 0.5, 0.62, 0.5]], // ㅔ tick
    [[0.62, 0.12, 0.62, 0.88]], // ㅔ stem
    [[0.82, 0.12, 0.82, 0.88]], // ㅔ outer stem
  ],
  "ㅟ": [
    [[0.1, 0.6, 0.52, 0.6]], // ㅜ bar
    [[0.31, 0.6, 0.31, 0.78]], // ㅜ stub
    [[0.7, 0.12, 0.7, 0.88]], // ㅣ stem
  ],
  // ㅡ-based: ㅢ
  "ㅢ": [
    [[0.1, 0.7, 0.54, 0.7]], // ㅡ bar
    [[0.7, 0.12, 0.7, 0.88]], // ㅣ stem
  ],
};

export const JAMO_LIST: { ch: string; kind: JamoKind }[] = [
  // Basic consonants
  { ch: "ㄱ", kind: "Consonant" },
  { ch: "ㄴ", kind: "Consonant" },
  { ch: "ㄷ", kind: "Consonant" },
  { ch: "ㄹ", kind: "Consonant" },
  { ch: "ㅁ", kind: "Consonant" },
  { ch: "ㅂ", kind: "Consonant" },
  { ch: "ㅅ", kind: "Consonant" },
  { ch: "ㅇ", kind: "Consonant" },
  { ch: "ㅈ", kind: "Consonant" },
  { ch: "ㅊ", kind: "Consonant" },
  { ch: "ㅋ", kind: "Consonant" },
  { ch: "ㅌ", kind: "Consonant" },
  { ch: "ㅍ", kind: "Consonant" },
  { ch: "ㅎ", kind: "Consonant" },
  // Double consonants
  { ch: "ㄲ", kind: "Consonant" },
  { ch: "ㄸ", kind: "Consonant" },
  { ch: "ㅃ", kind: "Consonant" },
  { ch: "ㅆ", kind: "Consonant" },
  { ch: "ㅉ", kind: "Consonant" },
  // Basic vowels
  { ch: "ㅏ", kind: "Vowel" },
  { ch: "ㅑ", kind: "Vowel" },
  { ch: "ㅓ", kind: "Vowel" },
  { ch: "ㅕ", kind: "Vowel" },
  { ch: "ㅗ", kind: "Vowel" },
  { ch: "ㅛ", kind: "Vowel" },
  { ch: "ㅜ", kind: "Vowel" },
  { ch: "ㅠ", kind: "Vowel" },
  { ch: "ㅡ", kind: "Vowel" },
  { ch: "ㅣ", kind: "Vowel" },
  // Complex vowels
  { ch: "ㅐ", kind: "Vowel" },
  { ch: "ㅒ", kind: "Vowel" },
  { ch: "ㅔ", kind: "Vowel" },
  { ch: "ㅖ", kind: "Vowel" },
  { ch: "ㅘ", kind: "Vowel" },
  { ch: "ㅙ", kind: "Vowel" },
  { ch: "ㅚ", kind: "Vowel" },
  { ch: "ㅝ", kind: "Vowel" },
  { ch: "ㅞ", kind: "Vowel" },
  { ch: "ㅟ", kind: "Vowel" },
  { ch: "ㅢ", kind: "Vowel" },
];

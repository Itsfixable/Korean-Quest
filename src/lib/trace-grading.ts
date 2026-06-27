import type { Stroke } from "@/lib/pixel-adventure/strokes";

export type Point = { x: number; y: number };

export interface GradeOptions {
  /** Canvas resolution the strokes were captured at (square). */
  size?: number;
  /** Pen width used for both template and user ink. */
  lineWidth?: number;
}

export interface GradeResult {
  /** Final grade, 0–100. */
  score: number;
  /** Fraction of the template that the learner actually traced (0–1). */
  coverage: number;
  /** Fraction of the learner's ink that lands on the template (0–1). */
  precision: number;
  /** Whole-shape similarity (F1 of coverage & precision), 0–1. */
  shapeScore: number;
  /** Per-stroke structural similarity, 0–1. */
  strokeScore: number;
  /** How well stroke direction matched the template, 0–1. */
  directionScore: number;
  /** template strokes − user strokes (positive = strokes missing). */
  strokeCountDelta: number;
  /** Short, learner-facing feedback line. */
  feedback: string;
}

const DEFAULT_SIZE = 320;
const DEFAULT_LINE_WIDTH = 16;

// Resolution-independent points sampled along each stroke for structural matching.
const RESAMPLE_POINTS = 32;
// Relative weighting of whole-shape vs. per-stroke structure in the final score.
const SHAPE_WEIGHT = 0.6;
const STROKE_WEIGHT = 0.4;

/* -------------------------------------------------------------------------- */
/* Rasterization                                                              */
/* -------------------------------------------------------------------------- */

function rasterizePolylines(polylines: Point[][], size: number, lineWidth: number): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array(size * size);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000";
  polylines.forEach((pts) => {
    if (pts.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) {
      // A single tap still leaves a round dot.
      ctx.lineTo(pts[0].x + 0.01, pts[0].y);
    } else {
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  });
  const data = ctx.getImageData(0, 0, size, size).data;
  const mask = new Uint8Array(size * size);
  for (let i = 0; i < mask.length; i += 1) mask[i] = data[i * 4 + 3] > 0 ? 1 : 0;
  return mask;
}

/* -------------------------------------------------------------------------- */
/* Exact Euclidean distance transform (Felzenszwalb & Huttenlocher, 2012)     */
/* -------------------------------------------------------------------------- */

const INF = 1e20;

function edt1d(f: Float64Array, n: number, out: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    const dx = q - v[k];
    out[q] = dx * dx + f[v[k]];
  }
}

/** Returns, for every pixel, the Euclidean distance (in px) to the nearest set pixel. */
function distanceTransform(mask: Uint8Array, size: number): Float64Array {
  const dist = new Float64Array(size * size);
  for (let i = 0; i < dist.length; i += 1) dist[i] = mask[i] ? 0 : INF;

  const maxDim = size;
  const f = new Float64Array(maxDim);
  const out = new Float64Array(maxDim);
  const v = new Int32Array(maxDim);
  const z = new Float64Array(maxDim + 1);

  // Columns.
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) f[y] = dist[y * size + x];
    edt1d(f, size, out, v, z);
    for (let y = 0; y < size; y += 1) dist[y * size + x] = out[y];
  }
  // Rows.
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * size;
    for (let x = 0; x < size; x += 1) f[x] = dist[rowOffset + x];
    edt1d(f, size, out, v, z);
    for (let x = 0; x < size; x += 1) dist[rowOffset + x] = Math.sqrt(out[x]);
  }
  return dist;
}

/* -------------------------------------------------------------------------- */
/* Whole-shape similarity                                                     */
/* -------------------------------------------------------------------------- */

// Soft membership: full credit within `core` px, linearly fading to 0 at `tol` px.
function falloff(dist: number, core: number, tol: number): number {
  if (dist <= core) return 1;
  if (dist >= tol) return 0;
  return 1 - (dist - core) / (tol - core);
}

function softOverlap(mask: Uint8Array, otherDist: Float64Array, core: number, tol: number): number {
  let count = 0;
  let sum = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    count += 1;
    sum += falloff(otherDist[i], core, tol);
  }
  return count === 0 ? 0 : sum / count;
}

/* -------------------------------------------------------------------------- */
/* Stroke structure                                                           */
/* -------------------------------------------------------------------------- */

function strokeToPolyline(stroke: Stroke, scale: number): Point[] {
  const pts: Point[] = [];
  stroke.forEach(([x1, y1, x2, y2], i) => {
    if (i === 0) pts.push({ x: x1 * scale, y: y1 * scale });
    pts.push({ x: x2 * scale, y: y2 * scale });
  });
  return pts;
}

/** Resamples a polyline into `n` points evenly spaced by arc length. */
function resample(points: Point[], n: number): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return new Array(n).fill(null).map(() => ({ ...points[0] }));

  let total = 0;
  const segLen: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    segLen.push(d);
    total += d;
  }
  if (total === 0) return new Array(n).fill(null).map(() => ({ ...points[0] }));

  const step = total / (n - 1);
  const out: Point[] = [points[0]];
  let segIdx = 0;
  let segPos = 0;
  for (let k = 1; k < n - 1; k += 1) {
    const target = k * step;
    while (segIdx < segLen.length - 1 && segPos + segLen[segIdx] < target) {
      segPos += segLen[segIdx];
      segIdx += 1;
    }
    const segStart = points[segIdx];
    const segEnd = points[segIdx + 1];
    const len = segLen[segIdx] || 1e-6;
    const t = Math.min(1, Math.max(0, (target - segPos) / len));
    out.push({ x: segStart.x + (segEnd.x - segStart.x) * t, y: segStart.y + (segEnd.y - segStart.y) * t });
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Symmetric mean nearest-neighbour (chamfer) distance between two point sets. */
function chamfer(a: Point[], b: Point[]): number {
  const dir = (from: Point[], to: Point[]) => {
    let sum = 0;
    for (const p of from) {
      let best = Infinity;
      for (const q of to) {
        const d = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
        if (d < best) best = d;
      }
      sum += Math.sqrt(best);
    }
    return sum / from.length;
  };
  return (dir(a, b) + dir(b, a)) / 2;
}

function directionAgreement(a: Point[], b: Point[]): number {
  const va = { x: a[a.length - 1].x - a[0].x, y: a[a.length - 1].y - a[0].y };
  const vb = { x: b[b.length - 1].x - b[0].x, y: b[b.length - 1].y - b[0].y };
  const ma = Math.hypot(va.x, va.y);
  const mb = Math.hypot(vb.x, vb.y);
  if (ma < 1e-6 || mb < 1e-6) return 1; // dots / closed shapes: no meaningful direction.
  const cos = (va.x * vb.x + va.y * vb.y) / (ma * mb);
  return (cos + 1) / 2; // map [-1,1] → [0,1]
}

/* -------------------------------------------------------------------------- */
/* Main entry point                                                           */
/* -------------------------------------------------------------------------- */

export function gradeTrace(
  template: Stroke[],
  userStrokes: Point[][],
  opts: GradeOptions = {},
): GradeResult {
  const size = opts.size ?? DEFAULT_SIZE;
  const lineWidth = opts.lineWidth ?? DEFAULT_LINE_WIDTH;
  const empty: GradeResult = {
    score: 0,
    coverage: 0,
    precision: 0,
    shapeScore: 0,
    strokeScore: 0,
    directionScore: 0,
    strokeCountDelta: template.length,
    feedback: "Draw the strokes first 🙂",
  };
  if (!template.length) return { ...empty, feedback: "Unknown character template." };
  const drawn = userStrokes.filter((s) => s.length > 0);
  if (drawn.length === 0) return empty;

  /* ---- Whole-shape similarity via distance transforms ---- */
  const templatePolys = template.map((stroke) => strokeToPolyline(stroke, size));
  const templateMask = rasterizePolylines(templatePolys, size, lineWidth);
  const userMask = rasterizePolylines(drawn, size, lineWidth);
  const templateDist = distanceTransform(templateMask, size);
  const userDist = distanceTransform(userMask, size);

  // Within half a pen-width of the centerline is "on the line"; fade out to ~2 widths.
  const core = lineWidth * 0.6;
  const tol = lineWidth * 2.0;
  const coverage = softOverlap(templateMask, userDist, core, tol); // template covered by user
  const precision = softOverlap(userMask, templateDist, core, tol); // user landing on template
  const shapeScore = coverage + precision > 0 ? (2 * coverage * precision) / (coverage + precision) : 0;

  /* ---- Per-stroke structure ---- */
  const tStrokes = templatePolys.map((p) => resample(p, RESAMPLE_POINTS));
  const uStrokes = drawn.map((p) => resample(p, RESAMPLE_POINTS));

  // Cost matrix of chamfer distances between every template/user stroke pair.
  const cost: number[][] = tStrokes.map((t) => uStrokes.map((u) => chamfer(t, u)));

  // Greedy assignment (best pair first). Stroke counts are small, so this is plenty.
  const assignedUser: number[] = new Array(tStrokes.length).fill(-1);
  const usedUser = new Set<number>();
  const usedTemplate = new Set<number>();
  const pairs: { t: number; u: number; cost: number }[] = [];
  for (let t = 0; t < tStrokes.length; t += 1)
    for (let u = 0; u < uStrokes.length; u += 1) pairs.push({ t, u, cost: cost[t][u] });
  pairs.sort((a, b) => a.cost - b.cost);
  for (const { t, u } of pairs) {
    if (usedTemplate.has(t) || usedUser.has(u)) continue;
    assignedUser[t] = u;
    usedTemplate.add(t);
    usedUser.add(u);
  }

  // Per-stroke similarity from chamfer distance (same soft falloff as the shape pass).
  let strokeSum = 0;
  let dirSum = 0;
  let matched = 0;
  for (let t = 0; t < tStrokes.length; t += 1) {
    const u = assignedUser[t];
    if (u === -1) continue; // missing stroke contributes 0
    matched += 1;
    strokeSum += falloff(cost[t][u], core, tol);
    dirSum += directionAgreement(tStrokes[t], uStrokes[u]);
  }
  const strokeShape = strokeSum / tStrokes.length; // unmatched template strokes drag this down
  const directionScore = matched === 0 ? 0 : dirSum / matched;

  // Reward writing strokes in the taught order (monotonic assignment).
  let orderHits = 0;
  let orderPairs = 0;
  let prev = -1;
  for (let t = 0; t < tStrokes.length; t += 1) {
    const u = assignedUser[t];
    if (u === -1) continue;
    if (prev !== -1) {
      orderPairs += 1;
      if (u > prev) orderHits += 1;
    }
    prev = u;
  }
  const orderFrac = orderPairs === 0 ? 1 : orderHits / orderPairs;

  const extra = Math.max(0, drawn.length - template.length);
  const extraPenalty = Math.min(0.3, extra * 0.1);

  const strokeScore = Math.max(
    0,
    strokeShape * (0.8 + 0.1 * orderFrac + 0.1 * directionScore) - extraPenalty,
  );

  /* ---- Combine ---- */
  const combined = SHAPE_WEIGHT * shapeScore + STROKE_WEIGHT * strokeScore;
  const score = Math.round(100 * Math.min(1, Math.max(0, combined)));
  const strokeCountDelta = template.length - drawn.length;

  return {
    score,
    coverage,
    precision,
    shapeScore,
    strokeScore,
    directionScore,
    strokeCountDelta,
    feedback: buildFeedback({ score, coverage, precision, strokeCountDelta, orderFrac, directionScore }),
  };
}

function buildFeedback(d: {
  score: number;
  coverage: number;
  precision: number;
  strokeCountDelta: number;
  orderFrac: number;
  directionScore: number;
}): string {
  if (d.strokeCountDelta > 0) return "You missed a stroke — trace every part of the character.";
  if (d.strokeCountDelta < 0) return "Too many strokes — try to draw it with fewer pen lifts.";
  if (d.coverage < 0.6) return "Trace closer to the whole guide — parts were left out.";
  if (d.precision < 0.6) return "Keep your lines on the guide — some strokes drifted off.";
  if (d.orderFrac < 0.5) return "Great shape! Try following the numbered stroke order next time.";
  if (d.directionScore < 0.5) return "Nice! Check the stroke direction (top-to-bottom, left-to-right).";
  if (d.score >= 90) return "Excellent — clean, accurate strokes!";
  if (d.score >= 75) return "Nicely done!";
  return "Good effort — refine the shape a little more.";
}

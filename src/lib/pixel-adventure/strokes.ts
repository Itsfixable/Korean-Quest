export type StrokeSeg = [number, number, number, number];
export type Stroke = StrokeSeg[];

export function qCurve(
  p0: { x: number; y: number },
  cp: { x: number; y: number },
  p1: { x: number; y: number },
  steps = 24,
): Stroke {
  const segs: Stroke = [];
  const Q = (a: number, b: number, c: number, t: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  let prevX = p0.x;
  let prevY = p0.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = Q(p0.x, cp.x, p1.x, t);
    const y = Q(p0.y, cp.y, p1.y, t);
    segs.push([prevX, prevY, x, y]);
    prevX = x;
    prevY = y;
  }
  return segs;
}

export const SIOT_STROKE: Stroke[] = [
  qCurve({ x: 0.24, y: 0.78 }, { x: 0.44, y: 0.48 }, { x: 0.5, y: 0.22 }, 24),
  qCurve({ x: 0.76, y: 0.78 }, { x: 0.56, y: 0.48 }, { x: 0.5, y: 0.22 }, 24),
];

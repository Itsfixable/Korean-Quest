"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/alphabetWorld.css";
import "@/styles/pages/jamo.css";
import "@/styles/pages/jamo-select-enhancements.css";
import { SIOT_STROKE } from "@/lib/pixel-adventure/strokes";

type StrokeSeg = [number, number, number, number];
type Stroke = StrokeSeg[];

const STROKE_DB: Record<string, Stroke[]> = {
  "ㄱ": [[[0.2, 0.25, 0.75, 0.25]], [[0.75, 0.25, 0.75, 0.78]]],
  "ㄴ": [[[0.25, 0.22, 0.25, 0.78]], [[0.25, 0.78, 0.78, 0.78]]],
  "ㄷ": [[[0.22, 0.22, 0.78, 0.22]], [[0.22, 0.22, 0.22, 0.78]], [[0.22, 0.78, 0.78, 0.78]]],
  "ㅁ": [[[0.22, 0.22, 0.22, 0.78]], [[0.22, 0.22, 0.78, 0.22]], [[0.78, 0.22, 0.78, 0.78]], [[0.22, 0.78, 0.78, 0.78]]],
  "ㅂ": [[[0.27, 0.22, 0.27, 0.74]], [[0.73, 0.22, 0.73, 0.74]], [[0.27, 0.52, 0.73, 0.52]], [[0.27, 0.78, 0.73, 0.78]]],
  "ㅅ": SIOT_STROKE,
  "ㅏ": [[[0.45, 0.18, 0.45, 0.82]], [[0.45, 0.5, 0.65, 0.5]]],
  "ㅓ": [[[0.35, 0.5, 0.55, 0.5]], [[0.55, 0.18, 0.55, 0.82]]],
  "ㅗ": [[[0.5, 0.35, 0.5, 0.55]], [[0.22, 0.55, 0.78, 0.55]]],
  "ㅣ": [[[0.55, 0.18, 0.55, 0.82]]],
  "ㅠ": [[[0.22, 0.4, 0.78, 0.4]], [[0.4, 0.4, 0.4, 0.6]], [[0.6, 0.4, 0.6, 0.6]]],
  "ㅡ": [[[0.22, 0.55, 0.78, 0.55]]],
};

const JAMO = [
  { ch: "ㄱ", kind: "Consonant" },
  { ch: "ㄴ", kind: "Consonant" },
  { ch: "ㄷ", kind: "Consonant" },
  { ch: "ㅁ", kind: "Consonant" },
  { ch: "ㅂ", kind: "Consonant" },
  { ch: "ㅅ", kind: "Consonant" },
  { ch: "ㅏ", kind: "Vowel" },
  { ch: "ㅓ", kind: "Vowel" },
  { ch: "ㅗ", kind: "Vowel" },
  { ch: "ㅣ", kind: "Vowel" },
  { ch: "ㅠ", kind: "Vowel" },
  { ch: "ㅡ", kind: "Vowel" },
];

function starsHTML(n: number) {
  return `${"⭐".repeat(n)}${"☆".repeat(3 - n)}`;
}

function isLight() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function tplColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--preview-template").trim() || (isLight() ? "#a0acc2" : "#6e7da3");
}

function drawColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--preview-draw").trim() || (isLight() ? "#101318" : "#ffffff");
}

function JamoPreviewCanvas({ ch }: { ch: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const lw = 10;
    const strokes = STROKE_DB[ch] || [];
    let raf = 0;
    let t0 = 0;
    const STROKE_TIME = 520;
    const GAP = 220;
    const N = strokes.length;

    const segLine = (seg: StrokeSeg, t: number) => {
      const [x1, y1, x2, y2] = seg;
      const X1 = x1 * W;
      const Y1 = y1 * H;
      const X2 = x2 * W;
      const Y2 = y2 * H;
      const dx = X2 - X1;
      const dy = Y2 - Y1;
      ctx.beginPath();
      ctx.moveTo(X1, Y1);
      ctx.lineTo(X1 + dx * t, Y1 + dy * t);
      ctx.stroke();
    };

    const drawTemplate = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = tplColor();
      strokes.forEach((segs) => segs.forEach((s) => segLine(s, 1)));
    };

    const frame = (ts: number) => {
      if (!t0) t0 = ts;
      const t = ts - t0;
      const total = N * (STROKE_TIME + GAP);
      if (t >= total) {
        t0 = ts;
        drawTemplate();
        raf = requestAnimationFrame(frame);
        return;
      }

      let acc = 0;
      let idx = 0;
      let local = 0;
      for (let i = 0; i < N; i += 1) {
        const dur = STROKE_TIME + GAP;
        if (t < acc + dur) {
          idx = i;
          local = Math.min(1, (t - acc) / STROKE_TIME);
          break;
        }
        acc += dur;
      }

      drawTemplate();
      ctx.strokeStyle = drawColor();
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let s = 0; s < idx; s += 1) strokes[s].forEach((seg) => segLine(seg, 1));
      strokes[idx]?.forEach((seg) => segLine(seg, local));
      raf = requestAnimationFrame(frame);
    };

    drawTemplate();
    raf = requestAnimationFrame(frame);

    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      t0 = 0;
      drawTemplate();
      raf = requestAnimationFrame(frame);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [ch]);

  return (
    <canvas
      ref={canvasRef}
      data-char={ch}
      width={120}
      height={120}
      aria-label={`Stroke order preview for ${ch}`}
    />
  );
}

export default function JamoSelectView() {
  const getJamoStars = useGameStore((s) => s.getJamoStars);

  return (
    <section className="card">
      <h1>Choose a Jamo</h1>
      <p className="muted">
        Tap a character to practice. The preview animates the <strong>traditional stroke order</strong>.
      </p>

      <div className="aw-grid kq-stagger" id="jamoGrid" role="list">
        {JAMO.map(({ ch, kind }) => {
          const earned = getJamoStars(ch);
          return (
            <Link
              key={ch}
              href={`/tracing?char=${encodeURIComponent(ch)}`}
              className={`aw-level-card kq-jamo-card kq-stars-${earned}`}
              data-char={ch}
              role="listitem"
              aria-label={`Practice ${ch}`}
            >
              <header className="aw-level-head">
                <h3 className="aw-level-char">{ch}</h3>
                <span className="aw-pill">{kind}</span>
              </header>
              <div className="aw-preview-wrap">
                <JamoPreviewCanvas ch={ch} />
              </div>
              <div className="kq-star-display">{starsHTML(earned)}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/tracing.css";
import "@/styles/pages/tracing-enhancements.css";
import { JAMO_STROKE_DB } from "@/lib/jamo-strokes";
import { gradeTrace } from "@/lib/trace-grading";

type Point = { x: number; y: number };
type StrokeDraw = { points: Point[] };

const STROKE_DB = JAMO_STROKE_DB;

const CSS_SIZE = 320;
const SIZE = CSS_SIZE;
const LW = 16;

interface TracingViewProps {
  char?: string;
}

function starsText(n: number) {
  return `${"⭐".repeat(n)}${"☆".repeat(3 - n)}`;
}

export default function TracingView({ char }: TracingViewProps) {
  const [queryChar, setQueryChar] = useState<string | undefined>(char);

  useEffect(() => {
    if (char) return;
    const c = new URLSearchParams(window.location.search).get("char");
    if (c) setQueryChar(c);
  }, [char]);

  const getJamoStars = useGameStore((s) => s.getJamoStars);
  const setJamoStars = useGameStore((s) => s.setJamoStars);
  const addXP = useGameStore((s) => s.addXP);
  const addCoins = useGameStore((s) => s.addCoins);
  const addBadge = useGameStore((s) => s.addBadge);
  const addRecentWork = useGameStore((s) => s.addRecentWork);

  const target = useMemo(() => {
    const decoded = decodeURIComponent(queryChar || "ㄱ");
    return STROKE_DB[decoded] ? decoded : "ㄱ";
  }, [queryChar]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<StrokeDraw[]>([]);
  const guidePointsRef = useRef<(Point & { stroke: number })[]>([]);
  const guideIndexRef = useRef(0);
  const drawingRef = useRef(false);
  const dotDraggingRef = useRef(false);
  const lastRef = useRef<Point | null>(null);

  const [stage, setStage] = useState(1);
  const [earnedStars, setEarnedStars] = useState(0);
  const [scoreHtml, setScoreHtml] = useState("");
  const [, bumpRender] = useState(0);

  useEffect(() => {
    const earned = getJamoStars(target);
    setEarnedStars(earned);
    setStage(Math.max(1, Math.min(3, earned + 1)));
  }, [target, getJamoStars]);

  const isLight = () => document.documentElement.getAttribute("data-theme") === "light";
  const inkColor = () => (isLight() ? "#111318" : "#ffffff");
  const templateColor = () => (isLight() ? "rgba(91,114,159,0.28)" : "rgba(255,255,255,0.28)");

  const N = (v: number) => Math.round(v * SIZE);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    const cssW = Math.round(r.width) || CSS_SIZE;
    const cssH = Math.round(r.height) || CSS_SIZE;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(canvas.width / SIZE, 0, 0, canvas.height / SIZE, 0, 0);
    return ctx;
  }, []);

  const getInkCtx = () => {
    if (!inkRef.current) {
      const c = document.createElement("canvas");
      c.width = SIZE;
      c.height = SIZE;
      inkRef.current = c;
    }
    return inkRef.current.getContext("2d");
  };

  const flattenGuidePoints = useCallback(() => {
    const points: (Point & { stroke: number })[] = [];
    (STROKE_DB[target] || []).forEach((stroke, strokeIndex) => {
      stroke.forEach(([x1, y1, x2, y2]) => {
        for (let i = 0; i <= 40; i += 1) {
          const t = i / 40;
          points.push({
            x: N(x1 + (x2 - x1) * t),
            y: N(y1 + (y2 - y1) * t),
            stroke: strokeIndex,
          });
        }
      });
    });
    guidePointsRef.current = points;
    guideIndexRef.current = 0;
  }, [target]);

  const clearInk = useCallback(() => {
    strokesRef.current = [];
    guideIndexRef.current = 0;
    getInkCtx()?.clearRect(0, 0, SIZE, SIZE);
  }, []);

  const render = useCallback(() => {
    const ctx = setupCanvas();
    const ink = inkRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    if (stage !== 3) {
      ctx.strokeStyle = templateColor();
      ctx.lineWidth = LW;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      (STROKE_DB[target] || []).forEach((stroke) => {
        stroke.forEach((seg) => {
          const [x1, y1, x2, y2] = seg.map(N);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
      });
    }

    if (stage === 1) {
      const guidePoints = guidePointsRef.current;
      const guideIndex = guideIndexRef.current;
      ctx.strokeStyle = "#5b729f";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      let prevStroke: number | null = null;
      let pathStarted = false;
      for (let i = 0; i <= guideIndex; i += 1) {
        const p = guidePoints[i];
        if (!p) continue;
        if (!pathStarted || p.stroke !== prevStroke) {
          if (pathStarted) ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          pathStarted = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
        prevStroke = p.stroke;
      }
      if (pathStarted) ctx.stroke();
      const dot = guidePoints[guideIndex] || guidePoints[0];
      if (dot) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#f06bb8";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }
    } else if (ink) {
      ctx.drawImage(ink, 0, 0, SIZE, SIZE);
    }

    if (stage === 3) {
      const mid = SIZE / 2;
      ctx.strokeStyle = "rgba(91,114,159,0.35)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(mid, 0);
      ctx.lineTo(mid, SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(SIZE, mid);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [setupCanvas, stage, target]);

  const playStarAwardAnimation = (starNumber: number) => {
    const targetStars = document.getElementById("kqTraceStars");
    if (!targetStars) return;
    const targetRect = targetStars.getBoundingClientRect();
    const star = document.createElement("div");
    star.className = "kq-award-star-fly";
    star.textContent = "⭐";
    star.style.setProperty("--end-x", `${targetRect.left + starNumber * 28}px`);
    star.style.setProperty("--end-y", `${targetRect.top + targetRect.height / 2}px`);
    document.body.appendChild(star);
    window.setTimeout(() => star.remove(), 1250);
  };

  const awardStageStar = useCallback(
    (starCount: number) => {
      const prev = getJamoStars(target);
      if (starCount > prev) {
        setJamoStars(target, starCount);
        setEarnedStars(starCount);
        playStarAwardAnimation(starCount);
        const xp = starCount === 1 ? 60 : starCount === 2 ? 90 : 150;
        const coins = starCount === 1 ? 30 : starCount === 2 ? 60 : 120;
        addXP(xp);
        addCoins(coins);
        addBadge("Tracing Starter");
        addRecentWork(`Earned ${starCount} star${starCount > 1 ? "s" : ""} on ${target}`, "Trace");
        setScoreHtml(`🎉 Stage ${starCount} complete! +${xp} XP · +${coins} coins<br/>${starsText(starCount)}`);
      } else {
        setScoreHtml(`✅ Stage ${starCount} already completed.<br/>${starsText(prev)}`);
      }
      setStage(Math.min(3, Math.max(starCount + 1, stage + 1)));
      clearInk();
      bumpRender((n) => n + 1);
    },
    [addBadge, addCoins, addRecentWork, addXP, clearInk, getJamoStars, setJamoStars, stage, target],
  );

  const handleGuideDrag = useCallback(
    (p: Point) => {
      if (stage !== 1) return;
      const pts = guidePointsRef.current;
      if (!pts.length) return;

      // Advance through every guide point the cursor has reached this move so
      // the dot keeps up even on fast drags. We step forward while the cursor
      // is near the path and getting closer to the next point than the current
      // one (i.e. genuinely progressing along the stroke).
      const MAX_DIST = 48;
      let idx = guideIndexRef.current;
      let moved = false;
      while (idx + 1 < pts.length) {
        const cur = pts[idx];
        const nxt = pts[idx + 1];
        // Crossing into a new stroke: there is a visual gap between strokes, so
        // once the current stroke is finished snap the dot to the next stroke's
        // start instead of waiting for the cursor to be near it.
        if (nxt.stroke !== cur.stroke) {
          idx += 1;
          moved = true;
          continue;
        }
        const dCur = Math.hypot(p.x - cur.x, p.y - cur.y);
        const dNxt = Math.hypot(p.x - nxt.x, p.y - nxt.y);
        if (dNxt < MAX_DIST && dNxt <= dCur) {
          idx += 1;
          moved = true;
        } else {
          break;
        }
      }

      if (moved) {
        guideIndexRef.current = idx;
        render();
      }
      if (idx >= pts.length - 2) {
        awardStageStar(1);
      }
    },
    [awardStageStar, render, stage],
  );

  const toCanvasXY = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const p = "touches" in e ? e.touches[0] : e;
    return {
      x: (p.clientX - r.left) * (SIZE / r.width),
      y: (p.clientY - r.top) * (SIZE / r.height),
    };
  };

  const gradeDrawing = () => {
    const tpl = STROKE_DB[target];
    if (!tpl) {
      setScoreHtml("Unknown character template.");
      return;
    }
    if (strokesRef.current.length === 0) {
      setScoreHtml("Draw the strokes first 🙂");
      return;
    }

    const result = gradeTrace(
      tpl,
      strokesRef.current.map((s) => s.points),
      { size: SIZE, lineWidth: LW },
    );
    const { score, feedback } = result;

    // Stage 3 (blank test) has no guide, so it's graded a little more leniently
    // than Stage 2 where the stroke order is still visible.
    const passScore = stage === 2 ? 70 : 62;
    const starToAward = stage === 2 ? 2 : 3;
    if (score >= passScore) {
      awardStageStar(starToAward);
    } else {
      setScoreHtml(
        `Score: <strong>${score}</strong>/100 (need ${passScore})<br/>${feedback}`,
      );
    }
  };

  useEffect(() => {
    flattenGuidePoints();
    clearInk();
    render();
  }, [target, stage, flattenGuidePoints, clearInk, render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const beginDraw = (e: MouseEvent | TouchEvent) => {
      const p = toCanvasXY(e);
      if (stage === 1) {
        dotDraggingRef.current = true;
        handleGuideDrag(p);
        return;
      }
      drawingRef.current = true;
      lastRef.current = p;
      strokesRef.current.push({ points: [p] });
    };

    const moveDraw = (e: MouseEvent | TouchEvent) => {
      const p = toCanvasXY(e);
      if (stage === 1 && dotDraggingRef.current) {
        handleGuideDrag(p);
        return;
      }
      if (!drawingRef.current || !lastRef.current) return;
      const ictx = getInkCtx();
      if (!ictx) return;
      ictx.strokeStyle = inkColor();
      ictx.lineWidth = LW;
      ictx.lineCap = "round";
      ictx.lineJoin = "round";
      ictx.beginPath();
      ictx.moveTo(lastRef.current.x, lastRef.current.y);
      ictx.lineTo(p.x, p.y);
      ictx.stroke();
      lastRef.current = p;
      strokesRef.current[strokesRef.current.length - 1].points.push(p);
      render();
    };

    const endDraw = () => {
      drawingRef.current = false;
      dotDraggingRef.current = false;
    };

    canvas.addEventListener("mousedown", beginDraw);
    canvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        beginDraw(e);
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        moveDraw(e);
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        endDraw();
      },
      { passive: false },
    );

    const onResize = () => render();
    window.addEventListener("resize", onResize);
    const mo = new MutationObserver(() => render());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      canvas.removeEventListener("mousedown", beginDraw);
      canvas.removeEventListener("mousemove", moveDraw);
      window.removeEventListener("mouseup", endDraw);
      window.removeEventListener("resize", onResize);
      mo.disconnect();
    };
  }, [handleGuideDrag, render, stage]);

  const jumpStage = (wanted: number) => {
    if (wanted > earnedStars + 1) {
      setScoreHtml(`🔒 Complete Stage ${wanted - 1} first.`);
      return;
    }
    setStage(wanted);
    clearInk();
    setScoreHtml("");
  };

  const stageHelp =
    stage === 1
      ? "Drag the pink dot through the stroke order."
      : stage === 2
        ? "Use the pen tool while the stroke order guide is visible."
        : "Write the jamo from memory with no guide.";

  return (
    <section className="card">
      <h1>Tracing Practice</h1>
      <Link href="/jamo-select" className="btn secondary back-btn">
        ← Back to Jamo Select
      </Link>

      <section id="kqTraceStagePanel" className="kq-trace-stage-panel">
        <div className="kq-trace-stage-top">
          <div>
            <strong id="kqTraceStageTitle">Stage {stage}</strong>
            <p id="kqTraceStageHelp">{stageHelp}</p>
          </div>
          <div className="kq-trace-stars" id="kqTraceStars">
            {starsText(earnedStars)}
          </div>
        </div>
        <div className="kq-trace-stage-tabs">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              data-stage-jump={n}
              className={`${stage === n ? "is-active" : ""}${n > earnedStars + 1 ? " is-locked" : ""}`}
              onClick={() => jumpStage(n)}
            >
              {n === 1 ? "1 Dot Guide" : n === 2 ? "2 Guided Pen" : "3 Blank Test"}
            </button>
          ))}
        </div>
      </section>

      <div className="trace-wrap">
        <canvas
          ref={canvasRef}
          id="traceCanvas"
          width={320}
          height={320}
          className="trace-canvas"
          aria-label="Tracing canvas"
        />
        <div className="trace-controls">
          <div className="muted">
            Character: <strong id="traceChar">{target}</strong>
          </div>
          <button
            className="btn"
            id="btnClear"
            type="button"
            onClick={() => {
              clearInk();
              setScoreHtml("");
              render();
            }}
          >
            {stage === 1 ? "Restart Stage" : "Clear"}
          </button>
          {stage !== 1 ? (
            <button className="btn" id="btnGrade" type="button" onClick={gradeDrawing}>
              {stage === 2 ? "Grade Guided Pen" : "Grade Blank Test"}
            </button>
          ) : null}
          <div id="traceScore" className="muted" dangerouslySetInnerHTML={{ __html: scoreHtml }} />
        </div>
      </div>
    </section>
  );
}

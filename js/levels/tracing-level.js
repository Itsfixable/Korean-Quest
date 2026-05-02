// js/levels/tracing-level.js
// 3-stage jamo tracing system:
// STAGE 1 = guided dot
// STAGE 2 = guided pen
// STAGE 3 = blank test

import {
  addXP,
  addCoins,
  addBadge,
  setJamoStars,
  getJamoStars,
  addRecentWork,
} from "../main/state.js";

const canvas = document.getElementById("traceCanvas");
const scoreOut = document.getElementById("traceScore");
const legend = document.getElementById("strokeLegend");
const charSpan = document.getElementById("traceChar");
const btnClear = document.getElementById("btnClear");
const btnGrade = document.getElementById("btnGrade");

const ctx = canvas?.getContext("2d");

const CSS_SIZE = 320;
const SIZE = CSS_SIZE;
const LW = 16;
const DPR = window.devicePixelRatio || 1;

const DB = {
  "ㄱ": [[[0.20, 0.25, 0.75, 0.25]], [[0.75, 0.25, 0.75, 0.78]]],
  "ㄴ": [[[0.25, 0.22, 0.25, 0.78]], [[0.25, 0.78, 0.78, 0.78]]],
  "ㄷ": [[[0.22, 0.22, 0.78, 0.22]], [[0.22, 0.22, 0.22, 0.78]], [[0.22, 0.78, 0.78, 0.78]]],
  "ㅁ": [[[0.22, 0.22, 0.78, 0.22]], [[0.22, 0.22, 0.22, 0.78]], [[0.22, 0.78, 0.78, 0.78]], [[0.78, 0.78, 0.78, 0.22]]],
  "ㅂ": [[[0.27, 0.22, 0.27, 0.74]], [[0.73, 0.22, 0.73, 0.74]], [[0.27, 0.52, 0.73, 0.52]], [[0.27, 0.78, 0.73, 0.78]]],
  "ㅅ": [[[0.50, 0.28, 0.28, 0.60]], [[0.50, 0.28, 0.72, 0.60]]],
  "ㅇ": [[[0.65, 0.50, 0.50, 0.35], [0.50, 0.35, 0.35, 0.50], [0.35, 0.50, 0.50, 0.65], [0.50, 0.65, 0.65, 0.50]]],
  "ㅏ": [[[0.45, 0.18, 0.45, 0.82]], [[0.45, 0.50, 0.65, 0.50]]],
  "ㅑ": [[[0.45, 0.16, 0.45, 0.84]], [[0.45, 0.40, 0.65, 0.40]], [[0.45, 0.60, 0.65, 0.60]]],
  "ㅓ": [[[0.35, 0.50, 0.50, 0.50]], [[0.55, 0.18, 0.55, 0.82]]],
  "ㅕ": [[[0.55, 0.16, 0.55, 0.84]], [[0.55, 0.40, 0.35, 0.40]], [[0.55, 0.60, 0.35, 0.60]]],
  "ㅗ": [[[0.22, 0.55, 0.78, 0.55]], [[0.50, 0.55, 0.50, 0.35]]],
  "ㅛ": [[[0.22, 0.60, 0.78, 0.60]], [[0.40, 0.60, 0.40, 0.40]], [[0.60, 0.60, 0.60, 0.40]]],
  "ㅠ": [[[0.22, 0.40, 0.78, 0.40]], [[0.40, 0.40, 0.40, 0.60]], [[0.60, 0.40, 0.60, 0.60]]],
  "ㅜ": [[[0.22, 0.45, 0.78, 0.45]], [[0.50, 0.45, 0.50, 0.65]]],
  "ㅡ": [[[0.22, 0.55, 0.78, 0.55]]],
  "ㅣ": [[[0.55, 0.18, 0.55, 0.82]]],
};

let target = decodeURIComponent(new URLSearchParams(location.search).get("char") || "ㄱ");
if (!DB[target]) target = "ㄱ";

let stage = Math.max(1, Math.min(3, getJamoStars(target) + 1));
let drawing = false;
let last = null;
let strokes = [];

let guidePoints = [];
let guideIndex = 0;
let dotDragging = false;

const ink = document.createElement("canvas");
ink.width = SIZE;
ink.height = SIZE;
const ictx = ink.getContext("2d");

function isLight() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function inkColor() {
  return isLight() ? "#111318" : "#ffffff";
}

function templateColor() {
  return isLight() ? "rgba(91,114,159,0.28)" : "rgba(255,255,255,0.28)";
}

function setupCanvas() {
  if (!canvas || !ctx) return;

  const r = canvas.getBoundingClientRect();
  const cssW = Math.round(r.width) || CSS_SIZE;
  const cssH = Math.round(r.height) || CSS_SIZE;

  canvas.width = Math.round(cssW * DPR);
  canvas.height = Math.round(cssH * DPR);

  ctx.setTransform(canvas.width / SIZE, 0, 0, canvas.height / SIZE, 0, 0);
}

function N(v) {
  return Math.round(v * SIZE);
}

function toCanvasXY(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return {
    x: (p.clientX - r.left) * (SIZE / r.width),
    y: (p.clientY - r.top) * (SIZE / r.height),
  };
}

function flattenGuidePoints() {
  const points = [];

  DB[target].forEach((stroke, strokeIndex) => {
    stroke.forEach(([x1, y1, x2, y2]) => {
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        points.push({
          x: N(x1 + (x2 - x1) * t),
          y: N(y1 + (y2 - y1) * t),
          stroke: strokeIndex,
        });
      }
    });
  });

  return points;
}

function clearInk() {
  strokes = [];
  guideIndex = 0;
  if (ictx) ictx.clearRect(0, 0, SIZE, SIZE);
}

function drawTemplate() {
  if (!ctx) return;

  ctx.clearRect(0, 0, SIZE, SIZE);

  if (stage === 3) return;

  ctx.strokeStyle = templateColor();
  ctx.lineWidth = LW;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  DB[target].forEach((stroke) => {
    stroke.forEach((seg) => {
      const [x1, y1, x2, y2] = seg.map(N);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  });
}

function drawGuideProgress() {
  if (!ctx || stage !== 1) return;

  ctx.strokeStyle = "#5b729f";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let prevStroke = null;
  let pathStarted = false;

  for (let i = 0; i <= guideIndex; i++) {
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
}

function drawQuadrants() {
  if (!ctx || stage !== 3) return;

  const mid = SIZE / 2;
  ctx.strokeStyle = "rgba(91,114,159,0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(mid, 0);
  ctx.lineTo(mid, SIZE);
  ctx.stroke();

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(SIZE, mid);
  ctx.stroke();

  ctx.setLineDash([]);
}

function render() {
  if (!ctx) return;

  drawTemplate();

  if (stage === 1) {
    drawGuideProgress();
  } else {
    ctx.drawImage(ink, 0, 0, SIZE, SIZE);
  }

  drawQuadrants();
}

function ensureStageUI() {
  if (document.getElementById("kqTraceStagePanel")) return;

  const panel = document.createElement("section");
  panel.id = "kqTraceStagePanel";
  panel.className = "kq-trace-stage-panel";

  panel.innerHTML = `
    <div class="kq-trace-stage-top">
      <div>
        <strong id="kqTraceStageTitle">Stage 1</strong>
        <p id="kqTraceStageHelp">Drag the dot through the stroke order.</p>
      </div>

      <div class="kq-trace-stars" id="kqTraceStars"></div>
    </div>

    <div class="kq-trace-stage-tabs">
      <button type="button" data-stage-jump="1">1 Dot Guide</button>
      <button type="button" data-stage-jump="2">2 Guided Pen</button>
      <button type="button" data-stage-jump="3">3 Blank Test</button>
    </div>
  `;

  canvas?.parentElement?.insertBefore(panel, canvas);

  panel.querySelectorAll("[data-stage-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wanted = Number(btn.dataset.stageJump);
      const earned = getJamoStars(target);

      if (wanted > earned + 1) {
        setScore(`🔒 Complete Stage ${wanted - 1} first.`);
        return;
      }

      stage = wanted;
      clearInk();
      updateStageUI();
      render();
    });
  });
}

function ensureStyles() {
  if (document.getElementById("kq-trace-stage-styles")) return;

  const style = document.createElement("style");
  style.id = "kq-trace-stage-styles";
  style.textContent = `
    .kq-trace-stage-panel {
      margin: 0 0 16px;
      padding: 16px;
      border-radius: 22px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(91,114,159,0.15);
      box-shadow: 0 10px 24px rgba(0,0,0,0.06);
    }

    html[data-theme="dark"] .kq-trace-stage-panel {
      background: rgba(22,29,42,0.92);
      border-color: rgba(255,255,255,0.10);
    }

    .kq-trace-stage-top {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: center;
      flex-wrap: wrap;
    }

    .kq-trace-stage-top strong {
      display: block;
      font-size: 1.2rem;
      font-weight: 1000;
    }

    .kq-trace-stage-top p {
      margin: 4px 0 0;
      font-weight: 800;
      color: var(--muted, #5e6678);
    }

    .kq-trace-stars {
      font-size: 1.5rem;
      letter-spacing: 2px;
      white-space: nowrap;
    }

    .kq-trace-stage-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }

    .kq-trace-stage-tabs button {
      border: none;
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      font-weight: 900;
      color: #304263;
      background: rgba(91,114,159,0.12);
      cursor: pointer;
    }

    .kq-trace-stage-tabs button.is-active {
      background: linear-gradient(180deg, #6d84b7, #5971a1);
      color: #ffffff;
    }

    .kq-trace-stage-tabs button.is-locked {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .kq-stage-complete-pop {
      animation: kqTracePop 420ms cubic-bezier(.2,1.2,.25,1) both;
    }

    .kq-award-star-fly {
      position: fixed;
      left: 50vw;
      top: 50vh;
      z-index: 9999;
      font-size: 1rem;
      pointer-events: none;
      filter: drop-shadow(0 0 10px rgba(255, 226, 95, 0.9)) drop-shadow(0 0 24px rgba(255, 196, 0, 0.65));
      animation: kqStarAwardFly 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .kq-award-star-fly::before,
    .kq-award-star-fly::after {
      content: "✦";
      position: absolute;
      color: #fff4a3;
      font-size: 0.55em;
      animation: kqStarSparkle 520ms ease-in-out infinite alternate;
    }

    .kq-award-star-fly::before {
      left: -18px;
      top: -12px;
    }

    .kq-award-star-fly::after {
      right: -16px;
      bottom: -10px;
      animation-delay: 180ms;
    }

    @keyframes kqStarAwardFly {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.1) rotate(0deg);
      }
      28% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(4.2) rotate(180deg);
      }
      55% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(3.2) rotate(420deg);
      }
      100% {
        opacity: 0.95;
        left: var(--end-x);
        top: var(--end-y);
        transform: translate(-50%, -50%) scale(1) rotate(720deg);
      }
    }

    @keyframes kqStarSparkle {
      from {
        opacity: 0.25;
        transform: scale(0.7) rotate(0deg);
      }
      to {
        opacity: 1;
        transform: scale(1.25) rotate(25deg);
      }
    }

    @keyframes kqTracePop {
      0% { transform: scale(.92); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  document.head.appendChild(style);
}

function starsHTML(n) {
  return `${"⭐".repeat(n)}${"☆".repeat(3 - n)}`;
}

function updateStageUI() {
  const earned = getJamoStars(target);

  const title = document.getElementById("kqTraceStageTitle");
  const help = document.getElementById("kqTraceStageHelp");
  const stars = document.getElementById("kqTraceStars");

  if (title) title.textContent = `Stage ${stage}`;
  if (stars) stars.textContent = starsHTML(earned);

  if (help) {
    if (stage === 1) help.textContent = "Drag the pink dot through the stroke order.";
    if (stage === 2) help.textContent = "Use the pen tool while the stroke order guide is visible.";
    if (stage === 3) help.textContent = "Write the jamo from memory with no guide.";
  }

  document.querySelectorAll("[data-stage-jump]").forEach((btn) => {
    const n = Number(btn.dataset.stageJump);
    btn.classList.toggle("is-active", n === stage);
    btn.classList.toggle("is-locked", n > earned + 1);
  });

  if (btnGrade) {
    btnGrade.hidden = stage === 1;
    btnGrade.textContent = stage === 2 ? "Grade Guided Pen" : "Grade Blank Test";
  }

  if (btnClear) {
    btnClear.textContent = stage === 1 ? "Restart Stage" : "Clear";
  }
}

function setScore(message) {
  if (scoreOut) scoreOut.innerHTML = message;
}

function playStarAwardAnimation(starNumber) {
  const targetStars = document.getElementById("kqTraceStars");
  if (!targetStars) return;
  const targetRect = targetStars.getBoundingClientRect();
  const star = document.createElement("div");
  star.className = "kq-award-star-fly";
  star.textContent = "⭐";
  star.style.setProperty("--end-x", `${targetRect.left + starNumber * 28}px`);
  star.style.setProperty("--end-y", `${targetRect.top + targetRect.height / 2}px`);
  document.body.appendChild(star);
  setTimeout(() => {
    star.remove();
  }, 1250);
}

function awardStageStar(starCount) {
  const prev = getJamoStars(target);

  if (starCount > prev) {
    setJamoStars(target, starCount);
    playStarAwardAnimation(starCount);

    const xp = starCount === 1 ? 60 : starCount === 2 ? 90 : 150;
    const coins = starCount === 1 ? 30 : starCount === 2 ? 60 : 120;

    addXP(xp);
    addCoins(coins);
    addBadge("✍️ Tracing Starter");
    addRecentWork(`Earned ${starCount} star${starCount > 1 ? "s" : ""} on ${target}`, "Tracing");

    setScore(`🎉 Stage ${starCount} complete! +${xp} XP · +${coins} coins<br>${starsHTML(starCount)}`);
  } else {
    setScore(`✅ Stage ${starCount} already completed.<br>${starsHTML(prev)}`);
  }

  clearInk();
  updateStageUI();
  render();
}

function handleGuideDrag(p) {
  if (stage !== 1 || !guidePoints.length) return;

  const next = guidePoints[guideIndex];
  if (!next) return;

  const dist = Math.hypot(p.x - next.x, p.y - next.y);

  if (dist < 42) {
    guideIndex = Math.min(guideIndex + 1, guidePoints.length - 1);
    render();
  }

  if (guideIndex >= guidePoints.length - 2) {
    awardStageStar(1);
  }
}

function beginDraw(e) {
  if (!canvas) return;

  const p = toCanvasXY(e);

  if (stage === 1) {
    dotDragging = true;
    handleGuideDrag(p);
    return;
  }

  drawing = true;
  last = p;
  strokes.push({ points: [last] });
}

function moveDraw(e) {
  if (!canvas || !ictx) return;

  const p = toCanvasXY(e);

  if (stage === 1 && dotDragging) {
    handleGuideDrag(p);
    return;
  }

  if (!drawing) return;

  ictx.strokeStyle = inkColor();
  ictx.lineWidth = LW;
  ictx.lineCap = "round";
  ictx.lineJoin = "round";

  ictx.beginPath();
  ictx.moveTo(last.x, last.y);
  ictx.lineTo(p.x, p.y);
  ictx.stroke();

  last = p;
  strokes[strokes.length - 1].points.push(p);
  render();
}

function endDraw() {
  drawing = false;
  dotDragging = false;
}

/* ===== scoring helpers ===== */

function maskFromStrokeSegs(segs) {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;

  const cx = c.getContext("2d");
  cx.lineWidth = LW;
  cx.lineCap = "round";
  cx.lineJoin = "round";
  cx.strokeStyle = "#000";

  segs.forEach((s) => {
    const [x1, y1, x2, y2] = s.map(N);
    cx.beginPath();
    cx.moveTo(x1, y1);
    cx.lineTo(x2, y2);
    cx.stroke();
  });

  const d = cx.getImageData(0, 0, SIZE, SIZE).data;
  const m = new Uint8Array(SIZE * SIZE);

  for (let i = 0; i < d.length; i += 4) {
    m[i >> 2] = d[i + 3] > 0 ? 1 : 0;
  }

  return m;
}

function maskFromPoints(points) {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;

  const cx = c.getContext("2d");
  cx.lineWidth = LW;
  cx.lineCap = "round";
  cx.lineJoin = "round";
  cx.strokeStyle = "#000";

  for (let i = 1; i < points.length; i++) {
    cx.beginPath();
    cx.moveTo(points[i - 1].x, points[i - 1].y);
    cx.lineTo(points[i].x, points[i].y);
    cx.stroke();
  }

  const d = cx.getImageData(0, 0, SIZE, SIZE).data;
  const m = new Uint8Array(SIZE * SIZE);

  for (let i = 0; i < d.length; i += 4) {
    m[i >> 2] = d[i + 3] > 0 ? 1 : 0;
  }

  return m;
}

function iouScore(a, b) {
  let ov = 0;
  let ca = 0;
  let cb = 0;

  for (let i = 0; i < a.length; i++) {
    if (a[i]) ca++;
    if (b[i]) cb++;
    if (a[i] && b[i]) ov++;
  }

  const iou = ov / (ca + cb - ov + 1e-6);
  const cov = ov / (ca + 1e-6);

  return 0.65 * iou + 0.35 * cov;
}

function resample(points, n = 64) {
  if (!points || points.length < 2) {
    return Array.from({ length: n }, () => points?.[0] || { x: 0, y: 0 });
  }

  const L = [0];

  for (let i = 1; i < points.length; i++) {
    L[i] = L[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  const total = L[L.length - 1] || 1;
  const out = [];

  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * total;
    let i = 1;

    while (i < L.length && L[i] < t) i++;

    const t0 = L[i - 1];
    const t1 = L[i] || t0 + 1e-6;
    const r = (t - t0) / (t1 - t0);

    const p0 = points[i - 1];
    const p1 = points[i] || points[i - 1];

    out.push({
      x: p0.x + (p1.x - p0.x) * r,
      y: p0.y + (p1.y - p0.y) * r,
    });
  }

  return out;
}

function resampleSegs(segs, n = 64) {
  const pts = [];

  for (const s of segs) {
    const [x1, y1, x2, y2] = s.map(N);
    const steps = 32;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push({
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t,
      });
    }
  }

  return resample(pts, n);
}

function chamfer(a, b) {
  function nearest(p, arr) {
    let best = 1e9;

    for (const q of arr) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < best) best = d;
    }

    return best;
  }

  function avg(s, t) {
    return s.reduce((sum, p) => sum + nearest(p, t), 0) / s.length;
  }

  return (avg(a, b) + avg(b, a)) / 2;
}

function shapeScore(segs, points) {
  const tpl = resampleSegs(segs, 64);
  const usr = resample(points, 64);
  const dist = chamfer(tpl, usr);
  return Math.exp(-dist / 20);
}

function gradeDrawing() {
  const tpl = DB[target];

  if (!tpl) {
    setScore("Unknown character template.");
    return;
  }

  if (strokes.length === 0) {
    setScore("Draw the strokes first 🙂");
    return;
  }

  let per = 0;
  const used = Math.min(tpl.length, strokes.length);

  for (let i = 0; i < used; i++) {
    const mTpl = maskFromStrokeSegs(tpl[i]);
    const mUsr = maskFromPoints(strokes[i].points);
    const sIoU = iouScore(mTpl, mUsr);
    const sShape = shapeScore(tpl[i], strokes[i].points);

    per += 0.4 * sIoU + 0.6 * sShape;
  }

  per = per / tpl.length;

  const missing = Math.max(0, tpl.length - strokes.length);
  const extra = Math.max(0, strokes.length - tpl.length);
  const orderPenalty = 1 - Math.min(0.35, missing * 0.12 + extra * 0.10);

  const hybrid = Math.max(0, Math.min(1, per * orderPenalty * 4));
  const score = Math.round(100 * hybrid);

  const passScore = stage === 2 ? 55 : 60;
  const starToAward = stage === 2 ? 2 : 3;

  if (score >= passScore) {
    awardStageStar(starToAward);
  } else {
    setScore(`Score: <strong>${score}</strong>/100<br>Try again to pass Stage ${stage}.`);
  }
}

function boot() {
  if (!canvas || !ctx) return;

  if (charSpan) charSpan.textContent = target;
  if (legend) legend.innerHTML = DB[target].map((_, i) => `<li>Stroke ${i + 1}</li>`).join("");

  setupCanvas();

  if (ictx) {
    ictx.lineWidth = LW;
    ictx.lineCap = "round";
    ictx.lineJoin = "round";
    ictx.strokeStyle = inkColor();
  }

  guidePoints = flattenGuidePoints();

  ensureStyles();
  ensureStageUI();
  updateStageUI();
  render();

  canvas.addEventListener("mousedown", beginDraw);
  canvas.addEventListener("mousemove", moveDraw);
  window.addEventListener("mouseup", endDraw);

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    beginDraw(e);
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    moveDraw(e);
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    endDraw();
  }, { passive: false });

  btnClear?.addEventListener("click", () => {
    clearInk();
    setScore("");
    render();
  });

  btnGrade?.addEventListener("click", gradeDrawing);

  window.addEventListener("resize", () => {
    setupCanvas();
    render();
  });

  const mo = new MutationObserver(() => {
    if (ictx) ictx.strokeStyle = inkColor();
    render();
  });

  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}

boot();

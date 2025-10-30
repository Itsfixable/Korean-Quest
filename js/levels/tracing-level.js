/* Hangul tracing shell with minimal stroke DB + grading logic (IoU-like) */
import { addXP, addCoins, addBadge } from "../main/state.js";

const canvas = document.getElementById("traceCanvas");
const scoreOut = document.getElementById("traceScore");
const legend = document.getElementById("strokeLegend");
const charSpan = document.getElementById("traceChar");

const ctx = canvas.getContext("2d");
const size = 320,
  lw = 16;

/* Template DB (stroke order) — sample for ㄱ */
const DB = {
  ㄱ: [
    { note: "Top horizontal (L→R)", segs: [["line", [0.25, 0.25, 0.7, 0.25]]] },
    { note: "Right vertical (T→B)", segs: [["line", [0.7, 0.25, 0.7, 0.75]]] },
  ],
};

let target = decodeURIComponent(
  new URLSearchParams(location.search).get("char") || "ㄱ"
);
if (!DB[target]) target = "ㄱ";
charSpan.textContent = target;
legend.innerHTML = DB[target]
  .map((s, i) => `<li>Stroke ${i + 1}: ${s.note}</li>`)
  .join("");

// Draw template faintly
function N(v) {
  return Math.round(v * size);
}
function drawTemplate() {
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(79,140,255,.25)";
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  DB[target].forEach((st) => {
    st.segs.forEach((seg) => {
      const [x1, y1, x2, y2] = seg[1].map((v) => N(v));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  });
}

// capture user strokes
const ink = document.createElement("canvas");
ink.width = size;
ink.height = size;
const ictx = ink.getContext("2d");
ictx.lineWidth = lw;
ictx.lineCap = "round";
ictx.lineJoin = "round";
ictx.strokeStyle = "#e6e7eb";

let drawing = false,
  last = null,
  strokes = []; // [{points:[{x,y}]}]
function pos(e) {
  const r = canvas.getBoundingClientRect();
  const c = e.touches ? e.touches[0] : e;
  return { x: c.clientX - r.left, y: c.clientY - r.top };
}
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  last = pos(e);
  strokes.push({ points: [last] });
});
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const p = pos(e);
  ictx.beginPath();
  ictx.moveTo(last.x, last.y);
  ictx.lineTo(p.x, p.y);
  ictx.stroke();
  last = p;
  strokes[strokes.length - 1].points.push(p);
  render();
});
window.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    drawing = true;
    last = pos(e);
    strokes.push({ points: [last] });
  },
  { passive: false }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (!drawing) return;
    const p = pos(e);
    ictx.beginPath();
    ictx.moveTo(last.x, last.y);
    ictx.lineTo(p.x, p.y);
    ictx.stroke();
    last = p;
    strokes[strokes.length - 1].points.push(p);
    render();
  },
  { passive: false }
);
canvas.addEventListener("touchend", () => (drawing = false), {
  passive: false,
});

function render() {
  drawTemplate();
  ctx.drawImage(ink, 0, 0);
}
render();

// Grading (simple IoU on rasterized strokes)
function maskStroke(segs) {
  const c = new OffscreenCanvas(size, size);
  const cx = c.getContext("2d");
  cx.lineWidth = lw;
  cx.lineCap = "round";
  cx.lineJoin = "round";
  cx.strokeStyle = "#000";
  segs.forEach((seg) => {
    const [x1, y1, x2, y2] = seg[1].map((v) => N(v));
    cx.beginPath();
    cx.moveTo(x1, y1);
    cx.lineTo(x2, y2);
    cx.stroke();
  });
  const d = cx.getImageData(0, 0, size, size).data;
  const m = new Uint8Array(size * size);
  for (let i = 0; i < d.length; i += 4) m[i >> 2] = d[i + 3] > 0 ? 1 : 0;
  return m;
}
function maskUser(points) {
  const c = new OffscreenCanvas(size, size);
  const cx = c.getContext("2d");
  cx.lineWidth = lw;
  cx.lineCap = "round";
  cx.lineJoin = "round";
  cx.strokeStyle = "#000";
  for (let i = 1; i < points.length; i++) {
    cx.beginPath();
    cx.moveTo(points[i - 1].x, points[i - 1].y);
    cx.lineTo(points[i].x, points[i].y);
    cx.stroke();
  }
  const d = cx.getImageData(0, 0, size, size).data;
  const m = new Uint8Array(size * size);
  for (let i = 0; i < d.length; i += 4) m[i >> 2] = d[i + 3] > 0 ? 1 : 0;
  return m;
}
function scoreMasks(a, b) {
  let overlap = 0,
    ca = 0,
    cb = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i]) ca++;
    if (b[i]) cb++;
    if (a[i] && b[i]) overlap++;
  }
  const iou = overlap / (ca + cb - overlap + 1e-6);
  const cov = overlap / (ca + 1e-6);
  return 0.7 * iou + 0.3 * cov;
}

document.getElementById("btnClear").onclick = () => {
  strokes = [];
  ictx.clearRect(0, 0, size, size);
  scoreOut.textContent = "";
  render();
};
document.getElementById("btnGrade").onclick = () => {
  // basic per-stroke matching in order (lenient)
  const tpl = DB[target];
  const n = Math.min(tpl.length, strokes.length);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const mTpl = maskStroke(tpl[i].segs);
    const mUser = maskUser(strokes[i].points);
    acc += scoreMasks(mTpl, mUser);
  }
  // penalty for missing/extra strokes
  const penalty =
    1 - Math.min(1, Math.max(0, (tpl.length - strokes.length) * 0.2));
  const score = Math.round(100 * (acc / tpl.length) * penalty);
  scoreOut.textContent = `Score: ${score}/100`;
  if (score >= 80) {
    addXP(10);
    addCoins(5);
    addBadge("✍️ Tracing Starter");
  }
};

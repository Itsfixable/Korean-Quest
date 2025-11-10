// ../js/levels/tracing-level.js
// Draw-only tracer (no grading). Keeps stroke legend + Clear button.

const canvas   = document.getElementById("traceCanvas");
const legend   = document.getElementById("strokeLegend");
const charSpan = document.getElementById("traceChar");
const btnClear = document.getElementById("btnClear");
const scoreOut = document.getElementById("traceScore"); // may exist in HTML

if (scoreOut) scoreOut.hidden = true;  // hide any leftover score area
const btnGrade = document.getElementById("btnGrade");
if (btnGrade) btnGrade.hidden = true;  // hide Grade button if present

/* Theme-aware ink: white in dark, dark in light */
function isLight() {
  return document.documentElement.getAttribute("data-theme") === "light";
}
function inkColor() { return isLight() ? "#111318" : "#ffffff"; }

const mo = new MutationObserver(() => { if (ictx) { ictx.strokeStyle = inkColor(); render(); } });
mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* Canvas setup (crisp with DPR) */
const CSS_SIZE = 320;
const DPR = window.devicePixelRatio || 1;
const ctx  = canvas?.getContext("2d");
function setupCanvas() {
  if (!canvas || !ctx) return;
  const r = canvas.getBoundingClientRect();
  const cssW = Math.round(r.width)  || CSS_SIZE;
  const cssH = Math.round(r.height) || CSS_SIZE;
  canvas.width  = Math.round(cssW * DPR);
  canvas.height = Math.round(cssH * DPR);
  ctx.setTransform(canvas.width / CSS_SIZE, 0, 0, canvas.height / CSS_SIZE, 0, 0);
}
setupCanvas();
window.addEventListener("resize", () => { setupCanvas(); render(); });

const SIZE = CSS_SIZE;
const LW   = 16;

/* Minimal templates for stroke legend (same set you had) */
const DB = {
  'ㄱ': [[[0.20,0.25, 0.75,0.25]], [[0.75,0.25, 0.75,0.78]]],
  'ㄴ': [[[0.25,0.22, 0.25,0.78]], [[0.25,0.78, 0.78,0.78]]],
  'ㄷ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]]],
  'ㅁ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]], [[0.78,0.78, 0.78,0.22]]],
  'ㅂ': [[[0.22,0.22, 0.78,0.22]], [[0.32,0.22, 0.32,0.74]], [[0.68,0.22, 0.68,0.74]], [[0.22,0.78, 0.78,0.78]]],
  'ㅅ': [[[0.28,0.28, 0.50,0.60]], [[0.72,0.28, 0.50,0.60]]],
  'ㅇ': [[[0.65,0.50, 0.50,0.35],[0.50,0.35, 0.35,0.50],[0.35,0.50, 0.50,0.65],[0.50,0.65, 0.65,0.50]]],
  'ㅏ': [[[0.45,0.18, 0.45,0.82]], [[0.45,0.50, 0.65,0.50]]],
  'ㅑ': [[[0.45,0.16, 0.45,0.84]], [[0.45,0.40, 0.65,0.40]], [[0.45,0.60, 0.65,0.60]]],
  'ㅓ': [[[0.55,0.18, 0.55,0.82]], [[0.55,0.50, 0.35,0.50]]],
  'ㅕ': [[[0.55,0.16, 0.55,0.84]], [[0.55,0.40, 0.35,0.40]], [[0.55,0.60, 0.35,0.60]]],
  'ㅗ': [[[0.22,0.55, 0.78,0.55]], [[0.50,0.55, 0.50,0.35]]],
  'ㅛ': [[[0.22,0.60, 0.78,0.60]], [[0.40,0.60, 0.40,0.40]], [[0.60,0.60, 0.60,0.40]]],
  'ㅠ': [[[0.22,0.40, 0.78,0.40]], [[0.40,0.40, 0.40,0.60]], [[0.60,0.40, 0.60,0.60]]],
  'ㅜ': [[[0.22,0.45, 0.78,0.45]], [[0.50,0.45, 0.50,0.65]]],
  'ㅡ': [[[0.22,0.55, 0.78,0.55]]],
  'ㅣ': [[[0.55,0.18, 0.55,0.82]]],
};

function N(v){ return Math.round(v*SIZE); }
function drawTemplate(){
  if (!ctx) return;
  ctx.clearRect(0,0,SIZE,SIZE);
  ctx.strokeStyle = 'rgba(79,140,255,.25)';   // light guide lines
  ctx.lineWidth = LW; ctx.lineCap='round'; ctx.lineJoin='round';
  const tpl = DB[target] || [];
  tpl.forEach(segs => {
    segs.forEach(s => { const [x1,y1,x2,y2]=s.map(N); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
  });
}

let target = decodeURIComponent(new URLSearchParams(location.search).get("char") || "ㄱ");
if (!DB[target]) target = "ㄱ";
if (charSpan) charSpan.textContent = target;
if (legend)   legend.innerHTML = DB[target].map((_,i)=>`<li>Stroke ${i+1}</li>`).join("");

/* Ink layer (draw only) */
const ink = document.createElement("canvas"); ink.width=SIZE; ink.height=SIZE;
const ictx = ink.getContext("2d");
if (ictx){
  ictx.lineWidth=LW; ictx.lineCap='round'; ictx.lineJoin='round';
  ictx.strokeStyle = inkColor();
}
let drawing=false,last=null,strokes=[];

function toCanvasXY(e){
  const r=canvas.getBoundingClientRect();
  const c=e.touches? e.touches[0] : e;
  const x = (c.clientX - r.left) * (SIZE / r.width);
  const y = (c.clientY - r.top)  * (SIZE / r.height);
  return { x, y };
}

if (canvas){
  canvas.addEventListener("mousedown", e=>{ drawing=true; last=toCanvasXY(e); strokes.push({points:[last]}); });
  canvas.addEventListener("mousemove", e=>{
    if(!drawing) return; const p=toCanvasXY(e);
    ictx.strokeStyle = inkColor();
    ictx.beginPath(); ictx.moveTo(last.x,last.y); ictx.lineTo(p.x,p.y); ictx.stroke(); last=p;
    strokes[strokes.length-1].points.push(p); render();
  });
  window.addEventListener("mouseup", ()=>drawing=false);

  canvas.addEventListener("touchstart", e=>{ e.preventDefault(); drawing=true; last=toCanvasXY(e); strokes.push({points:[last]}); }, {passive:false});
  canvas.addEventListener("touchmove",  e=>{ e.preventDefault(); if(!drawing)return; const p=toCanvasXY(e);
    ictx.strokeStyle = inkColor();
    ictx.beginPath(); ictx.moveTo(last.x,last.y); ictx.lineTo(p.x,p.y); ictx.stroke(); last=p;
    strokes[strokes.length-1].points.push(p); render();
  }, {passive:false});
  canvas.addEventListener("touchend", ()=>{ drawing=false; }, {passive:false});
}

btnClear?.addEventListener("click", ()=>{
  strokes=[]; ictx.clearRect(0,0,SIZE,SIZE); render();
});

function render(){ if(!ctx) return; drawTemplate(); ctx.drawImage(ink,0,0,SIZE,SIZE); }
render();

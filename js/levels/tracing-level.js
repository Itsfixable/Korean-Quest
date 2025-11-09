// tracing-level.js — tracer with robust grading + ⭐ (safe & scale-aware)
import { addXP, addCoins, addBadge, setJamoStars, getJamoStars } from "../main/state.js";

const canvas   = document.getElementById("traceCanvas");
const scoreOut = document.getElementById("traceScore");
const legend   = document.getElementById("strokeLegend");
const charSpan = document.getElementById("traceChar");
const btnClear = document.getElementById("btnClear");
const btnGrade = document.getElementById("btnGrade");

// Hard guards so nothing explodes silently
if (!canvas) {
  console.error("[trace] Missing #traceCanvas"); 
}
const ctx  = canvas?.getContext("2d");
if (!ctx) {
  console.error("[trace] 2D context unavailable");
}

const CSS_SIZE = 320;            // logical design size
const DPR = window.devicePixelRatio || 1;

// Normalize canvas backing store to CSS_SIZE with DPR for crisp ink
function setupCanvas() {
  if (!canvas) return;
  // read actual CSS size
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.round(rect.width)  || CSS_SIZE;
  const cssH = Math.round(rect.height) || CSS_SIZE;

  canvas.width  = Math.round(cssW * DPR);
  canvas.height = Math.round(cssH * DPR);

  // paint using scale so our math stays in [0..CSS_SIZE] space
  ctx.setTransform(canvas.width / CSS_SIZE, 0, 0, canvas.height / CSS_SIZE, 0, 0);
}
setupCanvas();
window.addEventListener("resize", () => { setupCanvas(); render(); });

const SIZE = CSS_SIZE;           // we draw in this logical size
const LW   = 16;                 // logical stroke width

/* Traditional stroke order DB (synced with jamo-select) — segments: [x1,y1,x2,y2] in 0..1 */
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

let target = decodeURIComponent(new URLSearchParams(location.search).get("char") || "ㄱ");
if (!DB[target]) target = "ㄱ";
if (charSpan) charSpan.textContent = target;
if (legend)   legend.innerHTML = DB[target].map((_,i)=>`<li>Stroke ${i+1}</li>`).join("");

/* Template draw */
function N(v){ return Math.round(v*SIZE); }
function drawTemplate(){
  if (!ctx) return;
  ctx.clearRect(0,0,SIZE,SIZE);
  ctx.strokeStyle = 'rgba(79,140,255,.25)';
  ctx.lineWidth = LW; ctx.lineCap='round'; ctx.lineJoin='round';
  const tpl = DB[target] || [];
  tpl.forEach(segs => {
    segs.forEach(s => { const [x1,y1,x2,y2]=s.map(N); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
  });
}

/* Ink layer (own canvas) */
const ink = document.createElement("canvas"); ink.width=SIZE; ink.height=SIZE;
const ictx = ink.getContext("2d");
if (ictx){
  ictx.lineWidth=LW; ictx.lineCap='round'; ictx.lineJoin='round'; ictx.strokeStyle='#e6e7eb';
}
let drawing=false,last=null,strokes=[];

/* Pointer → canvas coordinate (scale-aware) */
function toCanvasXY(e){
  const r=canvas.getBoundingClientRect();
  const c=e.touches? e.touches[0] : e;
  const x = (c.clientX - r.left) * (SIZE / r.width);
  const y = (c.clientY - r.top)  * (SIZE / r.height);
  return { x, y };
}

// Events
if (canvas){
  canvas.addEventListener("mousedown", e=>{ drawing=true; last=toCanvasXY(e); strokes.push({points:[last]}); });
  canvas.addEventListener("mousemove", e=>{
    if(!drawing) return; const p=toCanvasXY(e);
    ictx.beginPath(); ictx.moveTo(last.x,last.y); ictx.lineTo(p.x,p.y); ictx.stroke(); last=p; 
    strokes[strokes.length-1].points.push(p); render();
  });
  window.addEventListener("mouseup", ()=>drawing=false);

  canvas.addEventListener("touchstart", e=>{ e.preventDefault(); drawing=true; last=toCanvasXY(e); strokes.push({points:[last]}); }, {passive:false});
  canvas.addEventListener("touchmove",  e=>{ e.preventDefault(); if(!drawing)return; const p=toCanvasXY(e);
    ictx.beginPath(); ictx.moveTo(last.x,last.y); ictx.lineTo(p.x,p.y); ictx.stroke(); last=p; 
    strokes[strokes.length-1].points.push(p); render();
  }, {passive:false});
  canvas.addEventListener("touchend", ()=>{ drawing=false; }, {passive:false});
}

function render(){ if(!ctx) return; drawTemplate(); ctx.drawImage(ink,0,0,SIZE,SIZE); }
render();

/* ---------- Scoring ---------- */
function maskFromStrokeSegs(segs){
  const c=document.createElement('canvas'); c.width=SIZE; c.height=SIZE; const cx=c.getContext('2d');
  cx.lineWidth=LW; cx.lineCap='round'; cx.lineJoin='round'; cx.strokeStyle='#000';
  segs.forEach(s=>{ const [x1,y1,x2,y2]=s.map(N); cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2); cx.stroke(); });
  const d=c.getImageData(0,0,SIZE,SIZE).data, m=new Uint8Array(SIZE*SIZE);
  for(let i=0;i<d.length;i+=4) m[i>>2]=d[i+3]>0?1:0; return m;
}
function maskFromPoints(points){
  const c=document.createElement('canvas'); c.width=SIZE; c.height=SIZE; const cx=c.getContext('2d');
  cx.lineWidth=LW; cx.lineCap='round'; cx.lineJoin='round'; cx.strokeStyle='#000';
  for(let i=1;i<points.length;i++){ cx.beginPath(); cx.moveTo(points[i-1].x,points[i-1].y); cx.lineTo(points[i].x,points[i].y); cx.stroke(); }
  const d=c.getImageData(0,0,SIZE,SIZE).data, m=new Uint8Array(SIZE*SIZE);
  for(let i=0;i<d.length;i+=4) m[i>>2]=d[i+3]>0?1:0; return m;
}
function iouScore(a,b){
  let ov=0,ca=0,cb=0; for(let i=0;i<a.length;i++){ if(a[i])ca++; if(b[i])cb++; if(a[i]&&b[i])ov++; }
  const iou=ov/(ca+cb-ov+1e-6), cov=ov/(ca+1e-6); return 0.7*iou+0.3*cov;
}

// resampling & chamfer distance
function resample(points, n=64){
  if (!points || points.length<2){ return Array.from({length:n}, ()=>points?.[0]||{x:0,y:0}); }
  let L=[0]; for(let i=1;i<points.length;i++){ L[i]=L[i-1]+Math.hypot(points[i].x-points[i-1].x, points[i].y-points[i-1].y); }
  const total=L[L.length-1]||1, out=[];
  for(let k=0;k<n;k++){
    const t=(k/(n-1))*total; let i=1; while(i<L.length && L[i]<t) i++;
    const t0=L[i-1], t1=L[i]||t0+1e-6, r=(t-t0)/(t1-t0);
    const p0=points[i-1], p1=points[i]||points[i-1];
    out.push({x:p0.x+(p1.x-p0.x)*r, y:p0.y+(p1.y-p0.y)*r});
  }
  return out;
}
function resampleSegs(segs, n=64){
  const pts=[];
  for(const s of segs){
    const [x1,y1,x2,y2] = s.map(N);
    const steps=32;
    for(let i=0;i<=steps;i++){ const t=i/steps; pts.push({x:x1+(x2-x1)*t, y:y1+(y2-y1)*t}); }
  }
  return resample(pts, n);
}
function chamfer(a,b){
  function nearest(p,arr){ let best=1e9; for(const q of arr){ const d=Math.hypot(p.x-q.x, p.y-q.y); if(d<best) best=d; } return best; }
  function avg(a,b){ return a.reduce((s,p)=>s+nearest(p,b),0)/a.length; }
  return (avg(a,b)+avg(b,a))/2;
}
function shapeScore(segs, points){
  const tpl = resampleSegs(segs, 64);
  const usr = resample(points, 64);
  const dist = chamfer(tpl, usr); // px at SIZE basis
  const THRESH = 18;
  return Math.exp(-dist/THRESH); // 1.0 at perfect, ~0.37 at 18px avg
}

/* Buttons */
btnClear?.addEventListener("click", ()=>{
  strokes=[]; ictx.clearRect(0,0,SIZE,SIZE); if(scoreOut) scoreOut.textContent=""; render();
});

btnGrade?.addEventListener("click", ()=>{
  const tpl = DB[target];
  if (!tpl){ if(scoreOut) scoreOut.textContent = "Unknown character template."; return; }
  if (strokes.length === 0){ if(scoreOut) scoreOut.textContent = "Draw the strokes first 🙂"; return; }

  const n = Math.min(tpl.length, strokes.length);

  // per-stroke hybrid score
  let per = 0;
  for(let i=0;i<n;i++){
    const mTpl = maskFromStrokeSegs(tpl[i]);
    const mUsr = maskFromPoints(strokes[i].points);
    const sIoU = iouScore(mTpl, mUsr);
    const sShape = shapeScore(tpl[i], strokes[i].points);
    per += (0.30*sIoU + 0.70*sShape);
  }
  per = per / tpl.length; // normalize by required strokes

  // penalties for missing/extra strokes
  const missing = Math.max(0, tpl.length - strokes.length);
  const extra   = Math.max(0, strokes.length - tpl.length);
  const orderPenalty = 1 - Math.min(0.45, missing*0.18 + extra*0.12);

  const hybrid = Math.max(0, Math.min(1, per * orderPenalty));
  const score = Math.round(100 * hybrid);

  const stars = score>=90?3: score>=75?2: score>=60?1: 0;
  const prev = getJamoStars(target);
  if (stars > prev) setJamoStars(target, stars);

  if (scoreOut) scoreOut.innerHTML = `Score: <strong>${score}</strong>/100 &nbsp; ${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}`;
  if (score>=80){ addXP(10); addCoins(5); addBadge('✍️ Tracing Starter'); }
});

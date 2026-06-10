// tracing-level.js — tracer with robust grading + ⭐ (no OffscreenCanvas)
import { addXP, addCoins, addBadge, setJamoStars, getJamoStars } from "../main/state.js";

const canvas = document.getElementById("traceCanvas");
const scoreOut = document.getElementById("traceScore");
const legend = document.getElementById("strokeLegend");
const charSpan = document.getElementById("traceChar");

const ctx = canvas.getContext("2d");
const SIZE = 320, LW = 16;

/* Traditional stroke order DB (synced with jamo-select) */
const DB = {
  'ㄱ': [[[0.20,0.25, 0.75,0.25]], [[0.75,0.25, 0.75,0.78]]],
  'ㄴ': [[[0.25,0.22, 0.25,0.78]], [[0.25,0.78, 0.78,0.78]]],
  'ㄷ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]]],
  'ㅁ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]], [[0.78,0.78, 0.78,0.22]]],
  'ㅂ': [[[0.22,0.22, 0.78,0.22]], [[0.32,0.22, 0.32,0.74]], [[0.68,0.22, 0.68,0.74]], [[0.22,0.78, 0.78,0.78]]],
  'ㅅ': [qCurve({x:0.24,y:0.78},{x:0.44,y:0.48},{x:0.50,y:0.22},24), qCurve({x:0.76,y:0.78},{x:0.56,y:0.48},{x:0.50,y:0.22},24)],
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
charSpan.textContent = target;
legend.innerHTML = DB[target].map((_,i)=>`<li>Stroke ${i+1}</li>`).join("");

/* Template draw */
function N(v){ return Math.round(v*SIZE); }
function drawTemplate(){
  ctx.clearRect(0,0,SIZE,SIZE);
  ctx.strokeStyle = 'rgba(79,140,255,.25)';
  ctx.lineWidth = LW; ctx.lineCap='round'; ctx.lineJoin='round';
  DB[target].forEach(segs => {
    segs.forEach(s => { const [x1,y1,x2,y2]=s.map(N); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
  });
}

/* Ink layer (no OffscreenCanvas) */
const ink = document.createElement("canvas"); ink.width=SIZE; ink.height=SIZE;
const ictx = ink.getContext("2d"); ictx.lineWidth=LW; ictx.lineCap='round'; ictx.lineJoin='round'; ictx.strokeStyle='#e6e7eb';
let drawing=false,last=null,strokes=[];

function pos(e){ const r=canvas.getBoundingClientRect(); const c=e.touches?e.touches[0]:e; return {x:c.clientX-r.left, y:c.clientY-r.top}; }
canvas.addEventListener("mousedown", e=>{ drawing=true; last=pos(e); strokes.push({points:[last]}); });
canvas.addEventListener("mousemove", e=>{ if(!drawing) return; const p=pos(e); ictx.beginPath(); ictx.moveTo(last.x,last.y); ictx.lineTo(p.x,p.y); ictx.stroke(); last=p; strokes[strokes.length-1].points.push(p); render(); });
window.addEventListener("mouseup", ()=>drawing=false);
canvas.addEventListener("touchstart", e=>{ e.preventDefault(); drawing=true; last=pos(e); strokes.push({points:[last]}); }, {passive:false});
canvas.addEventListener("touchmove", e=>{ e.preventDefault(); if(!drawing)return; const p=pos(e); ictx.beginPath(); ictx.moveTo(last.x,last.y); ictx.lineTo(p.x,p.y); ictx.stroke(); last=p; strokes[strokes.length-1].points.push(p); render(); }, {passive:false});
canvas.addEventListener("touchend", ()=>drawing=false, {passive:false});

function render(){ drawTemplate(); ctx.drawImage(ink,0,0); }
render();

/* ---------- Scoring ---------- */
/* IoU on raster */
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

/* Chamfer on resampled polylines */
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
  const dist = chamfer(tpl, usr); // px
  const THRESH = 18;
  return Math.exp(-dist/THRESH); // 1.0 at perfect, ~0.37 at 18px avg
}

/* Buttons */
document.getElementById("btnClear").onclick = ()=>{
  strokes=[]; ictx.clearRect(0,0,SIZE,SIZE); scoreOut.textContent=""; render();
};

document.getElementById("btnGrade").onclick = ()=>{
  const tpl = DB[target];
  if (!tpl){ scoreOut.textContent = "Unknown character template."; return; }
  if (strokes.length === 0){ scoreOut.textContent = "Draw the strokes first 🙂"; return; }

  const n = Math.min(tpl.length, strokes.length);

  // per-stroke hybrid
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

  scoreOut.innerHTML = `Score: <strong>${score}</strong>/100 &nbsp; ${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}`;
  if (score>=80){ addXP(10); addCoins(5); addBadge('✍️ Tracing Starter'); }
};

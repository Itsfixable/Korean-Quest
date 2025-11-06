// jamo-select.js — 3–5 column grid with animated traditional stroke previews + ⭐ display
import { getJamoStars } from "../main/state.js";

// Return SEGMENTS, not points: [[x1,y1,x2,y2], ...]
function qCurve(p0, cp, p1, steps = 24) {
  const segs = [];
  const Q = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  let prevX = p0.x, prevY = p0.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = Q(p0.x, cp.x, p1.x, t);
    const y = Q(p0.y, cp.y, p1.y, t);
    segs.push([prevX, prevY, x, y]);
    prevX = x; prevY = y;
  }
  return segs;
}

const GRID = document.getElementById("jamoGrid");

/* Traditional stroke order DB (normalized 0..1) */
const DB = {
  'ㄱ': [[[0.20,0.25, 0.75,0.25]], [[0.75,0.25, 0.75,0.78]]],
  'ㄴ': [[[0.25,0.22, 0.25,0.78]], [[0.25,0.78, 0.78,0.78]]],
  'ㄷ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]]],
  'ㅁ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]], [[0.78,0.78, 0.78,0.22]]],
  'ㅂ': [[[0.22,0.22, 0.78,0.22]], [[0.32,0.22, 0.32,0.74]], [[0.68,0.22, 0.68,0.74]], [[0.22,0.78, 0.78,0.78]]],

  // ✅ Now each stroke is an array of [x1,y1,x2,y2] segments
  'ㅅ': [
    qCurve({x:0.24,y:0.78},{x:0.44,y:0.48},{x:0.50,y:0.22},24),
    qCurve({x:0.76,y:0.78},{x:0.56,y:0.48},{x:0.50,y:0.22},24),
  ],

  'ㅇ': [[[0.65,0.50, 0.50,0.35],[0.50,0.35, 0.35,0.50],[0.35,0.50, 0.50,0.65],[0.50,0.65, 0.65,0.50]]],
  'ㅏ': [[[0.45,0.18, 0.45,0.82]], [[0.45,0.50, 0.65,0.50]]],
  'ㅓ': [[[0.55,0.18, 0.55,0.82]], [[0.55,0.50, 0.35,0.50]]],
  'ㅗ': [[[0.22,0.55, 0.78,0.55]], [[0.50,0.55, 0.50,0.35]]],
  'ㅣ': [[[0.55,0.18, 0.55,0.82]]],
  'ㅑ': [[[0.45,0.16, 0.45,0.84]], [[0.45,0.40, 0.65,0.40]], [[0.45,0.60, 0.65,0.60]]],
  'ㅕ': [[[0.55,0.16, 0.55,0.84]], [[0.55,0.40, 0.35,0.40]], [[0.55,0.60, 0.35,0.60]]],
  'ㅛ': [[[0.22,0.60, 0.78,0.60]], [[0.40,0.60, 0.40,0.40]], [[0.60,0.60, 0.60,0.40]]],
  'ㅠ': [[[0.22,0.40, 0.78,0.40]], [[0.40,0.40, 0.40,0.60]], [[0.60,0.40, 0.60,0.60]]],
  'ㅜ': [[[0.22,0.45, 0.78,0.45]], [[0.50,0.45, 0.50,0.65]]],
  'ㅡ': [[[0.22,0.55, 0.78,0.55]]],
};

/* Show 12 entries so 5 columns fill nicely; grid clamps to 3–5 cols via CSS */
const JAMO = [
  { ch:'ㄱ', kind:'Consonant' }, { ch:'ㄴ', kind:'Consonant' }, { ch:'ㄷ', kind:'Consonant' },
  { ch:'ㅁ', kind:'Consonant' }, { ch:'ㅂ', kind:'Consonant' }, { ch:'ㅅ', kind:'Consonant' },
  { ch:'ㅏ', kind:'Vowel' },     { ch:'ㅓ', kind:'Vowel' },     { ch:'ㅗ', kind:'Vowel' },
  { ch:'ㅣ', kind:'Vowel' },     { ch:'ㅠ', kind:'Vowel' },     { ch:'ㅡ', kind:'Vowel' },
];

function starsHTML(n){ return `<span>${'⭐'.repeat(n)}${'☆'.repeat(3-n)}</span>`; }

// 🛡️ Guard: only render if the container exists on this page
if (GRID) {
  GRID.innerHTML = JAMO.map(({ch,kind}) => {
    const earned = getJamoStars(ch);
    return `
      <article class="aw-level-card" role="listitem" data-char="${ch}">
        <header class="flex" style="justify-content:space-between">
          <h3>${ch}</h3>
          <span class="badge">${kind}</span>
        </header>
        <div class="muted">Progress: ${starsHTML(earned)}</div>
        <canvas width="120" height="120" data-char="${ch}" aria-label="${ch} stroke preview"></canvas>
        <div class="flex">
          <a class="btn" href="tracing.html?char=${encodeURIComponent(ch)}">Practice</a>
          <button class="btn secondary" type="button" data-play>Replay</button>
        </div>
      </article>
    `;
  }).join("");

  const canvases = [...GRID.querySelectorAll('canvas[data-char]')];
  const previews = canvases.map(cv => makePreview(cv, cv.dataset.char));

  GRID.querySelectorAll('button[data-play]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.aw-level-card');
      const pv = previews.find(p => p.char === card.dataset.char);
      pv?.restart();
    });
  });
}

function makePreview(canvas, ch){
  const ctx = canvas.getContext('2d'), W=canvas.width, H=canvas.height, lw=10;
  const tplColor='rgba(255,255,255,.12)', drawColor='#e6e7eb';
  const strokes = DB[ch] || [];

  function drawTemplate(){
    ctx.clearRect(0,0,W,H);
    ctx.lineWidth = lw; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle = tplColor;
    for (const segs of strokes){ for (const s of segs) segLine(s, 1); }
  }
  function segLine(seg, t){
    const [x1,y1,x2,y2] = seg; // expects 4-tuple
    const X1=x1*W, Y1=y1*H, X2=x2*W, Y2=y2*H;
    const dx=X2-X1, dy=Y2-Y1;
    ctx.beginPath(); ctx.moveTo(X1,Y1); ctx.lineTo(X1+dx*t, Y1+dy*t); ctx.stroke();
  }

  let raf=0, t0=0;
  const STROKE_TIME=550, GAP=220, N=strokes.length;

  function frame(ts){
    if(!t0) t0 = ts;
    const t = ts - t0, total = N*(STROKE_TIME+GAP);
    if (t >= total){ t0 = ts; drawTemplate(); raf = requestAnimationFrame(frame); return; }

    let acc=0, idx=0, local=0;
    for (let i=0;i<N;i++){
      const dur = STROKE_TIME+GAP;
      if (t < acc+dur){ idx=i; local = Math.min(1, (t-acc)/STROKE_TIME); break; }
      acc+=dur;
    }

    drawTemplate();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lw; ctx.lineCap='round'; ctx.lineJoin='round';

    for (let s=0; s<idx; s++) for (const seg of strokes[s]) segLine(seg,1);
    for (const seg of strokes[idx]) segLine(seg,local);

    raf = requestAnimationFrame(frame);
  }
  function start(){ cancelAnimationFrame(raf); t0=0; drawTemplate(); raf=requestAnimationFrame(frame); }
  function restart(){ start(); }
  start();
  return { char: ch, restart, destroy(){ cancelAnimationFrame(raf); } };
}

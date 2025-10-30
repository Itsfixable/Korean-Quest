// jamo-select.js — 3–5 column level grid with animated stroke previews + ⭐ display
import { getJamoStars } from "../main/state.js";

const GRID = document.getElementById('jamoGrid');

/* Traditional stroke order DB (normalized 0..1 coords) */
const DB = {
  'ㄱ': [[[0.20,0.25, 0.75,0.25]], [[0.75,0.25, 0.75,0.78]]],
  'ㄴ': [[[0.25,0.22, 0.25,0.78]], [[0.25,0.78, 0.78,0.78]]],
  'ㄷ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]]],
  'ㅁ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]], [[0.78,0.78, 0.78,0.22]]],
  'ㅂ': [[[0.22,0.22, 0.78,0.22]], [[0.32,0.22, 0.32,0.74]], [[0.68,0.22, 0.68,0.74]], [[0.22,0.78, 0.78,0.78]]],
  'ㅅ': [[[0.28,0.28, 0.50,0.60]], [[0.72,0.28, 0.50,0.60]]],
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

// Show a 3×5-ready set (we’ll use 12 to demonstrate density; JS clamps to 3–5 columns)
const JAMO = [
  { ch:'ㄱ', kind:'Consonant' }, { ch:'ㄴ', kind:'Consonant' }, { ch:'ㄷ', kind:'Consonant' },
  { ch:'ㅁ', kind:'Consonant' }, { ch:'ㅂ', kind:'Consonant' }, { ch:'ㅅ', kind:'Consonant' },
  { ch:'ㅏ', kind:'Vowel' },     { ch:'ㅓ', kind:'Vowel' },     { ch:'ㅗ', kind:'Vowel' },
  { ch:'ㅣ', kind:'Vowel' },     { ch:'ㅠ', kind:'Vowel' },     { ch:'ㅡ', kind:'Vowel' },
];

function starsHTML(n){ return `<span>${'⭐'.repeat(n)}${'☆'.repeat(3-n)}</span>`; }

function buildGrid(){
  GRID.innerHTML = JAMO.map(({ch,kind}) => {
    const earned = getJamoStars(ch);
    return `
      <article class="aw-level-card" role="listitem" data-char="${ch}">
        <header class="flex" style="justify-content:space-between">
          <h3 style="margin:0">${ch}</h3>
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
  }).join('');
}
buildGrid();

/* Enforce 3–5 columns on desktop (1–2 on small) */
function updateGridCols(){
  const w = GRID.clientWidth;
  // estimate card width ~ 180–200px
  let cols = Math.floor(w / 200);
  if (w >= 720) cols = Math.max(3, Math.min(5, cols)); // desktop/tablet
  else cols = Math.max(1, Math.min(2, cols));          // mobile narrow
  GRID.style.gridTemplateColumns = `repeat(${cols}, minmax(160px,1fr))`;
}
window.addEventListener('resize', updateGridCols);
window.addEventListener('load', updateGridCols);
updateGridCols();

/* Preview animations */
const canvases = [...GRID.querySelectorAll('canvas[data-char]')];
const previews = canvases.map(cv => makePreview(cv, cv.dataset.char));

GRID.querySelectorAll('button[data-play]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const card = btn.closest('.aw-level-card');
    const pv = previews.find(p => p.char === card.dataset.char);
    pv?.restart();
  });
});

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
    const [x1,y1,x2,y2] = seg;
    const X1=x1*W, Y1=y1*H, X2=x2*W, Y2=y2*H;
    const dx=X2-X1, dy=Y2-Y1;
    ctx.beginPath(); ctx.moveTo(X1,Y1); ctx.lineTo(X1+dx*t, Y1+dy*t); ctx.stroke();
  }

  let raf=0, t0=0;
  const STROKE_TIME=550, GAP=220, N=strokes.length;

  function frame(ts){
    if(!t0) t0 = ts;
    const t = ts - t0;
    const total = N*(STROKE_TIME+GAP);
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

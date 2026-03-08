// ../js/levels/jamo-select.js — theme-aware previews + ⭐ display
import { getJamoStars } from "../main/state.js";

const GRID = document.getElementById("jamoGrid");
if (!GRID) console.warn("[jamo-select] #jamoGrid not found.");

/* Where the tracing page lives */
const TRACE_URL = "tracing.html";

/* Stroke DB: [x1,y1,x2,y2] coords in 0..1 */
const DB = {
  'ㄱ': [[[0.20,0.25, 0.75,0.25]], [[0.75,0.25, 0.75,0.78]]],
  'ㄴ': [[[0.25,0.22, 0.25,0.78]], [[0.25,0.78, 0.78,0.78]]],
  'ㄷ': [[[0.22,0.22, 0.78,0.22]], [[0.22,0.22, 0.22,0.78]], [[0.22,0.78, 0.78,0.78]]],
  'ㅁ': [[[0.22,0.22, 0.22,0.78]], [[0.22,0.22, 0.78,0.22]], [[0.78,0.22, 0.78,0.78]], [[0.22,0.78, 0.78,0.78]],],
  'ㅂ': [[[0.27,0.22, 0.27,0.74]], [[0.73,0.22, 0.73,0.74]], [[0.27,0.52, 0.73,0.52]],   [[0.27,0.78, 0.73,0.78]]],
  // 'ㅅ': [[[0.28,0.28, 0.50,0.60]], [[0.72,0.28, 0.50,0.60]]],
  'ㅅ': [[[0.50,0.28, 0.28,0.60]], [[0.50,0.28, 0.72,0.60]]],
  'ㅇ': [[[0.65,0.50, 0.50,0.35],[0.50,0.35, 0.35,0.50],[0.35,0.50, 0.50,0.65],[0.50,0.65, 0.65,0.50]]],
  'ㅏ': [[[0.45,0.18, 0.45,0.82]], [[0.45,0.50, 0.65,0.50]]],
  'ㅑ': [[[0.45,0.16, 0.45,0.84]], [[0.45,0.40, 0.65,0.40]], [[0.45,0.60, 0.65,0.60]]],
  'ㅓ': [[[0.35,0.50, 0.55,0.50]],[[0.55,0.18, 0.55,0.82]]],
  'ㅕ': [[[0.55,0.16, 0.55,0.84]], [[0.55,0.40, 0.35,0.40]], [[0.55,0.60, 0.35,0.60]]],
  'ㅗ': [[[0.50,0.35, 0.50,0.55]], [[0.22,0.55, 0.78,0.55]]],
  'ㅛ': [[[0.22,0.60, 0.78,0.60]], [[0.40,0.60, 0.40,0.40]], [[0.60,0.60, 0.60,0.40]]],
  'ㅠ': [[[0.22,0.40, 0.78,0.40]], [[0.40,0.40, 0.40,0.60]], [[0.60,0.40, 0.60,0.60]]],
  'ㅜ': [[[0.22,0.45, 0.78,0.45]], [[0.50,0.45, 0.50,0.65]]],
  'ㅡ': [[[0.22,0.55, 0.78,0.55]]],
  'ㅣ': [[[0.55,0.18, 0.55,0.82]]],
};

/* Show 12 entries to fill 5-wide nicely */
const JAMO = [
  { ch:'ㄱ', kind:'Consonant' }, { ch:'ㄴ', kind:'Consonant' }, { ch:'ㄷ', kind:'Consonant' },
  { ch:'ㅁ', kind:'Consonant' }, { ch:'ㅂ', kind:'Consonant' }, { ch:'ㅅ', kind:'Consonant' },
  { ch:'ㅏ', kind:'Vowel' },     { ch:'ㅓ', kind:'Vowel' },     { ch:'ㅗ', kind:'Vowel' },
  { ch:'ㅣ', kind:'Vowel' },     { ch:'ㅠ', kind:'Vowel' },     { ch:'ㅡ', kind:'Vowel' },
];

function starsHTML(n){ return `<span>${'⭐'.repeat(n)}${'☆'.repeat(3-n)}</span>`; }

if (GRID) {
  GRID.innerHTML = JAMO.map(({ ch, kind }) => {
    const earned = getJamoStars(ch);
    return `
      <article
        class="aw-level-card"
        data-char="${ch}"
        role="listitem"
        tabindex="0"
        aria-label="Practice ${ch}"
      >
        <header class="aw-level-head">
          <h3 class="aw-level-char">${ch}</h3>
          <span class="aw-pill">${kind}</span>
        </header>

        <div class="aw-preview-wrap">
          <canvas
            data-char="${ch}"
            width="120"
            height="120"
            aria-label="Stroke order preview for ${ch}"
          ></canvas>
        </div>
      </article>
    `;
  }).join("");
  //   return `
  //     <article class="aw-level-card" role="button" tabindex="0" data-char="${ch}" aria-label="Practice ${ch}">
  //       <header class="flex" style="justify-content:space-between">
  //         <h3>${ch}</h3>
  //         <span class="btn id-badge">${kind}</span>
  //       </header>
  //       <div class="muted">Progress: ${starsHTML(earned)}</div>
  //       <canvas width="128" height="128" data-char="${ch}" aria-label="${ch} stroke preview"></canvas>
  //       <div class="flex">
  //         <a class="btn" href="${TRACE_URL}?char=${encodeURIComponent(ch)}">Practice</a>
          
  //       </div>
  //     </article>
  //   `;
  // }).join("");

  /* Whole card navigates to tracing (except Replay button) */
  GRID.querySelectorAll(".aw-level-card").forEach(card => {
    const ch = card.dataset.char;
    card.addEventListener("click", (e) => {
      if (e.target.closest?.('[data-play]')) return;
      location.href = `${TRACE_URL}?char=${encodeURIComponent(ch)}`;
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        location.href = `${TRACE_URL}?char=${encodeURIComponent(ch)}`;
      }
    });
  });

  /* Theme-aware animated previews */
  const canvases = [...GRID.querySelectorAll('canvas[data-char]')];
  const previews = canvases.map(cv => makePreview(cv, cv.dataset.char));

  GRID.querySelectorAll('button[data-play]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const card = btn.closest('.aw-level-card');
      const pv = previews.find(p => p.char === card.dataset.char);
      pv?.restart();
    });
  });

  /* Keep previews synced if theme toggles */
  const mo = new MutationObserver(() => previews.forEach(p => p.restart(true)));
  mo.observe(document.documentElement, { attributes:true, attributeFilter:["data-theme"] });
}

/* ======== Preview animation (theme-aware colors) ======== */
function isLight(){ return document.documentElement.getAttribute("data-theme") === "light"; }
function tplColor(){ return getCSS('--preview-template') || (isLight() ? '#a0acc2' : '#6e7da3'); }
function drawColor(){ return getCSS('--preview-draw')     || (isLight() ? '#101318' : '#ffffff'); }
function getCSS(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function makePreview(canvas, ch){
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height, lw=10;
  const strokes = DB[ch] || [];

  function drawTemplate(){
    ctx.clearRect(0,0,W,H);
    ctx.lineWidth = lw; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle = tplColor();
    for (const segs of strokes){ for (const s of segs) segLine(s, 1); }
  }
  function segLine(seg, t){
    const [x1,y1,x2,y2] = seg;
    const X1=x1*W, Y1=y1*H, X2=x2*W, Y2=y2*H;
    const dx=X2-X1, dy=Y2-Y1;
    ctx.beginPath(); ctx.moveTo(X1,Y1); ctx.lineTo(X1+dx*t, Y1+dy*t); ctx.stroke();
  }

  let raf=0, t0=0;
  const STROKE_TIME=520, GAP=220, N=strokes.length;

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
    ctx.strokeStyle = drawColor();
    ctx.lineWidth = lw; ctx.lineCap='round'; ctx.lineJoin='round';

    for (let s=0; s<idx; s++) for (const seg of strokes[s]) segLine(seg,1);
    for (const seg of strokes[idx]) segLine(seg,local);

    raf = requestAnimationFrame(frame);
  }
  function start(){ cancelAnimationFrame(raf); t0=0; drawTemplate(); raf=requestAnimationFrame(frame); }
  function restart(force){ if(force){ cancelAnimationFrame(raf); } start(); }
  start();
  return { char: ch, restart, destroy(){ cancelAnimationFrame(raf); } };
}

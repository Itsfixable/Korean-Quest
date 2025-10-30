// js/levels/jamo-select.js
// Duolingo-style level select with animated jamo stroke previews.
// No imports; standalone module. Works with <script type="module">.

const GRID = document.getElementById('jamoGrid');

// ---- Stroke DB (normalized) ----
// Each jamo has strokes; each stroke has segments [x1,y1,x2,y2] in 0..1 canvas coords.
const DB = {
  // Consonants
  'ㄱ': [
    [[0.25,0.25, 0.70,0.25]],           // top horizontal
    [[0.70,0.25, 0.70,0.75]],           // right vertical
  ],
  'ㄴ': [
    [[0.30,0.25, 0.30,0.75]],           // left vertical
    [[0.30,0.75, 0.75,0.75]],           // bottom horizontal
  ],
  'ㄷ': [
    [[0.25,0.25, 0.75,0.25]],
    [[0.25,0.25, 0.25,0.75]],
    [[0.25,0.75, 0.75,0.75]],
  ],
  'ㅁ': [
    [[0.25,0.25, 0.75,0.25]],
    [[0.25,0.25, 0.25,0.75]],
    [[0.25,0.75, 0.75,0.75]],
    [[0.75,0.75, 0.75,0.25]],
  ],
  'ㅂ': [
    [[0.25,0.25, 0.75,0.25]],
    [[0.35,0.25, 0.35,0.72]],
    [[0.65,0.25, 0.65,0.72]],
    [[0.25,0.75, 0.75,0.75]],
  ],
  'ㅅ': [
    [[0.28,0.28, 0.50,0.60]],
    [[0.72,0.28, 0.50,0.60]],
  ],
  'ㅇ': [
    // approximate circle via 4 straight segments (for preview only)
    [[0.65,0.50, 0.50,0.35],[0.50,0.35, 0.35,0.50],[0.35,0.50, 0.50,0.65],[0.50,0.65, 0.65,0.50]],
  ],

  // Vowels
  'ㅣ': [
    [[0.55,0.20, 0.55,0.80]],
  ],
  'ㅡ': [
    [[0.25,0.55, 0.75,0.55]],
  ],
  'ㅏ': [
    [[0.45,0.20, 0.45,0.80]],
    [[0.45,0.50, 0.62,0.50]],
  ],
  'ㅑ': [
    [[0.45,0.18, 0.45,0.82]],
    [[0.45,0.40, 0.62,0.40]],
    [[0.45,0.60, 0.62,0.60]],
  ],
  'ㅓ': [
    [[0.55,0.20, 0.55,0.80]],
    [[0.55,0.50, 0.38,0.50]],
  ],
  'ㅕ': [
    [[0.55,0.18, 0.55,0.82]],
    [[0.55,0.40, 0.38,0.40]],
    [[0.55,0.60, 0.38,0.60]],
  ],
  'ㅗ': [
    [[0.25,0.55, 0.75,0.55]],
    [[0.50,0.55, 0.50,0.35]],
  ],
  'ㅛ': [
    [[0.25,0.60, 0.75,0.60]],
    [[0.40,0.60, 0.40,0.40]],
    [[0.60,0.60, 0.60,0.40]],
  ],
  'ㅜ': [
    [[0.25,0.45, 0.75,0.45]],
    [[0.50,0.45, 0.50,0.65]],
  ],
  'ㅠ': [
    [[0.25,0.40, 0.75,0.40]],
    [[0.40,0.40, 0.40,0.60]],
    [[0.60,0.40, 0.60,0.60]],
  ],
};

// Which jamo to show in the grid (feel free to add more)
const JAMO = [
  { ch:'ㄱ', kind:'Consonant' }, { ch:'ㄴ', kind:'Consonant' }, { ch:'ㄷ', kind:'Consonant' },
  { ch:'ㅁ', kind:'Consonant' }, { ch:'ㅂ', kind:'Consonant' }, { ch:'ㅅ', kind:'Consonant' },
  { ch:'ㅇ', kind:'Consonant' },
  { ch:'ㅏ', kind:'Vowel' }, { ch:'ㅑ', kind:'Vowel' }, { ch:'ㅓ', kind:'Vowel' },
  { ch:'ㅕ', kind:'Vowel' }, { ch:'ㅗ', kind:'Vowel' }, { ch:'ㅛ', kind:'Vowel' },
  { ch:'ㅜ', kind:'Vowel' }, { ch:'ㅠ', kind:'Vowel' }, { ch:'ㅡ', kind:'Vowel' }, { ch:'ㅣ', kind:'Vowel' },
];

// Build cards
function buildGrid(){
  GRID.innerHTML = JAMO.map(({ch,kind}) => `
    <article class="aw-level-card" role="listitem" data-char="${ch}">
      <header class="flex" style="justify-content:space-between">
        <h3 style="margin:0">${ch}</h3>
        <span class="badge">${kind}</span>
      </header>
      <canvas width="120" height="120" data-char="${ch}" aria-label="${ch} stroke preview"></canvas>
      <div class="flex">
        <a class="btn" href="tracing.html?char=${encodeURIComponent(ch)}">Practice</a>
        <button class="btn secondary" type="button" data-play>Replay</button>
      </div>
    </article>
  `).join('');
}
buildGrid();

// Animate all canvases
const CANVASES = [...GRID.querySelectorAll('canvas[data-char]')];
const PREVIEWS = CANVASES.map(cv => createPreview(cv, cv.dataset.char));

GRID.querySelectorAll('button[data-play]').forEach(btn=>{
  btn.addEventListener('click', () => {
    const card = btn.closest('.aw-level-card');
    const ch = card?.dataset.char;
    const pv = PREVIEWS.find(p => p.char === ch);
    pv?.restart();
  });
});

// ---- Preview engine ----
function createPreview(canvas, char){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const lw = 10;
  const templateColor = 'rgba(255,255,255,.10)';
  const drawColor = '#e6e7eb';
  const strokes = DB[char] || [];

  // draw faint template once
  function drawTemplate(){
    ctx.clearRect(0,0,W,H);
    ctx.lineWidth = lw; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle = templateColor;
    for (const segs of strokes){
      for (const s of segs){
        line(ctx, s, 1, W, H); // full length
      }
    }
  }

  // line helper with partial t [0..1]
  function line(ctx, seg, t, W, H){
    const [x1,y1,x2,y2] = seg;
    const X1=x1*W, Y1=y1*H, X2=x2*W, Y2=y2*H;
    const dx = X2 - X1, dy = Y2 - Y1;
    ctx.beginPath();
    ctx.moveTo(X1, Y1);
    ctx.lineTo(X1 + dx*t, Y1 + dy*t);
    ctx.stroke();
  }

  let raf = 0;
  let startTime = 0;
  const STROKE_TIME = 600;  // ms per stroke
  const PAUSE_BETWEEN = 250;
  const TOTAL = strokes.length;

  function frame(ts){
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    // Which stroke are we on?
    let acc = 0, idx = 0, tLocal = 0;
    for (let i=0;i<TOTAL;i++){
      const dur = STROKE_TIME + PAUSE_BETWEEN;
      if (elapsed < acc + dur){ idx = i; tLocal = Math.min(1, (elapsed - acc)/STROKE_TIME); break; }
      acc += dur;
    }
    // If finished all strokes, loop
    if (elapsed >= TOTAL*(STROKE_TIME+PAUSE_BETWEEN)){
      startTime = ts;
      drawTemplate(); // clear to template again
      raf = requestAnimationFrame(frame);
      return;
    }

    // redraw template then draw all completed strokes + partial current
    drawTemplate();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lw; ctx.lineCap='round'; ctx.lineJoin='round';

    // completed strokes
    for (let s=0; s<idx; s++){
      for (const seg of strokes[s]) line(ctx, seg, 1, W, H);
    }
    // partial current stroke
    for (const seg of strokes[idx]) line(ctx, seg, tLocal, W, H);

    raf = requestAnimationFrame(frame);
  }

  function start(){ cancelAnimationFrame(raf); startTime = 0; drawTemplate(); raf = requestAnimationFrame(frame); }
  function restart(){ start(); }

  // initial draw
  start();

  return { char, restart, destroy(){ cancelAnimationFrame(raf); } };
}

// ../js/main/schedule.js
console.log('[KQ] schedule.js loaded');

const need = (id) => {
  const el = document.getElementById(id);
  if (!el) console.error('[KQ] Missing element #' + id);
  return el;
};

const EL = {
  monthLabel: need('monthLabel'),
  prevMonth:  need('prevMonth'),
  nextMonth:  need('nextMonth'),
  calGrid:    need('calGrid'),
  selectedDateLabel: need('selectedDateLabel'),
  slotsGrid:  need('slotsGrid'),
  clearDay:   need('clearDay'),
  myBookings: need('myBookings'),
};

const today = new Date();
let viewYear  = today.getFullYear();
let viewMonth = today.getMonth();
let selectedISO = iso(today);

function iso(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function parseISO(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function humanDate(s){ const d = parseISO(s); return d.toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'}); }

function safe(fn, tag){
  try { fn(); } catch (e){ console.error('[KQ] ' + tag + ' failed:', e); }
}

function renderCalendar(){
  if (!EL.calGrid || !EL.monthLabel) return;

  // Title
  const hdr = new Date(viewYear, viewMonth, 1);
  EL.monthLabel.textContent = hdr.toLocaleDateString([], {month:'long', year:'numeric'});

  // Weekday header
  EL.calGrid.innerHTML = `
    <div class="weekday">Sun</div><div class="weekday">Mon</div><div class="weekday">Tue</div>
    <div class="weekday">Wed</div><div class="weekday">Thu</div><div class="weekday">Fri</div><div class="weekday">Sat</div>
  `;

  // Leading blanks
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDay = firstDay.getDay();
  for (let i=0;i<startDay;i++) EL.calGrid.appendChild(document.createElement('div'));

  // Days
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const todayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let count = 0;

  for (let d=1; d<=daysInMonth; d++){
    const dateISO = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day';
    cell.textContent = d;

    // inline debug styles to defeat any conflicting CSS
    cell.style.minHeight = '40px';
    cell.style.border = '1px solid rgba(0,0,0,.15)';

    if (parseISO(dateISO) < todayFloor) cell.disabled = true;

    cell.addEventListener('click', ()=>{
      selectedISO = dateISO;
      safe(renderCalendar, 'renderCalendar(reselect)');
      safe(renderSlots, 'renderSlots(after select)');
    });

    EL.calGrid.appendChild(cell);
    count++;
  }

  if (!count){
    const warn = document.createElement('div');
    warn.textContent = 'No days rendered';
    warn.style.border = '1px dashed red';
    warn.style.padding = '8px';
    EL.calGrid.appendChild(warn);
  }
}

function renderSlots(){
  if (!EL.slotsGrid || !EL.selectedDateLabel) return;
  EL.selectedDateLabel.textContent = humanDate(selectedISO);
  EL.slotsGrid.innerHTML = '';
  // draw a few dummy slots so we always see something
  ['09:00','09:30','10:00','10:30','11:00','11:30'].forEach(t=>{
    const b = document.createElement('button');
    b.className = 'slot';
    b.type = 'button';
    b.textContent = t;
    EL.slotsGrid.appendChild(b);
  });
}

if (EL.prevMonth) EL.prevMonth.addEventListener('click', ()=>{ viewMonth--; if (viewMonth<0){viewMonth=11;viewYear--;} safe(renderCalendar,'renderCalendar(prev)'); });
if (EL.nextMonth) EL.nextMonth.addEventListener('click', ()=>{ viewMonth++; if (viewMonth>11){viewMonth=0;viewYear++; } safe(renderCalendar,'renderCalendar(next)'); });

(function init(){
  console.log('[KQ] schedule.js init');
  safe(renderCalendar, 'renderCalendar(init)');
  safe(renderSlots, 'renderSlots(init)');
})();

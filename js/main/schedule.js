// ../js/main/schedule.js
// Book up to MAX_PER_DAY sessions per date; click a slot to select/deselect.
// "Your Bookings" shows Join + Cancel; Join opens video.html?room=...

console.log("[KQ] schedule.js loaded");

/* ---------- Config ---------- */
const MAX_PER_DAY = 2; // change to adjust the per-day cap
const TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30"];

/* ---------- Element helpers ---------- */
const need = (id) => {
  const el = document.getElementById(id);
  if (!el) console.error("[KQ] Missing element #"+id);
  return el;
};
const EL = {
  monthLabel: need("monthLabel"),
  prevMonth:  need("prevMonth"),
  nextMonth:  need("nextMonth"),
  calGrid:    need("calGrid"),
  selectedDateLabel: need("selectedDateLabel"),
  slotsGrid:  need("slotsGrid"),
  clearDay:   need("clearDay"),
  myBookings: need("myBookings"),
  slotHint:   document.getElementById("slotHint"),
};

const today = new Date();
let viewYear  = today.getFullYear();
let viewMonth = today.getMonth();
let selectedISO = iso(today);

/* ---------- Date utils ---------- */
function iso(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parseISO(s){ const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); }
function humanDate(s){ const d = parseISO(s); return d.toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"}); }

/* ---------- Local store ---------- */
const BK_KEY = "kq_bookings_v1";                             // { "YYYY-MM-DD_HH:MM": {date,time,room,going,createdAt} }
const bookings = JSON.parse(localStorage.getItem(BK_KEY) || "{}");
function saveBookings(){ localStorage.setItem(BK_KEY, JSON.stringify(bookings)); }
function roomFor(dateISO, timeStr){ return `KQ_${dateISO.replaceAll("-","")}_${timeStr.replace(":","")}`; }

function countForDate(dateISO){
  let n = 0;
  for (const k in bookings) if (bookings[k]?.date === dateISO) n++;
  return n;
}
function isBooked(dateISO, time){ return !!bookings[`${dateISO}_${time}`]; }
function toggleBooking(dateISO, time){
  const id = `${dateISO}_${time}`;
  if (bookings[id]){
    delete bookings[id];                                      // deselect
    saveBookings();
    return { action: "removed" };
  }
  // enforce cap
  if (countForDate(dateISO) >= MAX_PER_DAY){
    return { action: "blocked", reason: "Daily limit reached" };
  }
  bookings[id] = { date: dateISO, time, room: roomFor(dateISO,time), going: true, createdAt: Date.now() };
  saveBookings();
  return { action: "added" };
}

/* ---------- Calendar render ---------- */
function renderCalendar(){
  if (!EL.calGrid || !EL.monthLabel) return;

  const hdr = new Date(viewYear, viewMonth, 1);
  EL.monthLabel.textContent = hdr.toLocaleDateString([], {month:"long", year:"numeric"});

  EL.calGrid.innerHTML = `
    <div class="weekday">Sun</div><div class="weekday">Mon</div><div class="weekday">Tue</div>
    <div class="weekday">Wed</div><div class="weekday">Thu</div><div class="weekday">Fri</div><div class="weekday">Sat</div>
  `;

  const first = new Date(viewYear, viewMonth, 1);
  const lead = first.getDay();
  for (let i=0;i<lead;i++) EL.calGrid.appendChild(document.createElement("div"));

  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const todayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let d=1; d<=daysInMonth; d++){
    const dateISO = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    btn.textContent = d;

    if (parseISO(dateISO) < todayFloor) btn.disabled = true;

    btn.addEventListener("click", ()=>{
      selectedISO = dateISO;
      renderCalendar();   // to refresh selected outline
      renderSlots();
    });

    if (selectedISO === dateISO) btn.classList.add("selected");
    EL.calGrid.appendChild(btn);
  }
}

/* ---------- Slots: select / deselect with cap ---------- */
function renderSlots(){
  if (!EL.slotsGrid || !EL.selectedDateLabel) return;

  EL.selectedDateLabel.textContent = humanDate(selectedISO);
  EL.slotsGrid.innerHTML = "";

  const count = countForDate(selectedISO);
  if (EL.slotHint){
    EL.slotHint.textContent = `Tip: click a time to select or deselect. You can book up to ${MAX_PER_DAY} session(s) on ${humanDate(selectedISO)}.`;
  }

  TIMES.forEach(t=>{
    const id = `${selectedISO}_${t}`;
    const booked = !!bookings[id];
    const atCap  = !booked && count >= MAX_PER_DAY;

    const b = document.createElement("button");
    b.type = "button";
    b.className = "slot";
    b.textContent = booked ? `Selected • ${t}` : t;

    if (booked) b.classList.add("me");
    if (atCap) {
      b.classList.add("booked");
      b.disabled = true;
      b.title = `Daily limit (${MAX_PER_DAY}) reached`;
    }

    b.addEventListener("click", ()=>{
      const res = toggleBooking(selectedISO, t);
      if (res.action === "blocked") {
        // quick non-modal notice:
        b.blur();
      }
      renderSlots();
      renderMyBookings();
    });

    EL.slotsGrid.appendChild(b);
  });
}

/* ---------- "Your Bookings" list ---------- */
function renderMyBookings(){
  if (!EL.myBookings) return;
  const items = Object.values(bookings).sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));

  EL.myBookings.innerHTML = items.length
    ? items.map(b=>`
        <li>
          ${humanDate(b.date)} @ ${b.time}
          — <a class="btn" href="video.html?room=${encodeURIComponent(b.room)}">Join</a>
          <button class="btn secondary" data-cancel="${b.date}_${b.time}">Cancel</button>
        </li>
      `).join("")
    : `<li class="muted">No bookings yet.</li>`;

  EL.myBookings.querySelectorAll("[data-cancel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.cancel;
      delete bookings[id];
      saveBookings();
      renderSlots();
      renderMyBookings();
    });
  });
}

/* ---------- Clear selected day ---------- */
if (EL.clearDay){
  EL.clearDay.addEventListener("click", ()=>{
    Object.keys(bookings).forEach(k => { if (bookings[k]?.date === selectedISO) delete bookings[k]; });
    saveBookings();
    renderSlots();
    renderMyBookings();
  });
}

/* ---------- Month controls ---------- */
if (EL.prevMonth) EL.prevMonth.addEventListener("click", ()=>{
  viewMonth--; if (viewMonth<0){ viewMonth=11; viewYear--; }
  renderCalendar(); renderSlots();
});
if (EL.nextMonth) EL.nextMonth.addEventListener("click", ()=>{
  viewMonth++; if (viewMonth>11){ viewMonth=0; viewYear++; }
  renderCalendar(); renderSlots();
});

/* ---------- Boot ---------- */
(function init(){
  renderCalendar();
  renderSlots();
  renderMyBookings();
})();

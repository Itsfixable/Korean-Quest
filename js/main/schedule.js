// ../js/main/schedule.js
// Book up to MAX_PER_DAY sessions per date; click a slot to select/deselect.
// "Your Bookings" shows Join + Cancel; Join opens video.html?room=...

console.log("[KQ] schedule.js loaded");

/* ---------- Config ---------- */
const MAX_PER_DAY = 2;
const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

/* ---------- Element helpers ---------- */
const need = (id) => {
  const el = document.getElementById(id);
  if (!el) console.error("[KQ] Missing element #" + id);
  return el;
};

const EL = {
  monthLabel: need("monthLabel"),
  prevMonth: need("prevMonth"),
  nextMonth: need("nextMonth"),
  calGrid: need("calGrid"),
  selectedDateLabel: need("selectedDateLabel"),
  slotsGrid: need("slotsGrid"),
  clearDay: need("clearDay"),
  myBookings: need("myBookings"),
  slotHint: document.getElementById("slotHint"),
};

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedISO = iso(today);

/* ---------- Date utils ---------- */
function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function humanDate(s) {
  const d = parseISO(s);
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return (h * 60) + m;
}

function formatTime12(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function bookingDateTime(dateISO, timeStr) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function isPastSlot(dateISO, timeStr) {
  return bookingDateTime(dateISO, timeStr).getTime() < Date.now();
}

/* ---------- Local store ---------- */
const BK_KEY = "kq_bookings_v1"; // { "YYYY-MM-DD_HH:MM": {date,time,room,going,createdAt} }
const bookings = JSON.parse(localStorage.getItem(BK_KEY) || "{}");

function saveBookings() {
  localStorage.setItem(BK_KEY, JSON.stringify(bookings));
}

function roomFor(dateISO, timeStr) {
  return `KQ_${dateISO.replaceAll("-", "")}_${timeStr.replace(":", "")}`;
}

function pruneExpiredBookings() {
  let changed = false;

  Object.keys(bookings).forEach((key) => {
    const booking = bookings[key];
    if (!booking?.date || !booking?.time) {
      delete bookings[key];
      changed = true;
      return;
    }

    if (isPastSlot(booking.date, booking.time)) {
      delete bookings[key];
      changed = true;
    }
  });

  if (changed) saveBookings();
}

function countForDate(dateISO) {
  let n = 0;
  for (const k in bookings) {
    if (bookings[k]?.date === dateISO) n++;
  }
  return n;
}

function toggleBooking(dateISO, time) {
  const id = `${dateISO}_${time}`;

  if (bookings[id]) {
    delete bookings[id];
    saveBookings();
    return { action: "removed" };
  }

  if (isPastSlot(dateISO, time)) {
    return { action: "blocked", reason: "That time has already passed." };
  }

  if (countForDate(dateISO) >= MAX_PER_DAY) {
    return { action: "blocked", reason: "Daily limit reached" };
  }

  bookings[id] = {
    date: dateISO,
    time,
    room: roomFor(dateISO, time),
    going: true,
    createdAt: Date.now(),
  };

  saveBookings();
  return { action: "added" };
}

/* ---------- Selected day UI helpers ---------- */
function setSelectedDayUI(dateISO) {
  if (!EL.calGrid) return;

  EL.calGrid.querySelectorAll("button.day.selected").forEach((b) => b.classList.remove("selected"));
  EL.calGrid
    .querySelectorAll("button.day[aria-selected='true']")
    .forEach((b) => b.setAttribute("aria-selected", "false"));

  const match = EL.calGrid.querySelector(`button.day[data-iso="${dateISO}"]`);
  if (match) {
    match.classList.add("selected");
    match.setAttribute("aria-selected", "true");
  }
}

/* ---------- Calendar render ---------- */
function renderCalendar() {
  if (!EL.calGrid || !EL.monthLabel) return;

  const hdr = new Date(viewYear, viewMonth, 1);
  EL.monthLabel.textContent = hdr.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

  EL.calGrid.innerHTML = `
    <div class="weekday">Sun</div><div class="weekday">Mon</div><div class="weekday">Tue</div>
    <div class="weekday">Wed</div><div class="weekday">Thu</div><div class="weekday">Fri</div><div class="weekday">Sat</div>
  `;

  const first = new Date(viewYear, viewMonth, 1);
  const lead = first.getDay();

  for (let i = 0; i < lead; i++) {
    EL.calGrid.appendChild(document.createElement("div"));
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let d = 1; d <= daysInMonth; d++) {
    const dateISO = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    btn.textContent = d;
    btn.dataset.iso = dateISO;
    btn.setAttribute("aria-selected", "false");

    if (parseISO(dateISO) < todayFloor) {
      btn.disabled = true;
    }

    btn.addEventListener("click", () => {
      selectedISO = dateISO;
      setSelectedDayUI(selectedISO);
      renderSlots();
    });

    if (selectedISO === dateISO) {
      btn.classList.add("selected");
      btn.setAttribute("aria-selected", "true");
    }

    EL.calGrid.appendChild(btn);
  }
}

/* ---------- Slots: select / deselect with cap ---------- */
function renderSlots() {
  if (!EL.slotsGrid || !EL.selectedDateLabel) return;

  pruneExpiredBookings();

  EL.selectedDateLabel.textContent = humanDate(selectedISO);
  EL.slotsGrid.innerHTML = "";

  const count = countForDate(selectedISO);

  if (EL.slotHint) {
    EL.slotHint.textContent = `Tip: click a time to select or deselect. You can book up to ${MAX_PER_DAY} session(s) on ${humanDate(selectedISO)}.`;
  }

  TIMES.forEach((t) => {
    const id = `${selectedISO}_${t}`;
    const booked = !!bookings[id];
    const atCap = !booked && count >= MAX_PER_DAY;
    const past = isPastSlot(selectedISO, t);

    const b = document.createElement("button");
    b.type = "button";
    b.className = "slot";
    b.textContent = booked ? `Selected • ${formatTime12(t)}` : formatTime12(t);

    if (booked) {
      b.classList.add("me");
    }

    if (past) {
      b.classList.add("past");
      b.disabled = true;
      b.title = "This time has already passed";
    } else if (atCap) {
      b.classList.add("booked");
      b.disabled = true;
      b.title = `Daily limit (${MAX_PER_DAY}) reached`;
    }

    b.addEventListener("click", () => {
      const res = toggleBooking(selectedISO, t);
      if (res.action === "blocked") {
        b.blur();
      }
      renderSlots();
      renderMyBookings();
    });

    EL.slotsGrid.appendChild(b);
  });
}

/* ---------- "Your Bookings" list ---------- */
function renderMyBookings() {
  if (!EL.myBookings) return;

  pruneExpiredBookings();

  const items = Object.values(bookings)
    .sort((a, b) => bookingDateTime(a.date, a.time) - bookingDateTime(b.date, b.time));

  EL.myBookings.innerHTML = items.length
    ? items
        .map(
          (b) => `
        <li class="booking-row">
          <span class="booking-text">${humanDate(b.date)} @ ${formatTime12(b.time)}</span>
          <span class="booking-actions">
            <a class="btn" href="video.html?room=${encodeURIComponent(b.room)}">Join</a>
            <button class="btn secondary" data-cancel="${b.date}_${b.time}">Cancel</button>
          </span>
        </li>
      `
        )
        .join("")
    : `<li class="muted">No bookings yet.</li>`;

  EL.myBookings.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.cancel;
      delete bookings[id];
      saveBookings();
      renderSlots();
      renderMyBookings();
    });
  });
}

/* ---------- Clear selected day ---------- */
if (EL.clearDay) {
  EL.clearDay.addEventListener("click", () => {
    Object.keys(bookings).forEach((k) => {
      if (bookings[k]?.date === selectedISO) {
        delete bookings[k];
      }
    });
    saveBookings();
    renderSlots();
    renderMyBookings();
  });
}

/* ---------- Month controls ---------- */
if (EL.prevMonth) {
  EL.prevMonth.addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    renderCalendar();
    setSelectedDayUI(selectedISO);
    renderSlots();
  });
}

if (EL.nextMonth) {
  EL.nextMonth.addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderCalendar();
    setSelectedDayUI(selectedISO);
    renderSlots();
  });
}

/* ---------- Boot ---------- */
(function init() {
  pruneExpiredBookings();
  renderCalendar();
  setSelectedDayUI(selectedISO);
  renderSlots();
  renderMyBookings();
})();
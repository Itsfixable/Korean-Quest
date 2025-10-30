import { toggleRSVP, getRSVPs } from "./state.js";

function fmt(d) {
  return new Date(d).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const events = [
  {
    id: "e1",
    title: "Hangul Basics: ㄱ ㄴ ㄷ ㅁ ㅂ + ㅏ",
    when: Date.now() + 24 * 3600e3,
    host: "Ava (11th)",
    seats: 20,
  },
  {
    id: "e2",
    title: "Vocab Sprint: Food Words",
    when: Date.now() + 48 * 3600e3,
    host: "Noah (12th)",
    seats: 18,
  },
  {
    id: "e3",
    title: "Phrases: Greetings & Intros",
    when: Date.now() + 72 * 3600e3,
    host: "Mia (10th)",
    seats: 14,
  },
];

const cal = document.getElementById("kq-calendar");
const rsvps = getRSVPs();

cal.innerHTML = events
  .map(
    (ev) => `
  <article class="event" data-event-id="${ev.id}" role="listitem">
    <div class="event-info">
      <div class="when">${fmt(ev.when)}</div>
      <div class="title">${ev.title}</div>
      <div class="meta">Host: ${ev.host} • Seats left: ${
      ev.seats - (rsvps[ev.id]?.going ? 1 : 0)
    }</div>
    </div>
    <div class="event-cta">
      <button class="btn" data-rsvp="${ev.id}">${
      rsvps[ev.id]?.going ? "Cancel" : "RSVP"
    }</button>
    </div>
  </article>
`
  )
  .join("");

cal.querySelectorAll("button[data-rsvp]").forEach((btn) => {
  btn.addEventListener("click", () => {
    toggleRSVP(btn.dataset.rsvp);
    location.reload();
  });
});

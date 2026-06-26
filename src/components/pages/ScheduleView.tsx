"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBookingStore } from "@/stores/useBookingStore";
import type { Booking } from "@/lib/types";
import { asset } from "@/lib/asset";
import "@/styles/pages/schedule.css";

const MAX_PER_DAY = 2;

// Bookable window: 9:00 AM through 8:30 PM in 30-minute steps. Generated so the
// schedule offers real options throughout the day (not just the morning).
const SLOT_START_MIN = 9 * 60;
const SLOT_END_MIN = 20 * 60 + 30;
const SLOT_STEP_MIN = 30;

function buildTimes() {
  const out: string[] = [];
  for (let mins = SLOT_START_MIN; mins <= SLOT_END_MIN; mins += SLOT_STEP_MIN) {
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
}

const TIMES = buildTimes();

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function humanDate(s: string) {
  return parseISO(s).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function formatTime12(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function bookingDateTime(dateISO: string, timeStr: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function isPastSlot(dateISO: string, timeStr: string) {
  return bookingDateTime(dateISO, timeStr).getTime() < Date.now();
}

function roomFor(dateISO: string, timeStr: string) {
  return `KQ_${dateISO.replaceAll("-", "")}_${timeStr.replace(":", "")}`;
}

export default function ScheduleView() {
  const bookings = useBookingStore((s) => s.bookings);
  const addBooking = useBookingStore((s) => s.addBooking);
  const removeBooking = useBookingStore((s) => s.removeBooking);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedISO, setSelectedISO] = useState(() => iso(today));
  // Re-render every 30s so slots that pass during the session drop off and the
  // "past" state stays accurate without a manual refresh.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const pruneExpired = useCallback(() => {
    Object.entries(bookings).forEach(([key, booking]) => {
      if (!booking?.date || !booking?.time || isPastSlot(booking.date, booking.time)) {
        removeBooking(key);
      }
    });
  }, [bookings, removeBooking]);

  useEffect(() => {
    pruneExpired();
  }, [pruneExpired]);

  const countForDate = useCallback(
    (dateISO: string) => Object.values(bookings).filter((b) => b?.date === dateISO).length,
    [bookings],
  );

  const toggleBooking = (dateISO: string, time: string) => {
    const id = `${dateISO}_${time}`;
    if (bookings[id]) {
      removeBooking(id);
      return;
    }
    if (isPastSlot(dateISO, time)) return;
    if (countForDate(dateISO) >= MAX_PER_DAY) return;

    const booking: Booking = {
      date: dateISO,
      time,
      room: roomFor(dateISO, time),
      going: true,
      createdAt: Date.now(),
    };
    addBooking(id, booking);
  };

  const clearDay = () => {
    Object.entries(bookings).forEach(([key, booking]) => {
      if (booking?.date === selectedISO) removeBooking(key);
    });
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString([], { month: "long", year: "numeric" });
  const first = new Date(viewYear, viewMonth, 1);
  const lead = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const sortedBookings = Object.values(bookings).sort(
    (a, b) => bookingDateTime(a.date, a.time).getTime() - bookingDateTime(b.date, b.time).getTime(),
  );

  // Only show times that are still upcoming for the selected day. Future days
  // keep every slot; today drops the ones that have already passed.
  const daySlots = TIMES.filter((t) => bookingDateTime(selectedISO, t).getTime() >= nowMs);

  return (
    <>
      <section className="card schedule-main-card">
        <h1 className="visually-hidden">Schedule a Study Quest</h1>

        <div className="schedule-hero">
          <Image
            src={asset("/favicon/index/ScheduleAStudyQuestImage.png")}
            alt="Schedule a Study Quest"
            width={900}
            height={240}
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        <p className="muted schedule-subtitle">Pick a date, then choose a time. Booked slots are grayed out.</p>

        <div className="appt-layout">
          <div className="cal card cal-card">
            <div className="cal-header">
              <button
                className="btn secondary"
                id="prevMonth"
                type="button"
                aria-label="Previous month"
                onClick={() => {
                  let m = viewMonth - 1;
                  let y = viewYear;
                  if (m < 0) {
                    m = 11;
                    y -= 1;
                  }
                  setViewMonth(m);
                  setViewYear(y);
                }}
              >
                ‹
              </button>
              <h2 id="monthLabel" className="cal-title" aria-live="polite">
                {monthLabel}
              </h2>
              <button
                className="btn secondary"
                id="nextMonth"
                type="button"
                aria-label="Next month"
                onClick={() => {
                  let m = viewMonth + 1;
                  let y = viewYear;
                  if (m > 11) {
                    m = 0;
                    y += 1;
                  }
                  setViewMonth(m);
                  setViewYear(y);
                }}
              >
                ›
              </button>
            </div>

            <div className="cal-grid" id="calGrid" role="grid" aria-label="Calendar">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
              {Array.from({ length: lead }).map((_, i) => (
                <div key={`lead-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const dateISO = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const disabled = parseISO(dateISO) < todayFloor;
                const selected = selectedISO === dateISO;
                return (
                  <button
                    key={dateISO}
                    type="button"
                    className={`day${selected ? " selected" : ""}`}
                    data-iso={dateISO}
                    aria-selected={selected}
                    disabled={disabled}
                    onClick={() => setSelectedISO(dateISO)}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="slots card slots-card">
            <h2 className="slots-title">
              Times on <span id="selectedDateLabel">{humanDate(selectedISO)}</span>
            </h2>

            <div className="slots-grid" id="slotsGrid" role="list">
              {daySlots.length === 0 ? (
                <p className="muted slots-empty">
                  No more times available on {humanDate(selectedISO)}. Pick another date to book a session.
                </p>
              ) : (
                daySlots.map((t) => {
                  const id = `${selectedISO}_${t}`;
                  const booked = !!bookings[id];
                  const atCap = !booked && countForDate(selectedISO) >= MAX_PER_DAY;
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`slot${booked ? " me" : ""}${atCap ? " booked" : ""}`}
                      disabled={atCap}
                      title={atCap ? `Daily limit (${MAX_PER_DAY}) reached` : undefined}
                      onClick={() => toggleBooking(selectedISO, t)}
                    >
                      {booked ? `Selected • ${formatTime12(t)}` : formatTime12(t)}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex">
              <button className="btn secondary" id="clearDay" type="button" onClick={clearDay}>
                Clear my booking for this day
              </button>
            </div>

            <p className="muted" id="slotHint" style={{ marginTop: 8 }}>
              Tip: click a time to select or deselect. You can book up to {MAX_PER_DAY} session(s) on{" "}
              {humanDate(selectedISO)}.
            </p>
          </div>
        </div>
      </section>

      <section className="card bookings-card">
        <div className="bookings-title-row">
          <h2 className="bookings-title">Your Bookings</h2>
        </div>

        <ul id="myBookings" className="my-list">
          {sortedBookings.length === 0 ? (
            <li className="kq-empty">
              <span className="kq-empty-title">No bookings yet</span>
              <span className="kq-empty-hint">
                Pick a date and time above to schedule your first study quest.
              </span>
            </li>
          ) : (
            sortedBookings.map((b) => (
              <li key={`${b.date}_${b.time}`} className="booking-row">
                <span className="booking-text">
                  {humanDate(b.date)} @ {formatTime12(b.time)}
                </span>
                <span className="booking-actions">
                  <Link className="btn" href={`/video?room=${encodeURIComponent(b.room)}`}>
                    Join
                  </Link>
                  <button
                    className="btn secondary"
                    type="button"
                    data-cancel={`${b.date}_${b.time}`}
                    onClick={() => removeBooking(`${b.date}_${b.time}`)}
                  >
                    Cancel
                  </button>
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </>
  );
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking } from "@/lib/types";

interface BookingStore {
  bookings: Record<string, Booking>;
  addBooking: (key: string, booking: Booking) => void;
  removeBooking: (key: string) => void;
  toggleGoing: (key: string) => void;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: {},
      addBooking: (key, booking) =>
        set((s) => ({ bookings: { ...s.bookings, [key]: booking } })),
      removeBooking: (key) => {
        const bookings = { ...get().bookings };
        delete bookings[key];
        set({ bookings });
      },
      toggleGoing: (key) => {
        const booking = get().bookings[key];
        if (!booking) return;
        set((s) => ({
          bookings: { ...s.bookings, [key]: { ...booking, going: !booking.going } },
        }));
      },
    }),
    { name: "kq_bookings_v1" },
  ),
);

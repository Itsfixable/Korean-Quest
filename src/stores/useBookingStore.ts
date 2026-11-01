"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking } from "@/lib/types";
import { generateRoomCode } from "@/lib/room-code";

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
    {
      name: "kq_bookings_v1",
      version: 1,
      // v0 rooms were named after the slot's date and time (KQ_20261101_1600),
      // so anyone booking the same slot could walk into the call. Give each
      // existing booking a fresh random code.
      migrate: (persisted, version) => {
        const state = persisted as Pick<BookingStore, "bookings">;
        if (version < 1 && state?.bookings) {
          for (const booking of Object.values(state.bookings)) {
            if (booking) booking.room = generateRoomCode();
          }
        }
        return state as BookingStore;
      },
    },
  ),
);

"use client";

import { create } from "zustand";

export type DialogVariant = "info" | "error" | "success" | "warning";

interface OpenOptions {
  title?: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  /** When set, a Cancel button is shown and the dialog behaves like a confirm. */
  cancelLabel?: string | null;
  onConfirm?: (() => void) | null;
  onCancel?: (() => void) | null;
}

interface DialogStore {
  open: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmLabel: string;
  cancelLabel: string | null;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  /** Low-level opener; prefer `alert` / `confirm`. */
  openDialog: (opts: OpenOptions) => void;
  /** Simple acknowledgement dialog (replacement for window.alert). */
  alert: (message: string, opts?: Partial<OpenOptions>) => void;
  /** Confirmation dialog with Cancel + confirm buttons. */
  confirm: (message: string, opts?: Partial<OpenOptions>) => void;
  /** Runs the confirm callback (if any) and closes. */
  handleConfirm: () => void;
  /** Runs the cancel callback (if any) and closes. */
  handleCancel: () => void;
  close: () => void;
}

const DEFAULTS = {
  open: false,
  title: "",
  message: "",
  variant: "info" as DialogVariant,
  confirmLabel: "OK",
  cancelLabel: null as string | null,
  onConfirm: null as (() => void) | null,
  onCancel: null as (() => void) | null,
};

export const useDialogStore = create<DialogStore>((set, get) => ({
  ...DEFAULTS,

  openDialog: (opts) =>
    set({
      open: true,
      title: opts.title ?? "",
      message: opts.message,
      variant: opts.variant ?? "info",
      confirmLabel: opts.confirmLabel ?? "OK",
      cancelLabel: opts.cancelLabel ?? null,
      onConfirm: opts.onConfirm ?? null,
      onCancel: opts.onCancel ?? null,
    }),

  alert: (message, opts) =>
    get().openDialog({
      variant: "error",
      title: "Heads up",
      ...opts,
      message,
      cancelLabel: null,
    }),

  confirm: (message, opts) =>
    get().openDialog({
      variant: "warning",
      title: "Are you sure?",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      ...opts,
      message,
    }),

  handleConfirm: () => {
    const cb = get().onConfirm;
    set({ ...DEFAULTS });
    cb?.();
  },

  handleCancel: () => {
    const cb = get().onCancel;
    set({ ...DEFAULTS });
    cb?.();
  },

  close: () => set({ ...DEFAULTS }),
}));

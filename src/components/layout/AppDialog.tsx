"use client";

import { useEffect, useRef } from "react";
import { useDialogStore } from "@/stores/useDialogStore";

const VARIANT_ICON: Record<string, string> = {
  info: "ℹ️",
  error: "⚠️",
  success: "✅",
  warning: "❓",
};

export function AppDialog() {
  const open = useDialogStore((s) => s.open);
  const title = useDialogStore((s) => s.title);
  const message = useDialogStore((s) => s.message);
  const variant = useDialogStore((s) => s.variant);
  const confirmLabel = useDialogStore((s) => s.confirmLabel);
  const cancelLabel = useDialogStore((s) => s.cancelLabel);
  const handleConfirm = useDialogStore((s) => s.handleConfirm);
  const handleCancel = useDialogStore((s) => s.handleCancel);

  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
      if (e.key === "Enter") handleConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleCancel, handleConfirm]);

  if (!open) return null;

  return (
    <div
      className="kq-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        className={`kq-dialog kq-dialog--${variant}`}
        role={cancelLabel ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="kqDialogTitle"
        aria-describedby="kqDialogMessage"
      >
        <div className="kq-dialog-icon" aria-hidden="true">
          {VARIANT_ICON[variant] || VARIANT_ICON.info}
        </div>
        {title ? (
          <h3 id="kqDialogTitle" className="kq-dialog-title">
            {title}
          </h3>
        ) : null}
        <p id="kqDialogMessage" className="kq-dialog-message">
          {message}
        </p>

        <div className="kq-dialog-actions">
          {cancelLabel ? (
            <button type="button" className="kq-dialog-btn" onClick={handleCancel}>
              {cancelLabel}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            className="kq-dialog-btn primary"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

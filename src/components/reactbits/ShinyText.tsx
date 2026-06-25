"use client";

/**
 * ShinyText — React Bits (https://reactbits.dev)
 * A subtle animated shine sweeps across the text.
 */

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number; // seconds per sweep
  className?: string;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = "",
}: ShinyTextProps) {
  return (
    <span
      className={`kq-shiny-text ${disabled ? "is-disabled" : ""} ${className}`.trim()}
      style={{ animationDuration: `${speed}s` }}
    >
      {text}
    </span>
  );
}

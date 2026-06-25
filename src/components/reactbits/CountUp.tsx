"use client";

/**
 * CountUp — React Bits (https://reactbits.dev)
 * Springs a number from `from` to `to` when scrolled into view.
 */
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number; // seconds
  duration?: number; // seconds (approx)
  className?: string;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  separator = "",
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });

  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = String(direction === "down" ? to : from);
    }
  }, [from, to, direction]);

  useEffect(() => {
    if (!isInView) return;
    const startTimeout = setTimeout(() => {
      onStart?.();
      motionValue.set(direction === "down" ? from : to);
    }, delay * 1000);

    const endTimeout = setTimeout(() => {
      onEnd?.();
    }, delay * 1000 + duration * 1000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(endTimeout);
    };
  }, [isInView, motionValue, direction, from, to, delay, duration, onStart, onEnd]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (!ref.current) return;
      const value = Number(latest.toFixed(0));
      const formatted = separator
        ? value.toLocaleString().replace(/,/g, separator)
        : String(value);
      ref.current.textContent = formatted;
    });
    return () => unsubscribe();
  }, [springValue, separator]);

  return <span className={className} ref={ref} />;
}

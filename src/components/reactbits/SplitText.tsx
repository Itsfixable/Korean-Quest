"use client";

/**
 * SplitText — React Bits (https://reactbits.dev)
 * Motion-only adaptation: animates each character/word into view on scroll.
 */
import { useMemo, useRef } from "react";
import { motion, useInView, type Transition } from "motion/react";

type SplitType = "chars" | "words";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number; // ms between each piece
  duration?: number; // seconds per piece
  splitType?: SplitType;
  from?: { opacity?: number; y?: number };
  to?: { opacity?: number; y?: number };
  threshold?: number;
  rootMargin?: string;
  ease?: Transition["ease"];
  tag?: keyof React.JSX.IntrinsicElements;
}

export default function SplitText({
  text,
  className = "",
  delay = 40,
  duration = 0.5,
  splitType = "chars",
  from = { opacity: 0, y: 24 },
  to = { opacity: 1, y: 0 },
  threshold = 0.2,
  rootMargin = "-50px",
  ease = "easeOut",
  tag: Tag = "p",
}: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: threshold,
    margin: rootMargin as never,
  });

  const pieces = useMemo(() => {
    if (splitType === "words") return text.split(" ");
    return Array.from(text);
  }, [text, splitType]);

  const MotionTag = motion[Tag as "p"];

  return (
    <MotionTag className={`kq-split-text ${className}`.trim()} aria-label={text}>
      <span ref={ref} aria-hidden="true" className="kq-split-text__inner">
        {pieces.map((piece, i) => (
          <motion.span
            key={`${piece}-${i}`}
            className="kq-split-text__piece"
            initial={from}
            animate={inView ? to : from}
            transition={{
              duration,
              ease,
              delay: (i * delay) / 1000,
            }}
          >
            {piece === " " ? "\u00A0" : piece}
            {splitType === "words" && i < pieces.length - 1 ? "\u00A0" : null}
          </motion.span>
        ))}
      </span>
    </MotionTag>
  );
}

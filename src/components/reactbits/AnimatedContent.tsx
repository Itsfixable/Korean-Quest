"use client";

/**
 * AnimatedContent — React Bits (https://reactbits.dev)
 * Reveals children with a slide + fade (and optional scale) when scrolled into view.
 */
import { useRef, type ReactNode } from "react";
import { motion, useInView, type Transition } from "motion/react";

interface AnimatedContentProps {
  children: ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  duration?: number;
  ease?: Transition["ease"];
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  className?: string;
}

export default function AnimatedContent({
  children,
  distance = 60,
  direction = "vertical",
  reverse = false,
  duration = 0.8,
  ease = "easeOut",
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  className = "",
}: AnimatedContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });

  const axis = direction === "horizontal" ? "x" : "y";
  const offset = reverse ? -distance : distance;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ [axis]: offset, scale, opacity: animateOpacity ? initialOpacity : 1 }}
      animate={
        inView
          ? { [axis]: 0, scale: 1, opacity: 1 }
          : { [axis]: offset, scale, opacity: animateOpacity ? initialOpacity : 1 }
      }
      transition={{ duration, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

"use client";

/**
 * GradientText — React Bits (https://reactbits.dev)
 * Animated gradient fill, optionally with a gradient border.
 */
import type { CSSProperties, ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number; // seconds
  showBorder?: boolean;
}

export default function GradientText({
  children,
  className = "",
  colors = ["#5b729f", "#b3d1d3", "#5d76aa", "#6a9f71", "#5b729f"],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle: CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span className={`kq-gradient-text ${className}`.trim()}>
      {showBorder && (
        <span className="kq-gradient-text__overlay" style={gradientStyle} />
      )}
      <span className="kq-gradient-text__content" style={gradientStyle}>
        {children}
      </span>
    </span>
  );
}

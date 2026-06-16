"use client";

import { motion } from "motion/react";
import { useEffect } from "react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("kq-motion-loading");
    const timer = window.setTimeout(() => {
      document.body.classList.remove("kq-motion-loading");
      document.body.classList.add("kq-motion-ready");
    }, 60);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Global scroll/load reveal. On every route it finds the page's top-level
 * section surfaces and fades + slides them in as they enter the viewport
 * (sections already in view reveal immediately). This gives every tab the
 * same entrance motion without wrapping each page individually.
 *
 * Mounted inside PageTransition (keyed by pathname) so its effect runs once
 * the freshly navigated page has rendered.
 */
const REVEAL_SELECTOR = [
  "main .card",
  "main .kq-shop-banner",
  "main .kq-shop-panel",
  "main .kq-shop-bottom-card",
].join(", ");

export function ScrollReveal() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const els = Array.from(main.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    if (!els.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      els.forEach((el) => el.classList.add("kq-reveal", "kq-reveal--in"));
      return;
    }

    els.forEach((el, i) => {
      el.classList.add("kq-reveal");
      el.style.setProperty("--kq-reveal-delay", `${Math.min(i, 6) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("kq-reveal--in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );

    els.forEach((el) => observer.observe(el));

    // Safety net: if anything is still hidden shortly after load (e.g. the
    // observer missed an element during the route fade), reveal it.
    const fallback = window.setTimeout(() => {
      els.forEach((el) => el.classList.add("kq-reveal--in"));
    }, 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}

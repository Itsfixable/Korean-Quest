// js/main/motion.js
// Lightweight parallax for elements with .kq-parallax + data-depth="1..20"
export function initMotion() {
  const targets = [...document.querySelectorAll(".kq-parallax[data-depth]")];
  if (!targets.length) return;

  // Respect reduced motion
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  let mouseX = 0, mouseY = 0;
  let rafId = null;

  function update() {
    rafId = null;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const dx = (mouseX - cx) / cx;  // -1..1
    const dy = (mouseY - cy) / cy;  // -1..1

    targets.forEach((el) => {
      const depth = Number(el.dataset.depth || 6); // default
      const px = dx * depth;
      const py = dy * depth;

      el.style.setProperty("--px", `${px}px`);
      el.style.setProperty("--py", `${py}px`);
    });
  }

  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(update);
  }

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    schedule();
  }, { passive: true });

  // Also run once so it looks alive immediately
  mouseX = window.innerWidth / 2;
  mouseY = window.innerHeight / 2;
  schedule();
}
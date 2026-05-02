// js/main/motion.js

export function initMotion() {
  const elements = document.querySelectorAll("[data-depth]");

  if (!elements.length) return;

  let mouseX = 0;
  let mouseY = 0;

  function update() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const dx = (mouseX - cx) / cx;
    const dy = (mouseY - cy) / cy;

    elements.forEach((el) => {
      const depth = parseFloat(el.dataset.depth) || 5;

      const moveX = dx * depth;
      const moveY = dy * depth;

      el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  }

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    requestAnimationFrame(update);
  });
}

export function startMotion() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove("kq-motion-loading");
      document.body.classList.add("kq-motion-ready");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMotion);
} else {
  startMotion();
}

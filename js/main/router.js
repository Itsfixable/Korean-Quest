/* Optional convenience: highlight current nav link based on path */
import { initMotion } from "./motion.js";
(() => {
  const cur = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav .pill[href]").forEach((a) => {
    if (a.getAttribute("href") === cur) a.setAttribute("aria-current", "page");
  });
})();
initMotion();initMotion();
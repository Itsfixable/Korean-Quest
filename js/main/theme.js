// ../js/main/theme.js
// Sliding switch theme toggle (works with per-page token CSS)

console.log("[KQ] theme.js loaded");

const KEY = "theme"; // 'dark' | 'light'

function prefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === "light") {
    html.setAttribute("data-theme", "light");
  } else {
    html.removeAttribute("data-theme"); // dark is default in your page CSS
    theme = "dark";
  }
  localStorage.setItem(KEY, theme);
  syncSwitch(theme);
}

function syncSwitch(theme) {
  const el = document.getElementById("themeToggle");
  if (!el) return;
  // Checked means LIGHT in this UI
  el.checked = (theme === "light");
}

function initTheme() {
  const saved = localStorage.getItem(KEY);
  const theme = saved || (prefersDark() ? "dark" : "light");
  applyTheme(theme);

  const el = document.getElementById("themeToggle");
  if (el) {
    el.addEventListener("change", () => {
      applyTheme(el.checked ? "light" : "dark");
    });
  }

  // Keep in sync if system preference changes and user hasn't chosen manually
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", (e) => {
      const current = localStorage.getItem(KEY);
      if (!current) applyTheme(e.matches ? "dark" : "light");
    });
  } catch {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}

// Expose if you need programmatic control elsewhere
export { applyTheme };

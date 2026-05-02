export function showReward(text, x = null, y = null) {
  const el = document.createElement("div");
  el.className = "kq-floating-reward";
  el.textContent = text;

  el.style.position = "fixed";
  el.style.left = x ? `${x}px` : "70%";
  el.style.bottom = y ? `${y}px` : "120px";

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 900);
}

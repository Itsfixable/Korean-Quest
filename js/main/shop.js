import { getPlayer, buy, equip } from "./state.js";

const SHOP = [
  { id: "hat1", name: "🎓 Study Hat", cost: 30, slot: "hat" },
  { id: "petTiger", name: "🐯 Tiger Pet", cost: 60, slot: null },
  { id: "bgPalace", name: "🏯 Palace Background", cost: 100, slot: "bg" },
];

function render() {
  const p = getPlayer();
  document.getElementById("coinCount").textContent = p.coins;

  const grid = document.getElementById("shopGrid");
  grid.innerHTML = SHOP.map(
    (it) => `
    <div class="shop-item" role="listitem">
      <span>${it.name}</span>
      ${
        p.inventory.includes(it.id)
          ? it.slot
            ? `<button class="btn" data-equip="${it.slot}" data-id="${it.id}">Equip</button>`
            : `<span class="muted">Owned</span>`
          : `<button class="btn" data-buy="${it.id}" data-cost="${it.cost}">Buy — ${it.cost}</button>`
      }
    </div>
  `
  ).join("");

  const eq = document.getElementById("equippedList");
  const e = p.equipped;
  eq.innerHTML = `
    <li>Hat: ${e.hat || "—"}</li>
    <li>Background: ${e.bg || "—"}</li>
  `;

  grid.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.onclick = () => {
      const ok = buy(btn.dataset.buy, Number(btn.dataset.cost));
      if (!ok) alert("Not enough coins!");
      render();
    };
  });
  grid.querySelectorAll("[data-equip]").forEach((btn) => {
    btn.onclick = () => {
      equip(btn.dataset.equip, btn.dataset.id);
      render();
    };
  });
}

render();

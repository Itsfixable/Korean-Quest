import {
  getPlayer,
  needXP,
  on,
  getShopCatalog,
  getOwnedItemIds,
  getEquippedCosmetics,
  getEquippedProfile,
  purchaseShopItem,
  equipShopItem,
  unequipShopSlot,
} from "./state.js";

const FAKE_AUTH_KEY = "kq_fake_user";

const CATEGORIES = [
  ["avatars", "Avatars"],
  ["frames", "Frames"],
  ["backgrounds", "Backgrounds"],
  ["flairs", "Flairs"],
  ["pets", "Pets"],
  ["titles", "Titles"],
];

let activeCategory = "avatars";

function $(sel) {
  return document.querySelector(sel);
}

function getFakeUser() {
  try {
    return JSON.parse(localStorage.getItem(FAKE_AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

function getInitials(name) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "KQ";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "KQ";
}

function renderItemVisual(item, extraClass = "") {
  if (item?.image) {
    return `<img src="${item.image}" alt="${item.name}" class="kq-shop-art ${extraClass}" />`;
  }
  return `<div class="kq-shop-emoji ${extraClass}" aria-hidden="true">${item?.emoji || "✨"}</div>`;
}

function ensureStyles() {
  if (document.getElementById("kq-shop-page-styles")) return;

  const style = document.createElement("style");
  style.id = "kq-shop-page-styles";
  style.textContent = `
    .kq-shop-page {
      max-width: 1240px;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }

    .kq-shop-card {
      background: rgba(255,255,255,0.95);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 12px 28px rgba(0,0,0,0.06);
    }

    .kq-shop-hero {
      display: grid;
      grid-template-columns: 1.2fr 260px;
      gap: 18px;
      align-items: center;
    }

    .kq-shop-hero h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 3vw, 3rem);
      line-height: 1;
    }

    .kq-shop-hero p {
      margin: 0;
      color: var(--muted, #5e6678);
      font-size: 1.08rem;
      font-weight: 700;
      line-height: 1.55;
      max-width: 720px;
    }

    .kq-shop-mascot {
      min-height: 180px;
      border-radius: 24px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, rgba(248,244,225,0.96), rgba(255,255,255,0.96));
      border: 1px solid rgba(0,0,0,0.06);
      font-size: 5.2rem;
      overflow: hidden;
    }

    .kq-shop-mascot img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .kq-shop-top-strip {
      display: grid;
      gap: 14px;
    }

    .kq-shop-profile-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .kq-shop-user {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .kq-shop-user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      overflow: hidden;
      flex: 0 0 64px;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #6d84b7 0%, #5971a1 100%);
      color: #fff;
      font-size: 1rem;
      font-weight: 900;
      box-shadow: 0 8px 20px rgba(91,114,159,0.20);
      position: relative;
    }

    .kq-shop-user-avatar .kq-avatar-frame {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 1rem;
      pointer-events: none;
    }

    .kq-shop-user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .kq-shop-user-copy {
      min-width: 0;
    }

    .kq-shop-user-copy h2 {
      margin: 0 0 4px;
      font-size: 1.35rem;
      line-height: 1.2;
    }

    .kq-shop-user-copy p {
      margin: 0;
      color: var(--muted, #5e6678);
      font-weight: 800;
    }

    .kq-shop-stats-inline {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .kq-stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(91,114,159,0.10);
      color: #233554;
      font-weight: 900;
    }

    .kq-shop-progress-shell {
      display: grid;
      grid-template-columns: 140px minmax(0, 1fr) auto auto;
      gap: 14px;
      align-items: center;
      padding: 14px;
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(234,241,255,0.95), rgba(244,247,255,0.98));
      border: 1px solid rgba(0,0,0,0.06);
    }

    .kq-lvl-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 54px;
      border-radius: 18px;
      background: linear-gradient(180deg, #6d84b7 0%, #5971a1 100%);
      color: #fff;
      font-size: 1.2rem;
      font-weight: 900;
      box-shadow: 0 8px 18px rgba(91,114,159,0.18);
    }

    .kq-xp-bar {
      height: 30px;
      border-radius: 999px;
      background: rgba(91,114,159,0.15);
      overflow: hidden;
      position: relative;
    }

    .kq-xp-bar > span {
      display: block;
      height: 100%;
      width: 0%;
      border-radius: inherit;
      background: linear-gradient(90deg, #7f95c4, #5c73a5);
    }

    .kq-xp-text {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-weight: 900;
      color: #233554;
    }

    .kq-shop-count {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 1.45rem;
      font-weight: 900;
      color: #243552;
    }

    .kq-shop-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 8px;
      background: rgba(239,235,222,0.72);
      border-radius: 22px;
    }

    .kq-shop-tab {
      border: none;
      border-radius: 18px;
      padding: 14px 20px;
      font: inherit;
      font-size: 1.05rem;
      font-weight: 900;
      cursor: pointer;
      background: transparent;
      color: #4a5d83;
    }

    .kq-shop-tab.is-active {
      background: linear-gradient(180deg, #6d84b7 0%, #5971a1 100%);
      color: #fff;
      box-shadow: 0 8px 18px rgba(91,114,159,0.18);
    }

    .kq-shop-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
      gap: 18px;
    }

    .kq-shop-item {
      background: linear-gradient(180deg, rgba(255,252,246,0.98), rgba(250,248,242,0.98));
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 24px;
      padding: 18px;
      display: grid;
      gap: 14px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.04);
    }

    .kq-shop-item-visual {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 24px;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, rgba(236,245,255,0.98), rgba(255,255,255,0.98));
      border: 2px solid rgba(91,114,159,0.14);
      position: relative;
      overflow: hidden;
    }

    .kq-shop-item-frame {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 1.8rem;
      pointer-events: none;
    }

    .kq-shop-art {
      width: 82%;
      height: 82%;
      object-fit: contain;
      display: block;
    }

    .kq-shop-emoji {
      font-size: 4.6rem;
      line-height: 1;
    }

    .kq-shop-item h3 {
      margin: 0;
      font-size: 1.08rem;
      text-align: center;
    }

    .kq-shop-rarity {
      text-align: center;
      font-size: 0.98rem;
      font-weight: 900;
      margin-top: -6px;
    }

    .kq-rarity-common { color: #627095; }
    .kq-rarity-rare { color: #3657d1; }
    .kq-rarity-epic { color: #7a3ec9; }
    .kq-rarity-starter { color: #4d8f50; }

    .kq-shop-buy-row {
      display: grid;
      gap: 10px;
    }

    .kq-shop-price-btn,
    .kq-shop-equip-btn {
      width: 100%;
      border: none;
      border-radius: 18px;
      padding: 12px 14px;
      font: inherit;
      font-size: 1rem;
      font-weight: 900;
      cursor: pointer;
    }

    .kq-shop-price-btn {
      background: linear-gradient(180deg, #6d84b7 0%, #5971a1 100%);
      color: #fff;
      box-shadow: 0 8px 18px rgba(91,114,159,0.18);
    }

    .kq-shop-price-btn.is-owned {
      background: rgba(91,114,159,0.10);
      color: #5b729f;
      box-shadow: none;
    }

    .kq-shop-equip-btn {
      background: rgba(239,244,255,0.96);
      color: #2f4368;
      border: 1px solid rgba(91,114,159,0.18);
    }

    .kq-shop-equip-btn.is-equipped {
      background: rgba(123,211,137,0.18);
      color: #2d7b42;
      border-color: rgba(69,151,87,0.28);
    }

    .kq-shop-equip-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .kq-equip-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 999px;
      background: rgba(91,114,159,0.10);
      color: #31476e;
      font-size: 0.92rem;
      font-weight: 900;
    }

    .kq-equip-chip button {
      border: none;
      background: transparent;
      color: #5b729f;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
      padding: 0;
    }

    @media (max-width: 1080px) {
      .kq-shop-hero {
        grid-template-columns: 1fr;
      }

      .kq-shop-progress-shell {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 700px) {
      .kq-shop-profile-row {
        align-items: flex-start;
      }

      .kq-shop-user {
        width: 100%;
      }

      .kq-shop-stats-inline {
        width: 100%;
      }

      .kq-shop-tabs {
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureShell() {
  let main = document.querySelector("main");
  if (!main) main = document.body;

  let shell = document.getElementById("kqShopPage");
  if (shell) return shell;

  shell = document.createElement("section");
  shell.id = "kqShopPage";
  shell.className = "kq-shop-page";
  shell.innerHTML = `
    <section class="kq-shop-card kq-shop-hero">
      <div>
        <h1>Shop</h1>
        <p>Spend your coins to get new avatars, frames, backgrounds, flairs, pets, and profile titles.</p>
      </div>
      <div class="kq-shop-mascot" id="kqShopMascot">🐰</div>
    </section>

    <section class="kq-shop-card kq-shop-top-strip">
      <div class="kq-shop-profile-row">
        <div class="kq-shop-user" id="kqShopUser"></div>
        <div class="kq-shop-stats-inline">
          <div class="kq-stat-pill" id="kqOwnedCount">Owned 0</div>
          <div class="kq-stat-pill" id="kqEquippedCount">Equipped 0</div>
        </div>
      </div>

      <div class="kq-shop-progress-shell">
        <div class="kq-lvl-chip" id="kqLevelChip">Level 1</div>
        <div class="kq-xp-bar" aria-hidden="true">
          <span id="kqXpBarFill"></span>
          <div class="kq-xp-text" id="kqXpText">0 / 100 XP</div>
        </div>
        <div class="kq-shop-count" id="kqCoinCount">🪙 0</div>
        <div class="kq-shop-count" id="kqBadgeCount">🏅 0</div>
      </div>
    </section>

    <section class="kq-shop-card">
      <div id="kqShopTabs" class="kq-shop-tabs"></div>
    </section>

    <section class="kq-shop-card">
      <div id="kqEquippedSummary" class="kq-shop-equip-summary"></div>
    </section>

    <section class="kq-shop-grid kq-stagger" id="kqShopGrid"></section>
  `;

  main.innerHTML = "";
  main.appendChild(shell);
  return shell;
}

function renderUserBlock(profile) {
  const user = getFakeUser();
  const username = user?.loggedIn ? user.name : "Guest Learner";
  const avatarInitials = getInitials(username);
  const avatarHtml = user?.avatarImage
    ? `<img src="${user.avatarImage}" alt="${username} profile picture" />`
    : `<span>${avatarInitials}</span>`;

  const wrap = $("#kqShopUser");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="kq-shop-user-avatar">
      ${avatarHtml}
      <div class="kq-avatar-frame">${profile.frame?.emoji || "☁️"}</div>
    </div>
    <div class="kq-shop-user-copy">
      <h2>${username}</h2>
      <p>${profile.title?.name || "New Challenger"} · ${profile.background?.name || "Hanok Courtyard"}</p>
    </div>
  `;
}

function renderTopStats(player, equipped) {
  const xpNeeded = needXP(player.level);
  const xpPct = Math.max(0, Math.min(100, Math.round((player.xp / xpNeeded) * 100)));

  $("#kqLevelChip").textContent = `Level ${player.level}`;
  $("#kqXpBarFill").style.width = "0%";
  setTimeout(() => {
    $("#kqXpBarFill").style.width = `${xpPct}%`;
  }, 50);
  $("#kqXpText").textContent = `${player.xp} / ${xpNeeded} XP`;
  $("#kqCoinCount").textContent = `🪙 ${player.coins}`;
  $("#kqBadgeCount").textContent = `🏅 ${player.badges?.length || 0}`;
  $("#kqOwnedCount").textContent = `Owned ${getOwnedItemIds().length}`;
  $("#kqEquippedCount").textContent = `Equipped ${Object.values(equipped).filter(Boolean).length}`;
}

function renderTabs() {
  const wrap = $("#kqShopTabs");
  if (!wrap) return;

  wrap.innerHTML = CATEGORIES.map(
    ([id, label]) => `
      <button class="kq-shop-tab ${activeCategory === id ? "is-active" : ""}" type="button" data-category="${id}">
        ${label}
      </button>
    `,
  ).join("");

  wrap.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      render();
    });
  });
}

function renderEquippedSummary(profile, equipped) {
  const wrap = $("#kqEquippedSummary");
  if (!wrap) return;

  const chips = [];

  if (profile.avatar) chips.push(`<span class="kq-equip-chip">${profile.avatar.emoji || "✨"} ${profile.avatar.name}</span>`);
  if (profile.frame) chips.push(`<span class="kq-equip-chip">${profile.frame.emoji || "✨"} ${profile.frame.name}</span>`);
  if (profile.background) chips.push(`<span class="kq-equip-chip">${profile.background.emoji || "✨"} ${profile.background.name}</span>`);
  if (profile.title) chips.push(`<span class="kq-equip-chip">${profile.title.emoji || "✨"} ${profile.title.name}</span>`);

  if (profile.flair) {
    chips.push(`
      <span class="kq-equip-chip">
        ${profile.flair.emoji || "✨"} ${profile.flair.name}
        <button type="button" data-clear="flair">Clear</button>
      </span>
    `);
  }

  if (profile.pet) {
    chips.push(`
      <span class="kq-equip-chip">
        ${profile.pet.emoji || "✨"} ${profile.pet.name}
        <button type="button" data-clear="pet">Clear</button>
      </span>
    `);
  }

  wrap.innerHTML = chips.join("");

  wrap.querySelectorAll("[data-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      unequipShopSlot(btn.dataset.clear);
      render();
    });
  });
}

function renderGrid(items, ownedIds, equipped) {
  const grid = $("#kqShopGrid");
  if (!grid) return;

  grid.innerHTML = items.map((item) => {
    const isOwned = ownedIds.has(item.id);
    const isEquipped = equipped[item.slot] === item.id;

    return `
      <article class="kq-shop-item">
        <div class="kq-shop-item-visual">
          ${renderItemVisual(item)}
          ${item.slot === "frame" ? `<div class="kq-shop-item-frame">${item.emoji || "✨"}</div>` : ""}
        </div>

        <div>
          <h3>${item.name}</h3>
          <div class="kq-shop-rarity kq-rarity-${String(item.rarity || "common").toLowerCase()}">${item.rarity}</div>
        </div>

        <div class="kq-shop-buy-row">
          <button class="kq-shop-price-btn ${isOwned ? "is-owned" : ""}" type="button" data-buy="${item.id}" ${isOwned ? "disabled" : ""}>
            ${isOwned ? "Owned" : `🪙 ${item.cost}`}
          </button>

          ${isOwned ? `
            <button class="kq-shop-equip-btn ${isEquipped ? "is-equipped" : ""}" type="button" data-equip="${item.id}">
              ${isEquipped ? "Equipped" : "Equip"}
            </button>
          ` : ""}
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const result = purchaseShopItem(btn.dataset.buy);
      if (!result.ok && result.reason === "coins") {
        window.alert("You do not have enough coins for that item yet.");
      }
      render();
    });
  });

  grid.querySelectorAll("[data-equip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      equipShopItem(btn.dataset.equip);
      render();
    });
  });
}

function render() {
  ensureStyles();
  ensureShell();

  const player = getPlayer();
  const equipped = getEquippedCosmetics();
  const profile = getEquippedProfile();
  const ownedIds = new Set(getOwnedItemIds());
  const items = getShopCatalog(activeCategory);

  renderUserBlock(profile);
  renderTopStats(player, equipped);
  renderTabs();
  renderEquippedSummary(profile, equipped);
  renderGrid(items, ownedIds, equipped);

  requestAnimationFrame(() => {
    document.body.classList.add("kq-motion-ready");
  });
}

render();
on("state:changed", render);
window.addEventListener("storage", render);
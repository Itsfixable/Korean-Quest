// js/main/index-stats.js
import { getPlayer, getAchievements } from "./state.js";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function ensureHomeBadgeStyles() {
  if (document.getElementById("kq-home-badge-styles")) return;

  const style = document.createElement("style");
  style.id = "kq-home-badge-styles";
  style.textContent = `
      .kq-inline-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        width: 46px;
        height: 46px;

        border-radius: 999px;

        background: rgba(91, 114, 159, 0.10);
        color: var(--brand, #5b729f);

        font-size: 1.5rem;
        font-weight: 900;

        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
      }

    .kq-home-badge-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      min-height: 34px;
    }
  `;
  document.head.appendChild(style);
}

function findLabelNode(labelText) {
  const target = cleanText(labelText);
  const selectors = [
    "p",
    "span",
    "div",
    "strong",
    "h2",
    "h3",
    "h4",
    ".muted",
    ".label",
    ".stat-label"
  ];

  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
      if (cleanText(node.textContent) === target) {
        return node;
      }
    }
  }

  return null;
}

function findNearbyValueNode(labelNode) {
  if (!labelNode) return null;

  let current = labelNode.previousElementSibling;
  while (current) {
    if (cleanText(current.textContent) || current.children.length) return current;
    current = current.previousElementSibling;
  }

  current = labelNode.nextElementSibling;
  while (current) {
    if (cleanText(current.textContent) || current.children.length) return current;
    current = current.nextElementSibling;
  }

  return null;
}

function setValueByLabel(labelText, value) {
  const labelNode = findLabelNode(labelText);
  const valueNode = findNearbyValueNode(labelNode);

  if (valueNode) {
    valueNode.textContent = value;
  }
}

function updateHomeStreakPreservingImage(streakValue) {
  const streakImg =
    document.querySelector('img[src*="streakEmoji" i]') ||
    document.querySelector('img[alt*="streak" i]');

  if (!streakImg) return;

  const valueWrap = streakImg.parentElement;
  if (!valueWrap) return;

  let numberSpan = valueWrap.querySelector(".kq-home-streak-number");

  if (!numberSpan) {
    numberSpan = document.createElement("span");
    numberSpan.className = "kq-home-streak-number";

    [...valueWrap.childNodes].forEach((node) => {
      if (node === streakImg) return;

      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim()) {
          node.remove();
        }
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node;
        if (el.tagName === "IMG") return;
        el.remove();
      }
    });

    valueWrap.appendChild(numberSpan);
  }

  numberSpan.textContent = ` ${streakValue}`;
}

function getHomeBadgeValueNode() {
  const byId = document.getElementById("homeBadges");
  if (byId) return byId;

  const badgeLabel = findLabelNode("Badges");
  const nearby = findNearbyValueNode(badgeLabel);
  if (nearby) return nearby;

  return null;
}

function renderHomeBadges(achievements) {
  const badgeNode = getHomeBadgeValueNode();
  if (!badgeNode) return;

  badgeNode.classList.add("kq-home-badge-wrap");

  if (!achievements.length) {
    badgeNode.textContent = "—";
    return;
  }

  badgeNode.innerHTML = achievements
    .slice(0, 3)
    .map(
      (badge) => `
        <span class="kq-inline-badge" title="${badge.name}">
          ${badge.icon}
        </span>
      `
    )
    .join("");
}

function renderHomeStats() {
  ensureHomeBadgeStyles();

  const player = getPlayer();
  const achievements = getAchievements();

  setValueByLabel("Level", String(player.level));
  renderHomeBadges(achievements);
  updateHomeStreakPreservingImage(player.streak);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderHomeStats);
} else {
  renderHomeStats();
}
// js/main/index-stats.js
import { getPlayer } from "./state.js";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
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
    if (cleanText(current.textContent)) return current;
    current = current.previousElementSibling;
  }

  current = labelNode.nextElementSibling;
  while (current) {
    if (cleanText(current.textContent)) return current;
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

    // Remove old number/text nodes in this inline streak value area,
    // but keep the image.
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

function renderHomeStats() {
  const player = getPlayer();

  // Shared values
  setValueByLabel("Level", String(player.level));
  setValueByLabel("Badges", (player.badges || []).join(" • ") || "—");

  // Preserve the streak image and only replace the number
  updateHomeStreakPreservingImage(player.streak);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderHomeStats);
} else {
  renderHomeStats();
}
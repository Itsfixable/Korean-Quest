import {
  getPlayer,
  getQuests,
  getProgress,
  getAchievements,
  getAdventureProgress,
  needXP,
  mountGuideBubble,
  on,
  getEquippedProfile,
  getCurrentDisplayTitle,
} from "./state.js";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function ensureStyles() {
  if (document.getElementById("kq-dashboard-enhancements")) return;

  const style = document.createElement("style");
  style.id = "kq-dashboard-enhancements";
  style.textContent = `
    .kq-learning-card {
      grid-column: 1 / -1;
      display: grid;
      gap: 18px;
    }

    .kq-learning-row {
      display: grid;
      grid-template-columns: 1.4fr .9fr;
      gap: 18px;
      align-items: start;
    }

    .kq-overall-bar,
    .kq-quest-mini-bar {
      width: 100%;
      height: 12px;
      border-radius: 999px;
      background: rgba(91, 114, 159, 0.14);
      overflow: hidden;
    }

    .kq-overall-bar > span,
    .kq-quest-mini-bar > span {
      display: block;
      height: 100%;
      width: 0%;
      border-radius: inherit;
      background: linear-gradient(90deg, #8ba5dd, #5b729f);
    }

    .kq-learning-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin: 8px 0 2px;
      color: var(--muted, #5e6678);
      font-weight: 700;
    }

    .kq-stat-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .kq-mini-stat {
      background: var(--surface-2, #f7f9fd);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 16px;
      padding: 14px;
    }

    .kq-mini-stat strong {
      display: block;
      font-size: 1.2rem;
      margin-bottom: 4px;
    }

    .kq-mini-stat span {
      color: var(--muted, #5e6678);
      font-weight: 700;
    }

    .kq-achievement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .kq-achievement-chip {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      background: var(--surface-2, #f7f9fd);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 16px;
      padding: 14px;
    }

    .kq-achievement-icon {
      width: 44px;
      height: 44px;
      flex: 0 0 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      font-size: 1.35rem;
      background: rgba(116, 144, 200, 0.18);
    }

    .kq-achievement-chip h3 {
      margin: 0 0 4px;
      font-size: 0.98rem;
    }

    .kq-achievement-chip p {
      margin: 0;
      color: var(--muted, #5e6678);
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .kq-achievement-empty {
      border: 1px dashed rgba(0,0,0,0.14);
      border-radius: 16px;
      padding: 16px;
      color: var(--muted, #5e6678);
      font-weight: 700;
      background: rgba(255,255,255,0.68);
    }

    .kq-quest-item {
      list-style: none;
      margin: 0 0 14px;
      padding: 14px 16px;
      background: var(--surface-2, #f7f9fd);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
    }

    .kq-quest-item:last-child {
      margin-bottom: 0;
    }

    .kq-quest-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
      font-weight: 800;
    }

    .kq-quest-status {
      color: var(--muted, #5e6678);
      white-space: nowrap;
    }

    .kq-journey-note {
      color: var(--muted, #5e6678);
      font-weight: 700;
      line-height: 1.5;
      margin: 0;
    }

    .kq-recent-pill {
      display: inline-block;
      margin-right: 8px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(91, 114, 159, 0.12);
      color: var(--brand, #5b729f);
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    #dBadges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      line-height: 1.4;
      font-weight: 800;
      min-height: 34px;
    }

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

    .kq-profile-card {
      grid-column: 1 / -1;
      display: grid;
      gap: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,245,255,0.96));
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 20px;
      padding: 18px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.08);
    }

    .kq-profile-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .kq-profile-head {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .kq-profile-avatar-wrap {
      position: relative;
      width: 88px;
      height: 88px;
      flex: 0 0 88px;
    }

    .kq-profile-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 2.2rem;
      background: rgba(255,255,255,0.92);
      box-shadow: 0 10px 22px rgba(0,0,0,0.10);
      position: relative;
      z-index: 2;
    }

    .kq-profile-frame {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      z-index: 3;
      pointer-events: none;
    }

    .kq-profile-bg {
      position: absolute;
      right: 18px;
      top: 10px;
      font-size: 3rem;
      opacity: 0.18;
      pointer-events: none;
    }

    .kq-profile-title {
      margin: 0 0 6px;
      font-size: 1.12rem;
    }

    .kq-profile-sub {
      margin: 0;
      color: var(--muted, #5e6678);
      font-weight: 700;
      line-height: 1.45;
    }

    .kq-profile-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .kq-profile-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(91,114,159,0.12);
      color: var(--brand, #5b729f);
      font-size: 0.82rem;
      font-weight: 900;
    }

    .kq-profile-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .kq-profile-shop-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 10px 14px;
      background: #5b729f;
      color: #fff;
      text-decoration: none;
      font-weight: 900;
      box-shadow: 0 8px 16px rgba(91,114,159,0.22);
    }

    .kq-profile-shop-link:hover {
      background: #4f648a;
    }

    .kq-cosmetics-display {
      width: 100%;
      min-height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      overflow: hidden;
      background: linear-gradient(180deg, rgba(240,245,255,0.6), rgba(255,252,246,0.8));
      border: 1px solid rgba(91,114,159,0.12);
      position: relative;
    }

    .student-dashboard-right {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .kq-scene-stage {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 40px 30px 30px;
      overflow: hidden;
      min-height: 320px;
    }

    .kq-scene-background {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      z-index: 0;
    }

    .kq-scene-background .kq-bg-image,
    .kq-scene-background .kq-bg-emoji {
      width: 100%;
      height: 100%;
      object-fit: cover;
      font-size: 8rem;
      display: grid;
      place-items: center;
      color: rgba(91,114,159,0.08);
    }

    .kq-scene-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.75));
      backdrop-filter: blur(12px);
      z-index: 1;
    }

    /* Pet companion (left side) */
    .kq-scene-pet {
      position: absolute;
      left: 20px;
      bottom: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 5;
      animation: float 3s ease-in-out infinite;
    }

    .kq-scene-pet img,
    .kq-scene-pet span {
      font-size: 2.5rem;
      display: grid;
      place-items: center;
      width: 70px;
      height: 70px;
      background: rgba(255,255,255,0.7);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
      backdrop-filter: blur(8px);
      border: 2px solid rgba(255,255,255,0.5);
      object-fit: contain;
      padding: 8px;
    }

    .kq-pet-label {
      font-size: 0.7rem;
      font-weight: 900;
      color: #5b729f;
      text-align: center;
      max-width: 80px;
      line-height: 1.1;
    }

    /* Main avatar (center) */
    .kq-scene-avatar-container {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      margin-bottom: 15px;
      height: 240px;
    }

    .kq-scene-frame {
      position: absolute;
      top: -20px;
      z-index: 11;
      font-size: 3rem;
      width: 180px;
      height: 180px;
      display: grid;
      place-items: center;
      color: rgba(91,114,159,0.3);
      filter: drop-shadow(0 8px 20px rgba(0,0,0,0.12));
    }

    .kq-scene-avatar {
      width: 140px;
      height: 240px;
      border-radius: 20px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,248,255,0.9));
      border: 3px solid rgba(91,114,159,0.2);
      box-shadow:
        0 20px 48px rgba(91,114,159,0.25),
        inset 0 0 0 1px rgba(255,255,255,0.8);
      position: relative;
      z-index: 12;
      overflow: hidden;
    }

    .kq-scene-avatar img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
    }

    .kq-scene-avatar span {
      font-size: 3.5rem;
    }

    /* Nameplate and info */
    .kq-scene-nameplate {
      position: absolute;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      z-index: 15;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(91,114,159,0.18);
      border-radius: 14px;
      padding: 10px 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
      min-width: 260px;
    }

    .kq-scene-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      align-items: center;
    }

    .kq-scene-items span {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 5px 8px;
      border-radius: 999px;
      background: rgba(91,114,159,0.08);
      color: #5b729f;
      font-size: 0.75rem;
      font-weight: 800;
      white-space: nowrap;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }

    @media (max-width: 860px) {
      .kq-learning-row {
        grid-template-columns: 1fr;
      }

      .kq-stat-grid {
        grid-template-columns: 1fr;
      }

      .kq-profile-top {
        grid-template-columns: 1fr;
      }

      .kq-scene-avatar-container {
        height: 200px;
      }

      .kq-scene-avatar {
        width: 120px;
        height: 200px;
      }

      .kq-scene-frame {
        font-size: 2.5rem;
        width: 150px;
        height: 150px;
        top: -15px;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureEnhancementCard() {
  let card = document.getElementById("kqLearningJourneyCard");
  if (card) return card;

  const columns = document.querySelector(".dashboard-columns");
  card = document.createElement("section");
  card.id = "kqLearningJourneyCard";
  card.className = "dashboard-card kq-learning-card";
  card.innerHTML = `
    <div class="section-head">
      <span class="section-icon" aria-hidden="true">📈</span>
      <h2>Learning Journey</h2>
    </div>

    <div class="kq-learning-row">
      <div>
        <div class="kq-learning-meta">
          <span id="kqJourneyLabel">0% complete</span>
          <span id="kqJourneyUnlock">Adventure locked at Level 1</span>
        </div>
        <div class="kq-overall-bar" aria-hidden="true">
          <span id="kqJourneyBar"></span>
        </div>
        <p id="kqJourneyNote" class="kq-journey-note"></p>
      </div>

      <div class="kq-stat-grid">
        <div class="kq-mini-stat">
          <strong id="kqLessonsDone">0</strong>
          <span>Lessons completed</span>
        </div>
        <div class="kq-mini-stat">
          <strong id="kqBattlesWon">0</strong>
          <span>Battles won</span>
        </div>
        <div class="kq-mini-stat">
          <strong id="kqBadgeCount">0</strong>
          <span>Badges earned</span>
        </div>
      </div>
    </div>

    <div>
      <div class="section-head" style="margin-bottom: 12px;">
        <span class="section-icon" aria-hidden="true">🏅</span>
        <h2 style="font-size: 1.35rem;">Achievement Badges</h2>
      </div>
      <div id="kqAchievementGrid" class="kq-achievement-grid"></div>
    </div>
  `;

  if (columns) {
    columns.parentElement.insertBefore(card, columns);
  } else {
    (document.querySelector("main") || document.body).appendChild(card);
  }

  return card;
}

function ensureProfileCard() {
  let card = document.getElementById("kqProfileCard");
  if (card) return card;

  const columns = document.querySelector(".dashboard-columns");
  card = document.createElement("section");
  card.id = "kqProfileCard";
  card.className = "dashboard-card kq-profile-card";
  card.innerHTML = `
    <div class="section-head">
      <span class="section-icon" aria-hidden="true">🛍️</span>
      <h2>Quest Profile</h2>
    </div>
    <div id="kqProfileBody"></div>
  `;

  if (columns) {
    columns.parentElement.insertBefore(card, columns);
  } else {
    (document.querySelector("main") || document.body).appendChild(card);
  }

  return card;
}

function renderCosmeticsDisplay() {
  const dashboardRight = document.querySelector(".student-dashboard-right");
  if (!dashboardRight) return;

  const profile = getEquippedProfile();

  // Create a cinematic scene composition
  dashboardRight.innerHTML = `
    <div class="kq-scene-stage">
      <!-- Background layer -->
      <div class="kq-scene-background">
        ${
          profile.background?.image
            ? `<img src="${profile.background.image}" alt="${profile.background.name}" class="kq-bg-image" />`
            : `<div class="kq-bg-emoji">${profile.background?.emoji || "🏯"}</div>`
        }
        <div class="kq-scene-overlay"></div>
      </div>

      <!-- Pet companion (left side) -->
      ${
        profile.pet
          ? `
            <div class="kq-scene-pet">
              ${
                profile.pet.image
                  ? `<img src="${profile.pet.image}" alt="${profile.pet.name}" />`
                  : `<span>${profile.pet.emoji}</span>`
              }
              <div class="kq-pet-label">${profile.pet.name}</div>
            </div>
          `
          : ""
      }

      <!-- Main avatar (center) -->
      <div class="kq-scene-avatar-container">
        <div class="kq-scene-frame">
          ${profile.frame?.emoji || "☁️"}
        </div>
        <div class="kq-scene-avatar">
          ${
            profile.avatar?.image
              ? `<img src="${profile.avatar.image}" alt="${profile.avatar.name}" />`
              : `<span>${profile.avatar?.emoji || "👑"}</span>`
          }
        </div>
      </div>

      <!-- Title and info (bottom) -->
      <div class="kq-scene-nameplate">
        <div class="kq-scene-items">
          ${profile.avatar ? `<span>${profile.avatar.emoji} ${profile.avatar.name}</span>` : ""}
          ${profile.pet ? `<span>${profile.pet.emoji} ${profile.pet.name}</span>` : ""}
          ${profile.background ? `<span>${profile.background.emoji} ${profile.background.name}</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderXPBar(player) {
  const bar = document.getElementById("dBar");
  if (!bar) return;

  const pct = clamp(Math.round((player.xp / needXP(player.level)) * 100), 0, 100);
  bar.style.width = "0%";
  setTimeout(() => {
    bar.style.width = `${pct}%`;
  }, 50);
  bar.setAttribute("aria-valuenow", String(pct));
}

function renderQuestList(quests) {
  const questList = document.getElementById("questList");
  if (!questList) return;

  const daily = quests.daily || [];
  if (!daily.length) {
    questList.innerHTML = '<li class="kq-quest-item">No quests for today yet.</li>';
    return;
  }

  questList.innerHTML = daily
    .map((q) => {
      const progress = Math.min(q.progress, q.target);
      const pct = clamp(Math.round((progress / q.target) * 100), 0, 100);

      return `
        <li class="kq-quest-item">
          <div class="kq-quest-top">
            <span>${q.done ? "✅" : "⬜"} ${q.desc}</span>
            <span class="kq-quest-status">${progress}/${q.target}</span>
          </div>
          <div class="kq-quest-mini-bar" aria-hidden="true">
            <span style="width:${pct}%"></span>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderRecentWork(progress) {
  const workList = document.getElementById("recentWork");
  if (!workList) return;

  const work = progress.recentWork || [];
  workList.innerHTML = work.length
    ? work
        .map(
          (item) => `
            <li>
              <span class="kq-recent-pill">${item.type}</span>
              ${new Date(item.ts).toLocaleString()} — ${item.title}
            </li>
          `,
        )
        .join("")
    : '<li>No work recorded yet.</li>';
}

function computeJourneyPercent(progress, player) {
  const lessonScore = Math.min((progress.completedLessonIds?.length || 0) / 3, 1) * 45;
  const battleScore = Math.min((progress.battlesWon || 0) / 12, 1) * 35;
  const badgeScore = Math.min((player.badges?.length || 0) / 8, 1) * 20;
  return Math.round(lessonScore + battleScore + badgeScore);
}

function renderTopBadgeBox(achievements) {
  const badgeBox = document.getElementById("dBadges");
  if (!badgeBox) return;

  if (!achievements.length) {
    badgeBox.textContent = "—";
    return;
  }

  badgeBox.innerHTML = achievements
    .slice(0, 3)
    .map(
      (badge) => `
        <span class="kq-inline-badge" title="${badge.name}">
          ${badge.icon}
        </span>
      `,
    )
    .join("");
}

function renderJourney(progress, player, achievements) {
  ensureEnhancementCard();

  const adventure = getAdventureProgress();
  const percent = computeJourneyPercent(progress, player);

  const bar = document.getElementById("kqJourneyBar");
  if (bar) {
  bar.style.width = "0%";
  setTimeout(() => {
    bar.style.width = `${percent}%`;
  }, 50);
}

  setText("kqJourneyLabel", `${percent}% complete`);
  setText("kqJourneyUnlock", `Adventure unlocked through Level ${adventure.cap}`);
  setText("kqLessonsDone", progress.completedLessonIds?.length || 0);
  setText("kqBattlesWon", progress.battlesWon || 0);
  setText("kqBadgeCount", achievements.length);

  const nextUnlockText = adventure.nextLesson
    ? `Complete the next lesson to unlock ${adventure.nextLesson.label}.`
    : "All adventure chapters are unlocked — now clear every boss node.";
  setText("kqJourneyNote", nextUnlockText);

  const grid = document.getElementById("kqAchievementGrid");
  if (!grid) return;

  if (!achievements.length) {
    grid.innerHTML =
      '<div class="kq-achievement-empty">No badges yet — finish a lesson or win a battle to start collecting achievements.</div>';
    return;
  }
  grid.classList.add("kq-stagger");
  grid.innerHTML = achievements
    .map(
      (badge) => `
        <article class="kq-achievement-chip">
          <div class="kq-achievement-icon" aria-hidden="true">${badge.icon}</div>
          <div>
            <h3>${badge.name}</h3>
            <p>${badge.desc}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderProfileCard(player) {
  ensureProfileCard();

  const body = document.getElementById("kqProfileBody");
  if (!body) return;

  const profile = getEquippedProfile();

  body.innerHTML = `
    <div class="kq-profile-top">
      <div class="kq-profile-head">
        <div class="kq-profile-avatar-wrap">
          <div class="kq-profile-bg">${profile.background?.emoji || "🏯"}</div>
          <div class="kq-profile-avatar">
            ${
              profile.avatar?.image
                ? `<img src="${profile.avatar.image}" alt="${profile.avatar.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; padding: 8px;" />`
                : profile.avatar?.emoji || "👑"
            }
          </div>
          <div class="kq-profile-frame">${profile.frame?.emoji || "☁️"}</div>
        </div>

        <div>
          <h3 class="kq-profile-title">${getCurrentDisplayTitle()}</h3>
          <p class="kq-profile-sub">
            ${profile.background?.name || "Hanok Courtyard"} ·
            ${player.coins} coins ·
            Level ${player.level}
          </p>
        </div>
      </div>

      <div class="kq-profile-actions">
        <a class="kq-profile-shop-link" href="shop.html">Open Shop</a>
      </div>
    </div>

    <div class="kq-profile-tags">
      <span class="kq-profile-tag">${profile.avatar?.emoji || "👑"} ${profile.avatar?.name || "Starter Avatar"}</span>
      <span class="kq-profile-tag">${profile.frame?.emoji || "☁️"} ${profile.frame?.name || "Cloud Frame"}</span>
      <span class="kq-profile-tag">${profile.background?.emoji || "🏯"} ${profile.background?.name || "Hanok Courtyard"}</span>
      ${profile.pet ? `<span class="kq-profile-tag">${profile.pet.emoji} ${profile.pet.name}</span>` : ""}
    </div>
  `;
}

function renderDashboard() {
  ensureStyles();

  const player = getPlayer();
  const quests = getQuests();
  const progress = getProgress();
  const achievements = getAchievements();

  setText("dLevel", player.level);
  setText("dXP", player.xp);
  setText("dNext", needXP(player.level));
  setText("dStreak", `${player.streak} day${player.streak === 1 ? "" : "s"}`);
  setText("dCoins", player.coins);

  renderTopBadgeBox(achievements);
  renderXPBar(player);
  renderQuestList(quests);
  renderRecentWork(progress);
  renderJourney(progress, player, achievements);
  renderProfileCard(player);
  renderCosmeticsDisplay();

  requestAnimationFrame(() => {
    document.body.classList.add("kq-motion-ready");
  });
}

renderDashboard();
on("state:changed", renderDashboard);

mountGuideBubble(
  [
    "Every completed lesson now unlocks more of the Adventure Map...",
    "Achievement badges are live...",
    "Your dashboard progress now combines lessons...",
    "Your equipped shop cosmetics now appear in your Quest Profile card."
  ],
  { label: "Quest Guide", id: "kq-dashboard-bubble", side: "right" },
);
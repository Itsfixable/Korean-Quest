import {
  getLeaderboard,
  getPlayer,
  mountGuideBubble,
  on,
  getEquippedProfile,
  getCurrentDisplayTitle,
  getCurrentDisplayEmoji,
} from "./state.js";

const FALLBACK_ROWS = [
  { name: "Ava", xp: 420, title: "Streak Queen", badge: "🔥", streak: 19 },
  { name: "Noah", xp: 380, title: "Word Wizard", badge: "📚", streak: 16 },
  { name: "Mia", xp: 350, title: "Boss Breaker", badge: "👑", streak: 13 },
  { name: "Liam", xp: 310, title: "Quest Climber", badge: "🧭", streak: 12 },
  { name: "Emma", xp: 290, title: "Flashcard Ace", badge: "🃏", streak: 11 },
  { name: "Sophia", xp: 270, title: "Pronunciation Pro", badge: "🎤", streak: 10 },
  { name: "Ethan", xp: 250, title: "Grammar Guard", badge: "🛡️", streak: 9 },
  { name: "Olivia", xp: 220, title: "Hangul Hero", badge: "🇰🇷", streak: 8 },
  { name: "James", xp: 180, title: "Adventure Scout", badge: "🗺️", streak: 7 },
];

function ensureStyles() {
  if (document.getElementById("kq-leaderboard-enhancements")) return;

  const style = document.createElement("style");
  style.id = "kq-leaderboard-enhancements";
  style.textContent = `
    .kq-leaderboard-card {
      max-width: 980px;
      margin: 0 auto;
    }

    .kq-leaderboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 16px;
    }

    .kq-leaderboard-copy {
      flex: 1 1 auto;
      min-width: 0;
    }

    .kq-leaderboard-copy h1,
    .kq-leaderboard-copy h2 {
      margin: 0;
    }

    .kq-leaderboard-copy p {
      margin: 10px 0 0;
      color: var(--muted, #5e6678);
      line-height: 1.55;
      font-weight: 700;
    }

    .kq-podium-image {
      flex: 0 0 auto;
      width: 220px;
      max-width: 220px;
      align-self: flex-start;
      user-select: none;
      pointer-events: none;
      display: block;
      margin-top: -6px;
    }

    #lbTable {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border-radius: 22px;
      background: rgba(255,255,255,0.96);
      box-shadow: 0 12px 28px rgba(0,0,0,0.08);
    }

    #lbTable thead th {
      text-align: left;
      padding: 16px 14px;
      font-size: 0.92rem;
      letter-spacing: 0.02em;
      color: #5c6880;
      background: rgba(91, 114, 159, 0.08);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }

    #lbTable tbody td {
      padding: 15px 14px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      vertical-align: middle;
      transition: background 120ms ease;
      background: #fff;
    }

    #lbTable tbody tr:last-child td {
      border-bottom: none;
    }

    #lbTable tbody tr:not(.kq-rank-1):not(.kq-rank-2):not(.kq-rank-3):not(.kq-you-row):hover td {
      background: rgba(91, 114, 159, 0.05);
    }

    .kq-rank-medal {
      display: inline-grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(91, 114, 159, 0.12);
      font-size: 0.95rem;
      font-weight: 900;
    }

    .kq-player-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .kq-player-icon-wrap {
      position: relative;
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
    }

    .kq-player-icon {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: rgba(91,114,159,0.10);
      font-size: 1.15rem;
    }

    .kq-player-flair {
      position: absolute;
      right: -4px;
      bottom: -4px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.72rem;
      background: #fff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.12);
    }

    .kq-player-meta strong {
      display: block;
      font-size: 0.98rem;
      color: #273142;
    }

    .kq-player-meta span {
      color: var(--muted, #5e6678);
      font-size: 0.86rem;
      font-weight: 700;
    }

    .kq-title-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(91, 114, 159, 0.10);
      color: var(--brand, #5b729f);
      font-size: 0.8rem;
      font-weight: 900;
      white-space: nowrap;
    }

    .kq-xp-num {
      font-weight: 900;
      font-variant-numeric: tabular-nums;
    }

    .kq-name-medal {
      margin-left: 6px;
      font-size: 1rem;
    }

    .kq-you-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
      padding: 5px 9px;
      border-radius: 999px;
      background: rgba(39, 87, 174, 0.14);
      color: #2d5eb8;
      font-size: 0.75rem;
      font-weight: 900;
      vertical-align: middle;
    }

    #lbTable tbody tr.kq-you-row td {
      background: linear-gradient(90deg, rgba(214, 232, 255, 0.95), rgba(235, 244, 255, 0.98)) !important;
      font-weight: 900 !important;
      color: #1f4d8f !important;
    }

    #lbTable tbody tr.kq-you-row td:first-child {
      box-shadow: inset 5px 0 0 #4b83d8;
    }

    #lbTable tbody tr.kq-you-row:hover td {
      background: linear-gradient(90deg, rgba(205, 226, 255, 0.98), rgba(231, 242, 255, 0.99)) !important;
    }

    #lbTable tbody tr.kq-rank-1 td {
      background: linear-gradient(90deg, rgba(255, 240, 190, 0.98), rgba(255, 248, 224, 0.99)) !important;
      color: #6e4b00 !important;
      font-weight: 900 !important;
    }

    #lbTable tbody tr.kq-rank-1 td:first-child {
      box-shadow: inset 5px 0 0 #d8a514;
    }

    #lbTable tbody tr.kq-rank-2 td {
      background: linear-gradient(90deg, rgba(230, 234, 240, 0.98), rgba(245, 247, 250, 0.99)) !important;
      color: #4c5d73 !important;
      font-weight: 900 !important;
    }

    #lbTable tbody tr.kq-rank-2 td:first-child {
      box-shadow: inset 5px 0 0 #9aa7b4;
    }

    #lbTable tbody tr.kq-rank-3 td {
      background: linear-gradient(90deg, rgba(240, 215, 193, 0.98), rgba(250, 235, 224, 0.99)) !important;
      color: #7a4b2a !important;
      font-weight: 900 !important;
    }

    #lbTable tbody tr.kq-rank-3 td:first-child {
      box-shadow: inset 5px 0 0 #b87333;
    }

    #lbTable tbody tr.kq-you-row.kq-rank-1 td,
    #lbTable tbody tr.kq-you-row.kq-rank-2 td,
    #lbTable tbody tr.kq-you-row.kq-rank-3 td {
      background: linear-gradient(90deg, rgba(214, 232, 255, 0.95), rgba(235, 244, 255, 0.98)) !important;
      color: #1f4d8f !important;
    }

    #lbTable tbody tr.kq-you-row.kq-rank-1 td:first-child,
    #lbTable tbody tr.kq-you-row.kq-rank-2 td:first-child,
    #lbTable tbody tr.kq-you-row.kq-rank-3 td:first-child {
      box-shadow: inset 5px 0 0 #4b83d8;
    }

    @media (max-width: 900px) {
      .kq-leaderboard-header {
        align-items: center;
      }

      .kq-podium-image {
        width: 170px;
        max-width: 170px;
      }
    }

    @media (max-width: 700px) {
      .kq-leaderboard-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .kq-podium-image {
        width: 180px;
        max-width: 100%;
        margin-top: 6px;
      }

      #lbTable thead th,
      #lbTable tbody td {
        padding: 12px 10px;
      }
    }
  `;
  document.head.appendChild(style);
}

function rankMedal(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function medalForName(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
}

function normaliseRows() {
  const stored =
    Array.isArray(getLeaderboard()) && getLeaderboard().length
      ? getLeaderboard()
      : FALLBACK_ROWS;

  const merged = [...stored];

  if (merged.length < FALLBACK_ROWS.length) {
    FALLBACK_ROWS.forEach((row) => {
      if (!merged.some((existing) => existing.name === row.name)) {
        merged.push(row);
      }
    });
  }

  const me = getPlayer();
  const profile = getEquippedProfile();

  merged.push({
    name: "You",
    xp: Number(me.totalXPEarned) || Number(me.xp) || 0,
    title: getCurrentDisplayTitle(),
    badge: getCurrentDisplayEmoji(),
    streak: me.streak || 0,
    flair: profile.flair?.emoji || "",
    isYou: true,
  });

  return merged.sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0));
}

function ensureLeaderboardStructure() {
  const main = document.querySelector("main") || document.body;

  let card =
    document.querySelector(".leaderboard-card") ||
    document.querySelector(".leaderboard-section") ||
    document.querySelector(".leaderboard-shell") ||
    main.querySelector("section") ||
    main;

  card.classList.add("kq-leaderboard-card");

  let title =
    card.querySelector("h1") ||
    card.querySelector("h2");

  let subtitle = Array.from(card.querySelectorAll("p")).find((p) =>
    /weekly xp standings/i.test(p.textContent || "")
  );

  if (!title) {
    title = document.createElement("h1");
    title.textContent = "🏆 Leaderboard";
    card.prepend(title);
  }

  let header = document.getElementById("kqLeaderboardHeader");
  if (!header) {
    header = document.createElement("div");
    header.id = "kqLeaderboardHeader";
    header.className = "kq-leaderboard-header";

    const copy = document.createElement("div");
    copy.className = "kq-leaderboard-copy";

    title.parentNode.insertBefore(header, title);
    header.appendChild(copy);
    copy.appendChild(title);

    if (subtitle) {
      copy.appendChild(subtitle);
    }

    const image = document.createElement("img");
    image.id = "kqPodiumImage";
    image.className = "kq-podium-image";
    image.src = "favicon/leaderboard/podium.png";
    image.alt = "Leaderboard podium illustration";
    header.appendChild(image);
  }

  return card;
}

function ensureTable(card) {
  let table = document.getElementById("lbTable");
  if (table) return table;

  table = document.createElement("table");
  table.id = "lbTable";
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Student</th>
        <th>Title</th>
        <th>XP</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  card.appendChild(table);
  return table;
}

function renderLeaderboard() {
  ensureStyles();
  const card = ensureLeaderboardStructure();
  const rows = normaliseRows();
  const table = ensureTable(card);
  const tbody = table.querySelector("tbody");
  if (!tbody) return;
  tableBody.classList.add("kq-stagger");
  tbody.innerHTML = rows
    .map((row, index) => {
      const medal = medalForName(index);
      const classes = [
        row.isYou ? "kq-you-row" : "",
        index === 0 ? "kq-rank-1" : "",
        index === 1 ? "kq-rank-2" : "",
        index === 2 ? "kq-rank-3" : "",
      ].filter(Boolean).join(" ");

      return `
        <tr class="${classes}">
          <td><span class="kq-rank-medal">${rankMedal(index)}</span></td>
          <td>
            <div class="kq-player-cell">
              <div class="kq-player-icon-wrap">
                <span class="kq-player-icon">${row.badge || "✨"}</span>
                ${row.flair ? `<span class="kq-player-flair">${row.flair}</span>` : ""}
              </div>
              <div class="kq-player-meta">
                <strong>
                  ${row.name}${medal ? ` <span class="kq-name-medal">${medal}</span>` : ""}
                  ${row.isYou ? `<span class="kq-you-badge">Current User</span>` : ""}
                </strong>
                <span>${row.streak || 0} day streak</span>
              </div>
            </div>
          </td>
          <td><span class="kq-title-pill">${row.title || "Quest Player"}</span></td>
          <td><span class="kq-xp-num">${Number(row.xp) || 0}</span></td>
        </tr>
      `;
    })
    .join("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLeaderboard);
} else {
  renderLeaderboard();
}

on("state:changed", renderLeaderboard);

mountGuideBubble(
  [
    "Your row is now highlighted so judges can instantly spot the current user.",
    "The top 3 players are color-coded gold, silver, and bronze.",
    "Your equipped shop avatar, flair, and title now appear in your leaderboard row.",
  ],
  { label: "Score Coach", id: "kq-leaderboard-bubble", side: "right" }
);
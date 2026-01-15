import { getLeaderboard, getPlayer } from "./state.js";

/* Local leaderboard demo + optional API post example (commented) */
function renderLeaderboard() {
  const rows = getLeaderboard().slice();
  const me = getPlayer();

  // /* Add test/fake data for development */
  // rows.push(
  //   { name: "Test Player 1", xp: 500 },
  //   { name: "Test Player 2", xp: 450 },
  //   { name: "Test Player 3", xp: 400 }
  // );

  rows.push({ name: "You", xp: me.xp });

  rows.sort((a, b) => b.xp - a.xp);
  const tbody = document.querySelector("#lbTable tbody");
  if (tbody) {
    tbody.innerHTML = rows
      .map(
        (r, i) =>
          `<tr class="${r.name === "You" ? "me" : ""}"><td>${i + 1}</td><td>${
            r.name
          }</td><td>${r.xp}</td></tr>`
      )
      .join("");
  }
}

// Ensure DOM is ready before rendering
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLeaderboard);
} else {
  renderLeaderboard();
}

/* Example: send score to your backend (Supabase/Edge Function)
fetch('/api/submitScore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'You', xp:me.xp})})
  .then(r=>r.json()).then(console.log).catch(console.error);
*/

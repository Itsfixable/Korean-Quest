import { getLeaderboard, getPlayer } from "./state.js";

/* Local leaderboard demo + optional API post example (commented) */
const rows = getLeaderboard().slice();
const me = getPlayer();
rows.push({ name: "You", xp: me.xp });

rows.sort((a, b) => b.xp - a.xp);
const tbody = document.querySelector("#lbTable tbody");
tbody.innerHTML = rows
  .map(
    (r, i) =>
      `<tr class="${r.name === "You" ? "me" : ""}"><td>${i + 1}</td><td>${
        r.name
      }</td><td>${r.xp}</td></tr>`
  )
  .join("");

/* Example: send score to your backend (Supabase/Edge Function)
fetch('/api/submitScore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'You', xp:me.xp})})
  .then(r=>r.json()).then(console.log).catch(console.error);
*/

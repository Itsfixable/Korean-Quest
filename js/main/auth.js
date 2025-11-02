// ../js/main/auth.js
// Global Firebase Auth for KQ-FBLA (no auto-open on load)

console.log("[KQ] auth.js starting");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* 1) Replace with your Firebase config (Project Settings → Your apps) */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};

if (!firebaseConfig.apiKey) {
  console.error("[KQ] Missing Firebase config — auth will not work.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ---------- DOM helpers & modal bootstrap ---------- */
const $ = (id) => document.getElementById(id);

function ensureModal() {
  if (!$("#authModal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div id="authModal" class="modal" hidden>
        <div class="modal-card">
          <h3>Sign in</h3>
          <form id="authForm">
            <label>Email</label>
            <input id="authEmail" type="email" required />
            <label>Password</label>
            <input id="authPass" type="password" required minlength="6" />
            <div class="row">
              <button id="emailSignIn" class="btn primary" type="submit">Sign in</button>
              <button id="emailSignUp" class="btn secondary" type="button">Create account</button>
            </div>
          </form>
          <div class="row">
            <button id="googleBtn" class="btn" type="button">Continue with Google</button>
            <button id="authClose" class="btn" type="button">Close</button>
          </div>
          <p id="authMsg" class="muted" aria-live="polite"></p>
        </div>
      </div>`
    );
  }
}

/* ---------- Public API (no auto-open) ---------- */
export function openAuthModal() {
  const modal = $("#authModal");
  if (modal) {
    modal.hidden = false;
    $("#authEmail")?.focus();
  }
}
export function closeAuthModal() {
  const modal = $("#authModal");
  if (modal) {
    modal.hidden = true;
    const m = $("#authMsg");
    if (m) m.textContent = "";
  }
}
export const getUser = () => auth.currentUser;

/** Only returns a boolean. It will NOT open the modal unless you pass true. */
export function requireAuth(shouldOpen = false) {
  if (!auth.currentUser && shouldOpen) openAuthModal();
  return !!auth.currentUser;
}

/* Optional: subscribe to auth changes from page scripts */
const listeners = new Set();
export function onAuth(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emitAuth(u) {
  listeners.forEach((cb) => cb(u));
}

/* ---------- Wiring (runs after DOM is ready) ---------- */
function wireDOM() {
  if (window.__kqAuthWired) { console.warn("[KQ] auth already wired"); return; }
  window.__kqAuthWired = true;

  ensureModal();

  const loginBtn  = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userBadge = document.getElementById("userBadge");

  const modal   = document.getElementById("authModal");
  const form    = document.getElementById("authForm");
  const emailEl = document.getElementById("authEmail");
  const passEl  = document.getElementById("authPass");
  const msgEl   = document.getElementById("authMsg");
  const closeEl = document.getElementById("authClose");
  const signUpEl= document.getElementById("emailSignUp");
  const googleEl= document.getElementById("googleBtn");

  const open  = () => { if (modal) { modal.hidden = false; emailEl?.focus(); } };
  const close = () => { if (modal) { modal.hidden = true; if (msgEl) msgEl.textContent = ""; } };

  // 1) Bind nav pills (preventDefault in case they are <a> or <button>)
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); open(); });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault(); e.stopPropagation();
      try { await signOut(auth); } catch (err) { console.error("[KQ] signOut error", err); }
    });
  }

  // 2) Fallbacks: global event + delegated click (works if nav re-renders)
  window.addEventListener("kq-open-auth", open);
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.id === "loginBtn" || t.closest?.("#loginBtn"))) {
      e.preventDefault(); e.stopPropagation();
      open();
    }
  });

  // 3) Modal controls
  if (closeEl) closeEl.onclick = () => close();

  if (googleEl) {
    googleEl.onclick = async () => {
      try { const res = await signInWithPopup(auth, new GoogleAuthProvider()); console.log("[KQ] Google:", res.user?.uid); close(); }
      catch (e) { console.error("[KQ] Google popup error:", e); if (msgEl) msgEl.textContent = e.message; }
    };
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { const res = await signInWithEmailAndPassword(auth, emailEl.value, passEl.value); console.log("[KQ] Email:", res.user?.uid); close(); }
      catch (e) { console.error("[KQ] Email sign-in error:", e); if (msgEl) msgEl.textContent = e.message; }
    });
  }

  if (signUpEl) {
    signUpEl.addEventListener("click", async () => {
      try { const res = await createUserWithEmailAndPassword(auth, emailEl.value, passEl.value); console.log("[KQ] Created:", res.user?.uid); close(); }
      catch (e) { console.error("[KQ] Email sign-up error:", e); if (msgEl) msgEl.textContent = e.message; }
    });
  }

  // 4) Auth state -> nav UI
  onAuthStateChanged(auth, (user) => {
    const label = user?.displayName || user?.email || "";
    if (user) {
      if (userBadge) userBadge.textContent = `Signed in as ${label}`;
      if (loginBtn)  loginBtn.hidden = true;
      if (logoutBtn) logoutBtn.hidden = false;
      document.body.classList.add("authed");
    } else {
      if (userBadge) userBadge.textContent = "";
      if (loginBtn)  loginBtn.hidden = false;
      if (logoutBtn) logoutBtn.hidden = true;
      document.body.classList.remove("authed");
    }
    console.log("[KQ] auth state:", user ? "signed-in" : "signed-out");
  });

  if (modal) modal.hidden = true; // start hidden
  console.log("[KQ] auth.js ready");
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireDOM);
} else {
  wireDOM();
}

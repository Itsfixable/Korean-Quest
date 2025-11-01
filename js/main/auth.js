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
  ensureModal(); // inject if not present

  const loginBtn = $("#loginBtn");
  const logoutBtn = $("#logoutBtn");
  const userBadge = $("#userBadge");

  const modal = $("#authModal");
  const form = $("#authForm");
  const emailEl = $("#authEmail");
  const passEl = $("#authPass");
  const msgEl = $("#authMsg");
  const closeEl = $("#authClose");
  const signUpEl = $("#emailSignUp");
  const googleEl = $("#googleBtn");

  // Header actions (explicit only — no auto-open)
  if (loginBtn) loginBtn.onclick = () => openAuthModal();
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("[KQ] signOut error", e);
      }
    };
  }

  // Modal actions
  if (closeEl) closeEl.onclick = () => closeAuthModal();

  if (googleEl) {
    googleEl.onclick = async () => {
      try {
        const res = await signInWithPopup(auth, provider);
        console.log("[KQ] Google signed in:", res.user?.uid);
        closeAuthModal();
      } catch (e) {
        console.error("[KQ] Google popup error:", e);
        if (msgEl) msgEl.textContent = e.message;
      }
    };
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const res = await signInWithEmailAndPassword(auth, emailEl.value, passEl.value);
        console.log("[KQ] Email signed in:", res.user?.uid);
        closeAuthModal();
      } catch (e) {
        console.error("[KQ] Email sign-in error:", e);
        if (msgEl) msgEl.textContent = e.message;
      }
    });
  }

  if (signUpEl) {
    signUpEl.addEventListener("click", async () => {
      try {
        const res = await createUserWithEmailAndPassword(auth, emailEl.value, passEl.value);
        console.log("[KQ] Account created:", res.user?.uid);
        closeAuthModal();
      } catch (e) {
        console.error("[KQ] Email sign-up error:", e);
        if (msgEl) msgEl.textContent = e.message;
      }
    });
  }

  // Auth state → nav UI
  onAuthStateChanged(auth, (user) => {
    const label = user?.displayName || user?.email || "";
    if (user) {
      if (userBadge) userBadge.textContent = `Signed in as ${label}`;
      if (loginBtn) loginBtn.hidden = true;
      if (logoutBtn) logoutBtn.hidden = false;
      document.body.classList.add("authed");
    } else {
      if (userBadge) userBadge.textContent = "";
      if (loginBtn) loginBtn.hidden = false;
      if (logoutBtn) logoutBtn.hidden = true;
      document.body.classList.remove("authed");
    }
    emitAuth(user);
    console.log("[KQ] auth state:", user ? "signed-in" : "signed-out");
  });

  // Ensure modal starts hidden (in case CSS was overridden)
  if (modal) modal.hidden = true;

  console.log("[KQ] auth.js ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireDOM);
} else {
  wireDOM();
}

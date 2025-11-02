// ../js/main/auth.js
// Firebase Auth with Google popup→redirect fallback + 4-digit email OTP verification

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
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

/* 1) REPLACE with your exact Web app config (Firebase Console → Project settings → General → Your apps → Web) */
const firebaseConfig = {
  apiKey:        "YOUR_REAL_WEB_API_KEY",
  authDomain:    "your-project-id.firebaseapp.com",
  projectId:     "your-project-id",
  appId:         "1:###########:web:################",
  // optional: storageBucket, messagingSenderId, measurementId
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_")) {
  console.error("[KQ] Missing/placeholder Firebase config — auth will not work.");
}

/* 2) Init Firebase */
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// persist login
setPersistence(auth, browserLocalPersistence).catch(e =>
  console.error("[KQ] persistence error:", e)
);

const provider = new GoogleAuthProvider();

/* ---------- DOM helpers & modal bootstrap ---------- */
const $ = (id) => document.getElementById(id);

function ensureModal() {
  if (!$("#authModal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div id="authModal" class="modal" hidden>
        <div class="modal-card" style="position:relative;">
          <button id="authCloseX" aria-label="Close"
                  style="position:absolute;top:8px;right:8px;background:none;border:none;font-size:20px;cursor:pointer;line-height:1;">✕</button>
          <h3>Sign in</h3>

          <!-- EMAIL/PASSWORD -->
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

          <!-- GOOGLE -->
          <div class="row" style="margin-top:8px;">
            <button id="googleBtn" class="btn" type="button">Continue with Google</button>
          </div>

          <!-- OTP SECTION -->
          <div id="otpSection" style="display:none;margin-top:12px;">
            <hr style="opacity:.3;margin:10px 0;">
            <h4 style="margin:8px 0;">Verify your email</h4>
            <p class="muted" id="otpHelp">We sent a 4-digit code to your email. Enter it below.</p>
            <div class="row">
              <input id="otpInput" type="text" inputmode="numeric" pattern="\\d{4}"
                     maxlength="4" placeholder="1234"
                     style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px;" />
            </div>
            <div class="row" style="margin-top:8px;">
              <button id="otpSend" class="btn secondary" type="button">Resend code</button>
              <button id="otpVerify" class="btn primary" type="button">Verify code</button>
            </div>
          </div>

          <div class="row" style="margin-top:10px;">
            <button id="authClose" class="btn" type="button">Close</button>
          </div>

          <p id="authMsg" class="muted" aria-live="polite" style="margin-top:6px;"></p>
        </div>
      </div>`
    );
  }
}

/* ---------- Public API ---------- */
export function openAuthModal() {
  const modal = $("#authModal");
  if (modal) { modal.hidden = false; $("#authEmail")?.focus(); }
}
export function closeAuthModal() {
  const modal = $("#authModal");
  if (modal) { modal.hidden = true; setMsg(""); hideOtp(); }
}
export const getUser = () => auth.currentUser;
export function requireAuth(shouldOpen = false) {
  if (!auth.currentUser && shouldOpen) openAuthModal();
  return !!auth.currentUser;
}

/* ---------- Helpers ---------- */
function setMsg(t) { const m = $("#authMsg"); if (m) m.textContent = t || ""; }
function showOtp(text) {
  const s = $("#otpSection"); const h = $("#otpHelp");
  if (s) { s.style.display = "block"; }
  if (h && text) h.textContent = text;
}
function hideOtp() { const s = $("#otpSection"); if (s) s.style.display = "none"; }
function popupBlocked(code) {
  return ["auth/popup-blocked","auth/popup-closed-by-user",
          "auth/unauthorized-domain","auth/operation-not-supported-in-this-environment"].includes(code);
}

/* Callables (backend required — see functions code below) */
const cfRequestOtp = () => httpsCallable(functions, "requestOtp")({});
const cfVerifyOtp  = (code) => httpsCallable(functions, "verifyOtp")({ code });

/* After any sign-in, start 4-digit email code verification */
async function beginOtpVerificationFlow(user) {
  if (!user) return;

  // You can allow already-verified users to skip if you've stored status:
  // We'll fetch a custom claim via user.reload()? (Claims need Admin SDK.)
  // Simpler client approach: always (re)send, or you can call a "status" function.
  setMsg("Sending verification code...");
  try {
    await cfRequestOtp();
    showOtp("We sent a 4-digit code to your email. Enter it below.");
    setMsg("Check your inbox for the code.");
  } catch (e) {
    console.error("[KQ] requestOtp error:", e);
    setMsg(e?.message || "Could not send code. Try again.");
  }
}

/* Smart Google sign-in: try popup, fallback to redirect */
async function signInWithGoogleSmart() {
  setMsg("");
  try {
    const res = await signInWithPopup(auth, provider);
    console.log("[KQ] Google (popup):", res.user?.uid);
    await beginOtpVerificationFlow(res.user);
  } catch (e) {
    console.warn("[KQ] popup failed:", e.code, e.message);
    if (e.code === "auth/unauthorized-domain") {
      setMsg("This domain isn’t authorized. Add it in Firebase → Auth → Settings → Authorized domains.");
    }
    if (popupBlocked(e.code)) {
      setMsg("Opening Google sign-in…");
      try { await signInWithRedirect(auth, provider); }
      catch (e2) { console.error("[KQ] redirect error:", e2); setMsg(e2.message); }
    } else { setMsg(e.message); }
  }
}

/* Handle redirect result */
async function handleRedirectResultIfAny() {
  try {
    const res = await getRedirectResult(auth);
    if (res?.user) {
      console.log("[KQ] Google (redirect):", res.user.uid);
      await beginOtpVerificationFlow(res.user);
    }
  } catch (e) { console.error("[KQ] redirect result error:", e); setMsg(e.message); }
}

/* ---------- Wiring ---------- */
function wireDOM() {
  if (window.__kqAuthWired) return;
  window.__kqAuthWired = true;

  ensureModal();

  const loginBtn  = $("loginBtn");
  const logoutBtn = $("logoutBtn");
  const userBadge = $("userBadge");

  const modal   = $("authModal");
  const form    = $("authForm");
  const emailEl = $("authEmail");
  const passEl  = $("authPass");
  const closeEl = $("authClose");
  const closeX  = $("authCloseX");
  const signUpEl= $("emailSignUp");
  const googleEl= $("googleBtn");
  const otpSend = $("otpSend");
  const otpVerify = $("otpVerify");
  const otpInput = $("otpInput");

  const open  = () => { modal.hidden = false; emailEl?.focus(); };
  const close = () => { modal.hidden = true; setMsg(""); hideOtp(); otpInput && (otpInput.value=""); };

  if (loginBtn)  loginBtn.addEventListener("click", e => { e.preventDefault(); open(); });
  if (logoutBtn) logoutBtn.addEventListener("click", async e => {
    e.preventDefault();
    try { await signOut(auth); } catch (err) { console.error("[KQ] signOut error", err); }
  });

  window.addEventListener("kq-open-auth", open);
  document.addEventListener("click", e => {
    const t = e.target;
    if (t && (t.id === "loginBtn" || t.closest?.("#loginBtn"))) { e.preventDefault(); open(); }
  });

  if (closeEl) closeEl.onclick = () => close();
  if (closeX)  closeX.onclick  = () => close();

  if (googleEl) googleEl.onclick = () => { void signInWithGoogleSmart(); };

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      setMsg("");
      try {
        const res = await signInWithEmailAndPassword(auth, emailEl.value, passEl.value);
        console.log("[KQ] Email:", res.user?.uid);
        await beginOtpVerificationFlow(res.user);
      } catch (e) { console.error("[KQ] Email sign-in error:", e); setMsg(e.message); }
    });
  }

  if (signUpEl) {
    signUpEl.addEventListener("click", async () => {
      setMsg("");
      try {
        const res = await createUserWithEmailAndPassword(auth, emailEl.value, passEl.value);
        console.log("[KQ] Created:", res.user?.uid);
        await beginOtpVerificationFlow(res.user);
      } catch (e) { console.error("[KQ] Email sign-up error:", e); setMsg(e.message); }
    });
  }

  if (otpSend) {
    otpSend.addEventListener("click", async () => {
      setMsg("Sending code...");
      try { await cfRequestOtp(); setMsg("Code resent. Check your inbox."); }
      catch (e) { console.error("[KQ] requestOtp error:", e); setMsg(e.message || "Could not resend code."); }
    });
  }
  if (otpVerify) {
    otpVerify.addEventListener("click", async () => {
      const code = (otpInput?.value || "").trim();
      if (!/^\d{4}$/.test(code)) { setMsg("Enter the 4-digit code from your email."); return; }
      setMsg("Verifying code...");
      try {
        const res = await cfVerifyOtp(code);
        if (res?.data?.ok) {
          setMsg("Email verified! 🎉");
          hideOtp();
          close(); // close modal on success
        } else {
          setMsg(res?.data?.error || "Invalid code. Try again.");
        }
      } catch (e) {
        console.error("[KQ] verifyOtp error:", e);
        setMsg(e?.message || "Invalid code. Try again.");
      }
    });
  }

  onAuthStateChanged(auth, (user) => {
    const label = user?.displayName || user?.email || "";
    // You can decorate label with " (Not verified)" until OTP verified on backend,
    // but that requires reading a flag from Firestore; keeping simple here.
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

  modal.hidden = true;
  void handleRedirectResultIfAny();
  console.log("[KQ] origin:", location.origin, "authDomain:", auth.app.options.authDomain);
  console.log("[KQ] auth.js ready");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireDOM);
} else {
  wireDOM();
}

// js/main/fake-auth.js

const STORAGE_KEY = "kq_fake_user";

function getFakeUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveFakeUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearFakeUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function ensureFakeAuthStyles() {
  if (document.getElementById("kq-fake-auth-styles")) return;

  const style = document.createElement("style");
  style.id = "kq-fake-auth-styles";
  style.textContent = `
    .kq-auth-nav {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
    }

    .kq-auth-btn {
      border: none;
      border-radius: 999px;
      padding: 10px 16px;
      font-weight: 800;
      cursor: pointer;
      background: rgba(91, 114, 159, 0.10);
      color: #5b729f;
      transition: transform 120ms ease, background 120ms ease;
    }

    .kq-auth-btn:hover {
      transform: translateY(-1px);
      background: rgba(91, 114, 159, 0.16);
    }

    .kq-auth-btn.primary {
      background: linear-gradient(180deg, #7089bc 0%, #5d76aa 100%);
      color: #fff;
    }

    .kq-auth-user {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(91, 114, 159, 0.10);
      color: #273142;
      font-weight: 800;
    }

    .kq-auth-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      display: grid;
      place-items: center;
      z-index: 3000;
      padding: 20px;
    }

    .kq-auth-overlay[hidden] {
      display: none;
    }

    .kq-auth-modal {
      width: min(100%, 420px);
      background: #fff;
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.22);
      border: 1px solid rgba(0,0,0,0.08);
    }

    .kq-auth-modal h3 {
      margin: 0 0 8px;
      font-size: 1.4rem;
    }

    .kq-auth-modal p {
      margin: 0 0 16px;
      color: #5e6678;
      line-height: 1.5;
      font-weight: 700;
    }

    .kq-auth-field {
      display: grid;
      gap: 6px;
      margin-bottom: 14px;
    }

    .kq-auth-field label {
      font-weight: 800;
      color: #273142;
    }

    .kq-auth-field input {
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 14px;
      padding: 12px 14px;
      font-size: 0.96rem;
      font-family: inherit;
    }

    .kq-auth-field input:focus {
      outline: none;
      border-color: #7c98d1;
      box-shadow: 0 0 0 4px rgba(124, 152, 209, 0.16);
    }

    .kq-auth-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 12px;
    }

    @media (max-width: 640px) {
      .kq-auth-nav {
        width: 100%;
        justify-content: flex-end;
        flex-wrap: wrap;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureAuthModal() {
  let overlay = document.getElementById("kqFakeAuthOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "kqFakeAuthOverlay";
  overlay.className = "kq-auth-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="kq-auth-modal" role="dialog" aria-modal="true" aria-labelledby="kqAuthTitle">
      <h3 id="kqAuthTitle">Welcome to Korean Quest</h3>
      <p id="kqAuthSubtitle">Create a demo account to save your fake login state across pages.</p>

      <div class="kq-auth-field">
        <label for="kqFakeName">Name</label>
        <input id="kqFakeName" type="text" placeholder="Enter your name" maxlength="30" />
      </div>

      <div class="kq-auth-field">
        <label for="kqFakeEmail">Email</label>
        <input id="kqFakeEmail" type="email" placeholder="Enter your email (optional)" />
      </div>

      <div class="kq-auth-actions">
        <button type="button" class="kq-auth-btn" id="kqAuthCancel">Cancel</button>
        <button type="button" class="kq-auth-btn primary" id="kqAuthSubmit">Continue</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      overlay.hidden = true;
    }
  });

  overlay.querySelector("#kqAuthCancel")?.addEventListener("click", () => {
    overlay.hidden = true;
  });

  overlay.querySelector("#kqAuthSubmit")?.addEventListener("click", submitFakeAuth);

  return overlay;
}

function openAuthModal(mode = "login") {
  const overlay = ensureAuthModal();
  const title = overlay.querySelector("#kqAuthTitle");
  const subtitle = overlay.querySelector("#kqAuthSubtitle");
  const submit = overlay.querySelector("#kqAuthSubmit");
  const nameInput = overlay.querySelector("#kqFakeName");
  const emailInput = overlay.querySelector("#kqFakeEmail");

  if (title) title.textContent = mode === "signup" ? "Create your account" : "Log in to Korean Quest";
  if (subtitle) {
    subtitle.textContent =
      mode === "signup"
        ? "This is a demo sign up for your website presentation."
        : "This is a demo login for your website presentation.";
  }
  if (submit) submit.textContent = mode === "signup" ? "Sign Up" : "Log In";

  overlay.dataset.mode = mode;
  overlay.hidden = false;

  const existing = getFakeUser();
  if (nameInput) nameInput.value = existing?.name || "";
  if (emailInput) emailInput.value = existing?.email || "";

  setTimeout(() => nameInput?.focus(), 0);
}

function submitFakeAuth() {
  const overlay = document.getElementById("kqFakeAuthOverlay");
  if (!overlay) return;

  const nameInput = overlay.querySelector("#kqFakeName");
  const emailInput = overlay.querySelector("#kqFakeEmail");

  const name = String(nameInput?.value || "").trim();
  const email = String(emailInput?.value || "").trim();
  const mode = overlay.dataset.mode || "login";

  if (!name) {
    nameInput?.focus();
    return;
  }

  saveFakeUser({
    name,
    email,
    loggedIn: true,
    mode,
  });

  overlay.hidden = true;
  renderAuthNav();
}

function logoutFakeUser() {
  clearFakeUser();
  renderAuthNav();
}

function findNavContainer() {
  return (
    document.querySelector(".site-nav") ||
    document.querySelector(".nav") ||
    document.querySelector("nav")
  );
}

function renderAuthNav() {
  const nav =
    document.querySelector(".site-nav") ||
    document.querySelector(".nav") ||
    document.querySelector("nav");

  if (!nav) return;

  let authWrap = document.getElementById("kqAuthNav");
  if (!authWrap) {
    authWrap = document.createElement("div");
    authWrap.id = "kqAuthNav";
    authWrap.className = "kq-auth-nav";
    nav.appendChild(authWrap);
  }

  const user = getFakeUser();

  if (user?.loggedIn) {
    authWrap.innerHTML = `
      <span class="kq-auth-user">👋 Hi, ${user.name}</span>
      <button type="button" class="kq-auth-btn" id="kqLogoutBtn">Log Out</button>
    `;

    authWrap.querySelector("#kqLogoutBtn")?.addEventListener("click", logoutFakeUser);
  } else {
    authWrap.innerHTML = `
      <button type="button" class="kq-auth-btn" id="kqLoginBtn">Log In</button>
      <button type="button" class="kq-auth-btn primary" id="kqSignupBtn">Sign Up</button>
    `;

    authWrap.querySelector("#kqLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
    authWrap.querySelector("#kqSignupBtn")?.addEventListener("click", () => openAuthModal("signup"));
  }
}
function bootFakeAuth() {
  ensureFakeAuthStyles();
  ensureAuthModal();

  const tryRender = () => {
    const nav =
      document.querySelector(".site-nav") ||
      document.querySelector(".nav") ||
      document.querySelector("nav");

    if (!nav) return false;

    renderAuthNav();
    return true;
  };

  // Try immediately
  if (tryRender()) return;

  // Try again after nav-rebuild.js finishes
  let attempts = 0;
  const interval = setInterval(() => {
    attempts += 1;
    if (tryRender() || attempts > 30) {
      clearInterval(interval);
    }
  }, 200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootFakeAuth);
} else {
  bootFakeAuth();
}
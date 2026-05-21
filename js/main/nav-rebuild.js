(function () {
  const MOBILE_BREAKPOINT = 640;
  const FAKE_AUTH_KEY = "kq_fake_user";
  const GAME_STATE_KEY = "kq-state";

  const ICON_BASE = "favicon/nav/";

  const LINKS = [
    ["index.html", "Home", "nav-home.png"],
    ["schedule.html", "Schedule", "nav-schedule.png"],
    ["resources.html", "Learn", "nav-learn.png"],
    ["adventure.html", "Adventure", "nav-adventure.png"],
    ["dashboard.html", "Dashboard", "nav-dashboard.png"],
    ["shop.html", "Shop", "nav-shop.png"],
    ["leaderboard.html", "Leaderboard", "nav-leaderboard.png"],
    ["about.html", "About", "nav-about.png"],
  ];

  const EXTRA_ICONS = {
    home: `${ICON_BASE}nav-home.png`,
    schedule: `${ICON_BASE}nav-schedule.png`,
    learn: `${ICON_BASE}nav-learn.png`,
    adventure: `${ICON_BASE}nav-adventure.png`,
    dashboard: `${ICON_BASE}nav-dashboard.png`,
    shop: `${ICON_BASE}nav-shop.png`,
    leaderboard: `${ICON_BASE}nav-leaderboard.png`,
    statistics: `${ICON_BASE}nav-statistics.png`,
    avatar: `${ICON_BASE}nav-avatar.png`,
    about: `${ICON_BASE}nav-about.png`,
  };

  function getFakeUser() {
    try {
      return JSON.parse(localStorage.getItem(FAKE_AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveFakeUser(user) {
    localStorage.setItem(FAKE_AUTH_KEY, JSON.stringify(user));
  }

  function clearFakeUser() {
    localStorage.removeItem(FAKE_AUTH_KEY);
  }

  function getCurrentPath() {
    const file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function getInitials(name) {
    const cleaned = String(name || "").trim();

    if (!cleaned) return "KQ";

    const parts = cleaned.split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "KQ";
  }

  function getGameStats() {
    try {
      const raw = localStorage.getItem(GAME_STATE_KEY);
      if (!raw) return { level: 1, coins: 0 };
      const parsed = JSON.parse(raw);
      return {
        level: Number(parsed?.player?.level) || 1,
        coins: Number(parsed?.player?.coins) || 0,
      };
    } catch {
      return { level: 1, coins: 0 };
    }
  }

  function iconSrc(filename) {
    return `${ICON_BASE}${filename}`;
  }

  function makeSidebarLink(href, label, iconFile, currentPath) {
    const a = document.createElement("a");
    a.className = "pill kq-side-link";
    a.href = href;
    a.innerHTML = `
      <img class="kq-side-link-icon" src="${iconSrc(iconFile)}" alt="" aria-hidden="true" />
      <span class="kq-side-link-label">${label}</span>
    `;

    if (href === currentPath) {
      a.setAttribute("aria-current", "page");
    }

    return a;
  }

  function makeMobileLink(href, label, iconFile, currentPath) {
    const a = document.createElement("a");
    a.className = "pill kq-mobile-link";
    a.href = href;
    a.innerHTML = `
      <img class="kq-mobile-link-icon" src="${iconSrc(iconFile)}" alt="" aria-hidden="true" />
      <span>${label}</span>
    `;

    if (href === currentPath) {
      a.setAttribute("aria-current", "page");
    }

    return a;
  }

  function ensureNavStyles() {
    if (document.getElementById("kq-nav-rebuild-styles")) return;

    const style = document.createElement("style");
    style.id = "kq-nav-rebuild-styles";
    style.textContent = `
      :root {
        --kq-sidebar-width: clamp(220px, 24vw, 272px);
        --kq-sidebar-offset: clamp(12px, 1.25vw, 16px);
        --kq-sidebar-gap: clamp(10px, 1vw, 16px);
        --kq-sidebar-pad-x: clamp(12px, 1.3vw, 16px);
        --kq-sidebar-pad-y: clamp(14px, 1.6vw, 18px);
        --kq-card-radius: clamp(20px, 2vw, 28px);
        --kq-brand-logo-size: clamp(34px, 3vw, 42px);
        --kq-profile-avatar-size: clamp(42px, 4vw, 52px);
        --kq-profile-font: clamp(0.82rem, 1vw, 1rem);
        --kq-link-font: clamp(0.88rem, 1vw, 0.98rem);
        --kq-link-gap: clamp(8px, 1vw, 12px);
        --kq-link-pad-y: clamp(10px, 1vw, 12px);
        --kq-link-pad-x: clamp(10px, 1vw, 14px);
        --kq-link-radius: clamp(14px, 1.5vw, 18px);
        --kq-side-icon-size: clamp(28px, 3vw, 44px);
        --kq-mobile-icon-size: clamp(20px, 5vw, 24px);
        --kq-bottom-btn-font: clamp(0.88rem, 1vw, 0.98rem);
      }

      body {
        overflow-x: hidden;
      }

      /* =========================
         DESKTOP / TABLET SIDEBAR
      ========================= */

      @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
        body {
          padding-left: calc(var(--kq-sidebar-width) + (var(--kq-sidebar-offset) * 2) + 10px) !important;
        }

        .site-header {
          position: fixed !important;
          top: var(--kq-sidebar-offset) !important;
          left: var(--kq-sidebar-offset) !important;
          width: var(--kq-sidebar-width) !important;
          max-width: var(--kq-sidebar-width) !important;
          height: calc(100vh - (var(--kq-sidebar-offset) * 2)) !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 3000 !important;
        }

        .site-header.container {
          width: var(--kq-sidebar-width) !important;
          max-width: var(--kq-sidebar-width) !important;
        }

        .site-nav {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          justify-content: flex-start !important;
          gap: var(--kq-sidebar-gap) !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 0 !important;
          border-radius: var(--kq-card-radius) !important;
          padding: var(--kq-sidebar-pad-y) var(--kq-sidebar-pad-x) !important;
          background: #eaf0fb !important;
          box-shadow: 0 10px 28px rgba(0,0,0,0.06) !important;
          overflow: hidden !important;
        }

        main.container,
        .container:not(.site-header) {
          width: auto !important;
          max-width: none !important;
        }
      }

      .site-nav .brand {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: clamp(8px, 0.9vw, 10px) !important;
        padding: 4px 4px 8px !important;
        min-width: 0 !important;
      }

      .brand-logo {
        width: var(--kq-brand-logo-size) !important;
        height: var(--kq-brand-logo-size) !important;
        object-fit: contain !important;
        border-radius: 12px !important;
        flex: 0 0 var(--kq-brand-logo-size) !important;
      }

      .brand-wordmark {
        display: inline-flex !important;
        align-items: baseline !important;
        gap: 6px !important;
        min-width: 0 !important;
        flex-wrap: wrap !important;
      }

      .brand-korean,
      .brand-quest {
        font-weight: 900 !important;
        font-family: "Nunito", sans-serif !important;
        font-size: clamp(0.94rem, 1.05vw, 1.1rem) !important;
      }

      .kq-sidebar-profile {
        display: grid;
        gap: clamp(8px, 0.9vw, 10px);
        padding: clamp(12px, 1.2vw, 14px);
        border-radius: clamp(18px, 2vw, 22px);
        background: linear-gradient(180deg, #6d84b7 0%, #5971a1 100%);
        color: #fff;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
      }

      .kq-sidebar-profile-top {
        display: flex;
        align-items: center;
        gap: clamp(10px, 1vw, 12px);
        min-width: 0;
      }

      .kq-sidebar-avatar {
        width: var(--kq-profile-avatar-size);
        height: var(--kq-profile-avatar-size);
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: rgba(255,255,255,0.20);
        color: #fff;
        font-family: "Nunito", sans-serif;
        font-weight: 900;
        font-size: clamp(0.86rem, 1vw, 1rem);
        flex: 0 0 var(--kq-profile-avatar-size);
        overflow: hidden;
        border: 2px solid rgba(255,255,255,0.22);
      }

      .kq-sidebar-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .kq-sidebar-user-copy {
        min-width: 0;
      }

      .kq-sidebar-user-copy strong {
        display: block;
        font-size: var(--kq-profile-font);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .kq-sidebar-user-copy span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
        font-size: clamp(0.76rem, 0.92vw, 0.9rem);
        font-weight: 700;
        opacity: 0.95;
        flex-wrap: wrap;
      }

      .kq-sidebar-links {
        display: grid;
        gap: clamp(6px, 0.8vw, 8px);
        min-height: 0;
      }

      .kq-side-link {
        display: flex !important;
        align-items: center !important;
        gap: var(--kq-link-gap) !important;
        width: 100% !important;
        min-height: clamp(52px, 5vw, 66px) !important;
        padding: var(--kq-link-pad-y) var(--kq-link-pad-x) !important;
        border-radius: var(--kq-link-radius) !important;
        text-decoration: none !important;
        color: #1e2a3f !important;
        background: transparent !important;
        box-shadow: none !important;
        font-family: "Nunito", sans-serif !important;
        font-size: var(--kq-link-font) !important;
        font-weight: 900 !important;
        transition: transform 120ms ease, background 120ms ease, color 120ms ease;
      }

      .kq-side-link:hover {
        background: rgba(91, 114, 159, 0.08) !important;
        transform: translateX(2px);
      }

      .kq-side-link[aria-current="page"] {
        background: linear-gradient(180deg, #6d84b7 0%, #5971a1 100%) !important;
        color: #fff !important;
      }

      .kq-side-link-icon {
        width: var(--kq-side-icon-size);
        height: var(--kq-side-icon-size);
        object-fit: contain;
        flex: 0 0 var(--kq-side-icon-size);
        display: block;
        border-radius: clamp(8px, 1vw, 10px);
      }

      .kq-side-link-label {
        min-width: 0;
        line-height: 1.2;
      }

      .kq-sidebar-bottom {
        margin-top: auto;
        display: grid;
        gap: clamp(8px, 0.9vw, 10px);
      }

      .kq-sidebar-action {
        width: 100%;
        border: none;
        border-radius: 999px;
        padding: clamp(10px, 1vw, 12px) clamp(12px, 1vw, 14px);
        font-family: "Nunito", sans-serif;
        font-size: var(--kq-bottom-btn-font);
        font-weight: 900;
        text-align: center;
        cursor: pointer;
        text-decoration: none;
        background: rgba(255,255,255,0.86);
        color: #22324d;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
      }

      /* =========================
         AUTH MODAL
      ========================= */

      .kq-auth-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        display: grid;
        place-items: center;
        z-index: 99999;
        padding: 20px;
        pointer-events: auto;
      }

      .kq-auth-overlay[hidden] {
        display: none;
      }

      .kq-auth-modal {
        width: min(100%, 430px);
        background: #fff;
        border-radius: 24px;
        padding: 22px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(0, 0, 0, 0.08);
        pointer-events: auto;
      }

      .kq-auth-modal h3 {
        margin: 0 0 8px;
        font-size: 1.45rem;
      }

      .kq-auth-field {
        display: grid;
        gap: 6px;
        margin-bottom: 14px;
      }

      .kq-auth-field label {
        font-weight: 800;
        color: #273142;
        font-family: "Nunito", sans-serif;
      }

      .kq-auth-field input {
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 14px;
        padding: 12px 14px;
        font-size: 0.96rem;
        font-family: "Nunito", sans-serif;
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

      .kq-auth-btn {
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        font-weight: 800;
        cursor: pointer;
        background: rgba(91, 114, 159, 0.10);
        color: #5b729f;
        font-family: "Nunito", sans-serif;
      }

      .kq-auth-btn.primary {
        background: linear-gradient(180deg, #7089bc 0%, #5d76aa 100%);
        color: #fff;
      }

      /* =========================
         MOBILE: ORIGINAL TOP NAV
      ========================= */

      .kq-mobile-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
      }

      .kq-mobile-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .kq-mobile-home {
        white-space: nowrap;
      }

      .kq-mobile-user-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(91,114,159,0.10);
        color: #22324d;
        font-family: "Nunito", sans-serif;
        font-size: 0.88rem;
        font-weight: 800;
        max-width: 150px;
      }

      .kq-mobile-user-chip .kq-sidebar-avatar {
        width: 28px;
        height: 28px;
        flex-basis: 28px;
        font-size: 0.72rem;
        border-width: 1px;
      }

      .kq-mobile-user-chip span:last-child {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .kq-mobile-toggle {
        border: none;
        background: transparent;
        font-size: 1.35rem;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 10px;
      }

      .kq-mobile-toggle:hover {
        background: rgba(91, 114, 159, 0.08);
      }

      .kq-mobile-menu {
        display: none;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        margin-top: 12px;
      }

      .kq-mobile-menu.open {
        display: flex;
      }

      .kq-mobile-cascade {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }

      .kq-mobile-link {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }

      .kq-mobile-link-icon {
        width: var(--kq-mobile-icon-size);
        height: var(--kq-mobile-icon-size);
        object-fit: contain;
        flex: 0 0 var(--kq-mobile-icon-size);
        display: block;
      }

      .kq-mobile-profile {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 0 2px;
      }

      .kq-mobile-profile .kq-sidebar-avatar {
        width: 38px;
        height: 38px;
        flex-basis: 38px;
        font-size: 0.86rem;
      }

      .kq-mobile-auth-actions {
        display: grid;
        gap: 10px;
        padding-top: 8px;
      }

      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        body {
          padding-left: 0 !important;
        }

        .site-header {
          position: static !important;
          width: auto !important;
          max-width: none !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .site-header.container {
          width: auto !important;
          max-width: none !important;
        }

        .site-nav {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 10px !important;
          height: auto !important;
          border-radius: 22px !important;
          padding: 14px !important;
          background: #f6f8fc !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.05) !important;
        }

        .site-nav .brand {
          padding: 0 0 2px !important;
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
        <h3 id="kqAuthTitle">Login / Sign Up</h3>

        <div class="kq-auth-field">
          <label for="kqFakeName">Name</label>
          <input id="kqFakeName" type="text" placeholder="Enter your name" maxlength="30" />
        </div>

        <div class="kq-auth-field">
          <label for="kqFakeEmail">Email</label>
          <input id="kqFakeEmail" type="email" placeholder="Enter your email" />
        </div>

        <div class="kq-auth-field">
          <label for="kqFakePass">Password</label>
          <input id="kqFakePass" type="password" placeholder="Enter your password" />
        </div>

        <div class="kq-auth-actions">
          <button type="button" class="kq-auth-btn" id="kqAuthCancel">Cancel</button>
          <button type="button" class="kq-auth-btn primary" id="kqAuthSubmit">Continue</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.hidden = true;
    });

    overlay.querySelector("#kqAuthCancel")?.addEventListener("click", () => {
      overlay.hidden = true;
    });

    overlay.querySelector("#kqAuthSubmit")?.addEventListener("click", submitFakeAuth);

    return overlay;
  }

  function openAuthModal() {
    const overlay = ensureAuthModal();
    const nameInput = overlay.querySelector("#kqFakeName");
    const emailInput = overlay.querySelector("#kqFakeEmail");
    const passInput = overlay.querySelector("#kqFakePass");
    const existing = getFakeUser();

    if (nameInput) nameInput.value = existing?.name || "";
    if (emailInput) emailInput.value = existing?.email || "";
    if (passInput) passInput.value = "";

    overlay.hidden = false;
    setTimeout(() => nameInput?.focus(), 0);
  }

  function submitFakeAuth() {
    const overlay = document.getElementById("kqFakeAuthOverlay");
    if (!overlay) return;

    const nameInput = overlay.querySelector("#kqFakeName");
    const emailInput = overlay.querySelector("#kqFakeEmail");
    const passInput = overlay.querySelector("#kqFakePass");

    const name = String(nameInput?.value || "").trim();
    const email = String(emailInput?.value || "").trim();
    const password = String(passInput?.value || "").trim();

    if (!name) {
      nameInput?.focus();
      return;
    }

    if (!password) {
      passInput?.focus();
      return;
    }

    saveFakeUser({
      name,
      email,
      password,
      loggedIn: true,
      avatarInitials: getInitials(name),
    });

    overlay.hidden = true;
    rebuildNav();
  }

  function logoutFakeUser() {
    clearFakeUser();
    rebuildNav();
  }

  function buildAvatar(user) {
    const avatar = document.createElement("div");
    avatar.className = "kq-sidebar-avatar";

    if (user?.avatarImage) {
      const img = document.createElement("img");
      img.src = user.avatarImage;
      img.alt = `${user.name || "User"} profile picture`;
      avatar.appendChild(img);
    } else {
      avatar.textContent = user?.avatarInitials || getInitials(user?.name || "KQ");
    }

    return avatar;
  }

  function buildProfileCard() {
    const user = getFakeUser();
    const stats = getGameStats();

    const wrap = document.createElement("div");
    wrap.className = "kq-sidebar-profile";

    if (user?.loggedIn) {
      const top = document.createElement("div");
      top.className = "kq-sidebar-profile-top";

      top.appendChild(buildAvatar(user));

      const copy = document.createElement("div");
      copy.className = "kq-sidebar-user-copy";
      copy.innerHTML = `
        <strong>${user.name}</strong>
        <span>Level ${stats.level} · 🪙 ${stats.coins}</span>
      `;

      top.appendChild(copy);
      wrap.appendChild(top);
      return wrap;
    }

    wrap.innerHTML = `
      <div class="kq-sidebar-profile-top">
        <div class="kq-sidebar-avatar">KQ</div>
        <div class="kq-sidebar-user-copy">
          <strong>Guest Learner</strong>
          <span>Login to save your style</span>
        </div>
      </div>
    `;

    return wrap;
  }

  function buildDesktopSidebar(nav, brand, currentPath) {
    nav.innerHTML = "";
    nav.appendChild(brand);
    nav.appendChild(buildProfileCard());

    const linksWrap = document.createElement("div");
    linksWrap.className = "kq-sidebar-links";

    LINKS.forEach(([href, label, iconFile]) => {
      linksWrap.appendChild(makeSidebarLink(href, label, iconFile, currentPath));
    });

    nav.appendChild(linksWrap);

    const bottom = document.createElement("div");
    bottom.className = "kq-sidebar-bottom";

    const user = getFakeUser();
    if (user?.loggedIn) {
      const signOut = document.createElement("button");
      signOut.type = "button";
      signOut.className = "kq-sidebar-action";
      signOut.textContent = "Sign Out";
      signOut.addEventListener("click", logoutFakeUser);
      bottom.appendChild(signOut);
    } else {
      const login = document.createElement("button");
      login.type = "button";
      login.className = "kq-sidebar-action";
      login.textContent = "Login / Sign Up";
      login.addEventListener("click", openAuthModal);
      bottom.appendChild(login);
    }

    nav.appendChild(bottom);
  }

  function buildMobile(nav, brand, currentPath) {
    nav.innerHTML = "";
    nav.appendChild(brand);

    const top = document.createElement("div");
    top.className = "kq-mobile-top";

    const homeLink = makeMobileLink("index.html", "Home", "nav-home.png", currentPath);
    homeLink.classList.add("kq-mobile-home");

    const right = document.createElement("div");
    right.className = "kq-mobile-right";

    const user = getFakeUser();
    if (user?.loggedIn) {
      const userChip = document.createElement("div");
      userChip.className = "kq-mobile-user-chip";
      userChip.appendChild(buildAvatar(user));

      const name = document.createElement("span");
      name.textContent = user.name;
      userChip.appendChild(name);

      right.appendChild(userChip);
    }

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "kq-mobile-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    toggle.textContent = "☰";

    right.appendChild(toggle);
    top.appendChild(homeLink);
    top.appendChild(right);
    nav.appendChild(top);

    const menu = document.createElement("div");
    menu.className = "kq-mobile-menu";

    const cascade = document.createElement("div");
    cascade.className = "kq-mobile-cascade";

    LINKS.filter(([href]) => href !== "index.html").forEach(([href, label, iconFile]) => {
      cascade.appendChild(makeMobileLink(href, label, iconFile, currentPath));
    });

    menu.appendChild(cascade);

    const authActions = document.createElement("div");
    authActions.className = "kq-mobile-auth-actions";

    if (user?.loggedIn) {
      const signOut = document.createElement("button");
      signOut.type = "button";
      signOut.className = "kq-sidebar-action";
      signOut.textContent = "Sign Out";
      signOut.addEventListener("click", () => {
        logoutFakeUser();
        closeMenu();
      });
      authActions.appendChild(signOut);
    } else {
      const login = document.createElement("button");
      login.type = "button";
      login.className = "kq-sidebar-action";
      login.textContent = "Login / Sign Up";
      login.addEventListener("click", () => {
        openAuthModal();
        closeMenu();
      });
      authActions.appendChild(login);
    }

    menu.appendChild(authActions);
    nav.appendChild(menu);

    function closeMenu() {
      menu.classList.remove("open");
      toggle.textContent = "☰";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }

    function openMenu() {
      menu.classList.add("open");
      toggle.textContent = "✕";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menu.classList.contains("open")) closeMenu();
      else openMenu();
    });

    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target)) closeMenu();
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    closeMenu();
  }

  function rebuildNav() {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;

    const brand = nav.querySelector(".brand") || document.querySelector(".brand");
    if (!brand) return;

    const currentPath = getCurrentPath();
    const width = window.innerWidth;

    if (width <= MOBILE_BREAKPOINT) {
      buildMobile(nav, brand, currentPath);
    } else {
      buildDesktopSidebar(nav, brand, currentPath);
    }
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildNav, 120);
  });

  window.addEventListener("storage", (e) => {
    if (e.key === FAKE_AUTH_KEY || e.key === GAME_STATE_KEY) {
      rebuildNav();
    }
  });

  window.addEventListener("kq:fake-user-updated", rebuildNav);

  document.body.classList.remove("kq-transition-out");

  document.addEventListener("DOMContentLoaded", () => {
    ensureNavStyles();
    ensureAuthModal();
    rebuildNav();
    document.body.classList.remove("kq-transition-out");

    document.querySelectorAll(".site-nav a[href], .nav a[href], .mobile-nav a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#") || link.target === "_blank") return;

      link.addEventListener("click", (event) => {
        try {
          const destination = new URL(href, window.location.href);
          if (destination.origin === window.location.origin && destination.href !== window.location.href) {
            event.preventDefault();
            requestAnimationFrame(() => {
              document.body.classList.add("kq-transition-out");
              setTimeout(() => {
                window.location.href = destination.href;
              }, 240);
            });
          }
        } catch (error) {
          // ignore invalid URLs
        }
      });
    });
  });

  window.addEventListener("pageshow", () => {
    document.body.classList.remove("kq-transition-out");
  });

  window.KQ_NAV_ICONS = EXTRA_ICONS;
})();
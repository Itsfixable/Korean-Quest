(function () {
  const MOBILE_BREAKPOINT = 640;
  const FAKE_AUTH_KEY = "kq_fake_user";
  let currentMode = "";

  const LINKS = [
    ["index.html", "Home"],
    ["schedule.html", "Schedule"],
    ["resources.html", "Resources"],
    ["adventure.html", "Adventure"],
    ["dashboard.html", "Dashboard"],
    ["leaderboard.html", "Leaderboard"],
    ["about.html", "About"],
  ];

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

  function makeLink(href, label, currentPath) {
    const a = document.createElement("a");
    a.className = "pill";
    a.href = href;
    a.textContent = label;

    if (href === currentPath) {
      a.setAttribute("aria-current", "page");
    }

    return a;
  }

  function ensureFakeAuthStyles() {
    if (document.getElementById("kq-fake-auth-styles")) return;

    const style = document.createElement("style");
    style.id = "kq-fake-auth-styles";
    style.textContent = `
      .site-nav {
        display: grid !important;
        grid-template-columns: auto 1fr auto !important;
        align-items: center !important;
        column-gap: 22px !important;
        width: 100% !important;
      }

      .site-nav .brand {
        display: inline-flex !important;
        align-items: center !important;
        gap: 10px !important;
        white-space: nowrap !important;
      }

      .nav-links-desktop {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 12px !important;
        min-width: 0 !important;
        flex-wrap: nowrap !important;
      }

      .nav-links-desktop .pill {
        white-space: nowrap !important;
        font-family: "Nunito", sans-serif !important;
        font-weight: 700 !important;
        flex: 0 0 auto !important;
      }

      .nav-auth {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 10px !important;
        white-space: nowrap !important;
      }

      .nav-auth .pill {
        white-space: nowrap !important;
        font-family: "Nunito", sans-serif !important;
        font-weight: 700 !important;
      }

      .nav-auth-ghost {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        color: #111827 !important;
        padding: 10px 8px !important;
      }

      .nav-auth-ghost:hover {
        background: rgba(91, 114, 159, 0.08) !important;
      }

      .nav-user-trigger {
        border: none;
        background: transparent;
        color: #111827;
        font-family: "Nunito", sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        padding: 10px 12px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        position: relative;
      }

      .nav-user-trigger:hover {
        background: rgba(91, 114, 159, 0.08);
      }

      .nav-user-caret {
        font-size: 0.8rem;
        color: #5b729f;
      }

      .nav-user-wrap {
        position: relative;
      }

      .nav-user-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 160px;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.14);
        padding: 8px;
        z-index: 2200;
      }

      .nav-user-menu[hidden] {
        display: none;
      }

      .nav-user-menu button {
        width: 100%;
        border: none;
        background: transparent;
        color: #111827;
        font-family: "Nunito", sans-serif;
        font-size: 0.96rem;
        font-weight: 700;
        text-align: left;
        padding: 10px 12px;
        border-radius: 12px;
        cursor: pointer;
      }

      .nav-user-menu button:hover {
        background: rgba(91, 114, 159, 0.10);
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
        width: min(100%, 430px);
        background: #fff;
        border-radius: 24px;
        padding: 22px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.22);
        border: 1px solid rgba(0,0,0,0.08);
      }

      .kq-auth-modal h3 {
        margin: 0 0 8px;
        font-size: 1.45rem;
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
        font-family: "Nunito", sans-serif;
      }

      .kq-auth-field input {
        border: 1px solid rgba(0,0,0,0.12);
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
        transition: transform 120ms ease, background 120ms ease;
        font-family: "Nunito", sans-serif;
      }

      .kq-auth-btn:hover {
        transform: translateY(-1px);
        background: rgba(91, 114, 159, 0.16);
      }

      .kq-auth-btn.primary {
        background: linear-gradient(180deg, #7089bc 0%, #5d76aa 100%);
        color: #fff;
      }

      .nav-mobile-auth {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding-top: 8px;
      }

      .nav-mobile-auth .pill {
        font-family: "Nunito", sans-serif;
        font-weight: 700;
      }

      .nav-mobile-user-wrap {
        width: 100%;
        position: relative;
      }

      .nav-mobile-user-wrap .nav-user-trigger {
        width: 100%;
        justify-content: center;
        background: rgba(91, 114, 159, 0.08);
      }

      .nav-mobile-user-wrap .nav-user-menu {
        position: static;
        margin-top: 8px;
        box-shadow: none;
        border-radius: 14px;
      }

      @media (max-width: 1080px) {
        .site-nav {
          column-gap: 16px !important;
        }

        .nav-links-desktop {
          gap: 10px !important;
        }

        .nav-links-desktop .pill,
        .nav-auth .pill,
        .nav-user-trigger {
          font-size: 0.95rem !important;
        }
      }

      @media (max-width: 940px) {
        .site-nav {
          column-gap: 12px !important;
        }

        .nav-links-desktop {
          gap: 8px !important;
        }

        .nav-links-desktop .pill,
        .nav-auth .pill,
        .nav-user-trigger {
          font-size: 0.92rem !important;
        }
      }

      @media (max-width: 640px) {
        .site-nav {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }

        .nav-links-desktop {
          display: none !important;
        }

        .nav-mobile-auth .pill {
          flex: 1 1 auto;
          text-align: center;
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
        <p>This is a demo account system for Korean Quest.</p>

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
    });

    overlay.hidden = true;
    rebuildNav();
  }

  function logoutFakeUser() {
    clearFakeUser();
    rebuildNav();
  }

  function closeAllUserMenus() {
    document.querySelectorAll(".nav-user-menu").forEach((menu) => {
      menu.hidden = true;
    });
    document.querySelectorAll(".nav-user-trigger").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function attachUserMenu(trigger, menu) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = !menu.hidden;
      closeAllUserMenus();

      if (!isOpen) {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    menu.querySelector("[data-signout]")?.addEventListener("click", (e) => {
      e.preventDefault();
      logoutFakeUser();
    });
  }

  function buildAuthDesktop() {
    const wrap = document.createElement("div");
    wrap.className = "nav-auth";

    const user = getFakeUser();

    if (user?.loggedIn) {
      const userWrap = document.createElement("div");
      userWrap.className = "nav-user-wrap";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "nav-user-trigger";
      trigger.setAttribute("aria-expanded", "false");
      trigger.textContent = user.name;

      const caret = document.createElement("span");
      caret.className = "nav-user-caret";
      caret.textContent = "▾";
      trigger.appendChild(caret);

      const menu = document.createElement("div");
      menu.className = "nav-user-menu";
      menu.hidden = true;
      menu.innerHTML = `
        <button type="button" data-signout="true">Sign Out</button>
      `;

      userWrap.appendChild(trigger);
      userWrap.appendChild(menu);
      attachUserMenu(trigger, menu);

      wrap.appendChild(userWrap);
      return wrap;
    }

    const login = document.createElement("a");
    login.href = "#";
    login.className = "pill nav-auth-ghost";
    login.textContent = "Login / Sign Up";

    login.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal();
    });

    wrap.appendChild(login);
    return wrap;
  }

  function buildAuthMobile(closeMenu) {
    const wrap = document.createElement("div");
    wrap.className = "nav-mobile-auth";

    const user = getFakeUser();

    if (user?.loggedIn) {
      const userWrap = document.createElement("div");
      userWrap.className = "nav-mobile-user-wrap";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "nav-user-trigger";
      trigger.setAttribute("aria-expanded", "false");
      trigger.textContent = user.name;

      const caret = document.createElement("span");
      caret.className = "nav-user-caret";
      caret.textContent = "▾";
      trigger.appendChild(caret);

      const menu = document.createElement("div");
      menu.className = "nav-user-menu";
      menu.hidden = true;
      menu.innerHTML = `
        <button type="button" data-signout="true">Sign Out</button>
      `;

      menu.querySelector("[data-signout]")?.addEventListener("click", (e) => {
        e.preventDefault();
        logoutFakeUser();
        closeMenu();
      });

      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = !menu.hidden;
        menu.hidden = isOpen;
        trigger.setAttribute("aria-expanded", String(!isOpen));
      });

      userWrap.appendChild(trigger);
      userWrap.appendChild(menu);
      wrap.appendChild(userWrap);
      return wrap;
    }

    const login = document.createElement("a");
    login.href = "#";
    login.className = "pill";
    login.textContent = "Login / Sign Up";

    login.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal();
      closeMenu();
    });

    wrap.appendChild(login);
    return wrap;
  }

  function buildDesktop(nav, brand, currentPath) {
    nav.innerHTML = "";
    nav.appendChild(brand);

    const linksWrap = document.createElement("div");
    linksWrap.className = "nav-links-desktop";

    LINKS.forEach(([href, label]) => {
      linksWrap.appendChild(makeLink(href, label, currentPath));
    });

    linksWrap.appendChild(buildAuthDesktop());
    nav.appendChild(linksWrap);
  }

  function buildMobile(nav, brand, currentPath) {
    nav.innerHTML = "";
    nav.appendChild(brand);

    const topRow = document.createElement("div");
    topRow.className = "nav-mobile-top";

    const homeLink = makeLink("index.html", "Home", currentPath);
    homeLink.classList.add("nav-home-link");

    const toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    toggle.textContent = "☰";

    topRow.appendChild(homeLink);
    topRow.appendChild(toggle);

    const menu = document.createElement("div");
    menu.className = "nav-links";
    menu.id = "mobileNavMenu";

    LINKS.filter(([href]) => href !== "index.html").forEach(([href, label]) => {
      menu.appendChild(makeLink(href, label, currentPath));
    });

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

    menu.appendChild(buildAuthMobile(closeMenu));

    nav.appendChild(topRow);
    nav.appendChild(menu);

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menu.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target)) {
        closeMenu();
      }
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
    const nextMode = window.innerWidth <= MOBILE_BREAKPOINT ? "mobile" : "desktop";
    currentMode = nextMode;

    closeAllUserMenus();

    if (nextMode === "mobile") {
      buildMobile(nav, brand, currentPath);
    } else {
      buildDesktop(nav, brand, currentPath);
    }
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildNav, 120);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-auth") && !e.target.closest(".nav-mobile-user-wrap")) {
      closeAllUserMenus();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    ensureFakeAuthStyles();
    ensureAuthModal();
    rebuildNav();
  });
})();
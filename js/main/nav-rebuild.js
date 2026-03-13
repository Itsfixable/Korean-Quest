(function () {
  const MOBILE_BREAKPOINT = 640;
  const TABLET_BREAKPOINT = 1180;
  const FAKE_AUTH_KEY = "kq_fake_user";

  const LINKS = [
    ["index.html", "Home"],
    ["schedule.html", "Schedule"],
    ["resources.html", "Resources"],
    ["adventure.html", "Adventure"],
    ["dashboard.html", "Dashboard"],
    ["leaderboard.html", "Leaderboard"],
    ["about.html", "About"],
  ];

  const TABLET_PRIMARY_LINKS = new Set([
    "index.html",
    "resources.html",
    "adventure.html",
    "dashboard.html",
  ]);

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

  function ensureNavStyles() {
    if (document.getElementById("kq-nav-rebuild-styles")) return;

    const style = document.createElement("style");
    style.id = "kq-nav-rebuild-styles";
    style.textContent = `
      .site-header,
      .site-nav,
      .site-nav .brand,
      .nav-links-desktop,
      .nav-auth,
      .nav-user-wrap,
      .nav-more-wrap {
        overflow: visible !important;
      }

      .site-nav {
        display: grid !important;
        grid-template-columns: auto 1fr auto !important;
        align-items: center !important;
        column-gap: 16px !important;
        width: 100% !important;
        min-width: 0 !important;
      }

      .site-nav .brand {
        display: inline-flex !important;
        align-items: center !important;
        gap: 10px !important;
        white-space: nowrap !important;
        min-width: 0 !important;
        flex: 0 0 auto !important;
      }

      .nav-links-desktop,
      .nav-links-tablet {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        min-width: 0 !important;
        flex-wrap: nowrap !important;
      }

      .nav-links-desktop .pill,
      .nav-links-tablet .pill {
        white-space: nowrap !important;
        flex: 0 0 auto !important;
        font-family: "Nunito", sans-serif !important;
        font-weight: 700 !important;
        font-size: 0.88rem !important;
        padding: 8px 10px !important;
      }

      .nav-right-group {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 8px !important;
        min-width: 0 !important;
        flex: 0 0 auto !important;
      }

      .nav-auth {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 6px !important;
        white-space: nowrap !important;
        min-width: 0 !important;
        flex: 0 0 auto !important;
        position: relative !important;
      }

      .nav-auth .pill {
        white-space: nowrap !important;
        font-family: "Nunito", sans-serif !important;
        font-weight: 700 !important;
        font-size: 0.84rem !important;
        padding: 8px 6px !important;
      }

      .nav-auth-ghost {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        color: #111827 !important;
        padding: 8px 4px !important;
      }

      .nav-auth-ghost:hover {
        background: rgba(91, 114, 159, 0.08) !important;
      }

      .nav-auth-login-text-short {
        display: inline !important;
      }

      .nav-auth-login-text-long {
        display: none !important;
      }

      .nav-user-wrap,
      .nav-more-wrap {
        position: relative !important;
        overflow: visible !important;
      }

      .nav-user-trigger,
      .nav-more-trigger {
        border: none;
        background: transparent;
        color: #111827;
        font-family: "Nunito", sans-serif;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        padding: 8px 6px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .nav-user-trigger:hover,
      .nav-more-trigger:hover {
        background: rgba(91, 114, 159, 0.08);
      }

      .nav-user-caret,
      .nav-more-caret {
        font-size: 0.74rem;
        color: #5b729f;
      }

      .nav-user-menu,
      .nav-more-menu {
        display: none;
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 180px;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.14);
        padding: 8px;
        z-index: 9999;
      }

      .nav-user-wrap.open .nav-user-menu,
      .nav-more-wrap.open .nav-more-menu {
        display: block;
      }

      .nav-user-menu button,
      .nav-more-menu a,
      .nav-more-menu button {
        width: 100%;
        border: none;
        background: transparent;
        color: #111827;
        font-family: "Nunito", sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        text-align: left;
        padding: 10px 12px;
        border-radius: 12px;
        cursor: pointer;
        display: block;
        text-decoration: none;
      }

      .nav-user-menu button:hover,
      .nav-more-menu a:hover,
      .nav-more-menu button:hover {
        background: rgba(91, 114, 159, 0.10);
      }

      .nav-more-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.08);
        margin: 6px 0;
      }

      .kq-auth-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
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
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(0, 0, 0, 0.08);
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

      .nav-mobile-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
      }

      .nav-toggle {
        border: none;
        background: transparent;
        font-size: 1.4rem;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 10px;
      }

      .nav-toggle:hover {
        background: rgba(91, 114, 159, 0.08);
      }

      .nav-links {
        display: none;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        margin-top: 12px;
      }

      .nav-links.open {
        display: flex;
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

      .nav-mobile-user-wrap .nav-user-trigger,
      .nav-mobile-user-wrap .nav-more-trigger {
        width: 100%;
        justify-content: center;
        background: rgba(91, 114, 159, 0.08);
      }

      .nav-mobile-user-wrap .nav-user-menu,
      .nav-mobile-user-wrap .nav-more-menu {
        position: static;
        margin-top: 8px;
        box-shadow: none;
        border-radius: 14px;
      }

      @media (min-width: 1400px) {
        .nav-links-desktop .pill,
        .nav-links-tablet .pill {
          font-size: 0.9rem !important;
          padding: 8px 10px !important;
        }

        .nav-auth .pill,
        .nav-user-trigger,
        .nav-more-trigger {
          font-size: 0.88rem !important;
        }

        .nav-auth-login-text-long {
          display: inline !important;
        }

        .nav-auth-login-text-short {
          display: none !important;
        }
      }

      @media (max-width: ${TABLET_BREAKPOINT}px) and (min-width: ${MOBILE_BREAKPOINT + 1}px) {
        .site-nav {
          display: grid !important;
          grid-template-columns: auto 1fr auto !important;
          column-gap: 12px !important;
        }

        .nav-links-tablet .pill {
          font-size: 0.82rem !important;
          padding: 7px 8px !important;
        }

        .nav-auth .pill,
        .nav-user-trigger,
        .nav-more-trigger {
          font-size: 0.82rem !important;
          padding: 7px 5px !important;
        }
      }

      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        .site-nav {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          flex-wrap: wrap !important;
        }

        .nav-links-desktop,
        .nav-links-tablet,
        .nav-right-group {
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
    });

    overlay.hidden = true;
    rebuildNav();
  }

  function logoutFakeUser() {
    clearFakeUser();
    rebuildNav();
  }

  function closeAllUserMenus() {
    document.querySelectorAll(".nav-user-wrap, .nav-more-wrap, .nav-mobile-user-wrap").forEach((wrap) => {
      wrap.classList.remove("open");
    });

    document.querySelectorAll(".nav-user-trigger, .nav-more-trigger").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function attachPopupMenu(trigger, menu, wrapSelector) {
    const wrap = trigger.closest(wrapSelector);
    if (!wrap) return;

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const shouldOpen = !wrap.classList.contains("open");
      closeAllUserMenus();

      if (shouldOpen) {
        wrap.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      } else {
        wrap.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    menu.querySelector("[data-signout]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
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
      menu.innerHTML = `
        <button type="button" data-signout="true">Sign Out</button>
      `;

      userWrap.appendChild(trigger);
      userWrap.appendChild(menu);
      attachPopupMenu(trigger, menu, ".nav-user-wrap");

      wrap.appendChild(userWrap);
      return wrap;
    }

    const login = document.createElement("a");
    login.href = "#";
    login.className = "pill nav-auth-ghost";
    login.innerHTML = `
      <span class="nav-auth-login-text-long">Login / Sign Up</span>
      <span class="nav-auth-login-text-short">Login</span>
    `;

    login.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal();
    });

    wrap.appendChild(login);
    return wrap;
  }

  function buildMoreMenu(currentPath) {
    const moreWrap = document.createElement("div");
    moreWrap.className = "nav-more-wrap";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "nav-more-trigger";
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = `More <span class="nav-more-caret">▾</span>`;

    const menu = document.createElement("div");
    menu.className = "nav-more-menu";

    LINKS.filter(([href]) => !TABLET_PRIMARY_LINKS.has(href)).forEach(([href, label]) => {
      menu.appendChild(makeLink(href, label, currentPath));
    });

    menu.appendChild(document.createElement("div")).className = "nav-more-divider";

    const user = getFakeUser();
    if (user?.loggedIn) {
      const signOutBtn = document.createElement("button");
      signOutBtn.type = "button";
      signOutBtn.setAttribute("data-signout", "true");
      signOutBtn.textContent = `Sign Out (${user.name})`;
      menu.appendChild(signOutBtn);
    } else {
      const loginBtn = document.createElement("button");
      loginBtn.type = "button";
      loginBtn.textContent = "Login / Sign Up";
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openAuthModal();
        closeAllUserMenus();
      });
      menu.appendChild(loginBtn);
    }

    moreWrap.appendChild(trigger);
    moreWrap.appendChild(menu);
    attachPopupMenu(trigger, menu, ".nav-more-wrap");

    return moreWrap;
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

        const isOpen = userWrap.classList.contains("open");
        userWrap.classList.toggle("open", !isOpen);
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

    const rightGroup = document.createElement("div");
    rightGroup.className = "nav-right-group";
    rightGroup.appendChild(buildAuthDesktop());

    nav.appendChild(linksWrap);
    nav.appendChild(rightGroup);
  }

  function buildTablet(nav, brand, currentPath) {
    nav.innerHTML = "";
    nav.appendChild(brand);

    const linksWrap = document.createElement("div");
    linksWrap.className = "nav-links-tablet";

    LINKS.filter(([href]) => TABLET_PRIMARY_LINKS.has(href)).forEach(([href, label]) => {
      linksWrap.appendChild(makeLink(href, label, currentPath));
    });

    const rightGroup = document.createElement("div");
    rightGroup.className = "nav-right-group";
    rightGroup.appendChild(buildMoreMenu(currentPath));

    nav.appendChild(linksWrap);
    nav.appendChild(rightGroup);
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
    const width = window.innerWidth;

    closeAllUserMenus();

    if (width <= MOBILE_BREAKPOINT) {
      buildMobile(nav, brand, currentPath);
    } else if (width <= TABLET_BREAKPOINT) {
      buildTablet(nav, brand, currentPath);
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
    if (
      !e.target.closest(".nav-auth") &&
      !e.target.closest(".nav-mobile-user-wrap") &&
      !e.target.closest(".nav-user-wrap") &&
      !e.target.closest(".nav-more-wrap")
    ) {
      closeAllUserMenus();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    ensureNavStyles();
    ensureAuthModal();
    rebuildNav();
  });
})();
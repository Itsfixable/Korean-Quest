(function () {
  const MOBILE_BREAKPOINT = 640;
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

  function buildDesktop(nav, brand, currentPath) {
    nav.innerHTML = "";
    nav.appendChild(brand);

    const linksWrap = document.createElement("div");
    linksWrap.className = "nav-links-desktop";

    LINKS.forEach(([href, label]) => {
      linksWrap.appendChild(makeLink(href, label, currentPath));
    });

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

    nav.appendChild(topRow);
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

    if (nextMode === currentMode) return;
    currentMode = nextMode;

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

  document.addEventListener("DOMContentLoaded", rebuildNav);
})();
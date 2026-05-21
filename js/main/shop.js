import {
  getPlayer,
  needXP,
  on,
  getShopCatalog,
  getOwnedItemIds,
  getEquippedCosmetics,
  getEquippedProfile,
  purchaseShopItem,
  equipShopItem,
  unequipShopSlot,
} from "./state.js";

const FAKE_AUTH_KEY = "kq_fake_user";
const SHOP_PAGE_URL = "shop.html";

/* =========================================================
   SHOP IMAGE PATHS

   Active shop categories:
   1. Avatars
   2. Frames
   3. Backgrounds
   4. Pets

   Flairs and Titles have been removed.

   IMPORTANT:
   raw-images should contain transparent/no-background images.
   Current expected folders:
   - favicon/shop/raw-images/avatar/
   - favicon/shop/raw-images/pets/

   If your pet folder is actually named "bets", change:
   rawPetFolder: "favicon/shop/raw-images/pets"
   to:
   rawPetFolder: "favicon/shop/raw-images/bets"
========================================================= */

const SHOP_ASSETS = {
  banner: "favicon/shop/shopBanner.png",

  rawAvatarFolder: "favicon/shop/raw-images/avatar",
  rawPetFolder: "favicon/shop/raw-images/pets",

  icons: {
    owned: "favicon/shop/icons/owned.png",
    equipped: "favicon/shop/icons/equipped.png",
    earnCoins: "favicon/shop/icons/earnCoins.png",

    avatars: "favicon/shop/icons/avatar.png",
    frames: "favicon/shop/icons/frames.png",
    backgrounds: "favicon/shop/icons/bg.png",
    pets: "favicon/shop/icons/pets.png",
  },

  avatars: [
    "favicon/shop/avatars/avatar1.png",
    "favicon/shop/avatars/avatar2.png",
    "favicon/shop/avatars/avatar3.png",
    "favicon/shop/avatars/avatar4.png",
    "favicon/shop/avatars/avatar5.png",
    "favicon/shop/avatars/avatar6.png",
    "favicon/shop/avatars/avatar7.png",
    "favicon/shop/avatars/avatar8.png",
  ],

  rawAvatars: [
    "favicon/shop/raw-images/avatar/avatar1.png",
    "favicon/shop/raw-images/avatar/avatar2.png",
    "favicon/shop/raw-images/avatar/avatar3.png",
    "favicon/shop/raw-images/avatar/avatar4.png",
    "favicon/shop/raw-images/avatar/avatar5.png",
    "favicon/shop/raw-images/avatar/avatar6.png",
    "favicon/shop/raw-images/avatar/avatar7.png",
    "favicon/shop/raw-images/avatar/avatar8.png",
  ],

  frames: [
    "favicon/shop/frames/cloud-frame.png",
    "favicon/shop/frames/night-frame.png",
    "favicon/shop/frames/traditional-frame.png",
    "favicon/shop/frames/frame4.png",
  ],

  backgrounds: [
    "favicon/shop/backgrounds/night-bg.png",
    "favicon/shop/backgrounds/picnic-bg.png",
    "favicon/shop/backgrounds/sakura-bg.png",
    "favicon/shop/backgrounds/temple-bg.png",
  ],

  pets: [
    "favicon/shop/pets/bunny.png",
    "favicon/shop/pets/cat.png",
    "favicon/shop/pets/dog.png",
    "favicon/shop/pets/pet4.png",
    "favicon/shop/pets/pet5.png",
    "favicon/shop/pets/pet6.png",
  ],

  rawPets: [
    "favicon/shop/raw-images/pets/bunny.png",
    "favicon/shop/raw-images/pets/cat.png",
    "favicon/shop/raw-images/pets/dog.png",
    "favicon/shop/raw-images/pets/pet4.png",
    "favicon/shop/raw-images/pets/pet5.png",
    "favicon/shop/raw-images/pets/pet6.png",
  ],
};

/* =========================================================
   PROFILE CLICK CONTROLS

   This makes the top-left profile/user card act like a
   shortcut to shop.html.

   Add more selectors here if your nav-rebuild.js uses a
   different class/id for the profile card.
========================================================= */

const SHOP_PROFILE_LINK_SELECTORS = [
  "#kqNavUser",
  "#kqUserCard",
  "#kqSidebarUser",
  "#kqUserProfile",
  "#kqProfileCard",
  ".kq-nav-user",
  ".kq-sidebar-user",
  ".kq-user-card",
  ".kq-profile-card",
  ".kq-side-profile",
  ".nav-user-card",
  ".sidebar-user-card",
  ".user-profile-card",
  ".profile-card",
  "[data-profile-card]",
  "[data-user-card]",
];

/* =========================================================
   CATEGORY TAB CONTROLS

   This controls the top category selector:
   Avatars / Frames / Backgrounds / Pets
========================================================= */

const SHOP_TAB_CONSTRAINTS = {
  tabColumns: 4,
  tabGap: "22px",
  tabPadding: "16px 22px",
  tabBorderRadius: "24px",

  iconWidth: "70px",
  iconHeight: "70px",

  textSize: "1.05rem",
  activeScale: 1.04,
};

/* =========================================================
   FLOATING ITEM IMAGE CONTROLS

   This only affects images for items being sold in the shop.
   It does NOT affect tab icons, sidebar icons, profile icons,
   stat icons, or the banner.
========================================================= */

const SHOP_ITEM_FLOAT_CONSTRAINTS = {
  enabled: true,
  distance: "8px",
  duration: "3.8s",
  stagger: "0.18s",
};

/* =========================================================
   CARD SIZE / LAYOUT / MARGIN CONSTRAINTS

   Every section has full card controls.

   minHeight:
   - Full card height.

   padding:
   - Inside spacing of the full card.

   margin:
   - Outside spacing around each card.

   imageAreaHeight:
   - Height of the image section.

   imageAreaRadius:
   - Radius of image section.

   infoPadding:
   - Padding around name, rarity, price, equip buttons.
========================================================= */

const SHOP_CARD_CONSTRAINTS = {
  grid: {
    desktopColumns: 4,
    mediumColumns: 4,
    tabletColumns: 2,
    mobileColumns: 1,
    gap: "22px",
  },

  defaultCard: {
    minHeight: "330px",
    padding: "12px 12px 14px",
    margin: "0px",
    borderRadius: "26px",
    imageAreaHeight: "220px",
    imageAreaRadius: "22px",
    infoPadding: "0px 2px",
  },

  avatarCard: {
    minHeight: "430px",
    padding: "0px",
    margin: "0px",
    borderRadius: "26px",
    imageAreaHeight: "315px",
    imageAreaRadius: "26px 26px 0 0",
    infoPadding: "20px 14px 16px",
    gridTemplateRows: "315px auto",
  },

  frameCard: {
    minHeight: "360px",
    padding: "12px 12px 14px",
    margin: "0px",
    borderRadius: "26px",
    imageAreaHeight: "230px",
    imageAreaRadius: "22px",
    infoPadding: "0px 2px",
    gridTemplateRows: "1fr auto",
  },

  backgroundCard: {
    minHeight: "360px",
    padding: "12px 12px 14px",
    margin: "0px",
    borderRadius: "26px",
    imageAreaHeight: "230px",
    imageAreaRadius: "22px",
    infoPadding: "0px 2px",
    gridTemplateRows: "1fr auto",
  },

  petCard: {
    minHeight: "410px",
    padding: "12px 12px 14px",
    margin: "0px",
    borderRadius: "26px",
    imageAreaHeight: "350px",
    imageAreaRadius: "22px",
    infoPadding: "0px 2px",
    gridTemplateRows: "1fr auto",
  },
};

/* =========================================================
   IMAGE SIZE / POSITION CONSTRAINTS

   This controls the image inside each card.

   x / y:
   - Moves image left/right/up/down.

   scale:
   - Zooms in/out.

   objectFit:
   - contain = show whole image.
   - cover = fill area and crop.

   objectPosition:
   - Controls focus point.
========================================================= */

const SHOP_IMAGE_CONSTRAINTS = {
  avatars: [
    { width: "100%", height: "100%", x: "0px", y: "-50px", scale: 1.02, objectFit: "contain", objectPosition: "center top" },
    { width: "100%", height: "100%", x: "0px", y: "-60px", scale: 1.03, objectFit: "contain", objectPosition: "center top" },
    { width: "100%", height: "100%", x: "0px", y: "-50px", scale: 1.02, objectFit: "contain", objectPosition: "center top" },
    { width: "100%", height: "100%", x: "0px", y: "-50px", scale: 1.02, objectFit: "contain", objectPosition: "center top" },
    { width: "100%", height: "100%", x: "0px", y: "-50px", scale: 1.02, objectFit: "contain", objectPosition: "center top" },
    { width: "100%", height: "100%", x: "0px", y: "-30px", scale: 1.03, objectFit: "contain", objectPosition: "center top" },
    { width: "100%", height: "100%", x: "0px", y: "-40px", scale: 1.02, objectFit: "contain", objectPosition: "center top" },
    { width: "100%", height: "100%", x: "0px", y: "-50px", scale: 1.02, objectFit: "contain", objectPosition: "center top" },
  ],

  frames: [
    { width: "150%", height: "150%", x: "0px", y: "0px", scale: 1, objectFit: "contain", objectPosition: "center center" },
    { width: "150%", height: "150%", x: "0px", y: "0px", scale: 1, objectFit: "contain", objectPosition: "center center" },
    { width: "150%", height: "150%", x: "0px", y: "0px", scale: 1, objectFit: "contain", objectPosition: "center center" },
    { width: "150%", height: "150%", x: "0px", y: "0px", scale: 1, objectFit: "contain", objectPosition: "center center" },
  ],

  backgrounds: [
    { width: "150%", height: "100%", x: "30px", y: "0px", scale: 1, objectFit: "cover", objectPosition: "center center" },
    { width: "100%", height: "100%", x: "0px", y: "0px", scale: 1, objectFit: "cover", objectPosition: "center center" },
    { width: "100%", height: "100%", x: "0px", y: "0px", scale: 1, objectFit: "cover", objectPosition: "center center" },
    { width: "100%", height: "100%", x: "0px", y: "0px", scale: 1, objectFit: "cover", objectPosition: "center center" },
  ],

  pets: [
    { width: "220%", height: "150%", x: "-15px", y: "14px", scale: 1.35, objectFit: "contain", objectPosition: "center center" },
    { width: "250%", height: "200%", x: "10px", y: "0px", scale: 1.3, objectFit: "contain", objectPosition: "center center" },
    { width: "232%", height: "150%", x: "25px", y: "12px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
    { width: "148%", height: "148%", x: "0px", y: "12px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
    { width: "148%", height: "148%", x: "0px", y: "12px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
    { width: "148%", height: "148%", x: "0px", y: "12px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
  ],
};

/* =========================================================
   PROFILE PREVIEW LAYER CONTROLS

   This controls how the avatar/background/frame stack appears
   in the profile strip and in frame/background item previews.
========================================================= */

const PROFILE_LAYER_CONSTRAINTS = {
  avatar: {
    width: "82%",
    height: "82%",
    x: "0px",
    y: "8px",
    scale: 1,
    objectFit: "contain",
    objectPosition: "center bottom",
  },

  pet: {
    width: "46%",
    height: "46%",
    x: "20px",
    y: "18px",
    scale: 1,
    objectFit: "contain",
    objectPosition: "center bottom",
  },

  frame: {
    width: "100%",
    height: "100%",
    x: "0px",
    y: "0px",
    scale: 1,
    objectFit: "contain",
    objectPosition: "center center",
  },
};

const CATEGORIES = [
  ["avatars", "Avatars", SHOP_ASSETS.icons.avatars],
  ["frames", "Frames", SHOP_ASSETS.icons.frames],
  ["backgrounds", "Backgrounds", SHOP_ASSETS.icons.backgrounds],
  ["pets", "Pets", SHOP_ASSETS.icons.pets],
];

let activeCategory = "avatars";
let profileShortcutReady = false;

function $(sel) {
  return document.querySelector(sel);
}

function getFakeUser() {
  try {
    return JSON.parse(localStorage.getItem(FAKE_AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

function getInitials(name) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "KQ";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "KQ";
}

function saveFakeUser(user) {
  localStorage.setItem(FAKE_AUTH_KEY, JSON.stringify(user));
}

function setupProfileShortcut() {
  if (profileShortcutReady) return;
  profileShortcutReady = true;

  document.addEventListener("click", (event) => {
    const selector = SHOP_PROFILE_LINK_SELECTORS.join(",");
    const card = event.target.closest(selector);

    if (!card) return;

    const link = event.target.closest("a");
    const button = event.target.closest("button");

    if (link && link.getAttribute("href")) return;
    if (button && button.dataset?.category) return;

    window.location.href = SHOP_PAGE_URL;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const selector = SHOP_PROFILE_LINK_SELECTORS.join(",");
    const card = event.target.closest(selector);

    if (!card) return;

    event.preventDefault();
    window.location.href = SHOP_PAGE_URL;
  });
}

function syncSelectedAvatarWithFakeUser(profile) {
  const user = getFakeUser();
  if (!user) return;

  const avatar = getEquippedVisualItem("avatars", profile?.avatar?.id);

  if (avatar?.rawImage || avatar?.image) {
    const newImage = avatar.rawImage || avatar.image;

    if (user.avatarImage !== newImage) {
      user.avatarImage = newImage;
      saveFakeUser(user);
      window.dispatchEvent(new Event("kq:fake-user-updated"));
    }
  } else if (user.avatarImage) {
    delete user.avatarImage;
    saveFakeUser(user);
    window.dispatchEvent(new Event("kq:fake-user-updated"));
  }
}

function getRarity(item) {
  return String(item?.rarity || "Common").trim();
}

function getRarityClass(item) {
  return getRarity(item).toLowerCase().replace(/\s+/g, "-");
}

function getCategoryLabel() {
  return CATEGORIES.find(([id]) => id === activeCategory)?.[1] || "Shop";
}

function getCategoryIcon() {
  return CATEGORIES.find(([id]) => id === activeCategory)?.[2] || SHOP_ASSETS.icons.avatars;
}

function getCategoryAssets(category) {
  if (category === "avatars") return SHOP_ASSETS.avatars;
  if (category === "frames") return SHOP_ASSETS.frames;
  if (category === "backgrounds") return SHOP_ASSETS.backgrounds;
  if (category === "pets") return SHOP_ASSETS.pets;
  return [];
}

function getCategoryRawAssets(category) {
  if (category === "avatars") return SHOP_ASSETS.rawAvatars;
  if (category === "pets") return SHOP_ASSETS.rawPets;
  return [];
}

function getCategoryConstraints(category) {
  if (category === "avatars") return SHOP_IMAGE_CONSTRAINTS.avatars;
  if (category === "frames") return SHOP_IMAGE_CONSTRAINTS.frames;
  if (category === "backgrounds") return SHOP_IMAGE_CONSTRAINTS.backgrounds;
  if (category === "pets") return SHOP_IMAGE_CONSTRAINTS.pets;
  return [];
}

function addImagesToItems(items, category) {
  const imageList = getCategoryAssets(category);
  const rawImageList = getCategoryRawAssets(category);
  const constraintsList = getCategoryConstraints(category);

  return items.map((item, index) => ({
    ...item,
    image: imageList[index] || item.image || "",
    rawImage: rawImageList[index] || imageList[index] || item.image || "",
    imageSettings: constraintsList[index] || null,
  }));
}

function getEquippedVisualItem(category, itemId) {
  const catalog = getShopCatalog(category) || [];
  const visualCatalog = addImagesToItems(catalog, category);

  if (itemId) {
    const found = visualCatalog.find((item) => item.id === itemId);
    if (found) return found;
  }

  return visualCatalog[0] || null;
}

function getProfileVisuals(profile) {
  return {
    avatar: getEquippedVisualItem("avatars", profile?.avatar?.id),
    frame: getEquippedVisualItem("frames", profile?.frame?.id),
    background: getEquippedVisualItem("backgrounds", profile?.background?.id),
    pet: getEquippedVisualItem("pets", profile?.pet?.id),
  };
}

function imageSettingsToStyle(settings) {
  if (!settings) return "";

  const width = settings.width || "100%";
  const height = settings.height || "100%";
  const x = settings.x || "0px";
  const y = settings.y || "0px";
  const scale = settings.scale || 1;
  const objectFit = settings.objectFit || "contain";
  const objectPosition = settings.objectPosition || "center center";

  return `
    width: ${width};
    height: ${height};
    object-fit: ${objectFit};
    object-position: ${objectPosition};
    transform: translate(${x}, ${y}) scale(${scale});
  `;
}

function getFloatDelay(index) {
  const stagger = parseFloat(SHOP_ITEM_FLOAT_CONSTRAINTS.stagger) || 0;
  return `${index * stagger}s`;
}

function renderFloatingShell(innerHtml, index) {
  const floatingClass = SHOP_ITEM_FLOAT_CONSTRAINTS.enabled ? "is-floating" : "";

  return `
    <div
      class="kq-shop-float ${floatingClass}"
      style="
        --kq-item-float-distance: ${SHOP_ITEM_FLOAT_CONSTRAINTS.distance};
        --kq-item-float-duration: ${SHOP_ITEM_FLOAT_CONSTRAINTS.duration};
        --kq-item-float-delay: ${getFloatDelay(index)};
      "
    >
      ${innerHtml}
    </div>
  `;
}

function renderPlainImage(item, index, extraClass = "") {
  if (!item?.image) {
    return renderFloatingShell(
      `
        <div class="kq-shop-placeholder ${extraClass}" aria-hidden="true">
          <span>IMAGE HERE</span>
        </div>
      `,
      index,
    );
  }

  return renderFloatingShell(
    `
      <!-- IMAGE HERE: ${item.name} -->
      <img
        src="${item.rawImage || item.image}"
        data-fallback-src="${item.image}"
        alt="${item.name}"
        class="kq-shop-art ${extraClass}"
        style="${imageSettingsToStyle(item.imageSettings)}"
      />
    `,
    index,
  );
}

function renderCompositeProfile(profile, options = {}) {
  const visuals = getProfileVisuals(profile);
  const avatar = options.avatar || visuals.avatar;
  const frame = options.frame || visuals.frame;
  const background = options.background || visuals.background;
  const pet = options.pet || null;

  const avatarSrc = avatar?.rawImage || avatar?.image || "";
  const frameSrc = frame?.image || "";
  const backgroundSrc = background?.image || "";
  const petSrc = pet?.rawImage || pet?.image || "";

  return `
    <div class="kq-profile-stack">
      ${backgroundSrc ? `
        <img
          src="${backgroundSrc}"
          alt=""
          class="kq-profile-layer kq-profile-bg"
        />
      ` : ""}

      ${avatarSrc ? `
        <img
          src="${avatarSrc}"
          data-fallback-src="${avatar?.image || avatarSrc}"
          alt=""
          class="kq-profile-layer kq-profile-avatar-layer"
          style="${imageSettingsToStyle(PROFILE_LAYER_CONSTRAINTS.avatar)}"
        />
      ` : ""}

      ${petSrc ? `
        <img
          src="${petSrc}"
          data-fallback-src="${pet?.image || petSrc}"
          alt=""
          class="kq-profile-layer kq-profile-pet-layer"
          style="${imageSettingsToStyle(PROFILE_LAYER_CONSTRAINTS.pet)}"
        />
      ` : ""}

      ${frameSrc ? `
        <img
          src="${frameSrc}"
          alt=""
          class="kq-profile-layer kq-profile-frame-layer"
          style="${imageSettingsToStyle(PROFILE_LAYER_CONSTRAINTS.frame)}"
        />
      ` : ""}
    </div>
  `;
}

function renderItemVisual(item, category, index, profile) {
  if (category === "frames") {
    return renderFloatingShell(
      renderCompositeProfile(profile, { frame: item }),
      index,
    );
  }

  if (category === "backgrounds") {
    return renderFloatingShell(
      renderCompositeProfile(profile, { background: item }),
      index,
    );
  }

  if (category === "avatars") {
    return renderPlainImage(item, index);
  }

  if (category === "pets") {
    return renderPlainImage(item, index);
  }

  return renderPlainImage(item, index);
}

function ensureStyles() {
  if (document.getElementById("kq-shop-page-styles")) return;

  const style = document.createElement("style");
  style.id = "kq-shop-page-styles";
  style.textContent = `
    :root {
      --kq-shop-blue: #687dca;
      --kq-shop-blue-dark: #5466b5;
      --kq-shop-ink: #202b45;
      --kq-shop-muted: #66718d;
      --kq-shop-line: rgba(32, 43, 69, 0.09);
      --kq-shop-card: rgba(255, 255, 255, 0.94);
      --kq-shop-soft: #f8fbff;
      --kq-shop-green: #62b879;
      --kq-shop-purple: #8865d8;
      --kq-shop-orange: #f0a43c;
      --kq-shop-shadow: 0 18px 45px rgba(42, 59, 112, 0.08);
      --kq-shop-small-shadow: 0 10px 26px rgba(42, 59, 112, 0.07);
    }

    ${SHOP_PROFILE_LINK_SELECTORS.join(", ")} {
      cursor: pointer;
    }

    body {
      background:
        radial-gradient(circle at 18% 8%, rgba(255, 214, 226, 0.45), transparent 26%),
        radial-gradient(circle at 80% 0%, rgba(205, 230, 255, 0.45), transparent 32%),
        linear-gradient(180deg, #f7fbff 0%, #eef7ff 42%, #f8fbf0 100%);
    }

    .kq-shop-page {
      max-width: 1240px;
      margin: 0 auto;
      display: grid;
      gap: 18px;
      padding: 12px;
      color: var(--kq-shop-ink);
    }

    .kq-shop-panel,
    .kq-shop-bottom-card {
      background: var(--kq-shop-card);
      border: 1px solid var(--kq-shop-line);
      border-radius: 28px;
      box-shadow: var(--kq-shop-shadow);
      backdrop-filter: blur(10px);
    }

    .kq-shop-banner {
      width: 100%;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 14px 32px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.08);
      background: #ffffff;
    }

    .kq-shop-banner img {
      width: 100%;
      display: block;
      object-fit: cover;
    }

    .kq-shop-panel {
      padding: 16px;
    }

    .kq-shop-profile-strip {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 14px;
      align-items: center;
    }

    .kq-shop-user {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .kq-shop-user-avatar {
      width: 62px;
      height: 62px;
      border-radius: 23px;
      overflow: hidden;
      flex: 0 0 62px;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #6d84d4 0%, #5265b5 100%);
      color: #fff;
      font-size: 1.05rem;
      font-weight: 950;
      box-shadow: 0 8px 20px rgba(91, 114, 159, 0.18);
      position: relative;
    }

    .kq-shop-user-copy {
      min-width: 0;
    }

    .kq-shop-user-copy h2 {
      margin: 0 0 5px;
      font-size: 1.18rem;
      line-height: 1.2;
      font-weight: 950;
    }

    .kq-shop-user-copy p {
      margin: 0;
      color: var(--kq-shop-muted);
      font-weight: 850;
      font-size: 0.85rem;
    }

    .kq-stat-box {
      min-width: 122px;
      min-height: 64px;
      border-radius: 22px;
      padding: 10px 13px;
      background: #ffffff;
      border: 1px solid rgba(32, 43, 69, 0.07);
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 8px 20px rgba(42, 59, 112, 0.045);
    }

    .kq-stat-icon {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    .kq-stat-box span {
      display: block;
      color: var(--kq-shop-muted);
      font-size: 0.76rem;
      font-weight: 850;
    }

    .kq-stat-box strong {
      display: block;
      color: var(--kq-shop-ink);
      font-size: 1.1rem;
      font-weight: 950;
    }

    .kq-shop-progress-shell {
      display: grid;
      grid-template-columns: 140px minmax(0, 1fr) auto auto;
      gap: 14px;
      align-items: center;
      padding: 14px;
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(234,241,255,0.95), rgba(244,247,255,0.98));
      border: 1px solid rgba(0,0,0,0.06);
    }

    .kq-lvl-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 54px;
      border-radius: 18px;
      background: linear-gradient(180deg, #6d84b7 0%, #5971a1 100%);
      color: #fff;
      font-size: 1.2rem;
      font-weight: 950;
      box-shadow: 0 8px 18px rgba(91,114,159,0.18);
    }

    .kq-xp-bar {
      height: 30px;
      border-radius: 999px;
      background: rgba(91,114,159,0.15);
      overflow: hidden;
      position: relative;
    }

    .kq-xp-bar > span {
      display: block;
      height: 100%;
      width: 0%;
      border-radius: inherit;
      background: linear-gradient(90deg, #7f95c4, #5c73a5);
      transition: width 700ms ease;
    }

    .kq-xp-text {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-weight: 950;
      color: #233554;
    }

    .kq-shop-count {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 1.45rem;
      font-weight: 950;
      color: #243552;
    }

    .kq-shop-tabs {
      display: grid;
      grid-template-columns: repeat(${SHOP_TAB_CONSTRAINTS.tabColumns}, minmax(0, 1fr));
      gap: ${SHOP_TAB_CONSTRAINTS.tabGap};
    }

    .kq-shop-tab {
      border: none;
      border-radius: ${SHOP_TAB_CONSTRAINTS.tabBorderRadius};
      padding: ${SHOP_TAB_CONSTRAINTS.tabPadding};
      font: inherit;
      font-size: ${SHOP_TAB_CONSTRAINTS.textSize};
      font-weight: 950;
      cursor: pointer;
      background: rgba(255,255,255,0.78);
      color: #50607d;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition:
        transform 240ms cubic-bezier(0.2, 1.2, 0.25, 1),
        box-shadow 240ms ease,
        background 240ms ease,
        color 240ms ease;
    }

    .kq-shop-tab img {
      width: ${SHOP_TAB_CONSTRAINTS.iconWidth};
      height: ${SHOP_TAB_CONSTRAINTS.iconHeight};
      object-fit: contain;
      flex: 0 0 auto;
    }

    .kq-shop-tab:hover {
      transform: translateY(-2px);
      box-shadow: var(--kq-shop-small-shadow);
    }

    .kq-shop-tab.is-active {
      background: linear-gradient(180deg, #7185d5 0%, #5869bd 100%);
      color: #fff;
      box-shadow: 0 12px 24px rgba(88, 105, 189, 0.22);
      transform: scale(${SHOP_TAB_CONSTRAINTS.activeScale});
    }

    .kq-shop-list-panel {
      padding: 22px;
      display: grid;
      gap: 20px;
    }

    .kq-shop-section-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 18px;
      flex-wrap: wrap;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(32, 43, 69, 0.07);
    }

    .kq-shop-section-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .kq-shop-section-title img {
      width: 34px;
      height: 34px;
      object-fit: contain;
    }

    .kq-shop-section-title h2 {
      margin: 0;
      font-size: 1.42rem;
      line-height: 1.1;
      font-weight: 950;
      color: var(--kq-shop-ink);
    }

    .kq-shop-section-title p {
      margin: 5px 0 0;
      color: var(--kq-shop-muted);
      font-size: 0.9rem;
      font-weight: 850;
    }

    .kq-collected-count {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #a15e67;
      font-weight: 950;
      font-size: 0.9rem;
    }

    .kq-shop-grid {
      display: grid;
      grid-template-columns: repeat(${SHOP_CARD_CONSTRAINTS.grid.desktopColumns}, minmax(0, 1fr));
      gap: ${SHOP_CARD_CONSTRAINTS.grid.gap};
    }

    .kq-shop-item {
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,244,0.98));
      border: 1px solid rgba(32, 43, 69, 0.08);
      border-radius: ${SHOP_CARD_CONSTRAINTS.defaultCard.borderRadius};
      min-height: ${SHOP_CARD_CONSTRAINTS.defaultCard.minHeight};
      padding: ${SHOP_CARD_CONSTRAINTS.defaultCard.padding};
      margin: ${SHOP_CARD_CONSTRAINTS.defaultCard.margin};
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 10px;
      box-shadow: 0 12px 26px rgba(42, 59, 112, 0.07);
      position: relative;
      overflow: hidden;
      transition:
        transform 260ms cubic-bezier(0.2, 1.2, 0.25, 1),
        box-shadow 260ms ease,
        border-color 260ms ease,
        background 260ms ease;
    }

    .kq-shop-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 18px 34px rgba(42, 59, 112, 0.11);
    }

    .kq-shop-item.is-selected {
      transform: scale(1.025);
      border-color: rgba(98, 184, 121, 0.78);
      box-shadow:
        0 18px 36px rgba(98, 184, 121, 0.18),
        0 0 0 4px rgba(98, 184, 121, 0.12);
      z-index: 2;
    }

    .kq-shop-item.is-selected:hover {
      transform: scale(1.035) translateY(-3px);
    }

    .kq-shop-item.is-selected::before {
      content: "Selected";
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 5;
      padding: 6px 10px;
      border-radius: 999px;
      background: linear-gradient(180deg, #6d84b7, #5971a1);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 950;
      box-shadow: 0 6px 14px rgba(91,114,159,0.22);
    }

    .kq-shop-image-zone {
      position: relative;
      min-height: ${SHOP_CARD_CONSTRAINTS.defaultCard.imageAreaHeight};
      height: ${SHOP_CARD_CONSTRAINTS.defaultCard.imageAreaHeight};
      border-radius: ${SHOP_CARD_CONSTRAINTS.defaultCard.imageAreaRadius};
      display: grid;
      place-items: center;
      overflow: hidden;
      background:
        radial-gradient(circle at 22% 24%, rgba(255, 210, 219, 0.48), transparent 13%),
        radial-gradient(circle at 85% 15%, rgba(255, 226, 177, 0.35), transparent 12%),
        linear-gradient(180deg, #fbfdff 0%, #fff6ee 100%);
      border: 1px solid rgba(104, 125, 202, 0.11);
    }

    .kq-shop-image-zone::before,
    .kq-shop-image-zone::after {
      content: "✿";
      position: absolute;
      color: rgba(238, 157, 170, 0.4);
      font-size: 1.05rem;
      animation: kqShopFloat 3.8s ease-in-out infinite;
    }

    .kq-shop-image-zone::before {
      top: 18px;
      left: 18px;
    }

    .kq-shop-image-zone::after {
      top: 32px;
      right: 22px;
      animation-delay: -1.4s;
    }

    .kq-shop-float {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      position: relative;
      z-index: 2;
    }

    .kq-shop-float.is-floating {
      animation:
        kqShopItemFloat var(--kq-item-float-duration)
        ease-in-out
        var(--kq-item-float-delay)
        infinite;
    }

    .kq-shop-art {
      max-width: none;
      max-height: none;
      display: block;
      align-self: center;
      justify-self: center;
      filter: drop-shadow(0 12px 12px rgba(41, 55, 95, 0.12));
      transition: filter 260ms ease;
      position: relative;
      z-index: 2;
    }

    .kq-profile-stack {
      width: 100%;
      height: 100%;
      position: relative;
      display: grid;
      place-items: center;
      overflow: hidden;
      border-radius: inherit;
    }

    .kq-profile-layer {
      position: absolute;
      display: block;
      pointer-events: none;
    }

    .kq-profile-bg {
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }

    .kq-profile-avatar-layer {
      z-index: 2;
      filter: drop-shadow(0 10px 12px rgba(41, 55, 95, 0.12));
    }

    .kq-profile-pet-layer {
      z-index: 3;
      filter: drop-shadow(0 8px 9px rgba(41, 55, 95, 0.14));
    }

    .kq-profile-frame-layer {
      z-index: 4;
    }

    .kq-shop-user-avatar .kq-profile-stack {
      width: 100%;
      height: 100%;
      border-radius: 23px;
    }

    .kq-shop-placeholder {
      width: 78%;
      height: 78%;
      min-height: 145px;
      display: grid;
      place-items: center;
      border-radius: 22px;
      background: repeating-linear-gradient(
        45deg,
        #e9edf6,
        #e9edf6 10px,
        #d9dfed 10px,
        #d9dfed 20px
      );
      color: #5b729f;
      font-weight: 950;
      font-size: 0.82rem;
      letter-spacing: 0.06em;
      border: 2px dashed rgba(91,114,159,0.32);
      text-align: center;
      padding: 10px;
      position: relative;
      z-index: 2;
    }

    .kq-shop-info {
      display: grid;
      gap: 8px;
      padding: ${SHOP_CARD_CONSTRAINTS.defaultCard.infoPadding};
    }

    .kq-shop-item h3 {
      margin: 0;
      color: var(--kq-shop-ink);
      font-size: 0.98rem;
      line-height: 1.15;
      text-align: center;
      font-weight: 950;
    }

    .kq-shop-rarity {
      text-align: center;
      font-size: 0.77rem;
      font-weight: 950;
      margin-top: -2px;
    }

    .kq-rarity-common { color: #627095; }
    .kq-rarity-rare { color: #4866d8; }
    .kq-rarity-epic { color: #8656d6; }
    .kq-rarity-starter { color: #4d9a61; }
    .kq-rarity-legendary { color: #dd8a28; }

    .kq-shop-buy-row {
      display: grid;
      gap: 8px;
      margin-top: 2px;
    }

    .kq-shop-price-btn,
    .kq-shop-equip-btn {
      width: 100%;
      border: none;
      border-radius: 14px;
      min-height: 43px;
      padding: 10px 12px;
      font: inherit;
      font-size: 0.88rem;
      font-weight: 950;
      cursor: pointer;
      transition:
        transform 220ms cubic-bezier(0.2, 1.2, 0.25, 1),
        box-shadow 220ms ease,
        background 220ms ease,
        color 220ms ease;
    }

    .kq-shop-price-btn:hover,
    .kq-shop-equip-btn:hover {
      transform: translateY(-1px) scale(1.015);
    }

    .kq-shop-price-btn {
      background: linear-gradient(180deg, #6f82d4 0%, #5869bd 100%);
      color: #fff;
      box-shadow: 0 9px 18px rgba(88, 105, 189, 0.2);
    }

    .kq-shop-price-btn.is-rare {
      background: linear-gradient(180deg, #6f82d4 0%, #5869bd 100%);
    }

    .kq-shop-price-btn.is-epic {
      background: linear-gradient(180deg, #9b70e8 0%, #7e55d4 100%);
    }

    .kq-shop-price-btn.is-legendary {
      background: linear-gradient(180deg, #f6b24e 0%, #e48f2e 100%);
    }

    .kq-shop-price-btn.is-owned {
      background: rgba(104, 125, 202, 0.1);
      color: #5b6fbf;
      box-shadow: none;
    }

    .kq-shop-equip-btn {
      background: rgba(247, 249, 255, 0.96);
      color: #334466;
      border: 1px solid rgba(104, 125, 202, 0.16);
    }

    .kq-shop-equip-btn.is-equipped {
      background: #62b879;
      color: #ffffff;
      border-color: rgba(77, 154, 97, 0.25);
      box-shadow: 0 9px 18px rgba(98, 184, 121, 0.22);
    }

    .kq-shop-lock-card {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.62), rgba(238,244,250,0.92));
      filter: grayscale(0.15);
    }

    .kq-shop-lock-card .kq-shop-image-zone {
      background: rgba(255,255,255,0.4);
      border-color: rgba(32, 43, 69, 0.05);
    }

    .kq-coming-soon-lock {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.84);
      color: #99a1b5;
      font-size: 2rem;
      box-shadow: 0 12px 24px rgba(42, 59, 112, 0.08);
      z-index: 2;
      position: relative;
    }

    .kq-shop-bottom-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      padding: 18px 22px;
      background:
        radial-gradient(circle at 5% 30%, rgba(255, 204, 214, 0.33), transparent 18%),
        rgba(255, 255, 255, 0.92);
    }

    .kq-shop-bottom-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .kq-shop-bottom-left img {
      width: 54px;
      height: 54px;
      object-fit: contain;
    }

    .kq-shop-bottom-card h3 {
      margin: 0 0 4px;
      font-size: 1rem;
      font-weight: 950;
    }

    .kq-shop-bottom-card p {
      margin: 0;
      color: var(--kq-shop-muted);
      font-size: 0.86rem;
      font-weight: 850;
    }

    .kq-shop-dashboard-link {
      border: none;
      border-radius: 18px;
      padding: 13px 18px;
      background: #fff8ec;
      color: #536080;
      font: inherit;
      font-size: 0.86rem;
      font-weight: 950;
      cursor: pointer;
      box-shadow: 0 8px 18px rgba(42, 59, 112, 0.06);
    }

    .kq-equip-chip {
      display: none;
    }

    .kq-avatar-card {
      padding: ${SHOP_CARD_CONSTRAINTS.avatarCard.padding};
      margin: ${SHOP_CARD_CONSTRAINTS.avatarCard.margin};
      border-radius: ${SHOP_CARD_CONSTRAINTS.avatarCard.borderRadius};
      min-height: ${SHOP_CARD_CONSTRAINTS.avatarCard.minHeight};
      grid-template-rows: ${SHOP_CARD_CONSTRAINTS.avatarCard.gridTemplateRows};
      gap: 0;
    }

    .kq-avatar-card .kq-shop-image-zone {
      min-height: ${SHOP_CARD_CONSTRAINTS.avatarCard.imageAreaHeight};
      height: ${SHOP_CARD_CONSTRAINTS.avatarCard.imageAreaHeight};
      border: none;
      border-radius: ${SHOP_CARD_CONSTRAINTS.avatarCard.imageAreaRadius};
      overflow: hidden;
      place-items: center;
    }

    .kq-avatar-card .kq-shop-info {
      padding: ${SHOP_CARD_CONSTRAINTS.avatarCard.infoPadding};
      background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,250,244,0.98));
      border-top: 1px solid rgba(32, 43, 69, 0.06);
    }

    .kq-frame-card {
      padding: ${SHOP_CARD_CONSTRAINTS.frameCard.padding};
      margin: ${SHOP_CARD_CONSTRAINTS.frameCard.margin};
      border-radius: ${SHOP_CARD_CONSTRAINTS.frameCard.borderRadius};
      min-height: ${SHOP_CARD_CONSTRAINTS.frameCard.minHeight};
      grid-template-rows: ${SHOP_CARD_CONSTRAINTS.frameCard.gridTemplateRows};
    }

    .kq-frame-card .kq-shop-image-zone {
      min-height: ${SHOP_CARD_CONSTRAINTS.frameCard.imageAreaHeight};
      height: ${SHOP_CARD_CONSTRAINTS.frameCard.imageAreaHeight};
      border-radius: ${SHOP_CARD_CONSTRAINTS.frameCard.imageAreaRadius};
    }

    .kq-frame-card .kq-shop-info {
      padding: ${SHOP_CARD_CONSTRAINTS.frameCard.infoPadding};
    }

    .kq-background-card {
      padding: ${SHOP_CARD_CONSTRAINTS.backgroundCard.padding};
      margin: ${SHOP_CARD_CONSTRAINTS.backgroundCard.margin};
      border-radius: ${SHOP_CARD_CONSTRAINTS.backgroundCard.borderRadius};
      min-height: ${SHOP_CARD_CONSTRAINTS.backgroundCard.minHeight};
      grid-template-rows: ${SHOP_CARD_CONSTRAINTS.backgroundCard.gridTemplateRows};
    }

    .kq-background-card .kq-shop-image-zone {
      min-height: ${SHOP_CARD_CONSTRAINTS.backgroundCard.imageAreaHeight};
      height: ${SHOP_CARD_CONSTRAINTS.backgroundCard.imageAreaHeight};
      border-radius: ${SHOP_CARD_CONSTRAINTS.backgroundCard.imageAreaRadius};
      background: #ffffff;
    }

    .kq-background-card .kq-shop-info {
      padding: ${SHOP_CARD_CONSTRAINTS.backgroundCard.infoPadding};
    }

    .kq-pet-card {
      padding: ${SHOP_CARD_CONSTRAINTS.petCard.padding};
      margin: ${SHOP_CARD_CONSTRAINTS.petCard.margin};
      border-radius: ${SHOP_CARD_CONSTRAINTS.petCard.borderRadius};
      min-height: ${SHOP_CARD_CONSTRAINTS.petCard.minHeight};
      grid-template-rows: ${SHOP_CARD_CONSTRAINTS.petCard.gridTemplateRows};
    }

    .kq-pet-card .kq-shop-image-zone {
      min-height: ${SHOP_CARD_CONSTRAINTS.petCard.imageAreaHeight};
      height: ${SHOP_CARD_CONSTRAINTS.petCard.imageAreaHeight};
      border-radius: ${SHOP_CARD_CONSTRAINTS.petCard.imageAreaRadius};
    }

    .kq-pet-card .kq-shop-info {
      padding: ${SHOP_CARD_CONSTRAINTS.petCard.infoPadding};
    }

    .kq-avatar-card:hover .kq-shop-art,
    .kq-frame-card:hover .kq-shop-art,
    .kq-background-card:hover .kq-shop-art,
    .kq-pet-card:hover .kq-shop-art {
      filter: drop-shadow(0 14px 14px rgba(41, 55, 95, 0.16));
    }

    @keyframes kqShopFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    @keyframes kqShopItemFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(calc(-1 * var(--kq-item-float-distance)));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .kq-shop-image-zone::before,
      .kq-shop-image-zone::after,
      .kq-shop-float.is-floating {
        animation: none;
      }

      .kq-shop-art,
      .kq-shop-item,
      .kq-shop-tab,
      .kq-shop-price-btn,
      .kq-shop-equip-btn {
        transition: none;
      }
    }

    @media (max-width: 1080px) {
      .kq-shop-progress-shell {
        grid-template-columns: 1fr;
      }

      .kq-shop-grid {
        grid-template-columns: repeat(${SHOP_CARD_CONSTRAINTS.grid.mediumColumns}, minmax(0, 1fr));
      }
    }

    @media (max-width: 900px) {
      .kq-shop-profile-strip {
        grid-template-columns: 1fr 1fr;
      }

      .kq-shop-user {
        grid-column: 1 / -1;
      }

      .kq-shop-tabs {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .kq-shop-grid {
        grid-template-columns: repeat(${SHOP_CARD_CONSTRAINTS.grid.tabletColumns}, minmax(0, 1fr));
      }
    }

    @media (max-width: 620px) {
      .kq-shop-page {
        padding: 6px;
      }

      .kq-shop-profile-strip {
        grid-template-columns: 1fr;
      }

      .kq-stat-box {
        min-width: 0;
      }

      .kq-shop-tabs {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .kq-shop-list-panel {
        padding: 16px;
      }

      .kq-shop-grid {
        grid-template-columns: repeat(${SHOP_CARD_CONSTRAINTS.grid.mobileColumns}, minmax(0, 1fr));
      }

      .kq-shop-bottom-card {
        align-items: flex-start;
        flex-direction: column;
      }

      .kq-shop-dashboard-link {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureShell() {
  let main = document.querySelector("main");
  if (!main) main = document.body;

  let shell = document.getElementById("kqShopPage");
  if (shell) return shell;

  shell = document.createElement("section");
  shell.id = "kqShopPage";
  shell.className = "kq-shop-page";
  shell.innerHTML = `
    <section class="kq-shop-banner" aria-label="Shop banner">
      <img src="${SHOP_ASSETS.banner}" alt="Shop — spend coins, customize your profile, and unlock rewards" />
    </section>

    <section class="kq-shop-panel">
      <div class="kq-shop-profile-strip">
        <div class="kq-shop-user" id="kqShopUser"></div>

        <div class="kq-stat-box">
          <img class="kq-stat-icon" src="${SHOP_ASSETS.icons.owned}" alt="" />
          <div>
            <span>Owned</span>
            <strong id="kqOwnedCount">0</strong>
          </div>
        </div>

        <div class="kq-stat-box">
          <img class="kq-stat-icon" src="${SHOP_ASSETS.icons.equipped}" alt="" />
          <div>
            <span>Equipped</span>
            <strong id="kqEquippedCount">0</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="kq-shop-panel">
      <div class="kq-shop-progress-shell">
        <div class="kq-lvl-chip" id="kqLevelChip">Level 1</div>

        <div class="kq-xp-bar" aria-hidden="true">
          <span id="kqXpBarFill"></span>
          <div class="kq-xp-text" id="kqXpText">0 / 100 XP</div>
        </div>

        <div class="kq-shop-count" id="kqCoinCount">🪙 0</div>
        <div class="kq-shop-count" id="kqBadgeCount">🏅 0</div>
      </div>
    </section>

    <section class="kq-shop-panel">
      <div id="kqShopTabs" class="kq-shop-tabs"></div>
    </section>

    <section class="kq-shop-panel kq-shop-list-panel">
      <div class="kq-shop-section-head">
        <div class="kq-shop-section-title">
          <img id="kqSectionIcon" src="${SHOP_ASSETS.icons.avatars}" alt="" />
          <div>
            <h2 id="kqSectionTitle">Avatars</h2>
            <p id="kqSectionDesc">Choose an avatar to represent your journey.</p>
          </div>
        </div>

        <div class="kq-collected-count" id="kqCollectedCount">🌸 0 / 0 Collected</div>
      </div>

      <section class="kq-shop-grid kq-stagger" id="kqShopGrid"></section>
    </section>

    <section class="kq-shop-bottom-card">
      <div class="kq-shop-bottom-left">
        <img src="${SHOP_ASSETS.icons.earnCoins}" alt="" />
        <div>
          <h3>How do I earn coins?</h3>
          <p>Earn coins by completing lessons, daily quests, battles, and special events!</p>
        </div>
      </div>

      <button class="kq-shop-dashboard-link" type="button" id="kqDashboardLink">
        Go to Dashboard →
      </button>
    </section>
  `;

  main.innerHTML = "";
  main.appendChild(shell);

  const dashBtn = document.getElementById("kqDashboardLink");
  if (dashBtn) {
    dashBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  shell.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;

    const fallback = img.dataset.fallbackSrc;
    if (fallback && img.src !== fallback) {
      img.src = fallback;
    }
  }, true);

  return shell;
}

function getUserAvatarHtml(username, profile) {
  const user = getFakeUser();
  const profileStack = renderCompositeProfile(profile);
  const avatarInitials = getInitials(username);

  if (profileStack.trim()) {
    return profileStack;
  }

  if (user?.avatarImage) {
    return `<img src="${user.avatarImage}" alt="${username} profile picture" />`;
  }

  return `<span>${avatarInitials}</span>`;
}

function renderUserBlock(profile) {
  const user = getFakeUser();
  const username = user?.loggedIn ? user.name : "Guest Learner";
  syncSelectedAvatarWithFakeUser(profile);

  const avatarHtml = getUserAvatarHtml(username, profile);

  const wrap = $("#kqShopUser");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="kq-shop-user-avatar">
      ${avatarHtml}
    </div>

    <div class="kq-shop-user-copy">
      <h2>${username}</h2>
      <p>📍 ${profile.title?.name || "New Challenger"} · ${profile.background?.name || "Hanok Courtyard"}</p>
    </div>
  `;
}

function renderTopStats(player, equipped) {
  const xpNeeded = needXP(player.level);
  const xpPct = Math.max(0, Math.min(100, Math.round((player.xp / xpNeeded) * 100)));
  const equippedCount = Object.values(equipped).filter(Boolean).length;

  const ownedEl = $("#kqOwnedCount");
  const equippedEl = $("#kqEquippedCount");
  const levelChip = $("#kqLevelChip");
  const xpFill = $("#kqXpBarFill");
  const xpText = $("#kqXpText");
  const coins = $("#kqCoinCount");
  const badges = $("#kqBadgeCount");

  if (ownedEl) ownedEl.textContent = getOwnedItemIds().length;
  if (equippedEl) equippedEl.textContent = equippedCount;

  if (levelChip) levelChip.textContent = `Level ${player.level}`;
  if (xpText) xpText.textContent = `${player.xp} / ${xpNeeded} XP`;

  if (xpFill) {
    xpFill.style.width = "0%";
    setTimeout(() => {
      xpFill.style.width = `${xpPct}%`;
    }, 50);
  }

  if (coins) coins.textContent = `🪙 ${player.coins}`;
  if (badges) badges.textContent = `🏅 ${player.badges?.length || 0}`;
}

function renderTabs() {
  const wrap = $("#kqShopTabs");
  if (!wrap) return;

  wrap.innerHTML = CATEGORIES.map(
    ([id, label, icon]) => `
      <button class="kq-shop-tab ${activeCategory === id ? "is-active" : ""}" type="button" data-category="${id}">
        <img src="${icon}" alt="" />
        <span>${label}</span>
      </button>
    `,
  ).join("");

  wrap.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      render();
    });
  });
}

function renderSectionHeader(visibleItems, ownedIds, totalItems) {
  const title = $("#kqSectionTitle");
  const desc = $("#kqSectionDesc");
  const icon = $("#kqSectionIcon");
  const count = $("#kqCollectedCount");

  const label = getCategoryLabel();
  const categoryDescriptions = {
    avatars: "Choose an avatar to represent your journey.",
    frames: "Decorate your profile picture with a new frame.",
    backgrounds: "Pick a background for your learner profile.",
    pets: "Choose a companion to join your Korean Quest.",
  };

  if (title) title.textContent = label;
  if (desc) desc.textContent = categoryDescriptions[activeCategory] || "Unlock new cosmetics for your profile.";
  if (icon) icon.src = getCategoryIcon();

  if (count) {
    const ownedVisible = visibleItems.filter((item) => ownedIds.has(item.id)).length;
    count.textContent = `🌸 ${ownedVisible} / ${totalItems} Collected`;
  }
}

function renderEquippedSummary() {
  // Kept so older calls do not break.
}

function getVisibleItems(items) {
  const itemsWithImages = addImagesToItems(items, activeCategory);

  if (activeCategory === "avatars") {
    return itemsWithImages.slice(0, 7);
  }

  if (activeCategory === "frames") {
    return itemsWithImages.slice(0, SHOP_ASSETS.frames.length);
  }

  if (activeCategory === "backgrounds") {
    return itemsWithImages.slice(0, SHOP_ASSETS.backgrounds.length);
  }

  if (activeCategory === "pets") {
    return itemsWithImages.slice(0, SHOP_ASSETS.pets.length);
  }

  return itemsWithImages;
}

function getCategoryCardClass() {
  if (activeCategory === "avatars") return "kq-avatar-card";
  if (activeCategory === "frames") return "kq-frame-card";
  if (activeCategory === "backgrounds") return "kq-background-card";
  if (activeCategory === "pets") return "kq-pet-card";
  return "";
}

function renderGrid(items, ownedIds, equipped) {
  const grid = $("#kqShopGrid");
  if (!grid) return;

  const profile = getEquippedProfile();
  const visibleItems = getVisibleItems(items);

  const baseTotal =
    activeCategory === "avatars"
      ? Math.min(items.length, SHOP_ASSETS.avatars.length)
      : activeCategory === "frames"
      ? Math.min(items.length, SHOP_ASSETS.frames.length)
      : activeCategory === "backgrounds"
      ? Math.min(items.length, SHOP_ASSETS.backgrounds.length)
      : activeCategory === "pets"
      ? Math.min(items.length, SHOP_ASSETS.pets.length)
      : items.length;

  renderSectionHeader(visibleItems, ownedIds, baseTotal);

  const comingSoonCard =
    activeCategory === "avatars"
      ? `
        <article class="kq-shop-item kq-shop-lock-card">
          <div class="kq-shop-image-zone">
            <div class="kq-coming-soon-lock">🔒</div>
          </div>

          <div class="kq-shop-info">
            <h3>Coming Soon</h3>
            <div class="kq-shop-rarity kq-rarity-common">Stay tuned for more!</div>
            <div class="kq-shop-buy-row">
              <button class="kq-shop-price-btn is-owned" type="button" disabled>Locked</button>
            </div>
          </div>
        </article>
      `
      : "";

  if (!visibleItems.length) {
    grid.innerHTML = `
      <article class="kq-shop-item">
        <div class="kq-shop-image-zone">
          <div class="kq-coming-soon-lock">🔎</div>
        </div>

        <div class="kq-shop-info">
          <h3>No items yet</h3>
          <div class="kq-shop-rarity kq-rarity-common">Check back soon.</div>
          <div class="kq-shop-buy-row">
            <button class="kq-shop-price-btn is-owned" type="button" disabled>Empty</button>
          </div>
        </div>
      </article>
    `;
    return;
  }

  const categoryCardClass = getCategoryCardClass();

  grid.innerHTML = visibleItems.map((item, index) => {
    const isOwned = ownedIds.has(item.id);
    const isEquipped = equipped[item.slot] === item.id;
    const rarityClass = getRarityClass(item);

    return `
      <article
        class="kq-shop-item
          ${categoryCardClass}
          ${isEquipped ? "is-selected" : ""}"
        data-item-index="${index}"
      >
        <div class="kq-shop-image-zone">
          ${renderItemVisual(item, activeCategory, index, profile)}
        </div>

        <div class="kq-shop-info">
          <h3>${item.name}</h3>
          <div class="kq-shop-rarity kq-rarity-${rarityClass}">
            ${item.rarity}
          </div>

          <div class="kq-shop-buy-row">
            <button
              class="kq-shop-price-btn ${isOwned ? "is-owned" : ""} is-${rarityClass}"
              type="button"
              data-buy="${item.id}"
              ${isOwned ? "disabled" : ""}
            >
              ${isOwned ? "Owned" : `🪙 ${item.cost}`}
            </button>

            ${isOwned ? `
              <button
                class="kq-shop-equip-btn ${isEquipped ? "is-equipped" : ""}"
                type="button"
                data-equip="${item.id}"
                data-slot="${item.slot}"
                data-equipped="${isEquipped ? "true" : "false"}"
              >
                ${isEquipped ? "Equipped ✓" : "Equip"}
              </button>
            ` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("") + comingSoonCard;

  grid.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const result = purchaseShopItem(btn.dataset.buy);

      if (!result.ok && result.reason === "coins") {
        window.alert("You do not have enough coins for that item yet.");
      }

      renderSoft();
    });
  });

  grid.querySelectorAll("[data-equip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slot = btn.dataset.slot;
      const alreadyEquipped = btn.dataset.equipped === "true";

      if (alreadyEquipped) {
        unequipShopSlot(slot);
      } else {
        equipShopItem(btn.dataset.equip);
      }

      renderSoft();
    });
  });
}

function renderSoft() {
  const player = getPlayer();
  const equipped = getEquippedCosmetics();
  const profile = getEquippedProfile();
  const ownedIds = new Set(getOwnedItemIds());
  const items = getShopCatalog(activeCategory);

  renderUserBlock(profile);
  renderTopStats(player, equipped);
  renderEquippedSummary(profile);
  renderGrid(items, ownedIds, equipped);
}

function render() {
  setupProfileShortcut();
  ensureStyles();
  ensureShell();

  const player = getPlayer();
  const equipped = getEquippedCosmetics();
  const profile = getEquippedProfile();
  const ownedIds = new Set(getOwnedItemIds());
  const items = getShopCatalog(activeCategory);

  renderUserBlock(profile);
  renderTopStats(player, equipped);
  renderTabs();
  renderEquippedSummary(profile);
  renderGrid(items, ownedIds, equipped);

  requestAnimationFrame(() => {
    document.body.classList.add("kq-motion-ready");
  });
}

render();
on("state:changed", render);
window.addEventListener("storage", render);
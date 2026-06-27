import type { CSSProperties } from "react";
import type { ShopItem } from "@/lib/types";

export type CategoryId = "avatars" | "frames" | "backgrounds" | "pets" | "initials";

export interface ImageSettings {
  width?: string;
  height?: string;
  x?: string;
  y?: string;
  scale?: number;
  objectFit?: string;
  objectPosition?: string;
  transformOrigin?: string;
}

export interface VisualShopItem extends ShopItem {
  rawImage: string;
  /** Pre-cropped 575×575 head shot used for round profile pictures. */
  headImage: string;
  imageSettings: ImageSettings | null;
  /** Per-avatar zoom/offset that centers the face inside the round clip. */
  headSettings: ImageSettings | null;
}

export const SHOP_ASSETS = {
  banner: "/favicon/shop/shopBanner.png",
  icons: {
    owned: "/favicon/shop/ownedIcon.png",
    equipped: "/favicon/shop/equipedIcon.png",
    earnCoins: "/favicon/shop/icons/earnCoins.png",
    avatars: "/favicon/shop/icons/avatar.png",
    frames: "/favicon/shop/icons/frames.png",
    backgrounds: "/favicon/shop/icons/bg.png",
    pets: "/favicon/shop/icons/pets.png",
    initials: "/favicon/shop/icons/frames.png",
  },
  avatars: [
    "/favicon/shop/avatars/avatar1.png",
    "/favicon/shop/avatars/avatar2.png",
    "/favicon/shop/avatars/avatar3.png",
    "/favicon/shop/avatars/avatar4.png",
    "/favicon/shop/avatars/avatar5.png",
    "/favicon/shop/avatars/avatar6.png",
    "/favicon/shop/avatars/avatar7.png",
    "/favicon/shop/avatars/avatar8.png",
  ],
  rawAvatars: [
    "/favicon/shop/avatars/raw/rawAvatar1.png",
    "/favicon/shop/avatars/raw/rawAvatar2.png",
    "/favicon/shop/avatars/raw/rawAvatar3.png",
    "/favicon/shop/avatars/raw/rawAvatar4.png",
    "/favicon/shop/avatars/raw/rawAvatar5.png",
    "/favicon/shop/avatars/raw/rawAvatar6.png",
    "/favicon/shop/avatars/raw/rawAvatar7.png",
  ],
  // Pre-cropped 575×575 head shots used for the round profile pictures.
  headAvatars: [
    "/favicon/shop/avatars/head/avatar1Head.png",
    "/favicon/shop/avatars/head/avatar2Head.png",
    "/favicon/shop/avatars/head/avatar3Head.png",
    "/favicon/shop/avatars/head/avatar4Head.png",
    "/favicon/shop/avatars/head/avatar5Head.png",
    "/favicon/shop/avatars/head/avatar6Head.png",
    "/favicon/shop/avatars/head/avatar7Head.png",
  ],
  frames: [
    "/favicon/shop/frames/cloud-frame.png",
    "/favicon/shop/frames/night-frame.png",
    "/favicon/shop/frames/traditional-frame.png",
    "/favicon/shop/frames/frame4.png",
  ],
  backgrounds: [
    "/favicon/shop/backgrounds/night-bg.png",
    "/favicon/shop/backgrounds/picnic-bg.png",
    "/favicon/shop/backgrounds/sakura-bg.png",
    "/favicon/shop/backgrounds/temple-bg.png",
  ],
  pets: [
    "/favicon/shop/pets/bunny.png",
    "/favicon/shop/pets/cat.png",
    "/favicon/shop/pets/dog.png",
    "/favicon/shop/pets/pet4.png",
    "/favicon/shop/pets/pet5.png",
    "/favicon/shop/pets/pet6.png",
  ],
  rawPets: [
    "/favicon/shop/raw-images/pets/bunny.png",
    "/favicon/shop/raw-images/pets/cat.png",
    "/favicon/shop/raw-images/pets/dog.png",
    "/favicon/shop/raw-images/pets/pet4.png",
    "/favicon/shop/raw-images/pets/pet5.png",
    "/favicon/shop/raw-images/pets/pet6.png",
  ],
};

export const PROFILE_LAYER_CONSTRAINTS = {
  // The avatar layer now uses the pre-cropped head shot, so it simply fills the
  // circular clip (cover, centered) instead of zooming into a full-body cutout.
  avatar: {
    width: "100%",
    height: "100%",
    x: "0px",
    y: "0px",
    scale: 1,
    objectFit: "cover",
    objectPosition: "center center",
    transformOrigin: "center center",
  },
  // The frame uses cover (not fill) so its circular ring keeps its shape and
  // wraps around the inner picture like a real picture frame.
  frame: {
    width: "100%",
    height: "100%",
    x: "0px",
    y: "0px",
    scale: 1,
    objectFit: "cover",
    objectPosition: "center center",
  },
};

// Each head shot frames the face a little differently (big hats/helmets push the
// face lower in the square). These per-avatar settings zoom in slightly and lift
// the image up so the face lands dead-center in the round profile clip. `y` is a
// percentage of the avatar box, so the offset scales at any avatar size.
const HEAD_SETTINGS_BASE = {
  width: "100%",
  height: "100%",
  x: "0px",
  objectFit: "cover",
  objectPosition: "center center",
  transformOrigin: "center center",
} as const;

export const HEAD_IMAGE_CONSTRAINTS: ImageSettings[] = [
  { ...HEAD_SETTINGS_BASE, y: "-4%", scale: 1.1 }, // avatar1 — wide-brim gat boy
  { ...HEAD_SETTINGS_BASE, y: "-3%", scale: 1.06 }, // avatar2 — hanbok girl (bun)
  { ...HEAD_SETTINGS_BASE, y: "-3%", scale: 1.08 }, // avatar3 — black-hat scholar
  { ...HEAD_SETTINGS_BASE, y: "-3%", scale: 1.08 }, // avatar4 — helmet warrior
  { ...HEAD_SETTINGS_BASE, y: "-2%", scale: 1.05 }, // avatar5 — braided-hair girl
  { ...HEAD_SETTINGS_BASE, y: "-3%", scale: 1.06 }, // avatar6 — tall-hat boy
  { ...HEAD_SETTINGS_BASE, y: "-2%", scale: 1.04 }, // avatar7 — tiger mascot
];

export const SHOP_IMAGE_CONSTRAINTS: Record<CategoryId, ImageSettings[]> = {
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
    { width: "220%", height: "150%", x: "-15px", y: "0px", scale: 1.35, objectFit: "contain", objectPosition: "center center" },
    { width: "250%", height: "200%", x: "10px", y: "0px", scale: 1.3, objectFit: "contain", objectPosition: "center center" },
    { width: "232%", height: "150%", x: "25px", y: "0px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
    { width: "148%", height: "148%", x: "0px", y: "12px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
    { width: "148%", height: "148%", x: "0px", y: "12px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
    { width: "148%", height: "148%", x: "0px", y: "12px", scale: 1.32, objectFit: "contain", objectPosition: "center center" },
  ],
  initials: [],
};

/** Returns a readable text color (dark or white) for a given hex background. */
export function readableTextColor(hex?: string | null): string {
  const fallback = "#3b3470";
  if (!hex) return fallback;
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return fallback;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative luminance (sRGB perceptual weighting).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#2a2350" : "#ffffff";
}

/** True when an initials background value is a gradient (animated "changing color"). */
export function isAnimatedInitialsBg(value?: string | null): boolean {
  return Boolean(value && value.includes("gradient"));
}

/** Extra class applied to animated (gradient) initials backgrounds. */
export function initialsBgClass(value?: string | null): string {
  return isAnimatedInitialsBg(value) ? "kq-initials-anim" : "";
}

/**
 * Inline style for an initials swatch/background given an optional color or
 * gradient. Solid colors get a luminance-matched text color; animated gradients
 * use white text (their hue shifts so a fixed readable color isn't possible).
 */
export function initialsBackgroundStyle(value?: string | null): CSSProperties {
  if (!value) return {};
  if (isAnimatedInitialsBg(value)) return { background: value, color: "#ffffff" };
  return { background: value, color: readableTextColor(value) };
}

export function imageSettingsToStyle(settings: ImageSettings | null): CSSProperties {
  if (!settings) return {};
  return {
    width: settings.width || "100%",
    height: settings.height || "100%",
    objectFit: (settings.objectFit || "contain") as CSSProperties["objectFit"],
    objectPosition: settings.objectPosition || "center center",
    transformOrigin: settings.transformOrigin || "center center",
    transform: `translate(${settings.x || "0px"}, ${settings.y || "0px"}) scale(${settings.scale || 1})`,
  };
}

export function getCategoryAssets(category: CategoryId) {
  if (category === "avatars") return SHOP_ASSETS.avatars;
  if (category === "frames") return SHOP_ASSETS.frames;
  if (category === "backgrounds") return SHOP_ASSETS.backgrounds;
  if (category === "initials") return [] as string[];
  return SHOP_ASSETS.pets;
}

export function getCategoryRawAssets(category: CategoryId) {
  if (category === "avatars") return SHOP_ASSETS.rawAvatars;
  if (category === "pets") return SHOP_ASSETS.rawPets;
  return [];
}

export function getCategoryHeadAssets(category: CategoryId) {
  if (category === "avatars") return SHOP_ASSETS.headAvatars;
  return [];
}

export function addImagesToItems(items: ShopItem[], category: CategoryId): VisualShopItem[] {
  const imageList = getCategoryAssets(category);
  const rawImageList = getCategoryRawAssets(category);
  const headImageList = getCategoryHeadAssets(category);
  const constraintsList = SHOP_IMAGE_CONSTRAINTS[category];

  return items.map((item, index) => {
    const image = imageList[index] || item.image || "";
    const rawImage = rawImageList[index] || image;
    return {
      ...item,
      image,
      rawImage,
      headImage: headImageList[index] || rawImage,
      imageSettings: constraintsList[index] || null,
      headSettings: category === "avatars" ? HEAD_IMAGE_CONSTRAINTS[index] || null : null,
    };
  });
}

export function getEquippedVisualItem(
  catalog: ShopItem[],
  category: CategoryId,
  itemId?: string | null,
): VisualShopItem | null {
  const visualCatalog = addImagesToItems(catalog, category);
  if (itemId) {
    const found = visualCatalog.find((item) => item.id === itemId);
    if (found) return found;
  }
  return visualCatalog[0] || null;
}

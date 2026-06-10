"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { ShopItem } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/shop.css";
import "@/styles/pages/shop-extracted.css";

type CategoryId = "avatars" | "frames" | "backgrounds" | "pets";

interface ImageSettings {
  width?: string;
  height?: string;
  x?: string;
  y?: string;
  scale?: number;
  objectFit?: string;
  objectPosition?: string;
}

interface VisualShopItem extends ShopItem {
  rawImage: string;
  imageSettings: ImageSettings | null;
}

const SHOP_ASSETS = {
  banner: "/favicon/shop/shopBanner.png",
  icons: {
    owned: "/favicon/shop/icons/owned.png",
    equipped: "/favicon/shop/icons/equipped.png",
    earnCoins: "/favicon/shop/icons/earnCoins.png",
    avatars: "/favicon/shop/icons/avatar.png",
    frames: "/favicon/shop/icons/frames.png",
    backgrounds: "/favicon/shop/icons/bg.png",
    pets: "/favicon/shop/icons/pets.png",
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
    "/favicon/shop/raw-images/avatar/avatar1.png",
    "/favicon/shop/raw-images/avatar/avatar2.png",
    "/favicon/shop/raw-images/avatar/avatar3.png",
    "/favicon/shop/raw-images/avatar/avatar4.png",
    "/favicon/shop/raw-images/avatar/avatar5.png",
    "/favicon/shop/raw-images/avatar/avatar6.png",
    "/favicon/shop/raw-images/avatar/avatar7.png",
    "/favicon/shop/raw-images/avatar/avatar8.png",
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

const SHOP_ITEM_FLOAT_CONSTRAINTS = {
  enabled: true,
  distance: "8px",
  duration: "3.8s",
  stagger: "0.18s",
};

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

const SHOP_IMAGE_CONSTRAINTS: Record<CategoryId, ImageSettings[]> = {
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

const CATEGORIES: [CategoryId, string, string][] = [
  ["avatars", "Avatars", SHOP_ASSETS.icons.avatars],
  ["frames", "Frames", SHOP_ASSETS.icons.frames],
  ["backgrounds", "Backgrounds", SHOP_ASSETS.icons.backgrounds],
  ["pets", "Pets", SHOP_ASSETS.icons.pets],
];

const CATEGORY_DESCRIPTIONS: Record<CategoryId, string> = {
  avatars: "Choose an avatar to represent your journey.",
  frames: "Decorate your profile picture with a new frame.",
  backgrounds: "Pick a background for your learner profile.",
  pets: "Choose a companion to join your Korean Quest.",
};

function getInitials(name: string) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "KQ";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "KQ";
}

function getRarityClass(item: ShopItem) {
  return String(item?.rarity || "Common").trim().toLowerCase().replace(/\s+/g, "-");
}

function imageSettingsToStyle(settings: ImageSettings | null): CSSProperties {
  if (!settings) return {};
  return {
    width: settings.width || "100%",
    height: settings.height || "100%",
    objectFit: (settings.objectFit || "contain") as CSSProperties["objectFit"],
    objectPosition: settings.objectPosition || "center center",
    transform: `translate(${settings.x || "0px"}, ${settings.y || "0px"}) scale(${settings.scale || 1})`,
  };
}

function getCategoryAssets(category: CategoryId) {
  if (category === "avatars") return SHOP_ASSETS.avatars;
  if (category === "frames") return SHOP_ASSETS.frames;
  if (category === "backgrounds") return SHOP_ASSETS.backgrounds;
  return SHOP_ASSETS.pets;
}

function getCategoryRawAssets(category: CategoryId) {
  if (category === "avatars") return SHOP_ASSETS.rawAvatars;
  if (category === "pets") return SHOP_ASSETS.rawPets;
  return [];
}

function addImagesToItems(items: ShopItem[], category: CategoryId): VisualShopItem[] {
  const imageList = getCategoryAssets(category);
  const rawImageList = getCategoryRawAssets(category);
  const constraintsList = SHOP_IMAGE_CONSTRAINTS[category];

  return items.map((item, index) => ({
    ...item,
    image: imageList[index] || item.image || "",
    rawImage: rawImageList[index] || imageList[index] || item.image || "",
    imageSettings: constraintsList[index] || null,
  }));
}

function getEquippedVisualItem(
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

function getFloatDelay(index: number) {
  const stagger = parseFloat(SHOP_ITEM_FLOAT_CONSTRAINTS.stagger) || 0;
  return `${index * stagger}s`;
}

function getCategoryCardClass(category: CategoryId) {
  if (category === "avatars") return "kq-avatar-card";
  if (category === "frames") return "kq-frame-card";
  if (category === "backgrounds") return "kq-background-card";
  if (category === "pets") return "kq-pet-card";
  return "";
}

function getVisibleItems(items: ShopItem[], category: CategoryId) {
  const itemsWithImages = addImagesToItems(items, category);
  if (category === "avatars") return itemsWithImages.slice(0, 7);
  if (category === "frames") return itemsWithImages.slice(0, SHOP_ASSETS.frames.length);
  if (category === "backgrounds") return itemsWithImages.slice(0, SHOP_ASSETS.backgrounds.length);
  if (category === "pets") return itemsWithImages.slice(0, SHOP_ASSETS.pets.length);
  return itemsWithImages;
}

function getBaseTotal(items: ShopItem[], category: CategoryId) {
  if (category === "avatars") return Math.min(items.length, SHOP_ASSETS.avatars.length);
  if (category === "frames") return Math.min(items.length, SHOP_ASSETS.frames.length);
  if (category === "backgrounds") return Math.min(items.length, SHOP_ASSETS.backgrounds.length);
  if (category === "pets") return Math.min(items.length, SHOP_ASSETS.pets.length);
  return items.length;
}

function ShopImage({
  src,
  fallbackSrc,
  alt,
  className,
  style,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

function FloatShell({ index, children }: { index: number; children: ReactNode }) {
  const floatingClass = SHOP_ITEM_FLOAT_CONSTRAINTS.enabled ? "is-floating" : "";
  return (
    <div
      className={`kq-shop-float ${floatingClass}`}
      style={
        {
          "--kq-item-float-distance": SHOP_ITEM_FLOAT_CONSTRAINTS.distance,
          "--kq-item-float-duration": SHOP_ITEM_FLOAT_CONSTRAINTS.duration,
          "--kq-item-float-delay": getFloatDelay(index),
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

function ProfileStack({
  avatar,
  frame,
  background,
  pet,
}: {
  avatar?: VisualShopItem | null;
  frame?: VisualShopItem | null;
  background?: VisualShopItem | null;
  pet?: VisualShopItem | null;
}) {
  const avatarSrc = avatar?.rawImage || avatar?.image || "";
  const frameSrc = frame?.image || "";
  const backgroundSrc = background?.image || "";
  const petSrc = pet?.rawImage || pet?.image || "";

  return (
    <div className="kq-profile-stack">
      {backgroundSrc ? (
        <ShopImage src={backgroundSrc} alt="" className="kq-profile-layer kq-profile-bg" />
      ) : null}
      {avatarSrc ? (
        <ShopImage
          src={avatarSrc}
          fallbackSrc={avatar?.image || avatarSrc}
          alt=""
          className="kq-profile-layer kq-profile-avatar-layer"
          style={imageSettingsToStyle(PROFILE_LAYER_CONSTRAINTS.avatar)}
        />
      ) : null}
      {petSrc ? (
        <ShopImage
          src={petSrc}
          fallbackSrc={pet?.image || petSrc}
          alt=""
          className="kq-profile-layer kq-profile-pet-layer"
          style={imageSettingsToStyle(PROFILE_LAYER_CONSTRAINTS.pet)}
        />
      ) : null}
      {frameSrc ? (
        <ShopImage
          src={frameSrc}
          alt=""
          className="kq-profile-layer kq-profile-frame-layer"
          style={imageSettingsToStyle(PROFILE_LAYER_CONSTRAINTS.frame)}
        />
      ) : null}
    </div>
  );
}

function PlainItemImage({ item, index, extraClass = "" }: { item: VisualShopItem; index: number; extraClass?: string }) {
  if (!item.image) {
    return (
      <FloatShell index={index}>
        <div className={`kq-shop-placeholder ${extraClass}`} aria-hidden="true">
          <span>IMAGE HERE</span>
        </div>
      </FloatShell>
    );
  }

  return (
    <FloatShell index={index}>
      <ShopImage
        src={item.rawImage || item.image}
        fallbackSrc={item.image}
        alt={item.name}
        className={`kq-shop-art ${extraClass}`}
        style={imageSettingsToStyle(item.imageSettings)}
      />
    </FloatShell>
  );
}

function ItemVisual({
  item,
  category,
  index,
  profileVisuals,
}: {
  item: VisualShopItem;
  category: CategoryId;
  index: number;
  profileVisuals: {
    avatar: VisualShopItem | null;
    frame: VisualShopItem | null;
    background: VisualShopItem | null;
    pet: VisualShopItem | null;
  };
}) {
  if (category === "frames") {
    return (
      <FloatShell index={index}>
        <ProfileStack
          avatar={profileVisuals.avatar}
          frame={item}
          background={profileVisuals.background}
        />
      </FloatShell>
    );
  }

  if (category === "backgrounds") {
    return (
      <FloatShell index={index}>
        <ProfileStack
          avatar={profileVisuals.avatar}
          frame={profileVisuals.frame}
          background={item}
        />
      </FloatShell>
    );
  }

  return <PlainItemImage item={item} index={index} />;
}

export default function ShopView() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("avatars");
  const [xpBarWidth, setXpBarWidth] = useState(0);

  const user = useAuthStore((s) => s.user);
  const player = useGameStore((s) => s.player);
  const getShopCatalog = useGameStore((s) => s.getShopCatalog);
  const getOwnedItemIds = useGameStore((s) => s.getOwnedItemIds);
  const getEquippedCosmetics = useGameStore((s) => s.getEquippedCosmetics);
  const getEquippedProfile = useGameStore((s) => s.getEquippedProfile);
  const purchaseShopItem = useGameStore((s) => s.purchaseShopItem);
  const equipShopItem = useGameStore((s) => s.equipShopItem);
  const unequipShopSlot = useGameStore((s) => s.unequipShopSlot);
  const needXP = useGameStore((s) => s.needXP);

  const equipped = getEquippedCosmetics();
  const profile = getEquippedProfile();
  const ownedIds = useMemo(() => new Set(getOwnedItemIds()), [player.inventory]);
  const items = getShopCatalog(activeCategory);

  const profileVisuals = useMemo(() => {
    const avatarCatalog = getShopCatalog("avatars");
    const frameCatalog = getShopCatalog("frames");
    const backgroundCatalog = getShopCatalog("backgrounds");
    const petCatalog = getShopCatalog("pets");

    return {
      avatar: getEquippedVisualItem(avatarCatalog, "avatars", profile.avatar?.id),
      frame: getEquippedVisualItem(frameCatalog, "frames", profile.frame?.id),
      background: getEquippedVisualItem(backgroundCatalog, "backgrounds", profile.background?.id),
      pet: getEquippedVisualItem(petCatalog, "pets", profile.pet?.id),
    };
  }, [getShopCatalog, profile.avatar?.id, profile.frame?.id, profile.background?.id, profile.pet?.id]);

  const visibleItems = useMemo(() => getVisibleItems(items, activeCategory), [items, activeCategory]);
  const baseTotal = useMemo(() => getBaseTotal(items, activeCategory), [items, activeCategory]);
  const ownedVisible = visibleItems.filter((item) => ownedIds.has(item.id)).length;
  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const xpNeeded = needXP(player.level);
  const username = user?.loggedIn ? user.name : "Guest Learner";

  useEffect(() => {
    const xpPct = Math.max(0, Math.min(100, Math.round((player.xp / xpNeeded) * 100)));
    setXpBarWidth(0);
    const timer = window.setTimeout(() => setXpBarWidth(xpPct), 50);
    return () => window.clearTimeout(timer);
  }, [player.xp, player.level, xpNeeded]);

  const handleBuy = useCallback(
    (itemId: string) => {
      const result = purchaseShopItem(itemId);
      if (!result.ok && result.reason === "coins") {
        window.alert("You do not have enough coins for that item yet.");
      }
    },
    [purchaseShopItem],
  );

  const handleEquip = useCallback(
    (itemId: string, slot: string, alreadyEquipped: boolean) => {
      if (alreadyEquipped) {
        unequipShopSlot(slot);
      } else {
        equipShopItem(itemId);
      }
    },
    [equipShopItem, unequipShopSlot],
  );

  const categoryMeta = CATEGORIES.find(([id]) => id === activeCategory);
  const categoryLabel = categoryMeta?.[1] || "Shop";
  const categoryIcon = categoryMeta?.[2] || SHOP_ASSETS.icons.avatars;
  const categoryCardClass = getCategoryCardClass(activeCategory);

  const userAvatarContent = (() => {
    const hasProfileStack =
      profileVisuals.avatar?.image ||
      profileVisuals.frame?.image ||
      profileVisuals.background?.image ||
      profileVisuals.pet?.image;

    if (hasProfileStack) {
      return (
        <ProfileStack
          avatar={profileVisuals.avatar}
          frame={profileVisuals.frame}
          background={profileVisuals.background}
          pet={profileVisuals.pet}
        />
      );
    }

    if (user?.avatarImage) {
      return <ShopImage src={user.avatarImage} alt={`${username} profile picture`} />;
    }

    return <span>{user?.avatarInitials || getInitials(username)}</span>;
  })();

  return (
    <section id="kqShopPage" className="kq-shop-page">
      <section className="kq-shop-banner" aria-label="Shop banner">
        <ShopImage
          src={SHOP_ASSETS.banner}
          alt="Shop — spend coins, customize your profile, and unlock rewards"
        />
      </section>

      <section className="kq-shop-panel">
        <div className="kq-shop-profile-strip">
          <div className="kq-shop-user" id="kqShopUser">
            <div className="kq-shop-user-avatar">{userAvatarContent}</div>
            <div className="kq-shop-user-copy">
              <h2>{username}</h2>
              <p>
                📍 {profile.title?.name || "New Challenger"} · {profile.background?.name || "Hanok Courtyard"}
              </p>
            </div>
          </div>

          <div className="kq-stat-box">
            <ShopImage className="kq-stat-icon" src={SHOP_ASSETS.icons.owned} alt="" />
            <div>
              <span>Owned</span>
              <strong id="kqOwnedCount">{ownedIds.size}</strong>
            </div>
          </div>

          <div className="kq-stat-box">
            <ShopImage className="kq-stat-icon" src={SHOP_ASSETS.icons.equipped} alt="" />
            <div>
              <span>Equipped</span>
              <strong id="kqEquippedCount">{equippedCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="kq-shop-panel">
        <div className="kq-shop-progress-shell">
          <div className="kq-lvl-chip" id="kqLevelChip">
            Level {player.level}
          </div>

          <div className="kq-xp-bar" aria-hidden="true">
            <span id="kqXpBarFill" style={{ width: `${xpBarWidth}%` }} />
            <div className="kq-xp-text" id="kqXpText">
              {player.xp} / {xpNeeded} XP
            </div>
          </div>

          <div className="kq-shop-count" id="kqCoinCount">
            🪙 {player.coins}
          </div>
          <div className="kq-shop-count" id="kqBadgeCount">
            🏅 {player.badges?.length || 0}
          </div>
        </div>
      </section>

      <section className="kq-shop-panel">
        <div id="kqShopTabs" className="kq-shop-tabs">
          {CATEGORIES.map(([id, label, icon]) => (
            <button
              key={id}
              className={`kq-shop-tab ${activeCategory === id ? "is-active" : ""}`}
              type="button"
              data-category={id}
              onClick={() => setActiveCategory(id)}
            >
              <ShopImage src={icon} alt="" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="kq-shop-panel kq-shop-list-panel">
        <div className="kq-shop-section-head">
          <div className="kq-shop-section-title">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img id="kqSectionIcon" src={categoryIcon} alt="" />
            <div>
              <h2 id="kqSectionTitle">{categoryLabel}</h2>
              <p id="kqSectionDesc">
                {CATEGORY_DESCRIPTIONS[activeCategory] || "Unlock new cosmetics for your profile."}
              </p>
            </div>
          </div>

          <div className="kq-collected-count" id="kqCollectedCount">
            🌸 {ownedVisible} / {baseTotal} Collected
          </div>
        </div>

        <section className="kq-shop-grid kq-stagger" id="kqShopGrid">
          {!visibleItems.length ? (
            <article className="kq-shop-item">
              <div className="kq-shop-image-zone">
                <div className="kq-coming-soon-lock">🔎</div>
              </div>
              <div className="kq-shop-info">
                <h3>No items yet</h3>
                <div className="kq-shop-rarity kq-rarity-common">Check back soon.</div>
                <div className="kq-shop-buy-row">
                  <button className="kq-shop-price-btn is-owned" type="button" disabled>
                    Empty
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <>
              {visibleItems.map((item, index) => {
                const isOwned = ownedIds.has(item.id);
                const isEquipped = equipped[item.slot as keyof typeof equipped] === item.id;
                const rarityClass = getRarityClass(item);

                return (
                  <article
                    key={item.id}
                    className={`kq-shop-item ${categoryCardClass} ${isEquipped ? "is-selected" : ""}`}
                    data-item-index={index}
                  >
                    <div className="kq-shop-image-zone">
                      <ItemVisual
                        item={item}
                        category={activeCategory}
                        index={index}
                        profileVisuals={profileVisuals}
                      />
                    </div>

                    <div className="kq-shop-info">
                      <h3>{item.name}</h3>
                      <div className={`kq-shop-rarity kq-rarity-${rarityClass}`}>{item.rarity}</div>

                      <div className="kq-shop-buy-row">
                        <button
                          className={`kq-shop-price-btn ${isOwned ? "is-owned" : ""} is-${rarityClass}`}
                          type="button"
                          data-buy={item.id}
                          disabled={isOwned}
                          onClick={() => handleBuy(item.id)}
                        >
                          {isOwned ? "Owned" : `🪙 ${item.cost}`}
                        </button>

                        {isOwned ? (
                          <button
                            className={`kq-shop-equip-btn ${isEquipped ? "is-equipped" : ""}`}
                            type="button"
                            data-equip={item.id}
                            data-slot={item.slot}
                            data-equipped={isEquipped ? "true" : "false"}
                            onClick={() => handleEquip(item.id, item.slot, isEquipped)}
                          >
                            {isEquipped ? "Equipped ✓" : "Equip"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}

              {activeCategory === "avatars" ? (
                <article className="kq-shop-item kq-shop-lock-card">
                  <div className="kq-shop-image-zone">
                    <div className="kq-coming-soon-lock">🔒</div>
                  </div>
                  <div className="kq-shop-info">
                    <h3>Coming Soon</h3>
                    <div className="kq-shop-rarity kq-rarity-common">Stay tuned for more!</div>
                    <div className="kq-shop-buy-row">
                      <button className="kq-shop-price-btn is-owned" type="button" disabled>
                        Locked
                      </button>
                    </div>
                  </div>
                </article>
              ) : null}
            </>
          )}
        </section>
      </section>

      <section className="kq-shop-bottom-card">
        <div className="kq-shop-bottom-left">
          <ShopImage src={SHOP_ASSETS.icons.earnCoins} alt="" />
          <div>
            <h3>How do I earn coins?</h3>
            <p>Earn coins by completing lessons, daily quests, battles, and special events!</p>
          </div>
        </div>

        <Link className="kq-shop-dashboard-link" href="/dashboard" id="kqDashboardLink">
          Go to Dashboard →
        </Link>
      </section>
    </section>
  );
}

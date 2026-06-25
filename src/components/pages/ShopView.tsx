"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { ShopItem } from "@/lib/types";
import { asset } from "@/lib/asset";
import { ShopImage, ProfileStack } from "@/components/shared/ProfileAvatar";
import {
  SHOP_ASSETS,
  addImagesToItems,
  getEquippedVisualItem,
  imageSettingsToStyle,
  type CategoryId,
  type VisualShopItem,
} from "@/lib/shop-visuals";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/shop.css";
import "@/styles/pages/shop-extracted.css";

const SHOP_ITEM_FLOAT_CONSTRAINTS = {
  enabled: true,
  distance: "8px",
  duration: "3.8s",
  stagger: "0.18s",
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
        src={item.image || item.rawImage}
        fallbackSrc={item.rawImage || item.image}
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
}: {
  item: VisualShopItem;
  category: CategoryId;
  index: number;
}) {
  // Frames and backgrounds each preview only their own artwork (no composited
  // avatar/background), so the gallery shows just the frame or just the bg.
  if (category === "backgrounds") {
    return <PlainItemImage item={item} index={index} extraClass="kq-shop-art--bg" />;
  }

  if (category === "frames") {
    return <PlainItemImage item={item} index={index} extraClass="kq-shop-art--frame" />;
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

  const hasProfileStack = Boolean(
    profileVisuals.avatar?.image ||
      profileVisuals.frame?.image ||
      profileVisuals.background?.image ||
      profileVisuals.pet?.image,
  );

  const userAvatarContent = (() => {
    if (hasProfileStack) {
      return (
        <ProfileStack
          avatar={profileVisuals.avatar}
          frame={profileVisuals.frame}
          background={profileVisuals.background}
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
            <div className={`kq-shop-user-avatar${hasProfileStack ? " has-stack" : ""}`}>
              {userAvatarContent}
            </div>
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
            <img id="kqSectionIcon" src={asset(categoryIcon)} alt="" />
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

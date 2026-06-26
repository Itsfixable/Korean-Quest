"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { asset } from "@/lib/asset";
import {
  PROFILE_LAYER_CONSTRAINTS,
  getEquippedVisualItem,
  imageSettingsToStyle,
  initialsBackgroundStyle,
  type VisualShopItem,
} from "@/lib/shop-visuals";
import { useGameStore } from "@/stores/useGameStore";

export function ShopImage({
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
      src={asset(currentSrc)}
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

export function ProfileStack({
  avatar,
  frame,
  background,
  initials,
  initialsBg,
}: {
  avatar?: VisualShopItem | null;
  frame?: VisualShopItem | null;
  background?: VisualShopItem | null;
  initials?: string | null;
  initialsBg?: string | null;
}) {
  const avatarSrc = avatar?.headImage || avatar?.rawImage || avatar?.image || "";
  const frameSrc = frame?.image || "";
  const backgroundSrc = background?.image || "";
  const avatarStyle = imageSettingsToStyle(avatar?.headSettings ?? PROFILE_LAYER_CONSTRAINTS.avatar);
  const showInitials = Boolean(initials);

  return (
    <div className="kq-profile-stack">
      <div className="kq-profile-clip">
        {backgroundSrc && !showInitials ? (
          <ShopImage src={backgroundSrc} alt="" className="kq-profile-layer kq-profile-bg" />
        ) : null}
        {showInitials ? (
          <span
            className="kq-profile-layer kq-profile-initials"
            style={initialsBackgroundStyle(initialsBg)}
          >
            {initials}
          </span>
        ) : avatarSrc ? (
          <ShopImage
            src={avatarSrc}
            fallbackSrc={avatar?.rawImage || avatar?.image || avatarSrc}
            alt=""
            className="kq-profile-layer kq-profile-avatar-layer"
            style={avatarStyle}
          />
        ) : null}
      </div>
      {frameSrc ? (
        <ShopImage
          src={frameSrc}
          alt=""
          className="kq-profile-frame-layer"
          style={imageSettingsToStyle(PROFILE_LAYER_CONSTRAINTS.frame)}
        />
      ) : null}
    </div>
  );
}

/**
 * Reads the player's equipped cosmetics from the game store and returns the
 * resolved avatar / frame / background visuals (with the correct raw images
 * and asset paths). Shared by the shop profile strip and the sidebar.
 */
export function useEquippedProfileVisuals() {
  const getShopCatalog = useGameStore((s) => s.getShopCatalog);
  const getEquippedProfile = useGameStore((s) => s.getEquippedProfile);
  const equipped = useGameStore((s) => s.player.equipped);

  return useMemo(() => {
    const profile = getEquippedProfile();
    return {
      avatar: getEquippedVisualItem(getShopCatalog("avatars"), "avatars", profile.avatar?.id),
      frame: getEquippedVisualItem(getShopCatalog("frames"), "frames", profile.frame?.id),
      background: getEquippedVisualItem(getShopCatalog("backgrounds"), "backgrounds", profile.background?.id),
      pet: getEquippedVisualItem(getShopCatalog("pets"), "pets", profile.pet?.id),
    };
    // `equipped` is the reactive trigger; the getters themselves are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getShopCatalog, getEquippedProfile, equipped]);
}

/**
 * The account avatar used in the sidebar/navbar. Shows the equipped avatar's
 * portrait art (already framed face-forward), which reads far better at the
 * small navbar size than re-compositing the raw cutout over a background.
 * Falls back to the provided node (auth image / initials) when nothing is
 * equipped.
 */
export default function ProfileAvatar({ fallback }: { fallback?: React.ReactNode }) {
  const visuals = useEquippedProfileVisuals();
  const usesInitials = useGameStore((s) => s.player.profileUsesInitials);
  const src = visuals.avatar?.headImage || visuals.avatar?.image;

  if (usesInitials || !src) return <>{fallback ?? null}</>;

  return (
    <ShopImage
      src={src}
      fallbackSrc={visuals.avatar?.rawImage || visuals.avatar?.image || src}
      alt=""
      className="kq-account-avatar-img"
    />
  );
}

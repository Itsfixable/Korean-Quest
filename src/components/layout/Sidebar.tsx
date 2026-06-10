"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/constants/nav-links";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/nav.css";

const MOBILE_BREAKPOINT = 640;

function NavLink({
  href,
  label,
  icon,
  current,
  className,
}: {
  href: string;
  label: string;
  icon: string;
  current: boolean;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      aria-current={current ? "page" : undefined}
    >
      <Image
        className={className.includes("mobile") ? "kq-mobile-link-icon" : "kq-side-link-icon"}
        src={`/favicon/nav/${icon}`}
        alt=""
        width={44}
        height={44}
        aria-hidden
      />
      <span className={className.includes("side") ? "kq-side-link-label" : undefined}>
        {label}
      </span>
    </Link>
  );
}

function ProfileAvatar({ initials, image }: { initials: string; image?: string }) {
  if (image) {
    return (
      <div className="kq-sidebar-avatar">
        <Image src={image} alt="Profile" width={52} height={52} />
      </div>
    );
  }
  return <div className="kq-sidebar-avatar">{initials}</div>;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, openAuthModal, logout } = useAuthStore();
  const player = useGameStore((s) => s.player);
  const [mobile, setMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isCurrent = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const brand = (
    <Link className="brand" href="/" aria-label="Korean Quest Home">
      <Image
        className="brand-logo"
        src="/favicon/logoImage.png"
        alt="Korean Quest logo"
        width={42}
        height={42}
      />
      <span className="brand-wordmark">
        <span className="brand-korean">Korean</span>
        <span className="brand-quest">Quest</span>
      </span>
    </Link>
  );

  if (mobile) {
    return (
      <header className="container site-header">
        <nav className="nav site-nav" aria-label="Primary">
          {brand}
          <div className="kq-mobile-top">
            <NavLink
              href="/"
              label="Home"
              icon="nav-home.png"
              current={pathname === "/"}
              className="pill kq-mobile-link kq-mobile-home"
            />
            <div className="kq-mobile-right">
              {user?.loggedIn && (
                <div className="kq-mobile-user-chip">
                  <ProfileAvatar
                    initials={user.avatarInitials || "KQ"}
                    image={user.avatarImage}
                  />
                  <span>{user.name}</span>
                </div>
              )}
              <button
                type="button"
                className="kq-mobile-toggle"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
          <div className={`kq-mobile-menu${menuOpen ? " open" : ""}`}>
            <div className="kq-mobile-cascade">
              {NAV_LINKS.filter((l) => l.href !== "/").map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  current={isCurrent(link.href)}
                  className="pill kq-mobile-link"
                />
              ))}
            </div>
            <div className="kq-mobile-auth-actions">
              {user?.loggedIn ? (
                <button type="button" className="kq-sidebar-action" onClick={logout}>
                  Sign Out
                </button>
              ) : (
                <button type="button" className="kq-sidebar-action" onClick={openAuthModal}>
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="container site-header">
      <nav className="nav site-nav" aria-label="Primary">
        {brand}
        <div className="kq-sidebar-profile">
          {user?.loggedIn ? (
            <div className="kq-sidebar-profile-top">
              <ProfileAvatar
                initials={user.avatarInitials || "KQ"}
                image={user.avatarImage}
              />
              <div className="kq-sidebar-user-copy">
                <strong>{user.name}</strong>
                <span>
                  Level {player.level} · 🪙 {player.coins}
                </span>
              </div>
            </div>
          ) : (
            <div className="kq-sidebar-profile-top">
              <div className="kq-sidebar-avatar">KQ</div>
              <div className="kq-sidebar-user-copy">
                <strong>Guest Learner</strong>
                <span>Login to save your style</span>
              </div>
            </div>
          )}
        </div>
        <div className="kq-sidebar-links">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              current={isCurrent(link.href)}
              className="pill kq-side-link"
            />
          ))}
        </div>
        <div className="kq-sidebar-bottom">
          {user?.loggedIn ? (
            <button type="button" className="kq-sidebar-action" onClick={logout}>
              Sign Out
            </button>
          ) : (
            <button type="button" className="kq-sidebar-action" onClick={openAuthModal}>
              Login / Sign Up
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

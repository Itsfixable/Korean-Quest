export const NAV_LINKS = [
  { href: "/", label: "Home", icon: "nav-home.png" },
  { href: "/schedule", label: "Schedule", icon: "nav-schedule.png" },
  { href: "/resources", label: "Learn", icon: "nav-learn.png" },
  { href: "/adventure", label: "Adventure", icon: "nav-adventure.png" },
  { href: "/dashboard", label: "Dashboard", icon: "nav-dashboard.png" },
  { href: "/shop", label: "Shop", icon: "nav-shop.png" },
  { href: "/leaderboard", label: "Leaderboard", icon: "nav-leaderboard.png" },
  { href: "/about", label: "About", icon: "nav-about.png" },
] as const;

// Routes that live under a top-level nav tab but have their own path. Visiting
// any of these keeps the parent tab highlighted (e.g. Flashcards → "Learn").
export const NAV_SUBROUTES: Record<string, string[]> = {
  "/resources": ["/flashcards", "/test", "/jamo", "/jamo-select", "/tracing"],
  "/schedule": ["/video"],
};

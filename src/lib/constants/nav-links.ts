export const NAV_LINKS = [
  { href: "/", label: "Home", icon: "newNavIcons/homeIcon1.png" },
  { href: "/schedule", label: "Schedule", icon: "newNavIcons/scheduleIcon1.png" },
  { href: "/resources", label: "Learn", icon: "newNavIcons/learnIcon1.png" },
  { href: "/adventure", label: "Adventure", icon: "newNavIcons/adventureIcon1.png" },
  { href: "/dashboard", label: "Dashboard", icon: "newNavIcons/dashboardIcon1.png" },
  { href: "/shop", label: "Shop", icon: "newNavIcons/shopIcon1.png" },
  { href: "/leaderboard", label: "Leaderboard", icon: "newNavIcons/leaderboardIcon1.png" },
  { href: "/about", label: "About", icon: "newNavIcons/aboutIcon1.png" },
  { href: "/sources", label: "Sources", icon: "newNavIcons/sourceIcon1.png" },
] as const;

// Routes that live under a top-level nav tab but have their own path. Visiting
// any of these keeps the parent tab highlighted (e.g. Flashcards → "Learn").
export const NAV_SUBROUTES: Record<string, string[]> = {
  "/resources": ["/flashcards", "/test", "/jamo", "/jamo-select", "/tracing"],
  "/schedule": ["/video"],
};

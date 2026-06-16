import type { ShopItem } from "@/lib/types";

export const KQ_SHOP_CATALOG: ShopItem[] = [
  { id: "avatar-sejong", name: "Sejong Scholar", emoji: "👑", image: "/favicon/shop/avatars/avatar1.png", category: "avatars", slot: "avatar", cost: 0, rarity: "starter", description: "A starter avatar inspired by Korean learning and leadership." },
  { id: "avatar-bunny", name: "Hanbok Girl", emoji: "🐰", image: "/favicon/shop/avatars/avatar2.png", category: "avatars", slot: "avatar", cost: 90, rarity: "rare", description: "A playful bunny-themed shop avatar." },
  { id: "avatar-tiger", name: "Joseon Writer", emoji: "🐯", image: "/favicon/shop/avatars/avatar3.png", category: "avatars", slot: "avatar", cost: 90, rarity: "rare", description: "A bold tiger avatar for confident learners." },
  { id: "avatar-scholar", name: "Yi sun-sin", emoji: "📚", image: "/favicon/shop/avatars/avatar4.png", category: "avatars", slot: "avatar", cost: 90, rarity: "rare", description: "A bookish profile look for focused students." },
  { id: "avatar-kitty", name: "Gayageum Player", emoji: "🐱", image: "/favicon/shop/avatars/avatar5.png", category: "avatars", slot: "avatar", cost: 120, rarity: "epic", description: "A premium companion avatar." },
  { id: "avatar-6", name: "Royal Chef", emoji: "👨‍🍳", image: "/favicon/shop/avatars/avatar6.png", category: "avatars", slot: "avatar", cost: 100, rarity: "rare", description: "A chef avatar for culinary learners." },
  { id: "avatar-7", name: "Tiger spirit", emoji: "🧗", image: "/favicon/shop/avatars/avatar7.png", category: "avatars", slot: "avatar", cost: 100, rarity: "rare", description: "An adventurous spirit avatar." },
  { id: "avatar-8", name: "Coming Soon", emoji: "", image: "/favicon/shop/avatars/avatar8.png", category: "avatars", slot: "avatar", cost: 150, rarity: "epic", description: "Stay tuned for this exclusive avatar." },
  { id: "frame-cloud", name: "Cloud Frame", emoji: "☁️", image: "", category: "frames", slot: "frame", cost: 0, rarity: "starter", description: "A clean starter frame." },
  { id: "frame-jade", name: "Jade Frame", emoji: "💚", image: "", category: "frames", slot: "frame", cost: 70, rarity: "common", description: "A calm green border frame." },
  { id: "frame-gold", name: "Royal Gold Frame", emoji: "✨", image: "", category: "frames", slot: "frame", cost: 130, rarity: "rare", description: "A polished gold frame." },
  { id: "frame-neon", name: "Neon Study Frame", emoji: "💠", image: "", category: "frames", slot: "frame", cost: 180, rarity: "epic", description: "A bright prestige frame." },
  { id: "bg-hanok", name: "Hanok Courtyard", emoji: "🏯", image: "/favicon/shop/backgrounds/night-bg.png", category: "backgrounds", slot: "background", cost: 0, rarity: "starter", description: "A classic Korea Quest starter background." },
  { id: "bg-night", name: "Seoul Night", emoji: "🌃", image: "/favicon/shop/backgrounds/picnic-bg.png", category: "backgrounds", slot: "background", cost: 100, rarity: "common", description: "A city-night profile background." },
  { id: "bg-spring", name: "Cherry Blossom", emoji: "🌸", image: "/favicon/shop/backgrounds/sakura-bg.png", category: "backgrounds", slot: "background", cost: 125, rarity: "rare", description: "A soft springtime background." },
  { id: "bg-palace", name: "Royal Palace", emoji: "🏛️", image: "/favicon/shop/backgrounds/temple-bg.png", category: "backgrounds", slot: "background", cost: 170, rarity: "epic", description: "A premium palace background." },
  { id: "flair-spark", name: "Spark Flair", emoji: "✨", image: "", category: "flairs", slot: "flair", cost: 45, rarity: "common", description: "Adds a sparkle accent to your profile." },
  { id: "flair-flame", name: "Streak Flame", emoji: "🔥", image: "", category: "flairs", slot: "flair", cost: 80, rarity: "rare", description: "A bold flair for streak-focused learners." },
  { id: "flair-star", name: "Star Burst", emoji: "🌟", image: "", category: "flairs", slot: "flair", cost: 95, rarity: "rare", description: "A bright star accent." },
  { id: "pet-dumpling", name: " Bunny", emoji: "🥟", image: "", category: "pets", slot: "pet", cost: 75, rarity: "common", description: "A fun little desk companion." },
  { id: "pet-tiger", name: "Cat", emoji: "🐯", image: "", category: "pets", slot: "pet", cost: 115, rarity: "rare", description: "A tiger companion beside your profile." },
  { id: "pet-cloud", name: "Shiba inu", emoji: "☁️", image: "", category: "pets", slot: "pet", cost: 145, rarity: "epic", description: "A floating cloud companion." },
  { id: "title-rookie", name: "New Challenger", emoji: "🎒", image: "", category: "titles", slot: "title", cost: 0, rarity: "starter", description: "Your starter title." },
  { id: "title-hangul", name: "Hangul Hero", emoji: "🇰🇷", image: "", category: "titles", slot: "title", cost: 90, rarity: "common", description: "A title for students growing their Hangul skills." },
  { id: "title-captain", name: "Quest Captain", emoji: "🧭", image: "", category: "titles", slot: "title", cost: 130, rarity: "rare", description: "A title for steady learners." },
  { id: "title-master", name: "K-Quest Master", emoji: "🏆", image: "", category: "titles", slot: "title", cost: 190, rarity: "epic", description: "A premium title for top learners." },
];

export const KQ_SHOP_STARTERS = ["avatar-sejong", "frame-cloud", "bg-hanok", "title-rookie"];

export const KQ_SHOP_SLOT_LABELS: Record<string, string> = {
  avatar: "Avatar",
  frame: "Frame",
  background: "Background",
  flair: "Flair",
  pet: "Pet",
  title: "Title",
};

export const SEEDS = [
  { id: "carrot",     name: "Carrot",     emoji: "🥕", cost: 10,  growTime: 8,  sellMin: 18,  sellMax: 30,  color: "#FF6B35" },
  { id: "tomato",     name: "Tomato",     emoji: "🍅", cost: 20,  growTime: 12, sellMin: 35,  sellMax: 55,  color: "#E63946" },
  { id: "corn",       name: "Corn",       emoji: "🌽", cost: 30,  growTime: 16, sellMin: 55,  sellMax: 85,  color: "#F4D03F" },
  { id: "strawberry", name: "Strawberry", emoji: "🍓", cost: 50,  growTime: 20, sellMin: 90,  sellMax: 140, color: "#E91E8C" },
  { id: "watermelon", name: "Watermelon", emoji: "🍉", cost: 80,  growTime: 28, sellMin: 150, sellMax: 250, color: "#4CAF50" },
  { id: "grape",      name: "Grape",      emoji: "🍇", cost: 120, growTime: 36, sellMin: 220, sellMax: 380, color: "#9B59B6" },
];

export const QUALITIES = {
  common:    { label: "Common",    color: "#9E9E9E", multiplier: 1.0,  star: "⭐" },
  uncommon:  { label: "Uncommon",  color: "#4CAF50", multiplier: 1.5,  star: "⭐⭐" },
  rare:      { label: "Rare",      color: "#2196F3", multiplier: 2.2,  star: "⭐⭐⭐" },
  epic:      { label: "Epic",      color: "#9C27B0", multiplier: 3.5,  star: "💜💜💜" },
  legendary: { label: "Legendary", color: "#FF9800", multiplier: 6.0,  star: "🌟🌟🌟🌟🌟" },
};

export const ACHIEVEMENTS = [
  { id: "first_harvest",    title: "First Harvest",       desc: "Harvest your first crop",           icon: "🌾", condition: (s: any) => s.totalHarvested >= 1 },
  { id: "green_thumb",      title: "Green Thumb",         desc: "Harvest 20 crops",                  icon: "👍", condition: (s: any) => s.totalHarvested >= 20 },
  { id: "rich_farmer",      title: "Rich Farmer",         desc: "Earn $1,000 total",                 icon: "💰", condition: (s: any) => s.totalEarned >= 1000 },
  { id: "legend_seeker",    title: "Legend Seeker",       desc: "Get your first Legendary quality",  icon: "🌟", condition: (s: any) => s.legendaryCount >= 1 },
  { id: "legend_master",    title: "Legendary Master",    desc: "Get 5 Legendary harvests",          icon: "👑", condition: (s: any) => s.legendaryCount >= 5 },
  { id: "millionaire",      title: "Millionaire Farmer",  desc: "Earn $10,000 total",                icon: "🏆", condition: (s: any) => s.totalEarned >= 10000 },
  { id: "watermaster",      title: "Water Master",        desc: "Water crops 50 times",              icon: "💧", condition: (s: any) => s.totalWatered >= 50 },
  { id: "grape_king",       title: "Grape King",          desc: "Harvest 10 Grapes",                 icon: "🍇", condition: (s: any) => (s.harvestCounts?.grape || 0) >= 10 },
  { id: "speed_farmer",     title: "Speed Farmer",        desc: "Harvest 5 crops in one session",    icon: "⚡", condition: (s: any) => s.sessionHarvests >= 5 },
  { id: "legendary_streak", title: "Legendary Streak",   desc: "Get 3 Legendary harvests in a row", icon: "🔥", condition: (s: any) => s.legendaryStreak >= 3 },
];

export const GRID_SIZE = 12;

export function randomQuality(): keyof typeof QUALITIES {
  const roll = Math.random();
  if (roll < 0.02)  return "legendary";
  if (roll < 0.08)  return "epic";
  if (roll < 0.22)  return "rare";
  if (roll < 0.45)  return "uncommon";
  return "common";
}

export function calcSell(seed: typeof SEEDS[0], quality: keyof typeof QUALITIES) {
  const base = Math.floor(Math.random() * (seed.sellMax - seed.sellMin + 1)) + seed.sellMin;
  return Math.floor(base * QUALITIES[quality].multiplier);
}

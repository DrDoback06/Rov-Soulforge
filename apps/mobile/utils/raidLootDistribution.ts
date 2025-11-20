/**
 * Raid Loot Distribution System
 * 
 * Handles loot drops and distribution for boss raids
 * - Personal loot for items (each player gets own drops)
 * - Shared gold/XP pool
 * - MVP bonus
 * - Participation rewards
 */

import type { BossRaid } from '@/types/party';

export interface RaidLoot {
  items: LootItem[];
  gold: number;
  xp: number;
  renown: number;
  mvpBonus?: {
    userId: string;
    extraGold: number;
    extraXP: number;
    title: string;
  };
}

export interface LootItem {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'card';
  stats?: Record<string, number>;
  icon: string;
}

export interface PlayerLoot {
  userId: string;
  items: LootItem[];
  gold: number;
  xp: number;
  renown: number;
  isMVP: boolean;
}

/**
 * Generate loot for boss raid
 */
export function generateRaidLoot(raid: BossRaid): RaidLoot {
  const difficulty = raid.difficulty;
  const partySize = Object.keys(raid.partyId).length || 4;

  // Base rewards scale with difficulty
  const baseGold = {
    Normal: 500,
    Heroic: 1000,
    Mythic: 2000
  }[difficulty];

  const baseXP = {
    Normal: 1000,
    Heroic: 2000,
    Mythic: 4000
  }[difficulty];

  const baseRenown = {
    Normal: 50,
    Heroic: 100,
    Mythic: 200
  }[difficulty];

  // Generate items (1-3 items based on difficulty)
  const itemCount = {
    Normal: 1,
    Heroic: 2,
    Mythic: 3
  }[difficulty];

  const items: LootItem[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push(generateBossItem(raid.bossId, difficulty));
  }

  // MVP bonus (top damage dealer, healer, or tank)
  const mvpBonus = raid.mvp ? {
    userId: raid.mvp,
    extraGold: Math.floor(baseGold * 0.25),
    extraXP: Math.floor(baseXP * 0.25),
    title: '⭐ MVP'
  } : undefined;

  return {
    items,
    gold: baseGold * partySize, // Shared pool
    xp: baseXP,
    renown: baseRenown,
    mvpBonus
  };
}

/**
 * Distribute loot to players
 */
export function distributeLoot(raid: BossRaid, loot: RaidLoot, playerIds: string[]): PlayerLoot[] {
  const partySize = playerIds.length;
  const goldPerPlayer = Math.floor(loot.gold / partySize);

  return playerIds.map(userId => {
    // Personal item drops (RNG per player)
    const personalItems = loot.items.map(item => {
      // 30% drop chance per item for each player
      if (Math.random() < 0.3) {
        return item;
      }
      return null;
    }).filter(Boolean) as LootItem[];

    // Add guaranteed participation reward (consumable)
    personalItems.push(generateConsumable(raid.difficulty));

    // Calculate player's share
    const isMVP = userId === loot.mvpBonus?.userId;
    const playerGold = goldPerPlayer + (isMVP ? loot.mvpBonus!.extraGold : 0);
    const playerXP = loot.xp + (isMVP ? loot.mvpBonus!.extraXP : 0);

    return {
      userId,
      items: personalItems,
      gold: playerGold,
      xp: playerXP,
      renown: loot.renown,
      isMVP
    };
  });
}

/**
 * Generate boss-specific item
 */
function generateBossItem(bossId: string, difficulty: string): LootItem {
  const rarityChances = {
    Normal: { Common: 0.5, Uncommon: 0.3, Rare: 0.15, Epic: 0.04, Legendary: 0.01 },
    Heroic: { Common: 0.3, Uncommon: 0.35, Rare: 0.25, Epic: 0.08, Legendary: 0.02 },
    Mythic: { Common: 0.1, Uncommon: 0.3, Rare: 0.35, Epic: 0.2, Legendary: 0.05 }
  }[difficulty];

  const rarity = rollRarity(rarityChances!);

  const itemTemplates = {
    boss_snowdon_dragon: {
      weapon: { name: "Dragon's Fang", icon: '🗡️', stats: { atk: 15, str: 8 } },
      armor: { name: "Dragonscale Plate", icon: '🛡️', stats: { def: 20, vit: 10 } },
      accessory: { name: "Dragon's Eye Amulet", icon: '💎', stats: { int: 12, atk: 5 } }
    },
    boss_ben_nevis_titan: {
      weapon: { name: "Titan's Hammer", icon: '🔨', stats: { atk: 18, str: 12 } },
      armor: { name: "Titan's Bulwark", icon: '🛡️', stats: { def: 25, vit: 15 } },
      accessory: { name: "Mountain Heart Stone", icon: '💎', stats: { vit: 15, def: 8 } }
    }
  };

  const template = itemTemplates[bossId as keyof typeof itemTemplates] || itemTemplates.boss_snowdon_dragon;
  const types: Array<'weapon' | 'armor' | 'accessory'> = ['weapon', 'armor', 'accessory'];
  const type = types[Math.floor(Math.random() * types.length)];
  const item = template[type];

  // Scale stats by rarity
  const statMultiplier = {
    Common: 1.0,
    Uncommon: 1.3,
    Rare: 1.6,
    Epic: 2.0,
    Legendary: 3.0
  }[rarity];

  const scaledStats: Record<string, number> = {};
  if (item.stats) {
    for (const [stat, value] of Object.entries(item.stats)) {
      scaledStats[stat] = Math.floor(value * statMultiplier);
    }
  }

  return {
    id: `${bossId}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${item.name}${rarity !== 'Common' ? ` (${rarity})` : ''}`,
    rarity,
    type,
    stats: scaledStats,
    icon: item.icon
  };
}

/**
 * Generate participation consumable
 */
function generateConsumable(difficulty: string): LootItem {
  const potions = [
    { name: 'Health Potion', icon: '🧪', stats: { heal: 50 } },
    { name: 'Mana Potion', icon: '⚗️', stats: { mana: 30 } },
    { name: 'Strength Elixir', icon: '💪', stats: { atk: 5, duration: 300 } },
    { name: 'Defense Tonic', icon: '🛡️', stats: { def: 5, duration: 300 } }
  ];

  const potion = potions[Math.floor(Math.random() * potions.length)];
  const quantity = {
    Normal: 2,
    Heroic: 3,
    Mythic: 5
  }[difficulty] || 2;

  return {
    id: `consumable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${potion.name} x${quantity}`,
    rarity: 'Common',
    type: 'consumable',
    stats: potion.stats,
    icon: potion.icon
  };
}

/**
 * Roll item rarity based on chances
 */
function rollRarity(chances: Record<string, number>): 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' {
  const roll = Math.random();
  let cumulative = 0;

  for (const [rarity, chance] of Object.entries(chances)) {
    cumulative += chance;
    if (roll < cumulative) {
      return rarity as any;
    }
  }

  return 'Common';
}

/**
 * Calculate MVP based on battle stats
 */
export function calculateMVP(battleStats: Record<string, {
  damageDealt: number;
  damageTaken: number;
  healing: number;
  deaths: number;
}>): string | undefined {
  const players = Object.entries(battleStats);
  if (players.length === 0) return undefined;

  // Score formula: damage + healing - (deaths * 500)
  const scores = players.map(([userId, stats]) => ({
    userId,
    score: stats.damageDealt + (stats.healing * 2) - (stats.deaths * 500)
  }));

  scores.sort((a, b) => b.score - a.score);
  return scores[0].userId;
}

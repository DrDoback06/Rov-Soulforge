import { geohashForLocation } from 'geofire-common';

export interface Enemy {
  id: string;
  name: string;
  type: 'goblin' | 'orc' | 'troll' | 'dragon' | 'undead' | 'beast' | 'elemental' | 'demon';
  level: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  abilities?: string[];
  loot: {
    xp: number;
    gold: number;
    cardDropChance: number; // 0-100
    cardRarity?: 'normal' | 'magic' | 'rare' | 'epic' | 'legendary';
  };
}

/**
 * Enemy Pool - All possible enemies that can spawn
 * Organized by difficulty
 */
export const ENEMY_POOL: Record<string, Enemy[]> = {
  easy: [
    {
      id: 'goblin_scout',
      name: 'Goblin Scout',
      type: 'goblin',
      level: 1,
      hp: 30,
      attack: 5,
      defense: 3,
      speed: 4,
      icon: '👺',
      color: '#22c55e',
      rarity: 'common',
      loot: {
        xp: 10,
        gold: 5,
        cardDropChance: 10,
        cardRarity: 'normal'
      }
    },
    {
      id: 'forest_wolf',
      name: 'Forest Wolf',
      type: 'beast',
      level: 2,
      hp: 35,
      attack: 7,
      defense: 4,
      speed: 6,
      icon: '🐺',
      color: '#22c55e',
      rarity: 'common',
      loot: {
        xp: 12,
        gold: 6,
        cardDropChance: 12,
        cardRarity: 'normal'
      }
    },
    {
      id: 'skeleton_warrior',
      name: 'Skeleton Warrior',
      type: 'undead',
      level: 3,
      hp: 40,
      attack: 6,
      defense: 5,
      speed: 3,
      icon: '💀',
      color: '#22c55e',
      rarity: 'common',
      loot: {
        xp: 15,
        gold: 8,
        cardDropChance: 15,
        cardRarity: 'normal'
      }
    }
  ],

  medium: [
    {
      id: 'orc_warrior',
      name: 'Orc Warrior',
      type: 'orc',
      level: 5,
      hp: 80,
      attack: 12,
      defense: 10,
      speed: 4,
      icon: '👹',
      color: '#f59e0b',
      rarity: 'uncommon',
      loot: {
        xp: 30,
        gold: 15,
        cardDropChance: 20,
        cardRarity: 'magic'
      }
    },
    {
      id: 'fire_elemental',
      name: 'Fire Elemental',
      type: 'elemental',
      level: 6,
      hp: 70,
      attack: 15,
      defense: 8,
      speed: 5,
      icon: '🔥',
      color: '#f59e0b',
      rarity: 'uncommon',
      abilities: ['Flame Burst'],
      loot: {
        xp: 35,
        gold: 18,
        cardDropChance: 25,
        cardRarity: 'magic'
      }
    },
    {
      id: 'dark_knight',
      name: 'Dark Knight',
      type: 'undead',
      level: 7,
      hp: 100,
      attack: 14,
      defense: 12,
      speed: 4,
      icon: '⚔️',
      color: '#f59e0b',
      rarity: 'uncommon',
      loot: {
        xp: 40,
        gold: 20,
        cardDropChance: 22,
        cardRarity: 'magic'
      }
    }
  ],

  hard: [
    {
      id: 'troll_berserker',
      name: 'Troll Berserker',
      type: 'troll',
      level: 10,
      hp: 150,
      attack: 20,
      defense: 15,
      speed: 3,
      icon: '🧌',
      color: '#ef4444',
      rarity: 'rare',
      abilities: ['Rage', 'Regeneration'],
      loot: {
        xp: 60,
        gold: 30,
        cardDropChance: 35,
        cardRarity: 'rare'
      }
    },
    {
      id: 'shadow_demon',
      name: 'Shadow Demon',
      type: 'demon',
      level: 12,
      hp: 130,
      attack: 25,
      defense: 12,
      speed: 7,
      icon: '👿',
      color: '#ef4444',
      rarity: 'rare',
      abilities: ['Shadow Strike', 'Phase'],
      loot: {
        xp: 70,
        gold: 35,
        cardDropChance: 40,
        cardRarity: 'rare'
      }
    },
    {
      id: 'ice_golem',
      name: 'Ice Golem',
      type: 'elemental',
      level: 11,
      hp: 180,
      attack: 18,
      defense: 20,
      speed: 2,
      icon: '🗿',
      color: '#ef4444',
      rarity: 'rare',
      abilities: ['Frost Armor', 'Ice Shatter'],
      loot: {
        xp: 65,
        gold: 32,
        cardDropChance: 38,
        cardRarity: 'rare'
      }
    }
  ],

  epic: [
    {
      id: 'ancient_dragon',
      name: 'Ancient Dragon',
      type: 'dragon',
      level: 15,
      hp: 250,
      attack: 30,
      defense: 25,
      speed: 6,
      icon: '🐉',
      color: '#a855f7',
      rarity: 'epic',
      abilities: ['Dragon Breath', 'Wing Buffet', 'Tail Swipe'],
      loot: {
        xp: 100,
        gold: 50,
        cardDropChance: 50,
        cardRarity: 'epic'
      }
    },
    {
      id: 'lich_lord',
      name: 'Lich Lord',
      type: 'undead',
      level: 16,
      hp: 220,
      attack: 28,
      defense: 22,
      speed: 5,
      icon: '☠️',
      color: '#a855f7',
      rarity: 'epic',
      abilities: ['Death Bolt', 'Summon Undead', 'Life Drain'],
      loot: {
        xp: 110,
        gold: 55,
        cardDropChance: 55,
        cardRarity: 'epic'
      }
    }
  ],

  legendary: [
    {
      id: 'demon_lord',
      name: 'Demon Lord Azrathus',
      type: 'demon',
      level: 20,
      hp: 400,
      attack: 40,
      defense: 30,
      speed: 8,
      icon: '😈',
      color: '#fbbf24',
      rarity: 'legendary',
      abilities: ['Hellfire', 'Demonic Possession', 'Chaos Storm', 'Summon Minions'],
      loot: {
        xp: 200,
        gold: 100,
        cardDropChance: 75,
        cardRarity: 'legendary'
      }
    },
    {
      id: 'primordial_titan',
      name: 'Primordial Titan',
      type: 'elemental',
      level: 22,
      hp: 500,
      attack: 38,
      defense: 35,
      speed: 4,
      icon: '⚡',
      color: '#fbbf24',
      rarity: 'legendary',
      abilities: ['Earthquake', 'Thunder Strike', 'Stone Skin', 'Elemental Fury'],
      loot: {
        xp: 250,
        gold: 125,
        cardDropChance: 80,
        cardRarity: 'legendary'
      }
    }
  ]
};

/**
 * Get random enemies for a quest based on difficulty
 */
export function getEnemiesForQuest(
  difficulty: 'easy' | 'medium' | 'hard' | 'epic' | 'legendary',
  count: number
): Enemy[] {
  const pool = ENEMY_POOL[difficulty] || ENEMY_POOL.medium;
  const enemies: Enemy[] = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const baseEnemy = pool[randomIndex];

    // Create a unique instance with a unique ID
    enemies.push({
      ...baseEnemy,
      id: `${baseEnemy.id}_${Date.now()}_${i}`
    });
  }

  return enemies;
}

/**
 * Spawn enemies in proximity to quest location
 * Distributes enemies within a radius around the main quest point
 */
export function spawnEnemiesNearQuest(
  questLatitude: number,
  questLongitude: number,
  enemies: Enemy[],
  spreadRadius: number = 50 // meters
): Array<{ enemy: Enemy; latitude: number; longitude: number; geohash: string; defeated: boolean }> {
  const spawnedEnemies = [];

  for (let i = 0; i < enemies.length; i++) {
    // Random angle for circular distribution
    const angle = Math.random() * 2 * Math.PI;

    // Random distance within spread radius (0 to spreadRadius meters)
    const distance = Math.random() * spreadRadius;

    // Convert meters to degrees (approximate)
    // 1 degree latitude = ~111km
    const latOffset = (distance / 111000) * Math.cos(angle);
    const lngOffset = (distance / 111000) * Math.sin(angle) / Math.cos(questLatitude * Math.PI / 180);

    const spawnLat = questLatitude + latOffset;
    const spawnLng = questLongitude + lngOffset;

    spawnedEnemies.push({
      enemy: enemies[i],
      latitude: spawnLat,
      longitude: spawnLng,
      geohash: geohashForLocation([spawnLat, spawnLng]),
      defeated: false
    });
  }

  return spawnedEnemies;
}

/**
 * Get boss enemy for boss quests
 * Bosses have multiple phases
 */
export function getBossEnemy(difficulty: 'epic' | 'legendary', phases: number = 2): Enemy[] {
  const bossPool = difficulty === 'legendary' ? ENEMY_POOL.legendary : ENEMY_POOL.epic;
  const baseBoss = bossPool[Math.floor(Math.random() * bossPool.length)];

  const bossPhases: Enemy[] = [];

  for (let phase = 1; phase <= phases; phase++) {
    bossPhases.push({
      ...baseBoss,
      id: `${baseBoss.id}_phase${phase}`,
      name: `${baseBoss.name} - Phase ${phase}`,
      hp: baseBoss.hp * phase, // HP increases each phase
      attack: baseBoss.attack + (phase - 1) * 5, // Attack increases each phase
      defense: baseBoss.defense + (phase - 1) * 3,
      loot: {
        ...baseBoss.loot,
        xp: baseBoss.loot.xp * phase,
        gold: baseBoss.loot.gold * phase,
        cardDropChance: Math.min(100, baseBoss.loot.cardDropChance + phase * 10)
      }
    });
  }

  return bossPhases;
}

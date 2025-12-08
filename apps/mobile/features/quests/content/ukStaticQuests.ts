import { collection, addDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * UK Static Quests Database
 * 
 * Epic landmarks and locations across the UK
 * These quests are always available and visible to all players
 * Perfect for the "Search This Area" feature
 */

export const UK_STATIC_QUESTS: Omit<EnhancedQuest, 'id'>[] = [
  // LONDON
  {
    title: 'Tower of London Guardians',
    type: 'landmark',
    difficulty: 'epic',
    status: 'available',
    visibility: 'static',
    description: 'Guard the ancient Tower of London and protect the Crown Jewels from shadowy threats.',
    lore: 'For over 1000 years, the Tower has stood as a symbol of royal power. Now dark forces seek to claim its treasures.',
    location: {
      latitude: 51.5081,
      longitude: -0.0759,
      geohash: geohashForLocation([51.5081, -0.0759]),
      name: 'Tower of London',
      type: 'landmark'
    },
    activationRadius: 200,
    acceptRadius: 100,
    objectives: [
      {
        id: 'guard-tower',
        type: 'battle',
        description: 'Defeat 15 shadow guardians',
        target: 15,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          enemyTypes: ['shadow_guardian', 'dark_knight'],
          enemyCount: 15,
          spawnedEnemies: []
        }
      }
    ],
    rewards: {
      gold: 2000,
      xp: 5000,
      items: [
        {
          id: 'crown_jewel_fragment',
          type: 'legendary',
          rarity: 'legendary',
          quantity: 1,
          needsIdentification: false
        }
      ],
      renown: 500
    },
    requiredLevel: 15,
    recommendedLevel: 20,
    spawnedAt: new Date(),
    maxPlayers: 6,
    coopBonusPerPlayer: 50,
    isLegendary: true,
    isBoss: false,
    icon: '🏰',
    color: '#ffd700',
    tags: ['combat', 'legendary', 'london'],
    createdBy: 'system',
    completionCount: 0
  },

  // EDINBURGH
  {
    title: 'Edinburgh Castle Siege',
    type: 'landmark',
    difficulty: 'epic',
    status: 'available',
    visibility: 'static',
    description: 'Defend Edinburgh Castle against an ancient dragon that has awakened from its slumber.',
    lore: 'High above the city, Edinburgh Castle has witnessed countless battles. Now a dragon from the old world has returned to claim its ancient throne.',
    location: {
      latitude: 55.9486,
      longitude: -3.2008,
      geohash: geohashForLocation([55.9486, -3.2008]),
      name: 'Edinburgh Castle',
      type: 'landmark'
    },
    activationRadius: 300,
    acceptRadius: 150,
    objectives: [
      {
        id: 'defeat-dragon',
        type: 'battle',
        description: 'Defeat the Ancient Dragon',
        target: 1,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          enemyTypes: ['ancient_dragon'],
          enemyCount: 1,
          spawnedEnemies: []
        }
      }
    ],
    rewards: {
      gold: 5000,
      xp: 10000,
      items: [
        {
          id: 'dragon_scale_armor',
          type: 'legendary',
          rarity: 'legendary',
          quantity: 1,
          needsIdentification: false
        }
      ],
      renown: 1000
    },
    requiredLevel: 25,
    recommendedLevel: 30,
    spawnedAt: new Date(),
    maxPlayers: 8,
    coopBonusPerPlayer: 100,
    isLegendary: true,
    isBoss: true,
    icon: '🐉',
    color: '#ff6b6b',
    tags: ['combat', 'legendary', 'boss', 'edinburgh'],
    createdBy: 'system',
    completionCount: 0
  },

  // STONEHENGE
  {
    title: 'Stonehenge Mysteries',
    type: 'landmark',
    difficulty: 'epic',
    status: 'available',
    visibility: 'static',
    description: 'Uncover the ancient secrets of Stonehenge and restore its magical properties.',
    lore: 'For millennia, Stonehenge has stood as a gateway between worlds. Now its power wanes, and only a chosen few can restore its ancient magic.',
    location: {
      latitude: 51.1789,
      longitude: -1.8262,
      geohash: geohashForLocation([51.1789, -1.8262]),
      name: 'Stonehenge',
      type: 'landmark'
    },
    activationRadius: 500,
    acceptRadius: 200,
    objectives: [
      {
        id: 'restore-stones',
        type: 'collect',
        description: 'Collect 7 ancient stone fragments',
        target: 7,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          collectibleItems: ['Stone Fragment 1', 'Stone Fragment 2', 'Stone Fragment 3', 'Stone Fragment 4', 'Stone Fragment 5', 'Stone Fragment 6', 'Stone Fragment 7']
        }
      }
    ],
    rewards: {
      gold: 3000,
      xp: 7500,
      items: [
        {
          id: 'stonehenge_amulet',
          type: 'legendary',
          rarity: 'legendary',
          quantity: 1,
          needsIdentification: false
        }
      ],
      renown: 750
    },
    requiredLevel: 20,
    recommendedLevel: 25,
    spawnedAt: new Date(),
    maxPlayers: 4,
    coopBonusPerPlayer: 75,
    isLegendary: true,
    isBoss: false,
    icon: '🗿',
    color: '#8b5cf6',
    tags: ['collection', 'legendary', 'mystery', 'stonehenge'],
    createdBy: 'system',
    completionCount: 0
  },

  // CARDIFF
  {
    title: 'Cardiff Castle Dragons',
    type: 'landmark',
    difficulty: 'hard',
    status: 'available',
    visibility: 'static',
    description: 'Explore Cardiff Castle and discover the dragon legends hidden within its walls.',
    lore: 'Cardiff Castle holds many secrets, including ancient dragon legends that few believe are real. Your investigation may prove otherwise.',
    location: {
      latitude: 51.4816,
      longitude: -3.1791,
      geohash: geohashForLocation([51.4816, -3.1791]),
      name: 'Cardiff Castle',
      type: 'landmark'
    },
    activationRadius: 150,
    acceptRadius: 75,
    objectives: [
      {
        id: 'explore-castle',
        type: 'exploration',
        description: 'Explore 5 castle locations',
        target: 5,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          locations: ['Great Hall', 'Dragon Tower', 'Ancient Library', 'Secret Chamber', 'Dragon\'s Lair']
        }
      }
    ],
    rewards: {
      gold: 1500,
      xp: 3000,
      items: [
        {
          id: 'dragon_legend_scroll',
          type: 'rare',
          rarity: 'rare',
          quantity: 1,
          needsIdentification: true
        }
      ],
      renown: 300
    },
    requiredLevel: 10,
    recommendedLevel: 15,
    spawnedAt: new Date(),
    maxPlayers: 3,
    coopBonusPerPlayer: 50,
    isLegendary: false,
    isBoss: false,
    icon: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    color: '#ef4444',
    tags: ['exploration', 'cardiff', 'dragons'],
    createdBy: 'system',
    completionCount: 0
  },

  // BATH
  {
    title: 'Roman Baths Restoration',
    type: 'landmark',
    difficulty: 'medium',
    status: 'available',
    visibility: 'static',
    description: 'Help restore the ancient Roman Baths and uncover their healing properties.',
    lore: 'The Roman Baths have been a place of healing for centuries. Now their waters run dry, and only ancient magic can restore them.',
    location: {
      latitude: 51.3811,
      longitude: -2.3590,
      geohash: geohashForLocation([51.3811, -2.3590]),
      name: 'Roman Baths',
      type: 'landmark'
    },
    activationRadius: 100,
    acceptRadius: 50,
    objectives: [
      {
        id: 'restore-waters',
        type: 'collect',
        description: 'Collect 10 healing crystals',
        target: 10,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          collectibleItems: ['Healing Crystal 1', 'Healing Crystal 2', 'Healing Crystal 3', 'Healing Crystal 4', 'Healing Crystal 5', 'Healing Crystal 6', 'Healing Crystal 7', 'Healing Crystal 8', 'Healing Crystal 9', 'Healing Crystal 10']
        }
      }
    ],
    rewards: {
      gold: 800,
      xp: 1500,
      items: [
        {
          id: 'healing_potion',
          type: 'magic',
          rarity: 'magic',
          quantity: 3,
          needsIdentification: false
        }
      ],
      renown: 150
    },
    requiredLevel: 5,
    recommendedLevel: 8,
    spawnedAt: new Date(),
    maxPlayers: 2,
    coopBonusPerPlayer: 25,
    isLegendary: false,
    isBoss: false,
    icon: '🏛️',
    color: '#3b82f6',
    tags: ['collection', 'healing', 'bath'],
    createdBy: 'system',
    completionCount: 0
  },

  // YORK
  {
    title: 'York Minster Shadows',
    type: 'landmark',
    difficulty: 'hard',
    status: 'available',
    visibility: 'static',
    description: 'Investigate the shadowy figures that have been seen around York Minster at night.',
    lore: 'York Minster has stood for over 1000 years, but recently, shadowy figures have been spotted in its ancient halls. What dark secrets do they hide?',
    location: {
      latitude: 53.9623,
      longitude: -1.0819,
      geohash: geohashForLocation([53.9623, -1.0819]),
      name: 'York Minster',
      type: 'landmark'
    },
    activationRadius: 200,
    acceptRadius: 100,
    objectives: [
      {
        id: 'investigate-shadows',
        type: 'battle',
        description: 'Defeat 8 shadow creatures',
        target: 8,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          enemyTypes: ['shadow_priest', 'dark_acolyte'],
          enemyCount: 8,
          spawnedEnemies: []
        }
      }
    ],
    rewards: {
      gold: 1200,
      xp: 2500,
      items: [
        {
          id: 'holy_symbol',
          type: 'rare',
          rarity: 'rare',
          quantity: 1,
          needsIdentification: true
        }
      ],
      renown: 250
    },
    requiredLevel: 8,
    recommendedLevel: 12,
    spawnedAt: new Date(),
    maxPlayers: 4,
    coopBonusPerPlayer: 40,
    isLegendary: false,
    isBoss: false,
    icon: '⛪',
    color: '#f59e0b',
    tags: ['combat', 'mystery', 'york'],
    createdBy: 'system',
    completionCount: 0
  },

  // BIRMINGHAM
  {
    title: 'Birmingham Library Archives',
    type: 'landmark',
    difficulty: 'medium',
    status: 'available',
    visibility: 'static',
    description: 'Help organize the ancient archives and discover lost knowledge.',
    lore: 'The Birmingham Library holds countless ancient texts, but many have been misplaced over the years. Your help is needed to restore order.',
    location: {
      latitude: 52.4796,
      longitude: -1.9027,
      geohash: geohashForLocation([52.4796, -1.9027]),
      name: 'Birmingham Library',
      type: 'landmark'
    },
    activationRadius: 100,
    acceptRadius: 50,
    objectives: [
      {
        id: 'organize-archives',
        type: 'collect',
        description: 'Find and organize 12 lost books',
        target: 12,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          collectibleItems: ['Ancient Tome 1', 'Ancient Tome 2', 'Ancient Tome 3', 'Ancient Tome 4', 'Ancient Tome 5', 'Ancient Tome 6', 'Ancient Tome 7', 'Ancient Tome 8', 'Ancient Tome 9', 'Ancient Tome 10', 'Ancient Tome 11', 'Ancient Tome 12']
        }
      }
    ],
    rewards: {
      gold: 600,
      xp: 1200,
      items: [
        {
          id: 'knowledge_scroll',
          type: 'magic',
          rarity: 'magic',
          quantity: 2,
          needsIdentification: true
        }
      ],
      renown: 100
    },
    requiredLevel: 3,
    recommendedLevel: 6,
    spawnedAt: new Date(),
    maxPlayers: 2,
    coopBonusPerPlayer: 20,
    isLegendary: false,
    isBoss: false,
    icon: '📚',
    color: '#10b981',
    tags: ['collection', 'knowledge', 'birmingham'],
    createdBy: 'system',
    completionCount: 0
  },

  // MANCHESTER
  {
    title: 'Manchester Cathedral Quest',
    type: 'landmark',
    difficulty: 'medium',
    status: 'available',
    visibility: 'static',
    description: 'Investigate the mysterious lights that appear in Manchester Cathedral at midnight.',
    lore: 'Manchester Cathedral has been a place of worship for centuries, but recently, mysterious lights have been seen dancing in its ancient halls.',
    location: {
      latitude: 53.4853,
      longitude: -2.2426,
      geohash: geohashForLocation([53.4853, -2.2426]),
      name: 'Manchester Cathedral',
      type: 'landmark'
    },
    activationRadius: 120,
    acceptRadius: 60,
    objectives: [
      {
        id: 'investigate-lights',
        type: 'exploration',
        description: 'Investigate 6 cathedral locations',
        target: 6,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          locations: ['Main Altar', 'Crypt', 'Bell Tower', 'Choir Stalls', 'Nave', 'Chapel']
        }
      }
    ],
    rewards: {
      gold: 700,
      xp: 1400,
      items: [
        {
          id: 'blessed_candle',
          type: 'magic',
          rarity: 'magic',
          quantity: 1,
          needsIdentification: false
        }
      ],
      renown: 120
    },
    requiredLevel: 4,
    recommendedLevel: 7,
    spawnedAt: new Date(),
    maxPlayers: 3,
    coopBonusPerPlayer: 30,
    isLegendary: false,
    isBoss: false,
    icon: '🕯️',
    color: '#8b5cf6',
    tags: ['exploration', 'mystery', 'manchester'],
    createdBy: 'system',
    completionCount: 0
  },

  // LIVERPOOL
  {
    title: 'Liverpool Docks Adventure',
    type: 'landmark',
    difficulty: 'medium',
    status: 'available',
    visibility: 'static',
    description: 'Explore the historic Liverpool Docks and discover maritime secrets.',
    lore: 'Liverpool\'s docks have seen countless ships and sailors over the years. Many secrets lie buried in their storied past.',
    location: {
      latitude: 53.4084,
      longitude: -2.9916,
      geohash: geohashForLocation([53.4084, -2.9916]),
      name: 'Liverpool Docks',
      type: 'landmark'
    },
    activationRadius: 150,
    acceptRadius: 75,
    objectives: [
      {
        id: 'explore-docks',
        type: 'exploration',
        description: 'Explore 4 dock areas',
        target: 4,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          locations: ['Albert Dock', 'Pier Head', 'Canning Dock', 'Wapping Dock']
        }
      }
    ],
    rewards: {
      gold: 800,
      xp: 1600,
      items: [
        {
          id: 'sailor_compass',
          type: 'magic',
          rarity: 'magic',
          quantity: 1,
          needsIdentification: true
        }
      ],
      renown: 140
    },
    requiredLevel: 5,
    recommendedLevel: 8,
    spawnedAt: new Date(),
    maxPlayers: 3,
    coopBonusPerPlayer: 35,
    isLegendary: false,
    isBoss: false,
    icon: '⚓',
    color: '#06b6d4',
    tags: ['exploration', 'maritime', 'liverpool'],
    createdBy: 'system',
    completionCount: 0
  },

  // GLASGOW
  {
    title: 'Glasgow Cathedral Mysteries',
    type: 'landmark',
    difficulty: 'hard',
    status: 'available',
    visibility: 'static',
    description: 'Uncover the ancient mysteries hidden within Glasgow Cathedral.',
    lore: 'Glasgow Cathedral has stood for over 800 years, and its ancient walls hold many secrets. Some say the spirits of the past still walk its halls.',
    location: {
      latitude: 55.8631,
      longitude: -4.2340,
      geohash: geohashForLocation([55.8631, -4.2340]),
      name: 'Glasgow Cathedral',
      type: 'landmark'
    },
    activationRadius: 180,
    acceptRadius: 90,
    objectives: [
      {
        id: 'uncover-mysteries',
        type: 'battle',
        description: 'Defeat 6 spirit guardians',
        target: 6,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          enemyTypes: ['spirit_guardian', 'ancient_priest'],
          enemyCount: 6,
          spawnedEnemies: []
        }
      }
    ],
    rewards: {
      gold: 1000,
      xp: 2000,
      items: [
        {
          id: 'spirit_amulet',
          type: 'rare',
          rarity: 'rare',
          quantity: 1,
          needsIdentification: true
        }
      ],
      renown: 200
    },
    requiredLevel: 7,
    recommendedLevel: 10,
    spawnedAt: new Date(),
    maxPlayers: 4,
    coopBonusPerPlayer: 40,
    isLegendary: false,
    isBoss: false,
    icon: '👻',
    color: '#6366f1',
    tags: ['combat', 'mystery', 'glasgow'],
    createdBy: 'system',
    completionCount: 0
  }
];

/**
 * Seed UK Static Quests
 * 
 * Adds all UK static quests to Firestore
 * These quests are always available and visible to all players
 */
export async function seedUKStaticQuests(db: Firestore): Promise<void> {
  console.log('🌍 Seeding UK Static Quests...');
  
  try {
    const staticQuestsRef = collection(db, 'staticQuests');
    
    for (const quest of UK_STATIC_QUESTS) {
      await addDoc(staticQuestsRef, quest);
      console.log(`   ✅ Added: ${quest.title}`);
    }
    
    console.log(`   🌟 Seeded ${UK_STATIC_QUESTS.length} UK static quests!`);
  } catch (error) {
    console.error('Error seeding UK static quests:', error);
    throw error;
  }
}

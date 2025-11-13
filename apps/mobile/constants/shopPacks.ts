/**
 * Shop Pack Definitions
 *
 * Predefined card packs available in the shop
 */

import type { CardPack } from '@/types/shop';

export const CARD_PACKS: Record<string, CardPack> = {
  // Basic pack - Common/Uncommon focus
  basic: {
    id: 'basic',
    name: 'Basic Pack',
    description: '5 cards with a guaranteed uncommon',
    icon: '📦',
    price: {
      gold: 100
    },
    guaranteedCards: 5,
    guaranteedRare: 0,
    guaranteedEpic: 0,
    guaranteedLegendary: 0,
    rarity: {
      common: 70,
      uncommon: 25,
      rare: 4,
      epic: 0.9,
      legendary: 0.1,
      mythic: 0
    },
    gradientColors: ['#6b7280', '#4b5563']
  },

  // Standard pack - Balanced
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    description: '5 cards with a guaranteed rare',
    icon: '🎁',
    price: {
      gold: 250
    },
    guaranteedCards: 5,
    guaranteedRare: 1,
    guaranteedEpic: 0,
    guaranteedLegendary: 0,
    rarity: {
      common: 55,
      uncommon: 30,
      rare: 12,
      epic: 2.5,
      legendary: 0.5,
      mythic: 0
    },
    gradientColors: ['#3b82f6', '#2563eb'],
    featured: true
  },

  // Premium pack - Epic guarantee
  premium: {
    id: 'premium',
    name: 'Premium Pack',
    description: '7 cards with a guaranteed epic',
    icon: '💎',
    price: {
      gold: 500,
      gems: 50
    },
    guaranteedCards: 7,
    guaranteedRare: 2,
    guaranteedEpic: 1,
    guaranteedLegendary: 0,
    rarity: {
      common: 40,
      uncommon: 35,
      rare: 18,
      epic: 6,
      legendary: 1,
      mythic: 0
    },
    gradientColors: ['#a855f7', '#9333ea']
  },

  // Legendary pack - High-end
  legendary: {
    id: 'legendary',
    name: 'Legendary Pack',
    description: '10 cards with a guaranteed legendary',
    icon: '⭐',
    price: {
      gold: 1000,
      gems: 100
    },
    guaranteedCards: 10,
    guaranteedRare: 3,
    guaranteedEpic: 2,
    guaranteedLegendary: 1,
    rarity: {
      common: 30,
      uncommon: 30,
      rare: 25,
      epic: 12,
      legendary: 2.9,
      mythic: 0.1
    },
    gradientColors: ['#fbbf24', '#f59e0b']
  },

  // Mythic pack - Ultra rare
  mythic: {
    id: 'mythic',
    name: 'Mythic Pack',
    description: '15 cards with guaranteed legendary + chance at mythic',
    icon: '✨',
    price: {
      gems: 250,
      realMoney: 999 // $9.99
    },
    guaranteedCards: 15,
    guaranteedRare: 5,
    guaranteedEpic: 3,
    guaranteedLegendary: 2,
    rarity: {
      common: 25,
      uncommon: 25,
      rare: 25,
      epic: 15,
      legendary: 9,
      mythic: 1
    },
    gradientColors: ['#e11d48', '#be123c']
  }
};

export const DEFAULT_PITY_THRESHOLDS = {
  epic: 10,
  legendary: 40,
  mythic: 100
};

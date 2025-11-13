/**
 * Pack Opening Logic
 *
 * Handles card pack opening with pity system
 */

import type { CardPack, PitySystem, PackOpeningResult } from '@/types/shop';
import type { Card } from '@rov/types';
import { DEFAULT_PITY_THRESHOLDS } from '@/constants/shopPacks';

/**
 * Open a card pack with pity system
 */
export function openPack(
  pack: CardPack,
  pityData: PitySystem,
  availableCards: Card[]
): { result: PackOpeningResult; updatedPity: PitySystem } {
  const cards: PackOpeningResult['cards'] = [];
  let pityTriggered: PackOpeningResult['pityTriggered'] | undefined;

  // Increment pity counters
  const updatedPity: PitySystem = {
    ...pityData,
    pullsSinceEpic: pityData.pullsSinceEpic + 1,
    pullsSinceLegendary: pityData.pullsSinceLegendary + 1,
    pullsSinceMythic: pityData.pullsSinceMythic + 1,
    totalPulls: pityData.totalPulls + pack.guaranteedCards,
    lastUpdated: Date.now()
  };

  // Guaranteed cards
  const guarantees: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'> = [];

  // Add explicit guarantees
  for (let i = 0; i < pack.guaranteedLegendary; i++) {
    guarantees.push('legendary');
  }
  for (let i = 0; i < pack.guaranteedEpic; i++) {
    guarantees.push('epic');
  }
  for (let i = 0; i < pack.guaranteedRare; i++) {
    guarantees.push('rare');
  }

  // Fill remaining slots
  const remainingSlots = pack.guaranteedCards - guarantees.length;

  // Check pity system
  if (updatedPity.pullsSinceMythic >= updatedPity.mythicPityThreshold) {
    guarantees.push('mythic');
    pityTriggered = {
      rarity: 'mythic',
      pullCount: updatedPity.pullsSinceMythic
    };
    updatedPity.pullsSinceMythic = 0;
    updatedPity.mythicPulls += 1;
  } else if (updatedPity.pullsSinceLegendary >= updatedPity.legendaryPityThreshold) {
    guarantees.push('legendary');
    pityTriggered = {
      rarity: 'legendary',
      pullCount: updatedPity.pullsSinceLegendary
    };
    updatedPity.pullsSinceLegendary = 0;
    updatedPity.legendaryPulls += 1;
  } else if (updatedPity.pullsSinceEpic >= updatedPity.epicPityThreshold) {
    guarantees.push('epic');
    pityTriggered = {
      rarity: 'epic',
      pullCount: updatedPity.pullsSinceEpic
    };
    updatedPity.pullsSinceEpic = 0;
    updatedPity.epicPulls += 1;
  }

  // Generate cards based on guarantees
  for (const rarity of guarantees) {
    const card = getRandomCardByRarity(availableCards, rarity);
    if (card) {
      cards.push({
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        type: card.type,
        icon: getCardIcon(card.type),
        isPityCard: pityTriggered?.rarity === rarity
      });

      // Reset pity counters if high rarity pulled
      if (rarity === 'mythic') {
        updatedPity.pullsSinceMythic = 0;
        updatedPity.pullsSinceLegendary = 0;
        updatedPity.pullsSinceEpic = 0;
        updatedPity.mythicPulls += 1;
      } else if (rarity === 'legendary') {
        updatedPity.pullsSinceLegendary = 0;
        updatedPity.pullsSinceEpic = 0;
        updatedPity.legendaryPulls += 1;
      } else if (rarity === 'epic') {
        updatedPity.pullsSinceEpic = 0;
        updatedPity.epicPulls += 1;
      }
    }
  }

  // Fill remaining slots with random cards based on drop rates
  for (let i = 0; i < remainingSlots; i++) {
    const rarity = rollRarity(pack.rarity);
    const card = getRandomCardByRarity(availableCards, rarity);

    if (card) {
      cards.push({
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        type: card.type,
        icon: getCardIcon(card.type)
      });

      // Reset pity if high rarity pulled naturally
      if (rarity === 'mythic') {
        updatedPity.pullsSinceMythic = 0;
        updatedPity.pullsSinceLegendary = 0;
        updatedPity.pullsSinceEpic = 0;
        updatedPity.mythicPulls += 1;
      } else if (rarity === 'legendary') {
        updatedPity.pullsSinceLegendary = 0;
        updatedPity.pullsSinceEpic = 0;
        updatedPity.legendaryPulls += 1;
      } else if (rarity === 'epic') {
        updatedPity.pullsSinceEpic = 0;
        updatedPity.epicPulls += 1;
      }
    }
  }

  const result: PackOpeningResult = {
    packId: pack.id,
    packName: pack.name,
    cards,
    pityTriggered,
    timestamp: Date.now()
  };

  return { result, updatedPity };
}

/**
 * Roll for rarity based on drop rates
 */
function rollRarity(
  rates: CardPack['rarity']
): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' {
  const roll = Math.random() * 100;
  let cumulative = 0;

  const rarities: Array<keyof typeof rates> = [
    'mythic',
    'legendary',
    'epic',
    'rare',
    'uncommon',
    'common'
  ];

  for (const rarity of rarities) {
    cumulative += rates[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }

  return 'common';
}

/**
 * Get a random card of specific rarity
 */
function getRandomCardByRarity(
  cards: Card[],
  rarity: string
): Card | null {
  const cardsOfRarity = cards.filter((c) => c.rarity === rarity);
  if (cardsOfRarity.length === 0) {
    // Fallback to common if no cards of that rarity
    return cards.find((c) => c.rarity === 'common') || cards[0] || null;
  }

  const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
  return cardsOfRarity[randomIndex];
}

function getCardIcon(type: string): string {
  const icons: Record<string, string> = {
    action: '⚔️',
    skill: '✨',
    loot: '🎁',
    creature: '🐉',
    spell: '🔮',
    artifact: '⚡'
  };
  return icons[type] || '🎴';
}

/**
 * Initialize pity system for a user/pack
 */
export function initializePitySystem(userId: string, packId: string): PitySystem {
  return {
    userId,
    packId,
    pullsSinceEpic: 0,
    pullsSinceLegendary: 0,
    pullsSinceMythic: 0,
    epicPityThreshold: DEFAULT_PITY_THRESHOLDS.epic,
    legendaryPityThreshold: DEFAULT_PITY_THRESHOLDS.legendary,
    mythicPityThreshold: DEFAULT_PITY_THRESHOLDS.mythic,
    totalPulls: 0,
    epicPulls: 0,
    legendaryPulls: 0,
    mythicPulls: 0,
    lastUpdated: Date.now()
  };
}

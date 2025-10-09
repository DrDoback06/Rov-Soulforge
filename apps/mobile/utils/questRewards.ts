import { doc, updateDoc, getDoc, collection, addDoc, increment } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { QuestReward } from '@/types/quest-enhanced';
import type { Card } from '@rov/types';

/**
 * Quest Reward Distribution System
 *
 * Handles distributing rewards to players
 * Includes Diablo-style unidentified items, co-op bonuses, magic find
 */

export interface RewardDistributionResult {
  success: boolean;
  rewards: {
    gold: number;
    xp: number;
    items: Card[];
  };
  inventoryFull: boolean;
  overflowItems?: Card[];
}

const INVENTORY_CAPACITY = 50;

/**
 * Calculate actual rewards with co-op bonuses
 */
export function calculateRewards(
  baseRewards: QuestReward,
  teamSize: number = 1,
  coopBonusPerPlayer: number = 25
): QuestReward {
  if (teamSize <= 1) return baseRewards;

  const bonusMultiplier = 1 + ((teamSize - 1) * coopBonusPerPlayer / 100);

  return {
    gold: Math.floor(baseRewards.gold * bonusMultiplier),
    xp: Math.floor(baseRewards.xp * bonusMultiplier),
    items: baseRewards.items,
    magicFind: (baseRewards.magicFind || 0) + ((teamSize - 1) * 10) // +10% MF per extra player
  };
}

/**
 * Generate random unidentified item (Diablo-style)
 */
function generateUnidentifiedItem(
  rarity: 'normal' | 'magic' | 'rare' | 'epic' | 'legendary' | 'set' | 'unique',
  magicFind: number = 0
): Card {
  // Apply magic find to rarity chance
  const mfBonus = magicFind / 100;

  // Upgrade rarity based on magic find
  let finalRarity = rarity;
  if (Math.random() < mfBonus * 0.1) {
    // Chance to upgrade rarity
    const rarityLevels = ['normal', 'magic', 'rare', 'epic', 'legendary', 'set', 'unique'];
    const currentIndex = rarityLevels.indexOf(rarity);
    if (currentIndex < rarityLevels.length - 1) {
      finalRarity = rarityLevels[currentIndex + 1] as any;
    }
  }

  // Random card type
  const cardTypes = ['monster', 'spell', 'equipment', 'consumable'];
  const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];

  return {
    id: `unidentified_${Date.now()}_${Math.random()}`,
    name: `Unidentified ${finalRarity.charAt(0).toUpperCase() + finalRarity.slice(1)} Item`,
    type: cardType as any,
    rarity: finalRarity as any,
    cost: 0,
    description: 'This item must be identified before it can be used.',
    attack: 0,
    health: 0,
    isUnidentified: true,
    identificationCost: getIdentificationCost(finalRarity)
  } as Card;
}

/**
 * Get identification cost based on rarity
 */
function getIdentificationCost(rarity: string): number {
  switch (rarity) {
    case 'normal': return 10;
    case 'magic': return 25;
    case 'rare': return 50;
    case 'epic': return 100;
    case 'legendary': return 250;
    case 'set': return 500;
    case 'unique': return 1000;
    default: return 10;
  }
}

/**
 * Roll for item drops based on rewards
 */
function rollItemDrops(rewards: QuestReward): Card[] {
  const droppedItems: Card[] = [];

  if (!rewards.items || rewards.items.length === 0) return droppedItems;

  for (const itemReward of rewards.items) {
    if (itemReward.needsIdentification || itemReward.type === 'unidentified') {
      // Generate unidentified item
      const item = generateUnidentifiedItem(
        itemReward.rarity,
        rewards.magicFind || 0
      );
      droppedItems.push(item);
    } else {
      // Generate identified item (simplified - you'd have actual item generation here)
      const item: Card = {
        id: `${itemReward.type}_${Date.now()}_${Math.random()}`,
        name: `${itemReward.rarity} ${itemReward.cardType || 'Item'}`,
        type: itemReward.cardType || 'equipment' as any,
        rarity: itemReward.rarity as any,
        cost: Math.floor(Math.random() * 100),
        description: `A ${itemReward.rarity} item.`,
        attack: Math.floor(Math.random() * 20),
        health: Math.floor(Math.random() * 20)
      } as Card;

      droppedItems.push(item);
    }
  }

  return droppedItems;
}

/**
 * Distribute rewards to player
 */
export async function distributeQuestRewards(
  db: Firestore,
  userId: string,
  rewards: QuestReward,
  teamSize: number = 1,
  coopBonusPerPlayer: number = 25
): Promise<RewardDistributionResult> {
  try {
    // Calculate final rewards with bonuses
    const finalRewards = calculateRewards(rewards, teamSize, coopBonusPerPlayer);

    // Update player gold and XP
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, {
      gold: increment(finalRewards.gold),
      xp: increment(finalRewards.xp),
      'stats.questsCompleted': increment(1)
    });

    console.log(`💰 Distributed ${finalRewards.gold} gold, ${finalRewards.xp} XP to player`);

    // Roll for item drops
    const droppedItems = rollItemDrops(finalRewards);

    // Check inventory capacity
    const inventorySnapshot = await getDoc(doc(db, 'inventory', userId));
    const currentInventory = inventorySnapshot.exists() ? inventorySnapshot.data().cards || [] : [];

    const inventoryFull = currentInventory.length + droppedItems.length > INVENTORY_CAPACITY;

    if (inventoryFull) {
      // Not enough space - will need to handle overflow
      const availableSpace = INVENTORY_CAPACITY - currentInventory.length;
      const itemsToAdd = droppedItems.slice(0, availableSpace);
      const overflowItems = droppedItems.slice(availableSpace);

      // Add what we can
      if (itemsToAdd.length > 0) {
        await updateDoc(doc(db, 'inventory', userId), {
          cards: [...currentInventory, ...itemsToAdd]
        });
      }

      console.warn(`⚠️ Inventory full! ${overflowItems.length} items in overflow`);

      return {
        success: true,
        rewards: {
          gold: finalRewards.gold,
          xp: finalRewards.xp,
          items: itemsToAdd
        },
        inventoryFull: true,
        overflowItems
      };
    } else {
      // Add all items
      await updateDoc(doc(db, 'inventory', userId), {
        cards: [...currentInventory, ...droppedItems]
      });

      console.log(`🎁 Distributed ${droppedItems.length} items to inventory`);

      return {
        success: true,
        rewards: {
          gold: finalRewards.gold,
          xp: finalRewards.xp,
          items: droppedItems
        },
        inventoryFull: false
      };
    }
  } catch (error) {
    console.error('❌ Failed to distribute rewards:', error);
    return {
      success: false,
      rewards: {
        gold: 0,
        xp: 0,
        items: []
      },
      inventoryFull: false
    };
  }
}

/**
 * Send overflow items to stash
 */
export async function sendOverflowToStash(
  db: Firestore,
  userId: string,
  items: Card[]
): Promise<void> {
  try {
    const stashDoc = doc(db, 'stash', userId);
    const stashSnapshot = await getDoc(stashDoc);

    const currentStash = stashSnapshot.exists() ? stashSnapshot.data().equipment || [] : [];

    await updateDoc(stashDoc, {
      equipment: [...currentStash, ...items]
    });

    console.log(`📦 Sent ${items.length} overflow items to stash`);
  } catch (error) {
    console.error('❌ Failed to send overflow to stash:', error);
  }
}

/**
 * Identify an item (Diablo-style)
 */
export async function identifyItem(
  db: Firestore,
  userId: string,
  cardId: string
): Promise<Card | null> {
  try {
    // Get user's inventory
    const inventoryDoc = doc(db, 'inventory', userId);
    const inventorySnapshot = await getDoc(inventoryDoc);

    if (!inventorySnapshot.exists()) return null;

    const inventory = inventorySnapshot.data().cards || [];
    const cardIndex = inventory.findIndex((c: Card) => c.id === cardId);

    if (cardIndex === -1) return null;

    const unidentifiedCard = inventory[cardIndex];

    if (!unidentifiedCard.isUnidentified) {
      console.warn('Card is already identified');
      return unidentifiedCard;
    }

    // Check if player has enough gold
    const userDoc = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDoc);
    const userGold = userSnapshot.exists() ? userSnapshot.data().gold || 0 : 0;

    const identificationCost = unidentifiedCard.identificationCost || 10;

    if (userGold < identificationCost) {
      console.error('Not enough gold to identify');
      return null;
    }

    // Deduct gold
    await updateDoc(userDoc, {
      gold: increment(-identificationCost)
    });

    // Generate identified item with random stats
    const identifiedCard: Card = {
      ...unidentifiedCard,
      id: cardId,
      name: generateItemName(unidentifiedCard.type, unidentifiedCard.rarity),
      description: generateItemDescription(unidentifiedCard.type, unidentifiedCard.rarity),
      attack: generateStat(unidentifiedCard.rarity, 'attack'),
      health: generateStat(unidentifiedCard.rarity, 'health'),
      cost: generateStat(unidentifiedCard.rarity, 'cost'),
      isUnidentified: false,
      identifiedAt: new Date().toISOString()
    };

    // Update inventory
    inventory[cardIndex] = identifiedCard;
    await updateDoc(inventoryDoc, { cards: inventory });

    console.log(`✨ Identified item: ${identifiedCard.name}`);

    return identifiedCard;
  } catch (error) {
    console.error('❌ Failed to identify item:', error);
    return null;
  }
}

function generateItemName(type: string, rarity: string): string {
  const prefixes = {
    normal: ['Simple', 'Basic', 'Common'],
    magic: ['Enhanced', 'Superior', 'Fine'],
    rare: ['Exceptional', 'Masterwork', 'Elite'],
    epic: ['Legendary', 'Ancient', 'Mythic'],
    legendary: ['God-tier', 'Divine', 'Eternal']
  };

  const types = {
    monster: ['Creature', 'Beast', 'Summon'],
    spell: ['Spell', 'Incantation', 'Magic'],
    equipment: ['Sword', 'Armor', 'Shield', 'Helmet'],
    consumable: ['Potion', 'Elixir', 'Scroll']
  };

  const prefix = prefixes[rarity as keyof typeof prefixes]?.[Math.floor(Math.random() * 3)] || 'Unknown';
  const typeName = types[type as keyof typeof types]?.[Math.floor(Math.random() * types[type as keyof typeof types].length)] || 'Item';

  return `${prefix} ${typeName}`;
}

function generateItemDescription(type: string, rarity: string): string {
  return `A ${rarity} ${type} with random stats.`;
}

function generateStat(rarity: string, statType: 'attack' | 'health' | 'cost'): number {
  const ranges = {
    normal: { attack: [1, 5], health: [1, 5], cost: [1, 3] },
    magic: { attack: [5, 10], health: [5, 10], cost: [3, 5] },
    rare: { attack: [10, 20], health: [10, 20], cost: [5, 8] },
    epic: { attack: [20, 35], health: [20, 35], cost: [8, 12] },
    legendary: { attack: [35, 50], health: [35, 50], cost: [12, 20] }
  };

  const range = ranges[rarity as keyof typeof ranges]?.[statType] || [1, 5];
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
}

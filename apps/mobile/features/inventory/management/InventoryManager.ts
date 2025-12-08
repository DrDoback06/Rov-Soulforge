/**
 * Inventory Management System
 *
 * Enhanced inventory with auto-sorting, filtering, and smart stacking
 */

import type { ItemInstance } from '@rov/types';

export interface InventoryFilters {
  type?: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'card';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  minLevel?: number;
  maxLevel?: number;
  searchTerm?: string;
}

export interface InventorySort {
  field: 'name' | 'rarity' | 'level' | 'type' | 'value';
  direction: 'asc' | 'desc';
}

/**
 * Smart inventory stacking
 * Automatically stacks stackable items
 */
export function stackItems(items: ItemInstance[]): ItemInstance[] {
  const stackMap = new Map<string, ItemInstance>();

  for (const item of items) {
    const stackKey = `${item.baseId || item.id}_${item.rarity}`;

    if (item.stackable) {
      const existing = stackMap.get(stackKey);
      if (existing && existing.stackable) {
        // Stack with existing
        existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
      } else {
        stackMap.set(stackKey, { ...item });
      }
    } else {
      // Non-stackable items get unique keys
      const uniqueKey = `${stackKey}_${item.id}_${Date.now()}`;
      stackMap.set(uniqueKey, { ...item });
    }
  }

  return Array.from(stackMap.values());
}

/**
 * Filter inventory items
 */
export function filterItems(
  items: ItemInstance[],
  filters: InventoryFilters
): ItemInstance[] {
  return items.filter(item => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.rarity && item.rarity !== filters.rarity) return false;
    if (filters.minLevel && (item.level || 1) < filters.minLevel) return false;
    if (filters.maxLevel && (item.level || 1) > filters.maxLevel) return false;
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      const name = (item.name || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      if (!name.includes(search) && !description.includes(search)) return false;
    }
    return true;
  });
}

/**
 * Sort inventory items
 */
export function sortItems(
  items: ItemInstance[],
  sort: InventorySort
): ItemInstance[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sort.field) {
      case 'name':
        aVal = a.name || '';
        bVal = b.name || '';
        break;
      case 'rarity':
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        aVal = rarityOrder[a.rarity || 'common'] || 0;
        bVal = rarityOrder[b.rarity || 'common'] || 0;
        break;
      case 'level':
        aVal = a.level || 0;
        bVal = b.level || 0;
        break;
      case 'type':
        aVal = a.type || '';
        bVal = b.type || '';
        break;
      case 'value':
        aVal = a.value || 0;
        bVal = b.value || 0;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }

    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Get inventory statistics
 */
export function getInventoryStats(items: ItemInstance[]) {
  const stats = {
    totalItems: items.length,
    totalValue: 0,
    byType: {} as Record<string, number>,
    byRarity: {} as Record<string, number>,
    stackableCount: 0,
    uniqueCount: 0
  };

  const uniqueItems = new Set<string>();

  for (const item of items) {
    stats.totalValue += (item.value || 0) * (item.quantity || 1);

    // Count by type
    const type = item.type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count by rarity
    const rarity = item.rarity || 'common';
    stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;

    // Count stackable vs unique
    if (item.stackable) {
      stats.stackableCount++;
    }

    uniqueItems.add(item.baseId || item.id);
  }

  stats.uniqueCount = uniqueItems.size;

  return stats;
}

/**
 * Check if inventory has space
 */
export function hasInventorySpace(
  currentItems: ItemInstance[],
  maxSlots: number = 100
): boolean {
  const stacked = stackItems(currentItems);
  return stacked.length < maxSlots;
}

/**
 * Auto-sell junk items
 */
export function autoSellJunk(
  items: ItemInstance[],
  criteria: {
    sellCommon?: boolean;
    sellBelowLevel?: number;
    keepTypes?: string[];
  }
): {
  itemsToSell: ItemInstance[];
  itemsToKeep: ItemInstance[];
  totalGold: number;
} {
  const itemsToSell: ItemInstance[] = [];
  const itemsToKeep: ItemInstance[] = [];
  let totalGold = 0;

  for (const item of items) {
    let shouldSell = false;

    if (criteria.sellCommon && item.rarity === 'common') {
      shouldSell = true;
    }

    if (criteria.sellBelowLevel && (item.level || 1) < criteria.sellBelowLevel) {
      shouldSell = true;
    }

    if (criteria.keepTypes && criteria.keepTypes.includes(item.type || '')) {
      shouldSell = false;
    }

    if (shouldSell) {
      itemsToSell.push(item);
      totalGold += (item.value || 0) * (item.quantity || 1);
    } else {
      itemsToKeep.push(item);
    }
  }

  return { itemsToSell, itemsToKeep, totalGold };
}

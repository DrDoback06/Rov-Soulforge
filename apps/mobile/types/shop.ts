/**
 * Shop System Types
 *
 * Defines card packs, pricing, and pity system
 */

export interface CardPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: {
    gold?: number;
    gems?: number; // Premium currency
    realMoney?: number; // USD cents
  };

  // Pack contents
  guaranteedCards: number;
  guaranteedRare: number;
  guaranteedEpic: number;
  guaranteedLegendary: number;

  // Drop rates (percentages)
  rarity: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };

  // Visual
  gradientColors: string[];
  featured?: boolean;
  onSale?: boolean;
  salePrice?: {
    gold?: number;
    gems?: number;
    realMoney?: number;
  };
  saleEndsAt?: number;
}

export interface ShopOffer {
  id: string;
  type: 'pack' | 'bundle' | 'item' | 'currency';
  packId?: string; // If type is 'pack'
  name: string;
  description: string;
  icon: string;
  price: {
    gold?: number;
    gems?: number;
    realMoney?: number;
  };
  originalPrice?: {
    gold?: number;
    gems?: number;
    realMoney?: number;
  };
  quantity?: number;
  contents?: {
    packs?: { packId: string; quantity: number }[];
    gold?: number;
    gems?: number;
    items?: string[];
  };
  featured?: boolean;
  limitedTime?: boolean;
  expiresAt?: number;
  purchaseLimit?: number;
  userPurchases?: number;
}

export interface PitySystem {
  userId: string;
  packId: string;

  // Pity counters
  pullsSinceEpic: number;
  pullsSinceLegendary: number;
  pullsSinceMythic: number;

  // Thresholds
  epicPityThreshold: number; // Default: 10
  legendaryPityThreshold: number; // Default: 40
  mythicPityThreshold: number; // Default: 100

  // Statistics
  totalPulls: number;
  epicPulls: number;
  legendaryPulls: number;
  mythicPulls: number;

  lastUpdated: number;
}

export interface PackOpeningResult {
  packId: string;
  packName: string;
  cards: {
    id: string;
    name: string;
    rarity: string;
    type: string;
    icon?: string;
    isNew?: boolean;
    isPityCard?: boolean;
  }[];
  pityTriggered?: {
    rarity: 'epic' | 'legendary' | 'mythic';
    pullCount: number;
  };
  timestamp: number;
}

export interface UserCurrency {
  userId: string;
  gold: number;
  gems: number;
  lastUpdated: number;
}

export interface PurchaseHistory {
  id: string;
  userId: string;
  offerId: string;
  offerType: 'pack' | 'bundle' | 'item' | 'currency';
  price: {
    gold?: number;
    gems?: number;
    realMoney?: number;
  };
  timestamp: number;
  receipt?: string; // For IAP verification
}

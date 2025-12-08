/**
 * Shop & Economy Types
 */

import type { ShopItemKind } from '../common/shared';

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  name: string;
  description?: string;
  priceGold?: number;
  priceIAP?: number; // in cents
  spotlight?: boolean;
  stock?: number;
  contentsSpec?: any; // pack odds, adventure spawn rules, etc.
}

export interface PackContents {
  packSize: number;
  rarityOdds: number[]; // [Common%, Uncommon%, Rare%, Epic%, Legendary%]
}

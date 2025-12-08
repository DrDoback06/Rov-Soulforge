/**
 * Character & User Types
 */

import type { Alignment } from '../common/shared';

export interface User {
  uid: string;
  name?: string;
  region?: string;
  prefs?: {
    shareLocation?: boolean;
    allowFriendInvites?: boolean;
    colorBlindMode?: boolean;
  };
  createdAt: number;
}

export interface Character {
  id: string;
  uid: string;
  classId?: string;
  alignment?: Alignment;
  counters: {
    hp: number;
    mana: number;
    xp: number;
    renown: number;
  };
  stats: {
    atk: number;
    def: number;
    spd: number;
    maxHp?: number;
    maxMana?: number;
  };
  level: number;
  lives: number;
  inventory: ItemInstance[];
  equipped: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  skills: string[];
  gold: number;
}

export interface ItemInstance {
  id: string;
  cardId: string;
  durability?: number;
  bound?: boolean;
}

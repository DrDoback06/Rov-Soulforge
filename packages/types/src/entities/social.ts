/**
 * Trade & Social Types
 */

export interface Trade {
  id: string;
  fromUid: string;
  toUid: string;
  fromItems: string[]; // item instance ids
  toItems: string[];
  state: "pending" | "accepted" | "finalized" | "cancelled";
  createdAt: number;
}

export interface FriendAlliance {
  id: string;
  players: string[]; // character ids
  cardId: string; // "Friends" action card id
  createdAt: number;
}

export interface Season {
  id: string;
  name: string;
  start: number;
  end: number;
  rules?: any;
  cardPools?: string[];
  bossRotation?: string[];
}

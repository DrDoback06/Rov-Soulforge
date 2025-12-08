/**
 * Quest Objectives & Rewards
 */

import type { Rarity } from '../common/shared';

export interface QuestObjective {
  id: string;
  type: 'battle' | 'fitness' | 'defend' | 'collect';
  description: string;
  target: number;
  current: number;
  completed: boolean;
}

export interface QuestRewards {
  xp: number;
  gold: number;
  cards?: { cardId: string; rarity: Rarity }[];
}

export type Requirement =
  | { kind: "distanceKm"; value: number }
  | { kind: "hrZone"; minPct: number; durationSec: number }
  | { kind: "steps"; value: number }
  | { kind: "elevGainM"; value: number }
  | { kind: "poiRadiusM"; value: number };

export type Reward =
  | { kind: "xp"; value: number }
  | { kind: "gold"; value: number }
  | { kind: "renown"; value: number }
  | { kind: "card"; cardId: string }
  | { kind: "item"; cardId: string }
  | { kind: "tempBuff"; stat: "atk" | "def" | "maxMana" | "maxHp"; amount: number; durationSec: number };

export interface SpawnRules {
  regionId?: string;
  minLevel?: number;
  maxLevel?: number;
  ttlMinutes: number;
  budget?: number; // spawn cost/weight
}

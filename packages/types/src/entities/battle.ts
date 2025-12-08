/**
 * Battle & Combat Types
 */

import type { BattleMode, BattleState } from '../common/shared';
import type { EffectDef } from '../effects/effect-def';

export interface Battle {
  id: string;
  mode: BattleMode;
  participants: string[]; // character ids
  state: BattleState;
  turnOrder: string[];
  currentTurn?: string; // character id whose turn it is
  stack: StackItem[];
  log: BattleLogEntry[];
  timers: {
    ropeMs: number;
    maxMs: number;
    turnStart?: number;
  };
  normalization?: {
    ranked: boolean;
  };
  bossState?: {
    bossId: string;
    hp: number;
    maxHp: number;
    counters?: Record<string, number>; // e.g., "armorPlates": 3
  };
  // Enhanced battle data
  createdAt: number;
  updatedAt: number;
  winner?: string; // character id of winner
  battleSettings: {
    maxTurns: number;
    timeLimitMs: number;
    allowSpectators: boolean;
  };
  playerStates: Record<string, BattlePlayerState>;
  aiOpponent?: BattleAIState;
}

export interface BattlePlayerState {
  characterId: string;
  userId: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  lives: number;
  maxLives: number;
  hand: string[]; // card instance ids
  deck: string[]; // card instance ids
  discard: string[]; // card instance ids
  buffs: BattleBuff[];
  debuffs: BattleDebuff[];
  isActive: boolean;
  hasPassed: boolean;
  lastAction?: number; // timestamp
}

export interface BattleAIState {
  aiId: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Boss';
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  lives: number;
  maxLives: number;
  deck: string[]; // AI card templates
  hand: string[]; // AI card instances
  discard: string[]; // AI card instances
  behavior: AIBehavior;
  isActive: boolean;
}

export interface AIBehavior {
  aggression: number; // 0-1, how likely to attack
  defense: number; // 0-1, how likely to defend
  cardPlay: number; // 0-1, how likely to play cards
  targetPriority: 'weakest' | 'strongest' | 'random' | 'balanced';
}

export interface BattleBuff {
  id: string;
  name: string;
  stat: 'atk' | 'def' | 'maxMana' | 'maxHp' | 'spd';
  amount: number;
  duration: number; // turns remaining
  source: string; // card or effect that applied it
}

export interface BattleDebuff {
  id: string;
  name: string;
  stat: 'atk' | 'def' | 'maxMana' | 'maxHp' | 'spd';
  amount: number;
  duration: number; // turns remaining
  source: string; // card or effect that applied it
}

export interface StackItem {
  id: string;
  sourceCharId: string;
  cardId?: string;
  effect: EffectDef;
  targetIds?: string[];
  timestamp: number;
}

export interface BattleLogEntry {
  id: string;
  t: number;
  msg: string;
  seed?: string; // RNG seed used
}

// Battle Action Types
export type BattleAction = 
  | PlayCardAction
  | PassTurnAction
  | SurrenderAction
  | ResolveStackAction;

export interface PlayCardAction {
  type: 'playCard';
  battleId: string;
  playerId: string;
  cardId: string;
  targets?: string[]; // character ids
  timestamp: number;
}

export interface PassTurnAction {
  type: 'passTurn';
  battleId: string;
  playerId: string;
  timestamp: number;
}

export interface SurrenderAction {
  type: 'surrender';
  battleId: string;
  playerId: string;
  timestamp: number;
}

export interface ResolveStackAction {
  type: 'resolveStack';
  battleId: string;
  stackItemId: string;
  timestamp: number;
}

/**
 * Cloud Function Request/Response Types
 */

import type { BattleMode } from '../common/shared';
import type { Battle } from '../entities/battle';

export interface CreateBattleRequest {
  mode: BattleMode;
  participants: string[]; // character ids
  settings?: {
    maxTurns?: number;
    timeLimitMs?: number;
    allowSpectators?: boolean;
  };
  aiOpponent?: {
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Boss';
    aiId: string;
  };
}

export interface CreateBattleResponse {
  success: boolean;
  battleId?: string;
  error?: string;
}

export interface PlayCardRequest {
  battleId: string;
  playerId: string;
  cardId: string;
  targets?: string[];
}

export interface PlayCardResponse {
  success: boolean;
  error?: string;
  battleState?: Battle;
}

export interface PassTurnRequest {
  battleId: string;
  playerId: string;
}

export interface PassTurnResponse {
  success: boolean;
  error?: string;
  battleState?: Battle;
}

export interface GetBattleRequest {
  battleId: string;
  playerId: string;
}

export interface GetBattleResponse {
  success: boolean;
  battle?: Battle;
  error?: string;
}

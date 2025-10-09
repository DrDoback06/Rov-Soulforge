/**
 * Battle Client - Single interface for all battle operations
 * 
 * This module provides a unified API for creating and managing battles.
 * All battle operations go through Firebase callable functions to ensure
 * server-side validation and prevent cheating.
 */

import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import type { Battle, Character, BattleMode } from '@rov/types';

// ============================================================================
// Types
// ============================================================================

export interface CreateBattleRequest {
  participants: string[]; // User IDs
  mode: 'pvp' | 'coop' | 'ranked';
  ranked?: boolean;
  bossId?: string;
}

export interface CreateBattleResponse {
  battleId: string;
  turnOrder: string[];
  currentTurn: string;
}

export interface BattleActionRequest {
  battleId: string;
  action: {
    type: 'playCard' | 'respond' | 'passTurn' | 'surrender';
    cardId?: string;
    targetIds?: string[];
    charId: string;
  };
}

export interface BattleActionResponse {
  success: boolean;
  turnAdvanced?: boolean;
  winner?: string;
  message?: string;
}

// ============================================================================
// Battle Client
// ============================================================================

export class BattleClient {
  private functions: Functions;

  constructor(functions: Functions) {
    this.functions = functions;
  }

  /**
   * Create a new battle
   * Server validates participants, creates battle state, and initializes turn order
   */
  async createBattle(request: CreateBattleRequest): Promise<CreateBattleResponse> {
    const callable = httpsCallable<CreateBattleRequest, CreateBattleResponse>(
      this.functions,
      'createBattle'
    );

    try {
      const result = await callable(request);
      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to create battle:', error.message);
      throw new Error(`Failed to create battle: ${error.message}`);
    }
  }

  /**
   * Execute a battle action (play card, pass turn, etc.)
   * Server validates action legality and updates battle state
   */
  async executeBattleAction(request: BattleActionRequest): Promise<BattleActionResponse> {
    const callable = httpsCallable<BattleActionRequest, BattleActionResponse>(
      this.functions,
      'executeBattleAction'
    );

    try {
      const result = await callable(request);
      return result.data;
    } catch (error: any) {
      console.error('❌ Failed to execute battle action:', error.message);
      throw new Error(`Failed to execute action: ${error.message}`);
    }
  }

  /**
   * Subscribe to battle updates
   * Returns unsubscribe function
   */
  subscribeToBattle(
    db: any,
    battleId: string,
    onUpdate: (battle: Battle) => void,
    onError?: (error: Error) => void
  ): () => void {
    const unsubscribe = db
      .collection('battles')
      .doc(battleId)
      .onSnapshot(
        (snapshot: any) => {
          if (snapshot.exists) {
            const battle = snapshot.data() as Battle;
            onUpdate(battle);
          }
        },
        (error: any) => {
          console.error('❌ Battle subscription error:', error);
          onError?.(error);
        }
      );

    return unsubscribe;
  }

  /**
   * Quick helpers for common actions
   */
  async playCard(battleId: string, charId: string, cardId: string, targetIds?: string[]) {
    return this.executeBattleAction({
      battleId,
      action: {
        type: 'playCard',
        cardId,
        targetIds,
        charId
      }
    });
  }

  async passTurn(battleId: string, charId: string) {
    return this.executeBattleAction({
      battleId,
      action: {
        type: 'passTurn',
        charId
      }
    });
  }

  async surrender(battleId: string, charId: string) {
    return this.executeBattleAction({
      battleId,
      action: {
        type: 'surrender',
        charId
      }
    });
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

let battleClientInstance: BattleClient | null = null;

export function initializeBattleClient(functions: Functions): BattleClient {
  if (!battleClientInstance) {
    battleClientInstance = new BattleClient(functions);
  }
  return battleClientInstance;
}

export function getBattleClient(): BattleClient {
  if (!battleClientInstance) {
    throw new Error('BattleClient not initialized. Call initializeBattleClient() first.');
  }
  return battleClientInstance;
}

/**
 * useSimpleBattle Hook
 *
 * Manages SIMPLE, WORKING battle state for local battles
 * This is the hook that actually works in the app!
 */

import { useState, useCallback } from 'react';
import { SimpleBattleEngine, SimpleBattleState } from '../engine/BattleEngine';
import type { Character } from '@rov/types';

export interface UseSimpleBattleReturn {
  // State
  battleState: SimpleBattleState | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  playCard: (cardId: string) => void;
  endTurn: () => void;
  startBattle: (
    playerCharacter: Character,
    opponentName?: string,
    difficulty?: 'easy' | 'normal' | 'hard' | 'boss'
  ) => void;

  // Computed
  isPlayerTurn: boolean;
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
}

/**
 * Hook for managing simple, local battle state
 *
 * This is a SIMPLE implementation that works WITHOUT Firebase/backend.
 * Perfect for testing and getting battles working in the app.
 */
export function useSimpleBattle(): UseSimpleBattleReturn {
  const [engine, setEngine] = useState<SimpleBattleEngine | null>(null);
  const [battleState, setBattleState] = useState<SimpleBattleState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Start a new battle with optional difficulty
   */
  const startBattle = useCallback(
    (
      playerCharacter: Character,
      opponentName: string = 'Goblin',
      difficulty: 'easy' | 'normal' | 'hard' | 'boss' = 'normal'
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🎮 Starting battle:', { playerCharacter, opponentName, difficulty });

        const battleEngine = new SimpleBattleEngine(playerCharacter, opponentName, difficulty);
        setEngine(battleEngine);
        setBattleState(battleEngine.getState());

        console.log('✅ Battle started successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Error starting battle:', err);
        setError(err instanceof Error ? err.message : 'Failed to start battle');
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Play a card
   */
  const playCard = useCallback((cardId: string) => {
    if (!engine) {
      console.warn('⚠️ No battle engine - cannot play card');
      return;
    }

    console.log('🃏 Playing card:', cardId);

    const result = engine.playCard(cardId);
    if (!result.success) {
      console.warn('⚠️ Card play failed:', result.message);
      setError(result.message);
      setTimeout(() => setError(null), 2000); // Clear error after 2s
    } else {
      console.log('✅ Card played:', result.message);
    }

    // Update battle state
    setBattleState(engine.getState());
  }, [engine]);

  /**
   * End turn
   */
  const endTurn = useCallback(() => {
    if (!engine) {
      console.warn('⚠️ No battle engine - cannot end turn');
      return;
    }

    console.log('⏭️ Ending turn...');
    engine.endTurn();
    setBattleState(engine.getState());
    console.log('✅ Turn ended');
  }, [engine]);

  // Computed values
  const isPlayerTurn = battleState?.currentTurn === 'player';
  const isGameOver = battleState?.status === 'ended';
  const winner = battleState?.winner || null;

  return {
    battleState,
    isLoading,
    error,
    playCard,
    endTurn,
    startBattle,
    isPlayerTurn,
    isGameOver,
    winner
  };
}

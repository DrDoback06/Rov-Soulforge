import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/lib/firebase-context';
import { useAuth } from './useAuth';
import type { BattleState, BattleAction } from '@rov/logic';
import { useEffect } from 'react';

/**
 * Hook for managing battles with real-time updates
 */
export function useBattle(battleId: string | null) {
  const { db, functions } = useFirebase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load battle state
  const { data: battle, isLoading } = useQuery({
    queryKey: ['battle', battleId],
    queryFn: async () => {
      if (!battleId || !db) return null;

      // Initial load will be replaced by real-time listener
      return null;
    },
    enabled: !!battleId && !!db
  });

  // Real-time battle updates
  useEffect(() => {
    if (!battleId || !db) return;

    const unsubscribe = onSnapshot(
      doc(db, 'battles', battleId),
      (doc) => {
        if (doc.exists()) {
          const battleData = {
            id: doc.id,
            ...doc.data()
          } as BattleState;

          queryClient.setQueryData(['battle', battleId], battleData);
        }
      },
      (error) => {
        console.error('Battle listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [battleId, db, queryClient]);

  // Execute battle action
  const executeBattleActionMutation = useMutation({
    mutationFn: async (action: BattleAction) => {
      if (!functions || !battleId) throw new Error('Battle not initialized');

      const executeBattleActionFn = httpsCallable(functions, 'executeBattleAction');
      const result = await executeBattleActionFn({
        battleId,
        action
      });

      return result.data;
    },
    onError: (error) => {
      console.error('Battle action error:', error);
    }
  });

  // Play card from hand
  const playCard = (cardId: string, targetPlayerId?: string) => {
    executeBattleActionMutation.mutate({
      type: 'playCard',
      playerId: user?.uid || '',
      cardId,
      targetPlayerId
    });
  };

  // Play instant card from hand
  const playInstant = (cardId: string, targetPlayerId?: string) => {
    executeBattleActionMutation.mutate({
      type: 'playInstant',
      playerId: user?.uid || '',
      cardId,
      targetPlayerId
    });
  };

  // Use activated ability
  const useAbility = (abilityId: string, targetPlayerId?: string) => {
    executeBattleActionMutation.mutate({
      type: 'activateSkill',
      playerId: user?.uid || '',
      skillId: abilityId,
      targetPlayerId
    });
  };

  // Pass turn
  const passTurn = () => {
    executeBattleActionMutation.mutate({
      type: 'passTurn',
      playerId: user?.uid || ''
    });
  };

  // Surrender
  const surrender = () => {
    executeBattleActionMutation.mutate({
      type: 'surrender',
      playerId: user?.uid || ''
    });
  };

  // Get current player's state
  const myPlayerState = battle?.players.find(p => p.playerId === user?.uid);

  // Check if it's my turn
  const isMyTurn = battle?.currentPlayerId === user?.uid;

  // Get opponent state
  const opponentState = battle?.players.find(p => p.playerId !== user?.uid);

  return {
    battle,
    isLoading,
    myPlayerState,
    opponentState,
    isMyTurn,
    playCard,
    playInstant,
    useAbility,
    passTurn,
    surrender,
    isExecuting: executeBattleActionMutation.isPending
  };
}

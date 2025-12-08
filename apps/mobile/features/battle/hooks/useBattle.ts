import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/lib/firebase-context';
import { useAuth } from './useAuth';
import type { 
  Battle, 
  BattlePlayerState, 
  BattleAIState,
  CreateBattleRequest,
  PlayCardRequest,
  PassTurnRequest,
  GetBattleRequest
} from '@rov/types';
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
      if (!battleId || !functions || !user) return null;

      const getBattleFn = httpsCallable(functions, 'getBattle');
      const result = await getBattleFn({
        battleId,
        playerId: user.uid
      });

      return result.data.battle as Battle;
    },
    enabled: !!battleId && !!functions && !!user
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
          } as Battle;

          queryClient.setQueryData(['battle', battleId], battleData);
        }
      },
      (error) => {
        console.error('Battle listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [battleId, db, queryClient]);

  // Play card mutation
  const playCardMutation = useMutation({
    mutationFn: async ({ cardId, targets }: { cardId: string; targets?: string[] }) => {
      if (!functions || !battleId || !user) throw new Error('Battle not initialized');

      const playCardFn = httpsCallable(functions, 'playCard');
      const result = await playCardFn({
        battleId,
        playerId: user.uid,
        cardId,
        targets
      });

      return result.data;
    },
    onError: (error) => {
      console.error('Play card error:', error);
    }
  });

  // Pass turn mutation
  const passTurnMutation = useMutation({
    mutationFn: async () => {
      if (!functions || !battleId || !user) throw new Error('Battle not initialized');

      const passTurnFn = httpsCallable(functions, 'passTurn');
      const result = await passTurnFn({
        battleId,
        playerId: user.uid
      });

      return result.data;
    },
    onError: (error) => {
      console.error('Pass turn error:', error);
    }
  });

  // Play card from hand
  const playCard = (cardId: string, targets?: string[]) => {
    playCardMutation.mutate({ cardId, targets });
  };

  // Pass turn
  const passTurn = () => {
    passTurnMutation.mutate();
  };

  // Surrender (simplified for now)
  const surrender = () => {
    // TODO: Implement surrender functionality
    console.log('Surrender not implemented yet');
  };

  // Get current player's state
  const myPlayerState = battle?.playerStates ? 
    Object.values(battle.playerStates).find(p => p.userId === user?.uid) : 
    undefined;

  // Check if it's my turn
  const isMyTurn = battle?.currentTurn && myPlayerState ? 
    battle.currentTurn === myPlayerState.characterId : 
    false;

  // Get opponent state (first non-current player)
  const opponentState = battle?.playerStates ? 
    Object.values(battle.playerStates).find(p => p.userId !== user?.uid) : 
    undefined;

  // Get AI opponent if present
  const aiOpponent = battle?.aiOpponent;

  return {
    battle,
    isLoading,
    myPlayerState,
    opponentState: opponentState || aiOpponent,
    isMyTurn,
    playCard,
    passTurn,
    surrender,
    isExecuting: playCardMutation.isPending || passTurnMutation.isPending
  };
}

/**
 * Hook for creating battles
 */
export function useCreateBattle() {
  const { functions } = useFirebase();
  const { user } = useAuth();

  const createBattleMutation = useMutation({
    mutationFn: async (data: Omit<CreateBattleRequest, 'participants'> & { participants?: string[] }) => {
      if (!functions || !user) throw new Error('Not authenticated');

      const createBattleFn = httpsCallable(functions, 'createBattle');
      const result = await createBattleFn({
        ...data,
        participants: data.participants || [user.uid]
      });

      return result.data;
    },
    onError: (error) => {
      console.error('Create battle error:', error);
    }
  });

  const createBattle = (data: Omit<CreateBattleRequest, 'participants'> & { participants?: string[] }) => {
    createBattleMutation.mutate(data);
  };

  return {
    createBattle,
    isCreating: createBattleMutation.isPending,
    error: createBattleMutation.error
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/lib/firebase-context';
import { useAuth } from './useAuth';
import type { Quest, QuestProgress } from '@rov/types';
import { useEffect } from 'react';

/**
 * Hook for managing quests
 */
export function useQuests() {
  const { db, functions } = useFirebase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load nearby quests (requires location)
  const getNearbyQuests = async (latitude: number, longitude: number, radiusKm: number = 5) => {
    if (!functions) throw new Error('Firebase not initialized');

    const getNearbyQuestsFn = httpsCallable(functions, 'getNearbyQuests');
    const result = await getNearbyQuestsFn({ latitude, longitude, radiusKm });
    return (result.data as any).quests as Quest[];
  };

  // Load active quest progress for player
  const { data: questProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['questProgress', user?.uid],
    queryFn: async () => {
      if (!user?.uid || !db) return [];

      const progressSnapshot = await getDocs(
        query(
          collection(db, 'questProgress'),
          where('userId', '==', user.uid),
          where('status', 'in', ['available', 'active'])
        )
      );

      return progressSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuestProgress[];
    },
    enabled: !!user?.uid && !!db
  });

  // Real-time quest progress updates
  useEffect(() => {
    if (!user?.uid || !db) return;

    const q = query(
      collection(db, 'questProgress'),
      where('userId', '==', user.uid),
      where('status', 'in', ['available', 'active'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuestProgress[];

      queryClient.setQueryData(['questProgress', user.uid], progress);
    });

    return () => unsubscribe();
  }, [user?.uid, db, queryClient]);

  // Start quest
  const startQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      if (!functions) throw new Error('Firebase not initialized');

      const startQuestFn = httpsCallable(functions, 'startQuest');
      await startQuestFn({ questId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questProgress', user?.uid] });
    }
  });

  // Complete quest
  const completeQuestMutation = useMutation({
    mutationFn: async (data: { questId: string; latitude: number; longitude: number }) => {
      if (!functions) throw new Error('Firebase not initialized');

      const completeQuestFn = httpsCallable(functions, 'completeQuest');
      const result = await completeQuestFn(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questProgress', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['character', user?.uid] });
    }
  });

  // Get quest details
  const getQuestDetails = async (questId: string) => {
    if (!db) throw new Error('Firebase not initialized');

    const questDoc = await getDoc(doc(db, 'activeQuests', questId));
    if (!questDoc.exists()) {
      throw new Error('Quest not found');
    }

    return {
      id: questDoc.id,
      ...questDoc.data()
    } as Quest;
  };

  return {
    questProgress,
    isLoading: progressLoading,
    getNearbyQuests,
    getQuestDetails,
    startQuest: startQuestMutation.mutate,
    completeQuest: completeQuestMutation.mutate,
    isStarting: startQuestMutation.isPending,
    isCompleting: completeQuestMutation.isPending
  };
}

import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * Saved Quests Hook
 * 
 * Manages quests saved for later (doesn't expire, separate from active)
 * Used for planning epic adventures (e.g., Lake District trips)
 */

export function useSavedQuests(db: Firestore | null, userId: string | undefined) {
  const [savedQuests, setSavedQuests] = useState<EnhancedQuest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load saved quests
   */
  const loadSavedQuests = useCallback(async () => {
    if (!db || !userId) return;

    try {
      setIsLoading(true);
      
      const q = query(
        collection(db, 'savedQuests'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const quests: EnhancedQuest[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        quests.push({
          id: data.questId,
          ...data.questData
        } as EnhancedQuest);
      }

      setSavedQuests(quests);
    } catch (error) {
      console.error('Error loading saved quests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, userId]);

  /**
   * Save quest for later
   */
  const saveQuest = useCallback(async (quest: EnhancedQuest) => {
    if (!db || !userId) return false;

    try {
      // Check if already saved
      const q = query(
        collection(db, 'savedQuests'),
        where('userId', '==', userId),
        where('questId', '==', quest.id)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        return false; // Already saved
      }

      // Save quest
      await addDoc(collection(db, 'savedQuests'), {
        userId,
        questId: quest.id,
        questData: quest,
        savedAt: new Date().toISOString()
      });

      setSavedQuests(prev => [...prev, quest]);
      return true;
    } catch (error) {
      console.error('Error saving quest:', error);
      return false;
    }
  }, [db, userId]);

  /**
   * Remove saved quest
   */
  const unsaveQuest = useCallback(async (questId: string) => {
    if (!db || !userId) return;

    try {
      const q = query(
        collection(db, 'savedQuests'),
        where('userId', '==', userId),
        where('questId', '==', questId)
      );

      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'savedQuests', docSnap.id));
      }

      setSavedQuests(prev => prev.filter(q => q.id !== questId));
    } catch (error) {
      console.error('Error unsaving quest:', error);
    }
  }, [db, userId]);

  return {
    savedQuests,
    isLoading,
    loadSavedQuests,
    saveQuest,
    unsaveQuest
  };
}

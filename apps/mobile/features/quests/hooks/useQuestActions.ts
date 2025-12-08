import { useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * Quest Actions Hook
 * 
 * Handles quest acceptance, abandonment, and completion
 * Manages rewards, XP penalties, and Firestore updates
 */

export function useQuestActions(db: Firestore | null, userId: string | undefined) {
  
  /**
   * Accept a quest
   * Creates quest progress entry with status 'accepted'
   */
  const acceptQuest = useCallback(async (quest: EnhancedQuest) => {
    if (!db || !userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Check if already accepted
      const existingQuery = query(
        collection(db, 'questProgress'),
        where('userId', '==', userId),
        where('questId', '==', quest.id)
      );
      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        return { success: false, error: 'Quest already accepted' };
      }

      // Create quest progress entry
      await addDoc(collection(db, 'questProgress'), {
        userId,
        questId: quest.id,
        status: 'accepted',
        objectives: quest.objectives.map(obj => ({
          ...obj,
          completed: false,
          current: 0
        })),
        acceptedAt: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error accepting quest:', error);
      return { success: false, error: 'Failed to accept quest' };
    }
  }, [db, userId]);

  /**
   * Abandon a quest
   * Applies XP penalty (10% of quest XP reward)
   * Removes from active list if present
   */
  const abandonQuest = useCallback(async (quest: EnhancedQuest) => {
    if (!db || !userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Find quest progress
      const progressQuery = query(
        collection(db, 'questProgress'),
        where('userId', '==', userId),
        where('questId', '==', quest.id)
      );
      const progressSnapshot = await getDocs(progressQuery);

      if (progressSnapshot.empty) {
        return { success: false, error: 'Quest not found' };
      }

      const progressDoc = progressSnapshot.docs[0];

      // Update status to abandoned
      await updateDoc(doc(db, 'questProgress', progressDoc.id), {
        status: 'abandoned',
        abandonedAt: new Date().toISOString()
      });

      // Apply XP penalty (10% of quest XP)
      const xpPenalty = Math.floor((quest.rewards.xp || 0) * 0.1);
      if (xpPenalty > 0) {
        // Get user's character
        const characterQuery = query(
          collection(db, 'characters'),
          where('uid', '==', userId)
        );
        const characterSnapshot = await getDocs(characterQuery);

        if (!characterSnapshot.empty) {
          const characterDoc = characterSnapshot.docs[0];
          await updateDoc(doc(db, 'characters', characterDoc.id), {
            xp: increment(-xpPenalty)
          });
        }
      }

      return { success: true, xpPenalty };
    } catch (error) {
      console.error('Error abandoning quest:', error);
      return { success: false, error: 'Failed to abandon quest' };
    }
  }, [db, userId]);

  /**
   * Complete a quest
   * Grants rewards (gold, XP, renown)
   * Adds items to stash
   * Updates quest status to completed
   */
  const completeQuest = useCallback(async (quest: EnhancedQuest) => {
    if (!db || !userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Find quest progress
      const progressQuery = query(
        collection(db, 'questProgress'),
        where('userId', '==', userId),
        where('questId', '==', quest.id)
      );
      const progressSnapshot = await getDocs(progressQuery);

      if (progressSnapshot.empty) {
        return { success: false, error: 'Quest not found' };
      }

      const progressDoc = progressSnapshot.docs[0];
      const progressData = progressDoc.data();

      // Verify all objectives are completed
      const allCompleted = progressData.objectives.every((obj: any) => obj.completed);
      if (!allCompleted) {
        return { success: false, error: 'All objectives must be completed first' };
      }

      // Update quest status
      await updateDoc(doc(db, 'questProgress', progressDoc.id), {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Get user's character
      const characterQuery = query(
        collection(db, 'characters'),
        where('uid', '==', userId)
      );
      const characterSnapshot = await getDocs(characterQuery);

      if (characterSnapshot.empty) {
        return { success: false, error: 'Character not found' };
      }

      const characterDoc = characterSnapshot.docs[0];

      // Grant rewards
      const updates: any = {};

      if (quest.rewards.gold) {
        updates.gold = increment(quest.rewards.gold);
      }

      if (quest.rewards.xp) {
        updates.xp = increment(quest.rewards.xp);
      }

      if (quest.rewards.renown) {
        updates.renown = increment(quest.rewards.renown);
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'characters', characterDoc.id), updates);
      }

      // Add items to stash
      if (quest.rewards.items && quest.rewards.items.length > 0) {
        for (const item of quest.rewards.items) {
          await addDoc(collection(db, 'stashItems'), {
            userId,
            ...item,
            source: 'quest_reward',
            questId: quest.id,
            createdAt: serverTimestamp()
          });
        }
      }

      return { 
        success: true, 
        rewards: {
          gold: quest.rewards.gold || 0,
          xp: quest.rewards.xp || 0,
          renown: quest.rewards.renown || 0,
          items: quest.rewards.items || []
        }
      };
    } catch (error) {
      console.error('Error completing quest:', error);
      return { success: false, error: 'Failed to complete quest' };
    }
  }, [db, userId]);

  /**
   * Calculate quest progress percentage
   */
  const getQuestProgress = useCallback((objectives: any[]) => {
    if (!objectives || objectives.length === 0) return 0;
    const completed = objectives.filter(obj => obj.completed).length;
    return (completed / objectives.length) * 100;
  }, []);

  return {
    acceptQuest,
    abandonQuest,
    completeQuest,
    getQuestProgress
  };
}

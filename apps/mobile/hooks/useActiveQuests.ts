import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * Active Quests Management Hook
 * 
 * Manages the Active Quests list (multi-stop routing)
 * Supports drag-and-drop reordering, max 10 quests
 */

const MAX_ACTIVE_QUESTS = 10;

interface ActiveQuestEntry {
  quest: EnhancedQuest;
  position: number; // 0-9
}

export function useActiveQuests(db: Firestore | null, userId: string | undefined) {
  const [activeQuests, setActiveQuests] = useState<ActiveQuestEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load active quests from Firestore
   */
  const loadActiveQuests = useCallback(async () => {
    if (!db || !userId) return;

    try {
      setIsLoading(true);
      
      const q = query(
        collection(db, 'questProgress'),
        where('userId', '==', userId),
        where('status', '==', 'in_active_list')
      );

      const snapshot = await getDocs(q);
      const entries: ActiveQuestEntry[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Try to fetch quest from all possible collections
        let questData: EnhancedQuest | null = null;
        
        // Try staticQuests first
        const staticSnap = await getDocs(query(collection(db, 'staticQuests'), where('__name__', '==', data.questId)));
        if (!staticSnap.empty) {
          questData = { id: data.questId, ...staticSnap.docs[0].data() } as EnhancedQuest;
        }
        
        // Try localQuests if not found
        if (!questData) {
          const localSnap = await getDocs(query(collection(db, 'localQuests'), where('__name__', '==', data.questId)));
          if (!localSnap.empty) {
            questData = { id: data.questId, ...localSnap.docs[0].data() } as EnhancedQuest;
          }
        }
        
        // Try dynamicQuests if still not found
        if (!questData) {
          const dynamicSnap = await getDocs(query(collection(db, 'dynamicQuests'), where('__name__', '==', data.questId)));
          if (!dynamicSnap.empty) {
            questData = { id: data.questId, ...dynamicSnap.docs[0].data() } as EnhancedQuest;
          }
        }
        
        if (questData) {
          entries.push({
            quest: questData,
            position: data.activeListPosition || 0
          });
        } else {
          console.warn(`Quest ${data.questId} not found in any collection`);
        }
      }

      // Sort by position
      entries.sort((a, b) => a.position - b.position);
      setActiveQuests(entries);
      console.log('✅ Loaded active quests:', entries.length);

    } catch (error) {
      console.error('Error loading active quests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, userId]);

  /**
   * Add quest to active list
   * Checks if quest already exists and prevents duplicates
   */
  const addToActive = useCallback(async (quest: EnhancedQuest) => {
    if (!db || !userId) return false;

    if (activeQuests.length >= MAX_ACTIVE_QUESTS) {
      console.warn('Max active quests reached');
      return false;
    }

    try {
      // Check if quest already exists (any status)
      const existingQuery = query(
        collection(db, 'questProgress'),
        where('userId', '==', userId),
        where('questId', '==', quest.id)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        // Quest already exists - update status to in_active_list instead
        const docId = existingSnapshot.docs[0].id;
        await updateDoc(doc(db, 'questProgress', docId), {
          status: 'in_active_list',
          activeListPosition: activeQuests.length
        });
        console.log('Updated existing quest to active list');
      } else {
        // Create new quest progress
        await addDoc(collection(db, 'questProgress'), {
          userId,
          questId: quest.id,
          status: 'in_active_list',
          activeListPosition: activeQuests.length,
          objectives: quest.objectives.map(obj => ({
            ...obj,
            completed: false,
            current: 0
          })),
          acceptedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      // Update local state
      setActiveQuests(prev => [...prev, {
        quest,
        position: prev.length
      }]);

      return true;
    } catch (error) {
      console.error('Error adding to active:', error);
      return false;
    }
  }, [db, userId, activeQuests]);

  /**
   * Remove quest from active list
   */
  const removeFromActive = useCallback(async (questId: string) => {
    if (!db || !userId) return;

    try {
      // Find and delete quest progress
      const q = query(
        collection(db, 'questProgress'),
        where('userId', '==', userId),
        where('questId', '==', questId),
        where('status', '==', 'in_active_list')
      );

      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'questProgress', docSnap.id), {
          status: 'abandoned'
        });
      }

      // Update local state and reindex positions
      const newQuests = activeQuests
        .filter(entry => entry.quest.id !== questId)
        .map((entry, index) => ({
          ...entry,
          position: index
        }));

      setActiveQuests(newQuests);

      // Update positions in Firestore
      for (const entry of newQuests) {
        const q2 = query(
          collection(db, 'questProgress'),
          where('userId', '==', userId),
          where('questId', '==', entry.quest.id)
        );
        const snap = await getDocs(q2);
        if (!snap.empty) {
          await updateDoc(doc(db, 'questProgress', snap.docs[0].id), {
            activeListPosition: entry.position
          });
        }
      }

    } catch (error) {
      console.error('Error removing from active:', error);
    }
  }, [db, userId, activeQuests]);

  /**
   * Reorder active quests (drag-and-drop)
   */
  const reorderActiveQuests = useCallback(async (newOrder: EnhancedQuest[]) => {
    if (!db || !userId) return;

    try {
      // Update local state immediately
      const newEntries = newOrder.map((quest, index) => ({
        quest,
        position: index
      }));
      setActiveQuests(newEntries);

      // Update Firestore positions
      for (let i = 0; i < newOrder.length; i++) {
        const quest = newOrder[i];
        const q = query(
          collection(db, 'questProgress'),
          where('userId', '==', userId),
          where('questId', '==', quest.id)
        );
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await updateDoc(doc(db, 'questProgress', snapshot.docs[0].id), {
            activeListPosition: i
          });
        }
      }

    } catch (error) {
      console.error('Error reordering quests:', error);
    }
  }, [db, userId]);

  /**
   * Clear all active quests
   */
  const clearActiveQuests = useCallback(async () => {
    if (!db || !userId) return;

    try {
      const q = query(
        collection(db, 'questProgress'),
        where('userId', '==', userId),
        where('status', '==', 'in_active_list')
      );

      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'questProgress', docSnap.id), {
          status: 'abandoned'
        });
      }

      setActiveQuests([]);
    } catch (error) {
      console.error('Error clearing active quests:', error);
    }
  }, [db, userId]);

  return {
    activeQuests,
    isLoading,
    canAddMore: activeQuests.length < MAX_ACTIVE_QUESTS,
    maxQuests: MAX_ACTIVE_QUESTS,
    loadActiveQuests,
    addToActive,
    removeFromActive,
    reorderActiveQuests,
    clearActiveQuests
  };
}

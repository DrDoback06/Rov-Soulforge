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
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { applyXP, calculateStatIncreases, getQuestXPReward, getQuestGoldReward, getQuestRenownReward } from '@/utils/characterProgression';

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
   * Handles level-ups with stat increases
   * Adds items to inventory
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

      // Get user's character
      const characterRef = doc(db, 'characters', userId);
      const characterSnap = await getDoc(characterRef);

      if (!characterSnap.exists()) {
        return { success: false, error: 'Character not found' };
      }

      const characterData = characterSnap.data();
      const currentLevel = characterData.level || 1;
      const currentXP = characterData.counters?.xp || 0;
      const classId = characterData.classId || 'Warrior';

      // Calculate rewards based on quest rarity
      const xpReward = quest.rewards?.xp || getQuestXPReward(quest.rarity);
      const goldReward = quest.rewards?.gold || getQuestGoldReward(quest.rarity);
      const renownReward = quest.rewards?.renown || getQuestRenownReward(quest.rarity);

      // Apply XP and check for level-ups
      const progressionResult = applyXP(currentLevel, currentXP, xpReward);
      
      // Prepare character updates
      const updates: any = {
        'counters.xp': progressionResult.newXP,
        gold: increment(goldReward),
        'counters.renown': increment(renownReward)
      };

      // Handle level-ups
      let levelUpMessages: string[] = [];
      if (progressionResult.levelUps.length > 0) {
        const finalLevel = progressionResult.levelUps[progressionResult.levelUps.length - 1].newLevel;
        updates.level = finalLevel;

        // Calculate total stat increases
        const statIncreases = calculateStatIncreases(classId, progressionResult.levelUps);

        // Apply stat increases
        if (statIncreases.atk > 0) {
          updates['stats.atk'] = increment(statIncreases.atk);
        }
        if (statIncreases.def > 0) {
          updates['stats.def'] = increment(statIncreases.def);
        }
        if (statIncreases.spd > 0) {
          updates['stats.spd'] = increment(statIncreases.spd);
        }
        updates['stats.maxHp'] = increment(statIncreases.maxHp);
        updates['stats.maxMana'] = increment(statIncreases.maxMana);
        
        // Heal to full on level up
        updates['counters.hp'] = characterData.stats.maxHp + statIncreases.maxHp;
        updates['counters.mana'] = characterData.stats.maxMana + statIncreases.maxMana;

        levelUpMessages = progressionResult.levelUps.map(lu => 
          `Level ${lu.oldLevel} → ${lu.newLevel}!`
        );
      }

      // Update quest status
      await updateDoc(doc(db, 'questProgress', progressDoc.id), {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Update character
      await updateDoc(characterRef, updates);

      // Add card rewards to inventory
      if (quest.rewards?.cards && quest.rewards.cards.length > 0) {
        const inventoryRef = doc(db, 'inventories', userId);
        const inventorySnap = await getDoc(inventoryRef);
        
        if (inventorySnap.exists()) {
          const inventoryData = inventorySnap.data();
          const cards = inventoryData.cards || {};
          
          // Add each reward card
          quest.rewards.cards.forEach((card: any) => {
            const cardId = card.cardId || `reward_${Date.now()}_${Math.random()}`;
            if (cards[cardId]) {
              // Increment count if already exists
              cards[cardId].count = (cards[cardId].count || 1) + 1;
            } else {
              // Add new card
              cards[cardId] = {
                ...card,
                count: 1,
                location: 'inventory'
              };
            }
          });

          await updateDoc(inventoryRef, { cards });
        }
      }

      return { 
        success: true, 
        rewards: {
          gold: goldReward,
          xp: xpReward,
          renown: renownReward,
          cards: quest.rewards?.cards || []
        },
        levelUps: progressionResult.levelUps.map((lu, idx) => ({
          ...lu,
          message: levelUpMessages[idx]
        }))
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

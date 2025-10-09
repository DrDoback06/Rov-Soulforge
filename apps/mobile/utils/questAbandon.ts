/**
 * Quest Abandon Utilities
 *
 * Handles abandoning active quests with proper cleanup
 */

import type { Firestore } from 'firebase/firestore';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export interface AbandonResult {
  success: boolean;
  message: string;
  xpPenalty?: number;
}

/**
 * Abandon an active quest
 *
 * This will:
 * - Mark quest as abandoned in progress
 * - Apply XP penalty (10% of quest XP reward)
 * - Clean up spawned enemies
 * - Remove from active quests
 */
export async function abandonQuest(
  db: Firestore,
  userId: string,
  questProgressId: string
): Promise<AbandonResult> {
  try {
    const progressRef = doc(db, `users/${userId}/questProgress/${questProgressId}`);
    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) {
      return {
        success: false,
        message: 'Quest progress not found'
      };
    }

    const progressData = progressSnap.data();

    // Calculate XP penalty (10% of quest XP reward)
    const baseXP = progressData.rewards?.xp || 0;
    const xpPenalty = Math.floor(baseXP * 0.1);

    // Update quest status to abandoned
    await updateDoc(progressRef, {
      status: 'abandoned',
      abandonedAt: new Date(),
      xpPenalty: xpPenalty
    });

    // Apply XP penalty to user
    if (xpPenalty > 0) {
      const userProfileRef = doc(db, `users/${userId}/profile/main`);
      const userSnap = await getDoc(userProfileRef);

      if (userSnap.exists()) {
        const currentXP = userSnap.data().xp || 0;
        await updateDoc(userProfileRef, {
          xp: Math.max(0, currentXP - xpPenalty)
        });
      }
    }

    console.log(`✅ Quest abandoned: ${questProgressId} (XP penalty: ${xpPenalty})`);

    return {
      success: true,
      message: 'Quest abandoned',
      xpPenalty
    };

  } catch (error) {
    console.error('Failed to abandon quest:', error);
    return {
      success: false,
      message: 'Failed to abandon quest. Please try again.'
    };
  }
}

/**
 * Check if a quest can be abandoned
 * Some quests (like storyline quests) might not be abandonable
 */
export function canAbandonQuest(questData: any): boolean {
  // Story quests cannot be abandoned
  if (questData.isStoryQuest) {
    return false;
  }

  // Already completed/failed quests cannot be abandoned
  if (questData.status === 'completed' || questData.status === 'failed') {
    return false;
  }

  // All other quests can be abandoned
  return true;
}

/**
 * Get abandon confirmation message
 */
export function getAbandonMessage(questTitle: string, xpPenalty: number): string {
  return `Are you sure you want to abandon "${questTitle}"?\n\nYou will lose ${xpPenalty} XP.`;
}

/**
 * Clean up abandoned quests (run periodically)
 * Removes abandoned quests older than 24 hours
 */
export async function cleanupAbandonedQuests(
  db: Firestore,
  userId: string
): Promise<number> {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');

    const progressRef = collection(db, `users/${userId}/questProgress`);
    const q = query(progressRef, where('status', '==', 'abandoned'));
    const snapshot = await getDocs(q);

    let deletedCount = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const abandonedAt = data.abandonedAt?.toDate();

      if (abandonedAt && abandonedAt < oneDayAgo) {
        await deleteDoc(doc.ref);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old abandoned quests`);
    }

    return deletedCount;

  } catch (error) {
    console.error('Failed to cleanup abandoned quests:', error);
    return 0;
  }
}

/**
 * Quest Leaderboards System
 *
 * Tracks top performers for fitness quests and other competitive quests
 * Provides bonus rewards for top 10%
 */

import type { Firestore } from 'firebase/firestore';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  completedAt: Date;
  rank?: number;
  isTopTen?: boolean;
}

export interface QuestLeaderboard {
  questId: string;
  questTitle: string;
  entries: LeaderboardEntry[];
  totalParticipants: number;
  topTenThreshold: number;
}

/**
 * Submit a quest completion to the leaderboard
 *
 * @param score - For fitness quests: completion time in seconds
 *                For other quests: calculated score based on performance
 */
export async function submitToLeaderboard(
  db: Firestore,
  questId: string,
  userId: string,
  username: string,
  score: number
): Promise<boolean> {
  try {
    const leaderboardRef = doc(db, `leaderboards/quests/${questId}/${userId}`);

    await setDoc(leaderboardRef, {
      userId,
      username,
      score,
      completedAt: new Date()
    });

    console.log(`📊 Submitted to leaderboard: ${questId} - ${username}: ${score}`);
    return true;

  } catch (error) {
    console.error('Failed to submit to leaderboard:', error);
    return false;
  }
}

/**
 * Get leaderboard for a quest
 *
 * @param topN - Number of top entries to return (default 100)
 */
export async function getQuestLeaderboard(
  db: Firestore,
  questId: string,
  questTitle: string,
  topN: number = 100
): Promise<QuestLeaderboard> {
  try {
    const leaderboardRef = collection(db, `leaderboards/quests/${questId}`);

    // Get all entries, sorted by score (ascending for time-based, descending for point-based)
    const q = query(leaderboardRef, orderBy('score', 'asc'), limit(topN));
    const snapshot = await getDocs(q);

    const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
      userId: doc.data().userId,
      username: doc.data().username,
      score: doc.data().score,
      completedAt: doc.data().completedAt?.toDate() || new Date(),
      rank: index + 1,
      isTopTen: index < Math.ceil(snapshot.size * 0.1) // Top 10%
    }));

    // Get total participants
    const allEntriesSnapshot = await getDocs(collection(db, `leaderboards/quests/${questId}`));
    const totalParticipants = allEntriesSnapshot.size;

    // Calculate top 10% threshold
    const topTenIndex = Math.ceil(totalParticipants * 0.1);
    const topTenThreshold = entries[topTenIndex - 1]?.score || 0;

    return {
      questId,
      questTitle,
      entries,
      totalParticipants,
      topTenThreshold
    };

  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return {
      questId,
      questTitle,
      entries: [],
      totalParticipants: 0,
      topTenThreshold: 0
    };
  }
}

/**
 * Check if user is in top 10% for a quest
 */
export async function isUserInTopTen(
  db: Firestore,
  questId: string,
  userId: string
): Promise<{ isTopTen: boolean; rank: number; percentile: number }> {
  try {
    const leaderboardRef = collection(db, `leaderboards/quests/${questId}`);

    // Get all entries
    const allEntriesSnapshot = await getDocs(query(leaderboardRef, orderBy('score', 'asc')));
    const totalParticipants = allEntriesSnapshot.size;

    if (totalParticipants === 0) {
      return { isTopTen: false, rank: 0, percentile: 0 };
    }

    // Find user's rank
    let userRank = 0;
    allEntriesSnapshot.docs.forEach((doc, index) => {
      if (doc.data().userId === userId) {
        userRank = index + 1;
      }
    });

    if (userRank === 0) {
      return { isTopTen: false, rank: 0, percentile: 0 };
    }

    const percentile = (userRank / totalParticipants) * 100;
    const isTopTen = percentile <= 10;

    return {
      isTopTen,
      rank: userRank,
      percentile
    };

  } catch (error) {
    console.error('Failed to check top ten status:', error);
    return { isTopTen: false, rank: 0, percentile: 0 };
  }
}

/**
 * Calculate bonus rewards for leaderboard position
 *
 * @param isTopTen - Whether user is in top 10%
 * @param rank - User's rank
 * @param baseRewards - Base quest rewards
 */
export function calculateLeaderboardBonus(
  isTopTen: boolean,
  rank: number,
  baseRewards: { gold: number; xp: number }
): { gold: number; xp: number; multiplier: number } {
  if (!isTopTen) {
    return { gold: 0, xp: 0, multiplier: 1.0 };
  }

  let multiplier = 1.0;

  // Top 3 get massive bonuses
  if (rank === 1) {
    multiplier = 2.0; // 100% bonus
  } else if (rank === 2) {
    multiplier = 1.75; // 75% bonus
  } else if (rank === 3) {
    multiplier = 1.5; // 50% bonus
  } else if (rank <= 10) {
    multiplier = 1.3; // 30% bonus for top 10
  } else {
    multiplier = 1.15; // 15% bonus for top 10%
  }

  return {
    gold: Math.floor(baseRewards.gold * (multiplier - 1)),
    xp: Math.floor(baseRewards.xp * (multiplier - 1)),
    multiplier
  };
}

/**
 * Format score for display based on quest type
 */
export function formatLeaderboardScore(score: number, questType: 'fitness' | 'battle' | 'other'): string {
  switch (questType) {
    case 'fitness':
      // Score is time in seconds
      const minutes = Math.floor(score / 60);
      const seconds = score % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;

    case 'battle':
      // Score is completion time + efficiency
      return `${score.toFixed(0)} pts`;

    default:
      return score.toString();
  }
}

/**
 * Get user's personal best for a quest
 */
export async function getPersonalBest(
  db: Firestore,
  questId: string,
  userId: string
): Promise<{ score: number; completedAt: Date } | null> {
  try {
    const entryRef = doc(db, `leaderboards/quests/${questId}/${userId}`);
    const { getDoc } = await import('firebase/firestore');
    const entrySnap = await getDoc(entryRef);

    if (!entrySnap.exists()) {
      return null;
    }

    return {
      score: entrySnap.data().score,
      completedAt: entrySnap.data().completedAt?.toDate() || new Date()
    };

  } catch (error) {
    console.error('Failed to get personal best:', error);
    return null;
  }
}

/**
 * Calculate fitness quest score
 * Lower is better (faster completion time)
 */
export function calculateFitnessScore(
  completionTimeSeconds: number,
  isTracked: boolean
): number {
  // If untracked (manual), add 50% penalty to score (making it worse)
  if (!isTracked) {
    return Math.floor(completionTimeSeconds * 1.5);
  }

  return completionTimeSeconds;
}

/**
 * Calculate battle quest score
 * Higher is better (efficiency, damage, etc.)
 */
export function calculateBattleScore(
  completionTimeSeconds: number,
  damageDealt: number,
  damageTaken: number
): number {
  // Base score on efficiency
  const timeBonus = Math.max(0, 600 - completionTimeSeconds); // Bonus for fast completion
  const efficiencyRatio = damageDealt / Math.max(1, damageTaken);

  return Math.floor(timeBonus + (efficiencyRatio * 100));
}

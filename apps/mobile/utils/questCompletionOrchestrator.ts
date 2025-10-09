/**
 * Quest Completion Orchestrator
 *
 * Coordinates all quest completion activities:
 * - Leaderboard submission
 * - Reward calculation with bonuses
 * - Animated rewards display
 * - Quest progress updates
 * - User profile updates
 */

import type { Firestore } from 'firebase/firestore';
import { submitToLeaderboard, calculateLeaderboardBonus } from './questLeaderboards';
import { distributeRewards } from './questRewards';
import { completeQuest } from './questObjectiveTracker';
import type { EnhancedQuest } from '@/types/quest-enhanced';

export interface QuestCompletionData {
  questId: string;
  questTitle: string;
  userId: string;
  username: string;

  // Performance metrics
  completionTimeSeconds: number;

  // Battle-specific
  damageDealt?: number;
  damageTaken?: number;

  // Fitness-specific
  isTracked?: boolean;

  // Team
  teammates?: string[];
}

export interface QuestCompletionResult {
  success: boolean;
  rewards: {
    gold: number;
    xp: number;
    items: any[];
  };
  leaderboardData?: {
    rank: number;
    isTopTen: boolean;
    multiplier: number;
    bonusGold: number;
    bonusXp: number;
  };
  error?: string;
}

/**
 * Complete a quest with full orchestration
 */
export async function completeQuestWithOrchestration(
  db: Firestore,
  quest: EnhancedQuest,
  completionData: QuestCompletionData
): Promise<QuestCompletionResult> {
  try {
    console.log('🎯 Starting quest completion orchestration:', quest.title);

    // Step 1: Calculate base score
    let score = 0;
    const questType = quest.type || 'travel';

    if (questType === 'fitness') {
      // Fitness: Lower time is better
      const isTracked = completionData.isTracked ?? false;
      score = calculateFitnessScore(completionData.completionTimeSeconds, isTracked);
    } else if (questType === 'battle') {
      // Battle: Higher efficiency is better
      score = calculateBattleScore(
        completionData.completionTimeSeconds,
        completionData.damageDealt || 0,
        completionData.damageTaken || 1
      );
    } else {
      // Other types: Just use completion time
      score = completionData.completionTimeSeconds;
    }

    console.log(`  📊 Calculated score: ${score}`);

    // Step 2: Submit to leaderboard
    await submitToLeaderboard(
      db,
      completionData.questId,
      completionData.userId,
      completionData.username,
      score
    );

    console.log('  🏆 Submitted to leaderboard');

    // Step 3: Get leaderboard rank and calculate bonuses
    const leaderboard = await import('./questLeaderboards').then(m =>
      m.getQuestLeaderboard(db, completionData.questId, quest.title)
    );

    const myEntry = leaderboard.entries.find(e => e.userId === completionData.userId);
    const rank = myEntry?.rank || 0;
    const isTopTen = myEntry?.isTopTen || false;

    console.log(`  🥇 Leaderboard rank: ${rank} ${isTopTen ? '(Top 10%)' : ''}`);

    // Step 4: Calculate rewards with bonuses
    const baseRewards = quest.rewards || { gold: 100, xp: 200, items: [] };
    const bonusResult = calculateLeaderboardBonus(isTopTen, rank, {
      gold: baseRewards.gold || 0,
      xp: baseRewards.xp || 0
    });

    console.log(`  💰 Reward multiplier: ${bonusResult.multiplier}x`);
    console.log(`  💵 Gold: ${baseRewards.gold} → ${bonusResult.gold}`);
    console.log(`  ⭐ XP: ${baseRewards.xp} → ${bonusResult.xp}`);

    // Step 5: Distribute rewards
    const finalRewards = {
      gold: bonusResult.gold,
      xp: bonusResult.xp,
      items: baseRewards.items || []
    };

    const rewardResult = await distributeRewards(
      db,
      completionData.userId,
      finalRewards,
      completionData.teammates || []
    );

    console.log('  🎁 Rewards distributed');

    // Step 6: Mark quest as complete
    const questProgressId = `${completionData.userId}_${completionData.questId}`;
    await completeQuest(db, questProgressId);

    console.log('  ✅ Quest marked complete');

    // Step 7: Return complete result
    return {
      success: true,
      rewards: {
        gold: bonusResult.gold,
        xp: bonusResult.xp,
        items: rewardResult.rewards.items
      },
      leaderboardData: {
        rank,
        isTopTen,
        multiplier: bonusResult.multiplier,
        bonusGold: bonusResult.gold - baseRewards.gold,
        bonusXp: bonusResult.xp - baseRewards.xp
      }
    };

  } catch (error) {
    console.error('❌ Quest completion failed:', error);
    return {
      success: false,
      rewards: { gold: 0, xp: 0, items: [] },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate fitness quest score
 * Lower is better (faster time)
 */
function calculateFitnessScore(
  completionTimeSeconds: number,
  isTracked: boolean
): number {
  if (!isTracked) {
    // 50% penalty for untracked workouts
    return Math.floor(completionTimeSeconds * 1.5);
  }
  return completionTimeSeconds;
}

/**
 * Calculate battle quest score
 * Higher is better (efficiency + speed)
 */
function calculateBattleScore(
  completionTimeSeconds: number,
  damageDealt: number,
  damageTaken: number
): number {
  // Time bonus: max 600 seconds (10 minutes) = 600 bonus points
  const timeBonus = Math.max(0, 600 - completionTimeSeconds);

  // Efficiency ratio: damage dealt vs damage taken
  const efficiencyRatio = damageDealt / Math.max(1, damageTaken);

  // Final score: time bonus + efficiency × 100
  return Math.floor(timeBonus + (efficiencyRatio * 100));
}

/**
 * Prepare reward items for animated display
 */
export function prepareAnimatedRewardItems(
  rewards: { gold: number; xp: number; items: any[] },
  leaderboardData?: {
    rank: number;
    isTopTen: boolean;
    multiplier: number;
    bonusGold: number;
    bonusXp: number;
  }
): Array<{
  type: 'xp' | 'gold' | 'item' | 'card';
  amount?: number;
  name?: string;
  rarity?: string;
  icon?: string;
}> {
  const rewardItems = [];

  // XP reward
  if (rewards.xp > 0) {
    rewardItems.push({
      type: 'xp' as const,
      amount: rewards.xp,
      name: 'Experience Points'
    });
  }

  // Gold reward
  if (rewards.gold > 0) {
    rewardItems.push({
      type: 'gold' as const,
      amount: rewards.gold,
      name: 'Gold'
    });
  }

  // Item rewards
  for (const item of rewards.items) {
    rewardItems.push({
      type: (item.type === 'card' ? 'card' : 'item') as 'item' | 'card',
      name: item.name,
      rarity: item.rarity,
      icon: item.icon
    });
  }

  return rewardItems;
}

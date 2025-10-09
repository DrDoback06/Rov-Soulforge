/**
 * Quest Battle Utilities
 *
 * Handles PvE battles for quest objectives
 * Creates battles between player and quest enemies
 */

import { httpsCallable } from 'firebase/functions';
import type { Functions } from 'firebase/functions';
import type { Firestore } from 'firebase/firestore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export interface QuestEnemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  icon: string;
  type: string;
  abilities?: string[];
  loot?: {
    xp: number;
    gold: number;
    cardDropChance: number;
    cardRarity: string;
  };
}

export interface QuestBattleResult {
  battleId: string;
  victory: boolean;
  rewards?: {
    xp: number;
    gold: number;
    cards?: any[];
  };
  xpPenalty?: number;
}

/**
 * Start a battle with a quest enemy
 *
 * Creates a PvE battle and returns battle ID for navigation
 */
export async function startQuestEnemyBattle(
  functions: Functions,
  userId: string,
  enemy: QuestEnemy,
  questId?: string
): Promise<string> {
  try {
    console.log('⚔️ Starting battle with:', enemy.name);

    const createBattleFn = httpsCallable(functions, 'createBattle');

    // Create PvE battle with enemy as AI opponent
    const result = await createBattleFn({
      participants: [userId, `enemy_${enemy.id}`],
      mode: 'pve',
      options: {
        ranked: false,
        enemyData: {
          id: enemy.id,
          name: enemy.name,
          level: enemy.level,
          hp: enemy.hp,
          attack: enemy.attack,
          defense: enemy.defense,
          type: enemy.type,
          abilities: enemy.abilities || []
        },
        questId // Track which quest this battle is for
      }
    });

    const data = result.data as any;

    if (!data.battleId) {
      throw new Error('Battle creation failed - no battle ID returned');
    }

    console.log('✅ Battle created:', data.battleId);
    return data.battleId;

  } catch (error) {
    console.error('❌ Failed to create quest battle:', error);
    throw error;
  }
}

/**
 * Handle quest battle completion
 *
 * Called after battle ends to update quest progress
 */
export async function handleQuestBattleComplete(
  db: Firestore,
  userId: string,
  questProgressId: string,
  objectiveId: string,
  enemyId: string,
  victory: boolean
): Promise<void> {
  try {
    const progressRef = doc(db, 'questProgress', questProgressId);
    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) {
      throw new Error('Quest progress not found');
    }

    const progressData = progressSnap.data();
    const updatedObjectives = progressData.objectives.map((obj: any) => {
      if (obj.id === objectiveId && obj.type === 'battle') {
        // Update spawned enemies to mark this one as defeated
        const updatedEnemies = obj.metadata?.spawnedEnemies?.map((spawn: any) => {
          if (spawn.enemy.id === enemyId) {
            return {
              ...spawn,
              defeated: victory
            };
          }
          return spawn;
        }) || [];

        // Count how many enemies are defeated
        const defeatedCount = updatedEnemies.filter((spawn: any) => spawn.defeated).length;

        return {
          ...obj,
          current: defeatedCount,
          completed: defeatedCount >= obj.target,
          metadata: {
            ...obj.metadata,
            spawnedEnemies: updatedEnemies
          }
        };
      }
      return obj;
    });

    // Check if all objectives are complete
    const allComplete = updatedObjectives.every((obj: any) => obj.completed);

    await updateDoc(progressRef, {
      objectives: updatedObjectives,
      status: allComplete ? 'completed' : 'in_progress',
      lastUpdated: new Date()
    });

    console.log(`✅ Quest progress updated - Enemy ${enemyId} marked as ${victory ? 'defeated' : 'not defeated'}`);

    if (allComplete) {
      console.log('🎉 All quest objectives complete!');
    }

  } catch (error) {
    console.error('❌ Failed to update quest progress:', error);
    throw error;
  }
}

/**
 * Get quest progress and objective IDs for a battle
 *
 * Used to track which quest objective a battle belongs to
 */
export async function findQuestBattleContext(
  db: Firestore,
  userId: string,
  enemyId: string
): Promise<{ questProgressId: string; objectiveId: string } | null> {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');

    const q = query(
      collection(db, 'questProgress'),
      where('uid', '==', userId),
      where('status', '==', 'in_progress')
    );

    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Find objective with this enemy
      const battleObjective = data.objectives?.find((obj: any) => {
        if (obj.type === 'battle' && obj.metadata?.spawnedEnemies) {
          return obj.metadata.spawnedEnemies.some((spawn: any) =>
            spawn.enemy.id === enemyId && !spawn.defeated
          );
        }
        return false;
      });

      if (battleObjective) {
        return {
          questProgressId: doc.id,
          objectiveId: battleObjective.id
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to find quest battle context:', error);
    return null;
  }
}

/**
 * Calculate XP penalty for losing a quest battle
 */
export function calculateQuestBattleXPPenalty(
  questDifficulty: string,
  playerLevel: number
): number {
  const basePenalties: Record<string, number> = {
    easy: 50,
    medium: 100,
    hard: 200,
    epic: 400,
    legendary: 800
  };

  const penalty = basePenalties[questDifficulty] || 100;

  // Scale with player level (higher level = bigger penalty)
  return Math.floor(penalty * (1 + playerLevel / 20));
}

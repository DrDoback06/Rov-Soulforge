/**
 * Quest Battle Integration
 *
 * Handles launching battles from quest objectives and tracking completion.
 * Works with local SimpleBattle system and can optionally sync to Firebase.
 */

import type { Character } from '@rov/types';
import type { SimpleBattleState } from '@/features/battle';

export interface QuestBattleConfig {
  questId: string;
  objectiveId: string;
  enemyName: string;
  enemyLevel?: number;
  requiredWins?: number;
}

export interface QuestBattleResult {
  questId: string;
  objectiveId: string;
  enemyId: string;
  winner: 'player' | 'opponent';
  battleLog: string[];
  completedAt: Date;
}

/**
 * Launch a battle from a quest objective
 */
export function startQuestBattle(
  config: QuestBattleConfig,
  playerCharacter: Character
): QuestBattleConfig {
  console.log(`⚔️ Starting quest battle: ${config.questId} vs ${config.enemyName}`);
  return config;
}

/**
 * Handle local battle completion (SimpleBattle system)
 * Updates quest progress locally and optionally syncs to Firebase
 */
export function handleLocalBattleComplete(
  battleState: SimpleBattleState,
  config: QuestBattleConfig
): QuestBattleResult {
  const result: QuestBattleResult = {
    questId: config.questId,
    objectiveId: config.objectiveId,
    enemyId: battleState.opponent.characterId,
    winner: battleState.winner || 'opponent',
    battleLog: battleState.battleLog,
    completedAt: new Date(),
  };

  console.log(`✅ Local battle completed - Winner: ${result.winner}`);

  // TODO: Update local quest progress
  // TODO: Optionally sync to Firebase if online

  return result;
}

/**
 * Check if quest battle objective is complete
 */
export function isQuestBattleComplete(
  currentWins: number,
  requiredWins: number
): boolean {
  return currentWins >= requiredWins;
}

/**
 * Get battle configuration from quest objective
 */
export function getBattleConfigFromObjective(
  questId: string,
  objective: any
): QuestBattleConfig | null {
  if (objective.type !== 'battle') {
    return null;
  }

  return {
    questId,
    objectiveId: objective.id,
    enemyName: objective.enemyType || 'Goblin',
    enemyLevel: objective.minLevel || 1,
    requiredWins: objective.count || 1,
  };
}

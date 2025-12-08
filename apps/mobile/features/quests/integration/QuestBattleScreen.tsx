/**
 * Quest Battle Screen
 *
 * Wrapper around BattleScreen that handles quest integration.
 * Launches battles from quest objectives and updates progress on completion.
 */

import React from 'react';
import { BattleScreen } from '@/features/battle';
import type { Character } from '@rov/types';
import type { QuestBattleConfig } from './questBattles';
import { handleLocalBattleComplete } from './questBattles';

export interface QuestBattleScreenProps {
  playerCharacter: Character;
  battleConfig: QuestBattleConfig;
  onBattleEnd: (result: { winner: 'player' | 'opponent'; victory: boolean }) => void;
}

/**
 * Battle screen integrated with quest system
 *
 * @example
 * ```tsx
 * const battleConfig = getBattleConfigFromObjective(questId, objective);
 *
 * <QuestBattleScreen
 *   playerCharacter={character}
 *   battleConfig={battleConfig}
 *   onBattleEnd={(result) => {
 *     if (result.victory) {
 *       updateQuestProgress(questId, objectiveId);
 *     }
 *   }}
 * />
 * ```
 */
export function QuestBattleScreen({
  playerCharacter,
  battleConfig,
  onBattleEnd,
}: QuestBattleScreenProps) {
  const handleBattleComplete = (winner: 'player' | 'opponent') => {
    const victory = winner === 'player';

    console.log(`⚔️ Quest battle ended - Victory: ${victory}`);

    // Trigger callback
    onBattleEnd({ winner, victory });
  };

  return (
    <BattleScreen
      playerCharacter={playerCharacter}
      opponentName={battleConfig.enemyName}
      onBattleEnd={handleBattleComplete}
    />
  );
}

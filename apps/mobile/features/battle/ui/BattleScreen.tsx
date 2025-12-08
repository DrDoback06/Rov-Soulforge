/**
 * Battle Screen - SIMPLE WORKING IMPLEMENTATION
 *
 * This is the main battle screen that actually works!
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useSimpleBattle } from '../hooks/useSimpleBattle';
import { BattleCard } from './BattleCard';
import type { Character } from '@rov/types';

interface BattleScreenProps {
  playerCharacter: Character;
  opponentName?: string;
  onBattleEnd?: (winner: 'player' | 'opponent') => void;
}

export function BattleScreen({ playerCharacter, opponentName = 'Goblin', onBattleEnd }: BattleScreenProps) {
  const {
    battleState,
    isLoading,
    error,
    playCard,
    endTurn,
    startBattle,
    isPlayerTurn,
    isGameOver,
    winner
  } = useSimpleBattle();

  // Start battle on mount
  useEffect(() => {
    console.log('🎮 BattleScreen mounted, starting battle...');
    startBattle(playerCharacter, opponentName);
  }, [startBattle, playerCharacter, opponentName]);

  // Handle battle end
  useEffect(() => {
    if (isGameOver && winner && onBattleEnd) {
      console.log('🏆 Battle ended, winner:', winner);
      onBattleEnd(winner);
    }
  }, [isGameOver, winner, onBattleEnd]);

  if (isLoading || !battleState) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading battle...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Battle Log */}
      <View style={styles.logContainer}>
        <ScrollView style={styles.log} contentContainerStyle={styles.logContent}>
          {battleState.battleLog.slice(-5).map((entry, index) => (
            <Text key={index} style={styles.logEntry}>
              {entry}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Opponent Area */}
      <View style={styles.opponentArea}>
        <Text style={styles.opponentName}>
          {battleState.opponent.name} ({battleState.difficulty.toUpperCase()})
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statBar}>
            <Text style={styles.statLabel}>❤️ HP</Text>
            <View style={styles.statBarBg}>
              <View
                style={[
                  styles.statBarFill,
                  styles.hpBar,
                  { width: `${(battleState.opponent.hp / battleState.opponent.maxHp) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.statText}>
              {battleState.opponent.hp}/{battleState.opponent.maxHp}
            </Text>
          </View>
          <View style={styles.statBar}>
            <Text style={styles.statLabel}>💧 Mana</Text>
            <Text style={styles.statText}>
              {battleState.opponent.mana}/{battleState.opponent.maxMana}
            </Text>
          </View>
        </View>

        {/* Opponent Shield */}
        {battleState.opponent.shield > 0 && (
          <View style={styles.shieldIndicator}>
            <Text style={styles.shieldText}>🛡️ Shield: {battleState.opponent.shield}</Text>
          </View>
        )}

        {/* Opponent Status Effects */}
        {battleState.opponent.statusEffects.length > 0 && (
          <View style={styles.statusEffectsContainer}>
            {battleState.opponent.statusEffects.map((effect, idx) => (
              <View key={idx} style={styles.statusEffect}>
                <Text style={styles.statusEffectText}>
                  {effect.type === 'burn' && '🔥'}
                  {effect.type === 'poison' && '☠️'}
                  {effect.type === 'shield' && '🛡️'}
                  {effect.type === 'strength' && '⚡'}
                  {effect.type === 'weakness' && '🔻'}
                  {' '}
                  {effect.duration}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.handCount}>Cards: {battleState.opponent.hand.length}</Text>
      </View>

      {/* Center Info */}
      <View style={styles.centerInfo}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Combo Notification */}
        {battleState.lastCombo && !isGameOver && (
          <View style={styles.comboBanner}>
            <Text style={styles.comboText}>
              ⚡ {battleState.lastCombo.name}!
            </Text>
            <Text style={styles.comboDesc}>+{battleState.lastCombo.bonusDamage} damage</Text>
          </View>
        )}

        {isGameOver ? (
          <View style={styles.gameOverBanner}>
            <Text style={styles.gameOverText}>
              {winner === 'player' ? '🎉 YOU WON!' : '💀 YOU LOST!'}
            </Text>
            <Text style={styles.rewardsText}>
              +{battleState.rewards.xp} XP, +{battleState.rewards.gold} Gold
            </Text>
          </View>
        ) : (
          <View style={[styles.turnIndicator, isPlayerTurn && styles.yourTurn]}>
            <Text style={styles.turnText}>
              {isPlayerTurn ? '✨ YOUR TURN' : '⏳ OPPONENT TURN'}
            </Text>
          </View>
        )}

        <Text style={styles.turnNumber}>Turn {battleState.turnNumber}</Text>
      </View>

      {/* Player Area */}
      <View style={styles.playerArea}>
        <View style={styles.statsRow}>
          <View style={styles.statBar}>
            <Text style={styles.statLabel}>❤️ HP</Text>
            <View style={styles.statBarBg}>
              <View
                style={[
                  styles.statBarFill,
                  styles.hpBar,
                  { width: `${(battleState.player.hp / battleState.player.maxHp) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.statText}>
              {battleState.player.hp}/{battleState.player.maxHp}
            </Text>
          </View>
          <View style={styles.statBar}>
            <Text style={styles.statLabel}>💧 Mana</Text>
            <Text style={styles.statText}>
              {battleState.player.mana}/{battleState.player.maxMana}
            </Text>
          </View>
        </View>

        {/* Player Shield */}
        {battleState.player.shield > 0 && (
          <View style={styles.shieldIndicator}>
            <Text style={styles.shieldText}>🛡️ Shield: {battleState.player.shield}</Text>
          </View>
        )}

        {/* Player Status Effects */}
        {battleState.player.statusEffects.length > 0 && (
          <View style={styles.statusEffectsContainer}>
            {battleState.player.statusEffects.map((effect, idx) => (
              <View key={idx} style={styles.statusEffect}>
                <Text style={styles.statusEffectText}>
                  {effect.type === 'burn' && '🔥'}
                  {effect.type === 'poison' && '☠️'}
                  {effect.type === 'shield' && '🛡️'}
                  {effect.type === 'strength' && '⚡'}
                  {effect.type === 'weakness' && '🔻'}
                  {' '}
                  {effect.duration}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Player Hand */}
        <ScrollView
          horizontal
          style={styles.hand}
          contentContainerStyle={styles.handContent}
          showsHorizontalScrollIndicator={false}
        >
          {battleState.player.hand.map((card) => (
            <BattleCard
              key={card.id}
              card={card}
              onPress={() => playCard(card.id)}
              disabled={!isPlayerTurn || isGameOver || battleState.player.mana < card.manaCost}
            />
          ))}
        </ScrollView>

        {/* End Turn Button */}
        <Pressable
          style={({ pressed }) => [
            styles.endTurnButton,
            (!isPlayerTurn || isGameOver) && styles.endTurnButtonDisabled,
            pressed && isPlayerTurn && !isGameOver && styles.endTurnButtonPressed
          ]}
          onPress={endTurn}
          disabled={!isPlayerTurn || isGameOver}
        >
          <Text style={styles.endTurnButtonText}>END TURN</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  logContainer: {
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
  },
  log: {
    flex: 1,
  },
  logContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  logEntry: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  opponentArea: {
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#ef4444',
  },
  opponentName: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBar: {
    flex: 1,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  statBarBg: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  statBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  hpBar: {
    backgroundColor: '#ef4444',
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  handCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  centerInfo: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  turnIndicator: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
  },
  yourTurn: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  turnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  turnNumber: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  gameOverBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    padding: 16,
    borderRadius: 12,
  },
  gameOverText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerArea: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderTopWidth: 2,
    borderTopColor: '#3b82f6',
  },
  hand: {
    marginVertical: 16,
  },
  handContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
  },
  endTurnButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endTurnButtonDisabled: {
    backgroundColor: '#6b7280',
    opacity: 0.5,
  },
  endTurnButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  endTurnButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shieldIndicator: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    padding: 6,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  shieldText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusEffectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  statusEffect: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  statusEffectText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  comboBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#eab308',
  },
  comboText: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comboDesc: {
    color: '#fde68a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  rewardsText: {
    color: '#86efac',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});

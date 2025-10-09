/**
 * Target Selector Component
 *
 * Allows players to select targets for card effects
 * Highlights valid targets and provides visual feedback
 */

import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import type { BattlePlayer } from '@/types/battleground';
import type { Card } from '@rov/types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat
} from 'react-native-reanimated';

interface TargetSelectorProps {
  visible: boolean;
  card: Card;
  players: BattlePlayer[];
  currentPlayerId: string;
  onSelectTargets: (targetIds: string[]) => void;
  onCancel: () => void;
}

export function TargetSelector({
  visible,
  card,
  players,
  currentPlayerId,
  onSelectTargets,
  onCancel
}: TargetSelectorProps) {
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  // Determine valid targets based on card effects
  const validTargets = getValidTargets(card, players, currentPlayerId);
  const requiresTargeting = validTargets.length > 0;
  const maxTargets = getMaxTargets(card);

  function handleSelectTarget(targetId: string) {
    if (maxTargets === 1) {
      // Single target - select immediately
      setSelectedTargets(new Set([targetId]));
      setTimeout(() => {
        onSelectTargets([targetId]);
        setSelectedTargets(new Set());
      }, 300);
    } else {
      // Multiple targets - toggle selection
      setSelectedTargets(prev => {
        const newSet = new Set(prev);
        if (newSet.has(targetId)) {
          newSet.delete(targetId);
        } else if (newSet.size < maxTargets) {
          newSet.add(targetId);
        }
        return newSet;
      });
    }
  }

  function handleConfirm() {
    onSelectTargets(Array.from(selectedTargets));
    setSelectedTargets(new Set());
  }

  function handleCancel() {
    setSelectedTargets(new Set());
    onCancel();
  }

  if (!visible || !requiresTargeting) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.98)', 'rgba(15, 15, 30, 0.98)']}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Select Target{maxTargets > 1 ? 's' : ''}</Text>
              <Text style={styles.cardName}>{card.name}</Text>
            </View>

            {/* Target selection */}
            <View style={styles.targetsContainer}>
              {validTargets.map(target => {
                const isSelected = selectedTargets.has(target.userId);
                const isCurrentPlayer = target.userId === currentPlayerId;

                return (
                  <TargetButton
                    key={target.userId}
                    player={target}
                    isSelected={isSelected}
                    isCurrentPlayer={isCurrentPlayer}
                    onSelect={() => handleSelectTarget(target.userId)}
                  />
                );
              })}
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {maxTargets === 1
                  ? 'Tap a target to select'
                  : `Select up to ${maxTargets} targets (${selectedTargets.size}/${maxTargets})`
                }
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {maxTargets > 1 && (
                <Pressable
                  style={[styles.confirmButton, selectedTargets.size === 0 && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  disabled={selectedTargets.size === 0}
                >
                  <LinearGradient
                    colors={selectedTargets.size > 0 ? ['#4ade80', '#22c55e'] : ['#3a3a4e', '#2a2a3e']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Confirm ({selectedTargets.size})</Text>
                  </LinearGradient>
                </Pressable>
              )}

              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

interface TargetButtonProps {
  player: BattlePlayer;
  isSelected: boolean;
  isCurrentPlayer: boolean;
  onSelect: () => void;
}

function TargetButton({ player, isSelected, isCurrentPlayer, onSelect }: TargetButtonProps) {
  const pulseAnim = useSharedValue(1);

  // Pulse animation for selected targets
  if (isSelected) {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1
    );
  } else {
    pulseAnim.value = 1;
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }]
  }));

  const hpPercentage = (player.hp / player.maxHp) * 100;

  return (
    <Pressable onPress={onSelect}>
      <Animated.View style={[
        styles.targetButton,
        isSelected && styles.targetButtonSelected,
        animatedStyle
      ]}>
        <LinearGradient
          colors={isSelected ? ['#4ade80', '#22c55e'] : ['#2a2a3e', '#1a1a2e']}
          style={styles.targetButtonGradient}
        >
          {/* Player info */}
          <View style={styles.targetHeader}>
            <Text style={styles.targetName}>
              {player.username} {isCurrentPlayer && '(You)'}
            </Text>
            <View style={styles.livesContainer}>
              {[...Array(player.lives)].map((_, i) => (
                <Text key={i} style={styles.lifeIcon}>❤️</Text>
              ))}
            </View>
          </View>

          {/* HP bar */}
          <View style={styles.hpBarContainer}>
            <View style={styles.hpBarTrack}>
              <View style={[
                styles.hpBarFill,
                { width: `${hpPercentage}%`, backgroundColor: getHpColor(hpPercentage) }
              ]} />
            </View>
            <Text style={styles.hpText}>
              {player.hp} / {player.maxHp}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>⚔️</Text>
              <Text style={styles.statValue}>{player.atk}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>🛡️</Text>
              <Text style={styles.statValue}>{player.def}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>💧</Text>
              <Text style={styles.statValue}>{player.mana}</Text>
            </View>
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.selectedIcon}>✓</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function getValidTargets(
  card: Card,
  players: BattlePlayer[],
  currentPlayerId: string
): BattlePlayer[] {
  // Parse card effects to determine valid targets
  // For now, assume all effects can target any player

  const validTargets: BattlePlayer[] = [];

  for (const effect of card.effects || []) {
    switch (effect.type) {
      case 'damage':
      case 'debuff':
        // Can target opponents
        validTargets.push(...players.filter(p => p.userId !== currentPlayerId));
        break;

      case 'heal':
      case 'buff':
        // Can target self and allies
        validTargets.push(...players.filter(p =>
          p.userId === currentPlayerId || p.role.startsWith('ally')
        ));
        break;

      default:
        // Other effects may not require targeting
        break;
    }
  }

  // Remove duplicates
  return Array.from(new Set(validTargets));
}

function getMaxTargets(card: Card): number {
  // Most cards target 1 player
  // Some AoE cards could target multiple
  // This could be expanded based on card metadata

  for (const effect of card.effects || []) {
    if (effect.type === 'damage' || effect.type === 'heal') {
      // Check if it's an AoE effect (future enhancement)
      return 1;
    }
  }

  return 1;
}

function getHpColor(percentage: number): string {
  if (percentage > 60) return '#22c55e';
  if (percentage > 30) return '#f59e0b';
  return '#ef4444';
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden'
  },
  content: {
    padding: 24
  },
  header: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8
  },
  cardName: {
    fontSize: 16,
    color: '#8e8e93'
  },
  targetsContainer: {
    gap: 12,
    marginBottom: 20
  },
  targetButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  targetButtonSelected: {
    borderWidth: 3,
    borderColor: '#4ade80'
  },
  targetButtonGradient: {
    padding: 16,
    position: 'relative'
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  targetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4
  },
  lifeIcon: {
    fontSize: 16
  },
  hpBarContainer: {
    marginBottom: 12
  },
  hpBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 4
  },
  hpText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12
  },
  statBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 8
  },
  statLabel: {
    fontSize: 14
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  infoBox: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#4488ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20
  },
  infoText: {
    fontSize: 14,
    color: '#4488ff',
    textAlign: 'center'
  },
  actions: {
    gap: 12
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444'
  }
});

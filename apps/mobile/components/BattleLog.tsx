/**
 * Battle Log Component
 *
 * Real-time battle event log with timestamps and RNG seeds
 * Displays all battle actions for transparency and replay ability
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import type { BattleLogEntry, DiceRoll } from '@/types/battleground';
import Animated, {
  FadeInDown,
  FadeOutUp
} from 'react-native-reanimated';

interface BattleLogProps {
  log: BattleLogEntry[];
  expanded?: boolean;
}

export function BattleLog({ log, expanded: initialExpanded = false }: BattleLogProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [showSeeds, setShowSeeds] = useState(false);

  // Show last 10 entries when collapsed
  const displayLog = expanded ? log : log.slice(-10);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>📜 Battle Log</Text>
          <Text style={styles.count}>({log.length})</Text>
        </View>
        <Text style={styles.expandIcon}>
          {expanded ? '▼' : '▶'}
        </Text>
      </Pressable>

      {/* Log entries */}
      {expanded && (
        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {displayLog.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <LogEntry entry={entry} showSeed={showSeeds} />
              </Animated.View>
            ))}

            {log.length > 10 && !expanded && (
              <Pressable style={styles.showMoreButton} onPress={() => setExpanded(true)}>
                <Text style={styles.showMoreText}>
                  Show all ({log.length - 10} more)
                </Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Debug toggle */}
          <Pressable
            style={styles.debugToggle}
            onPress={() => setShowSeeds(!showSeeds)}
          >
            <Text style={styles.debugToggleText}>
              {showSeeds ? '🔒 Hide' : '🔓 Show'} RNG Seeds
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function LogEntry({ entry, showSeed }: { entry: BattleLogEntry; showSeed: boolean }) {
  const icon = getEventIcon(entry.type);
  const color = getEventColor(entry.type);
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <View style={styles.logEntry}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.logEntryGradient}
      >
        {/* Header row */}
        <View style={styles.logEntryHeader}>
          <View style={styles.logEntryLeft}>
            <Text style={styles.logIcon}>{icon}</Text>
            <Text style={[styles.logType, { color }]}>
              {formatEventType(entry.type)}
            </Text>
          </View>
          <View style={styles.logEntryRight}>
            <Text style={styles.turnNumber}>Turn {entry.turnNumber}</Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
        </View>

        {/* Message */}
        <Text style={styles.logMessage}>{entry.message}</Text>

        {/* Card played */}
        {entry.cardPlayed && (
          <View style={styles.cardInfo}>
            <Text style={styles.cardInfoIcon}>🎴</Text>
            <Text style={styles.cardInfoText}>{entry.cardPlayed.cardName}</Text>
          </View>
        )}

        {/* Damage/Heal info */}
        {entry.damage && (
          <View style={styles.damageInfo}>
            <Text style={styles.damageIcon}>⚔️</Text>
            <Text style={styles.damageText}>
              {entry.damage.amount} damage → {entry.damage.targetName}
            </Text>
          </View>
        )}

        {entry.heal && (
          <View style={styles.healInfo}>
            <Text style={styles.healIcon}>💚</Text>
            <Text style={styles.healText}>
              {entry.heal.amount} healing → {entry.heal.targetName}
            </Text>
          </View>
        )}

        {/* Dice rolls */}
        {entry.diceRolls && entry.diceRolls.length > 0 && (
          <View style={styles.diceInfo}>
            <Text style={styles.diceIcon}>🎲</Text>
            <View style={styles.diceRolls}>
              {entry.diceRolls.map((roll, i) => (
                <DiceResult key={i} roll={roll} />
              ))}
            </View>
          </View>
        )}

        {/* RNG seed (debug) */}
        {showSeed && entry.rngSeed && (
          <View style={styles.seedInfo}>
            <Text style={styles.seedLabel}>Seed:</Text>
            <Text style={styles.seedValue}>{entry.rngSeed.substring(0, 16)}...</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

function DiceResult({ roll }: { roll: DiceRoll }) {
  return (
    <View style={styles.diceResult}>
      <Text style={styles.diceType}>{roll.diceType}</Text>
      <Text style={styles.diceValue}>{roll.result}</Text>
    </View>
  );
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    turn_start: '▶️',
    turn_end: '⏸️',
    card_played: '🎴',
    card_drawn: '🃏',
    stack_added: '➕',
    stack_resolved: '✅',
    stack_countered: '🚫',
    damage_dealt: '⚔️',
    healing_done: '💚',
    buff_applied: '⬆️',
    debuff_applied: '⬇️',
    effect_expired: '⏱️',
    item_equipped: '🎒',
    item_destroyed: '💥',
    player_died: '💀',
    battle_won: '🏆',
    battle_lost: '☠️',
    player_surrendered: '🏳️',
    player_disconnected: '🔌'
  };
  return icons[type] || '📝';
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    turn_start: '#4488ff',
    turn_end: '#8e8e93',
    card_played: '#ffd700',
    stack_resolved: '#22c55e',
    stack_countered: '#ef4444',
    damage_dealt: '#ff4444',
    healing_done: '#22c55e',
    buff_applied: '#4ade80',
    debuff_applied: '#f59e0b',
    player_died: '#ef4444',
    battle_won: '#ffd700',
    battle_lost: '#8e8e93',
    player_surrendered: '#f59e0b'
  };
  return colors[type] || '#8e8e93';
}

function formatEventType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(26, 26, 46, 0.95)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  count: {
    fontSize: 14,
    color: '#8e8e93'
  },
  expandIcon: {
    fontSize: 16,
    color: '#8e8e93'
  },
  content: {
    maxHeight: 400
  },
  scrollView: {
    maxHeight: 350
  },
  scrollContent: {
    padding: 12,
    gap: 8
  },
  logEntry: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4
  },
  logEntryGradient: {
    padding: 12
  },
  logEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  logEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logIcon: {
    fontSize: 16
  },
  logType: {
    fontSize: 12,
    fontWeight: '600'
  },
  logEntryRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  turnNumber: {
    fontSize: 11,
    color: '#4488ff',
    fontWeight: '600'
  },
  timestamp: {
    fontSize: 11,
    color: '#5e5e6e',
    fontFamily: 'monospace'
  },
  logMessage: {
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 6
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 6,
    borderRadius: 4,
    marginTop: 4
  },
  cardInfoIcon: {
    fontSize: 14
  },
  cardInfoText: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: '600'
  },
  damageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 6,
    borderRadius: 4,
    marginTop: 4
  },
  damageIcon: {
    fontSize: 14
  },
  damageText: {
    fontSize: 12,
    color: '#ff4444',
    fontWeight: '600'
  },
  healInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 6,
    borderRadius: 4,
    marginTop: 4
  },
  healIcon: {
    fontSize: 14
  },
  healText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600'
  },
  diceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6
  },
  diceIcon: {
    fontSize: 14
  },
  diceRolls: {
    flexDirection: 'row',
    gap: 6
  },
  diceResult: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#4488ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center'
  },
  diceType: {
    fontSize: 10,
    color: '#8e8e93',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  diceValue: {
    fontSize: 14,
    color: '#4488ff',
    fontWeight: 'bold'
  },
  seedInfo: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    padding: 6,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderRadius: 4
  },
  seedLabel: {
    fontSize: 10,
    color: '#5e5e6e',
    fontFamily: 'monospace'
  },
  seedValue: {
    fontSize: 10,
    color: '#8e8e93',
    fontFamily: 'monospace'
  },
  showMoreButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(68, 136, 255, 0.1)',
    borderRadius: 8,
    marginTop: 8
  },
  showMoreText: {
    fontSize: 13,
    color: '#4488ff',
    fontWeight: '600'
  },
  debugToggle: {
    padding: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderTopWidth: 1,
    borderTopColor: '#3a3a4e',
    alignItems: 'center'
  },
  debugToggleText: {
    fontSize: 12,
    color: '#8e8e93'
  }
});

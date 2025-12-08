/**
 * BattleCard Component
 *
 * Displays a single card in battle
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { SimpleCard } from '../engine/BattleEngine';

interface BattleCardProps {
  card: SimpleCard;
  onPress?: () => void;
  disabled?: boolean;
}

export function BattleCard({ card, onPress, disabled = false }: BattleCardProps) {
  const cardColor = {
    attack: '#ef4444',  // red
    heal: '#22c55e',    // green
    buff: '#3b82f6',    // blue
  }[card.type];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardColor },
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{card.name}</Text>
        <View style={styles.manaCost}>
          <Text style={styles.manaText}>{card.manaCost}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardValue}>
          {card.type === 'attack' && `⚔️ ${card.value}`}
          {card.type === 'heal' && `❤️ ${card.value}`}
          {card.type === 'buff' && `⬆️ ${card.value}`}
        </Text>
        <Text style={styles.cardDescription}>{card.description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    height: 160,
    borderRadius: 12,
    padding: 12,
    margin: 6,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  manaCost: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    textAlign: 'center',
  },
});

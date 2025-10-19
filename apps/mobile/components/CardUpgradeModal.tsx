import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GameCard } from '@rov/types';

interface CardUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  card: GameCard | null;
  characterId: string;
  currentGold: number;
  onUpgradeSuccess: () => void;
}

const MAX_LEVEL = 10;
const BASE_UPGRADE_COST = 100;
const COST_MULTIPLIER = 1.5;

export default function CardUpgradeModal({
  visible,
  onClose,
  card,
  characterId,
  currentGold,
  onUpgradeSuccess,
}: CardUpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  if (!card) return null;

  const currentLevel = card.level || 1;
  const isMaxLevel = currentLevel >= MAX_LEVEL;
  const upgradeCost = Math.floor(BASE_UPGRADE_COST * Math.pow(COST_MULTIPLIER, currentLevel - 1));
  const canAfford = currentGold >= upgradeCost;

  // Calculate stat increases based on card type
  const getStatIncrease = (stat: number, type: string) => {
    const baseIncrease = Math.floor(stat * 0.1); // 10% increase per level
    return Math.max(1, baseIncrease);
  };

  const calculateUpgradedStats = () => {
    const newStats = { ...card };
    
    if (card.attack !== undefined) {
      newStats.attack = (card.attack || 0) + getStatIncrease(card.attack || 0, 'attack');
    }
    if (card.defense !== undefined) {
      newStats.defense = (card.defense || 0) + getStatIncrease(card.defense || 0, 'defense');
    }
    if (card.health !== undefined) {
      newStats.health = (card.health || 0) + getStatIncrease(card.health || 0, 'health');
    }
    if (card.mana !== undefined) {
      newStats.mana = (card.mana || 0) + getStatIncrease(card.mana || 0, 'mana');
    }
    
    return newStats;
  };

  const upgradedStats = calculateUpgradedStats();

  const handleUpgrade = async () => {
    if (!db || !canAfford || isMaxLevel || isUpgrading) return;

    setIsUpgrading(true);

    try {
      // Animate the upgrade
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Update card in inventory
      const inventoryRef = doc(db, 'inventories', characterId);
      
      // Get current inventory to find and update the specific card
      await updateDoc(inventoryRef, {
        [`cardsData.${card.id}`]: {
          ...upgradedStats,
          level: currentLevel + 1,
        },
      });

      // Deduct gold from character
      const characterRef = doc(db, 'characters', characterId);
      await updateDoc(characterRef, {
        gold: currentGold - upgradeCost,
      });

      setTimeout(() => {
        onUpgradeSuccess();
        onClose();
      }, 600);
    } catch (error) {
      console.error('Error upgrading card:', error);
      alert('Failed to upgrade card. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common':
        return '#9e9e9e';
      case 'uncommon':
        return '#4caf50';
      case 'rare':
        return '#2196f3';
      case 'epic':
        return '#9c27b0';
      case 'legendary':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const scaleAnim = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Upgrade Card</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Card Info */}
            <Animated.View
              style={[
                styles.cardInfo,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={[styles.cardName, { color: getRarityColor(card.rarity) }]}>
                {card.name}
              </Text>
              <Text style={styles.cardType}>{card.type}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>Level {currentLevel}</Text>
                {!isMaxLevel && (
                  <Text style={styles.levelArrow}> → {currentLevel + 1}</Text>
                )}
                {isMaxLevel && (
                  <Text style={styles.maxLevelText}> (MAX)</Text>
                )}
              </View>
            </Animated.View>

            {/* Stats Comparison */}
            {!isMaxLevel && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Stat Upgrades</Text>
                {card.attack !== undefined && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Attack:</Text>
                    <Text style={styles.statValue}>{card.attack}</Text>
                    <Text style={styles.statArrow}>→</Text>
                    <Text style={styles.statNewValue}>{upgradedStats.attack}</Text>
                    <Text style={styles.statIncrease}>
                      (+{(upgradedStats.attack || 0) - (card.attack || 0)})
                    </Text>
                  </View>
                )}
                {card.defense !== undefined && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Defense:</Text>
                    <Text style={styles.statValue}>{card.defense}</Text>
                    <Text style={styles.statArrow}>→</Text>
                    <Text style={styles.statNewValue}>{upgradedStats.defense}</Text>
                    <Text style={styles.statIncrease}>
                      (+{(upgradedStats.defense || 0) - (card.defense || 0)})
                    </Text>
                  </View>
                )}
                {card.health !== undefined && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Health:</Text>
                    <Text style={styles.statValue}>{card.health}</Text>
                    <Text style={styles.statArrow}>→</Text>
                    <Text style={styles.statNewValue}>{upgradedStats.health}</Text>
                    <Text style={styles.statIncrease}>
                      (+{(upgradedStats.health || 0) - (card.health || 0)})
                    </Text>
                  </View>
                )}
                {card.mana !== undefined && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Mana:</Text>
                    <Text style={styles.statValue}>{card.mana}</Text>
                    <Text style={styles.statArrow}>→</Text>
                    <Text style={styles.statNewValue}>{upgradedStats.mana}</Text>
                    <Text style={styles.statIncrease}>
                      (+{(upgradedStats.mana || 0) - (card.mana || 0)})
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Cost and Gold */}
            {!isMaxLevel && (
              <View style={styles.costContainer}>
                <Text style={styles.costLabel}>Upgrade Cost:</Text>
                <Text style={[styles.costValue, !canAfford && styles.costInsufficient]}>
                  💰 {upgradeCost} Gold
                </Text>
                <Text style={styles.goldAvailable}>
                  (You have: {currentGold} Gold)
                </Text>
              </View>
            )}

            {/* Upgrade Button */}
            <TouchableOpacity
              style={[
                styles.upgradeButton,
                (isMaxLevel || !canAfford || isUpgrading) && styles.upgradeButtonDisabled,
              ]}
              onPress={handleUpgrade}
              disabled={isMaxLevel || !canAfford || isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.upgradeButtonText}>
                  {isMaxLevel
                    ? 'Maximum Level Reached'
                    : !canAfford
                    ? 'Insufficient Gold'
                    : 'Upgrade Card'}
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  cardInfo: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardType: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  levelArrow: {
    fontSize: 18,
    color: '#4caf50',
    fontWeight: '600',
  },
  maxLevelText: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: 'bold',
  },
  statsContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    width: 80,
  },
  statValue: {
    fontSize: 14,
    color: '#fff',
    width: 40,
    textAlign: 'right',
  },
  statArrow: {
    fontSize: 14,
    color: '#4caf50',
    marginHorizontal: 8,
  },
  statNewValue: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
    width: 40,
  },
  statIncrease: {
    fontSize: 12,
    color: '#4caf50',
    marginLeft: 4,
  },
  costContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  costLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 20,
    color: '#ffd700',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  costInsufficient: {
    color: '#f44336',
  },
  goldAvailable: {
    fontSize: 12,
    color: '#aaa',
  },
  upgradeButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#555',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});





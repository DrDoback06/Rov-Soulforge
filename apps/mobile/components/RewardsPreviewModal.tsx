import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UniversalCardItem } from './UniversalCardItem';

const { width, height } = Dimensions.get('window');

interface RewardsPreviewModalProps {
  visible: boolean;
  rewards: {
    gold?: number;
    xp?: number;
    items?: any[];
    cards?: any[];
  };
  onClose: () => void;
}

/**
 * Rewards Preview Modal
 * Shows detailed information about quest rewards
 * Displays cards, items, gold, XP with beautiful Diablo II styling
 */
export function RewardsPreviewModal({
  visible,
  rewards,
  onClose
}: RewardsPreviewModalProps) {
  const [hoveredCard, setHoveredCard] = useState<any>(null);

  const totalValue = calculateTotalValue(rewards);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#2a2a3e', '#1a1a2e']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🎁 Quest Rewards</Text>
              <Text style={styles.subtitle}>
                Total Value: ~{totalValue} gold equivalent
              </Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Currency Rewards */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 Currency & Experience</Text>
                <View style={styles.currencyGrid}>
                  {rewards.gold && (
                    <View style={[styles.currencyCard, styles.goldCard]}>
                      <Text style={styles.currencyIcon}>💰</Text>
                      <Text style={styles.currencyAmount}>{rewards.gold}</Text>
                      <Text style={styles.currencyLabel}>Gold</Text>
                    </View>
                  )}
                  {rewards.xp && (
                    <View style={[styles.currencyCard, styles.xpCard]}>
                      <Text style={styles.currencyIcon}>⭐</Text>
                      <Text style={styles.currencyAmount}>{rewards.xp}</Text>
                      <Text style={styles.currencyLabel}>Experience</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Card Rewards */}
              {rewards.cards && rewards.cards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    🃏 Cards ({rewards.cards.length})
                  </Text>
                  <View style={styles.cardsGrid}>
                    {rewards.cards.map((card, index) => (
                      <View key={index} style={styles.cardWrapper}>
                        <UniversalCardItem
                          card={card}
                          count={card.count || 1}
                          sourceZone="rewards"
                          onHover={setHoveredCard}
                        />
                        <Text style={styles.cardName}>{card.name}</Text>
                        <Text style={[styles.cardRarity, { color: getRarityColor(card.rarity) }]}>
                          {card.rarity}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Item Rewards */}
              {rewards.items && rewards.items.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    ⚔️ Items ({rewards.items.length})
                  </Text>
                  <View style={styles.itemsList}>
                    {rewards.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemIcon}>{item.image || '🎁'}</Text>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemDescription}>{item.description}</Text>
                          {item.stats && (
                            <View style={styles.itemStats}>
                              {item.damage && (
                                <Text style={styles.itemStat}>⚔️ {item.damage}</Text>
                              )}
                              {item.defense && (
                                <Text style={styles.itemStat}>🛡️ {item.defense}</Text>
                              )}
                            </View>
                          )}
                        </View>
                        <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
                          {item.rarity}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Bonus Information */}
              <View style={styles.bonusSection}>
                <Text style={styles.bonusTitle}>💡 Did You Know?</Text>
                <Text style={styles.bonusText}>
                  • Completing quests increases your character's renown
                </Text>
                <Text style={styles.bonusText}>
                  • Higher renown unlocks better quest rewards
                </Text>
                <Text style={styles.bonusText}>
                  • Chain multiple quests for bonus XP multipliers
                </Text>
              </View>
            </ScrollView>

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

function calculateTotalValue(rewards: any): number {
  let total = rewards.gold || 0;

  // XP worth 10 gold per XP
  if (rewards.xp) {
    total += rewards.xp * 10;
  }

  // Cards worth based on rarity
  if (rewards.cards) {
    rewards.cards.forEach((card: any) => {
      const rarityValues: Record<string, number> = {
        common: 50,
        uncommon: 150,
        rare: 500,
        epic: 1500,
        legendary: 5000
      };
      total += rarityValues[card.rarity?.toLowerCase()] || 50;
    });
  }

  // Items worth based on rarity
  if (rewards.items) {
    rewards.items.forEach((item: any) => {
      const rarityValues: Record<string, number> = {
        common: 100,
        uncommon: 300,
        rare: 1000,
        epic: 3000,
        legendary: 10000
      };
      total += rarityValues[item.rarity?.toLowerCase()] || 100;
    });
  }

  return Math.round(total);
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#8e8e93',
    uncommon: '#4488ff',
    rare: '#9944ff',
    epic: '#ff44ff',
    legendary: '#ff8800'
  };
  return colors[rarity?.toLowerCase()] || colors.common;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 600,
    maxHeight: height * 0.85,
    borderRadius: 16,
    overflow: 'hidden'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  header: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93'
  },
  scrollView: {
    flex: 1
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: 12
  },
  currencyCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2
  },
  goldCard: {
    backgroundColor: '#ffd70020',
    borderColor: '#ffd700'
  },
  xpCard: {
    backgroundColor: '#4488ff20',
    borderColor: '#4488ff'
  },
  currencyIcon: {
    fontSize: 40,
    marginBottom: 8
  },
  currencyAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  currencyLabel: {
    fontSize: 12,
    color: '#8e8e93'
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  cardWrapper: {
    alignItems: 'center',
    width: 80
  },
  cardName: {
    fontSize: 11,
    color: '#ffffff',
    marginTop: 4,
    textAlign: 'center'
  },
  cardRarity: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  itemsList: {
    gap: 12
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3a3a4e'
  },
  itemIcon: {
    fontSize: 32,
    marginRight: 12
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4
  },
  itemDescription: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4
  },
  itemStats: {
    flexDirection: 'row',
    gap: 12
  },
  itemStat: {
    fontSize: 12,
    color: '#ffffff'
  },
  itemRarity: {
    fontSize: 12,
    fontWeight: '600'
  },
  bonusSection: {
    backgroundColor: '#4488ff20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4488ff40',
    marginTop: 12
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  bonusText: {
    fontSize: 13,
    color: '#8e8e93',
    marginBottom: 4
  },
  closeButton: {
    backgroundColor: '#4488ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

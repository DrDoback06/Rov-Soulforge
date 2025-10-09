/**
 * Enhanced Quest Completion Modal
 *
 * Beautiful quest completion screen with:
 * - Animated rewards display
 * - Leaderboard rank reveal
 * - Bonus rewards showcase
 * - Smooth transitions
 */

import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { AnimatedRewards } from './AnimatedRewards';
import { QuestLeaderboardModal } from './QuestLeaderboardModal';

interface EnhancedQuestCompletionModalProps {
  visible: boolean;
  questTitle: string;
  questId: string;
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
  onDismiss: () => void;
  onViewLeaderboard?: () => void;
}

/**
 * Enhanced completion modal with animations and leaderboard
 */
export function EnhancedQuestCompletionModal({
  visible,
  questTitle,
  questId,
  rewards,
  leaderboardData,
  onDismiss,
  onViewLeaderboard
}: EnhancedQuestCompletionModalProps) {
  const [showAnimatedRewards, setShowAnimatedRewards] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const hasBonus = leaderboardData && leaderboardData.isTopTen;
  const bonusMultiplier = leaderboardData?.multiplier || 1.0;

  // Prepare reward items for animation
  const rewardItems = [];

  if (rewards.xp > 0) {
    rewardItems.push({
      type: 'xp' as const,
      amount: rewards.xp,
      name: 'Experience Points'
    });
  }

  if (rewards.gold > 0) {
    rewardItems.push({
      type: 'gold' as const,
      amount: rewards.gold,
      name: 'Gold'
    });
  }

  for (const item of rewards.items || []) {
    rewardItems.push({
      type: (item.type === 'card' ? 'card' : 'item') as 'item' | 'card',
      name: item.name,
      rarity: item.rarity,
      icon: item.icon
    });
  }

  function handleAnimationComplete() {
    setShowAnimatedRewards(false);
  }

  function handleViewLeaderboard() {
    setShowLeaderboard(true);
  }

  function handleLeaderboardClose() {
    setShowLeaderboard(false);
  }

  function getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onDismiss}
      >
        <View style={styles.overlay}>
          {/* Animated Rewards (shows first) */}
          {showAnimatedRewards && (
            <AnimatedRewards
              rewards={rewardItems}
              onAnimationComplete={handleAnimationComplete}
              showLeaderboardBonus={hasBonus}
              bonusMultiplier={bonusMultiplier}
            />
          )}

          {/* Main completion content (shows after animation) */}
          {!showAnimatedRewards && (
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['rgba(26, 26, 46, 0.98)', 'rgba(15, 15, 30, 0.98)']}
                style={styles.modalContent}
              >
                {/* Success Banner */}
                <View style={styles.successBanner}>
                  <Text style={styles.successIcon}>✅</Text>
                  <Text style={styles.successTitle}>Quest Complete!</Text>
                  <Text style={styles.questTitle}>{questTitle}</Text>
                </View>

                {/* Leaderboard Rank (if applicable) */}
                {leaderboardData && (
                  <View style={[
                    styles.leaderboardRankBox,
                    hasBonus && styles.leaderboardRankBoxBonus
                  ]}>
                    <Text style={styles.rankMedal}>
                      {getRankMedal(leaderboardData.rank)}
                    </Text>
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankLabel}>Your Rank</Text>
                      <Text style={styles.rankValue}>#{leaderboardData.rank}</Text>
                      {hasBonus && (
                        <Text style={styles.topTenBadge}>
                          TOP 10% 🎉
                        </Text>
                      )}
                    </View>
                    {hasBonus && (
                      <View style={styles.multiplierBadge}>
                        <Text style={styles.multiplierText}>
                          ×{leaderboardData.multiplier.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Rewards Summary */}
                <View style={styles.rewardsSection}>
                  <Text style={styles.sectionTitle}>Rewards Earned</Text>

                  <ScrollView style={styles.rewardsScroll}>
                    {/* XP */}
                    <View style={styles.rewardRow}>
                      <View style={styles.rewardLeft}>
                        <Text style={styles.rewardIcon}>⭐</Text>
                        <Text style={styles.rewardLabel}>Experience</Text>
                      </View>
                      <View style={styles.rewardRight}>
                        <Text style={styles.rewardValue}>+{rewards.xp}</Text>
                        {leaderboardData && leaderboardData.bonusXp > 0 && (
                          <Text style={styles.bonusText}>
                            (+{leaderboardData.bonusXp} bonus)
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Gold */}
                    <View style={styles.rewardRow}>
                      <View style={styles.rewardLeft}>
                        <Text style={styles.rewardIcon}>💰</Text>
                        <Text style={styles.rewardLabel}>Gold</Text>
                      </View>
                      <View style={styles.rewardRight}>
                        <Text style={styles.rewardValue}>+{rewards.gold}</Text>
                        {leaderboardData && leaderboardData.bonusGold > 0 && (
                          <Text style={styles.bonusText}>
                            (+{leaderboardData.bonusGold} bonus)
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Items */}
                    {rewards.items && rewards.items.length > 0 && (
                      <View style={styles.itemsSection}>
                        <Text style={styles.itemsSectionTitle}>
                          Items ({rewards.items.length})
                        </Text>
                        {rewards.items.map((item, index) => (
                          <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemIcon}>{item.icon || '🎁'}</Text>
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{item.name}</Text>
                              <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
                                {item.rarity?.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                </View>

                {/* Actions */}
                <View style={styles.actionSection}>
                  {leaderboardData && (
                    <Pressable
                      style={styles.leaderboardButton}
                      onPress={handleViewLeaderboard}
                    >
                      <LinearGradient
                        colors={['#fbbf24', '#f59e0b']}
                        style={styles.leaderboardButtonGradient}
                      >
                        <Text style={styles.leaderboardButtonText}>
                          🏆 View Leaderboard
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.continueButton}
                    onPress={onDismiss}
                  >
                    <LinearGradient
                      colors={['#4ade80', '#22c55e']}
                      style={styles.continueButtonGradient}
                    >
                      <Text style={styles.continueButtonText}>Continue Adventure</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>
      </Modal>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <QuestLeaderboardModal
          visible={showLeaderboard}
          questId={questId}
          questTitle={questTitle}
          onClose={handleLeaderboardClose}
        />
      )}
    </>
  );
}

function getRarityColor(rarity: string | undefined): string {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'magic': return '#6366f1';
    case 'rare': return '#3b82f6';
    case 'epic': return '#a855f7';
    case 'legendary': return '#f59e0b';
    case 'unique': return '#ef4444';
    default: return '#ffffff';
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden'
  },
  modalContent: {
    padding: 24
  },
  successBanner: {
    alignItems: 'center',
    marginBottom: 24
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 8
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4
  },
  questTitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center'
  },
  leaderboardRankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(68, 136, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#4488ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12
  },
  leaderboardRankBoxBonus: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: '#fbbf24'
  },
  rankMedal: {
    fontSize: 40
  },
  rankInfo: {
    flex: 1
  },
  rankLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  rankValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  topTenBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 4
  },
  multiplierBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  multiplierText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  rewardsSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  rewardsScroll: {
    maxHeight: 300
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8
  },
  rewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  rewardIcon: {
    fontSize: 24
  },
  rewardLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600'
  },
  rewardRight: {
    alignItems: 'flex-end'
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22c55e'
  },
  bonusText: {
    fontSize: 11,
    color: '#fbbf24',
    marginTop: 2
  },
  itemsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  itemsSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8e8e93',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    gap: 12
  },
  itemIcon: {
    fontSize: 20
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2
  },
  itemRarity: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  actionSection: {
    gap: 12
  },
  leaderboardButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  leaderboardButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  leaderboardButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
});

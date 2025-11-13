/**
 * Battle Result Modal
 *
 * Displays victory or defeat screen with:
 * - Battle outcome (victory/defeat)
 * - Battle statistics
 * - Rewards earned (gold, XP, items)
 * - Ranked changes (if applicable)
 * - Quest completion (if applicable)
 */

import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  BounceIn
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import type { BattleReward } from '@/types/battleground';
import { heavyImpact } from '@/utils/haptics';
import { useEffect } from 'react';

interface BattleResultModalProps {
  visible: boolean;
  victory: boolean;
  rewards: BattleReward;
  onClose: () => void;
  onViewDetails?: () => void;
}

export function BattleResultModal({
  visible,
  victory,
  rewards,
  onClose,
  onViewDetails
}: BattleResultModalProps) {
  useEffect(() => {
    if (visible) {
      // Haptic feedback on modal open
      heavyImpact();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={50} style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Animated.View entering={ZoomIn.duration(400)} style={styles.modal}>
              <LinearGradient
                colors={victory ? ['#2b8a3e', '#1a5228'] : ['#c92a2a', '#7a1a1a']}
                style={styles.modalGradient}
              >
                {/* Header */}
                <Animated.View
                  entering={BounceIn.delay(200).duration(600)}
                  style={styles.header}
                >
                  <Text style={styles.outcomeIcon}>
                    {victory ? '🏆' : '☠️'}
                  </Text>
                  <Text style={styles.outcomeText}>
                    {victory ? 'VICTORY!' : 'DEFEAT'}
                  </Text>
                </Animated.View>

                {/* Content */}
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Base Rewards */}
                  <Animated.View
                    entering={FadeInDown.delay(400).duration(400)}
                    style={styles.section}
                  >
                    <Text style={styles.sectionTitle}>💰 Rewards</Text>
                    <View style={styles.rewardsGrid}>
                      {/* Gold */}
                      <RewardItem icon="💰" label="Gold" value={`${rewards.gold}g`} />

                      {/* XP */}
                      <RewardItem icon="⭐" label="XP" value={`${rewards.xp}`} />
                    </View>
                  </Animated.View>

                  {/* Items Dropped */}
                  {rewards.items.length > 0 && (
                    <Animated.View
                      entering={FadeInDown.delay(500).duration(400)}
                      style={styles.section}
                    >
                      <Text style={styles.sectionTitle}>🎁 Items Obtained</Text>
                      <View style={styles.itemsList}>
                        {rewards.items.map((itemId, index) => (
                          <Animated.View
                            key={itemId}
                            entering={FadeInDown.delay(600 + index * 50).duration(300)}
                            style={styles.itemCard}
                          >
                            <LinearGradient
                              colors={['#4c6ef5', '#364fc7']}
                              style={styles.itemGradient}
                            >
                              <Text style={styles.itemIcon}>🎴</Text>
                              <Text style={styles.itemName} numberOfLines={1}>
                                {itemId}
                              </Text>
                            </LinearGradient>
                          </Animated.View>
                        ))}
                      </View>
                    </Animated.View>
                  )}

                  {/* Ranked Changes */}
                  {rewards.rankedChanges && (
                    <Animated.View
                      entering={FadeInDown.delay(600).duration(400)}
                      style={styles.section}
                    >
                      <Text style={styles.sectionTitle}>🏅 Ranked</Text>
                      <View style={styles.rankedCard}>
                        <View style={styles.rankedRow}>
                          <Text style={styles.rankedLabel}>ELO:</Text>
                          <Text style={styles.rankedValue}>
                            {rewards.rankedChanges.eloBefore} →{' '}
                            <Text
                              style={
                                rewards.rankedChanges.eloAfter >
                                rewards.rankedChanges.eloBefore
                                  ? styles.rankedValueUp
                                  : styles.rankedValueDown
                              }
                            >
                              {rewards.rankedChanges.eloAfter}
                            </Text>
                          </Text>
                        </View>

                        <View style={styles.rankedRow}>
                          <Text style={styles.rankedLabel}>LP:</Text>
                          <Text
                            style={
                              rewards.rankedChanges.lpGained > 0
                                ? styles.rankedValueUp
                                : styles.rankedValueDown
                            }
                          >
                            {rewards.rankedChanges.lpGained > 0 ? '+' : ''}
                            {rewards.rankedChanges.lpGained}
                          </Text>
                        </View>

                        {rewards.rankedChanges.rankUp && (
                          <View style={styles.rankUpBanner}>
                            <Text style={styles.rankUpText}>
                              🎉 RANK UP! → {rewards.rankedChanges.newRank?.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  )}

                  {/* Quest Completion */}
                  {rewards.questCompleted && rewards.questRewards && (
                    <Animated.View
                      entering={FadeInDown.delay(700).duration(400)}
                      style={styles.section}
                    >
                      <Text style={styles.sectionTitle}>✅ Quest Complete!</Text>
                      <View style={styles.questRewards}>
                        <Text style={styles.questRewardItem}>
                          💰 +{rewards.questRewards.gold}g
                        </Text>
                        <Text style={styles.questRewardItem}>
                          ⭐ +{rewards.questRewards.xp} XP
                        </Text>
                        {rewards.questRewards.items.length > 0 && (
                          <Text style={styles.questRewardItem}>
                            🎁 {rewards.questRewards.items.length} items
                          </Text>
                        )}
                      </View>
                    </Animated.View>
                  )}

                  {/* Battle Statistics */}
                  <Animated.View
                    entering={FadeInDown.delay(800).duration(400)}
                    style={styles.section}
                  >
                    <Text style={styles.sectionTitle}>📊 Battle Stats</Text>
                    <View style={styles.statsGrid}>
                      <StatItem label="Damage Dealt" value={rewards.damageDealt} />
                      <StatItem label="Damage Taken" value={rewards.damageTaken} />
                      <StatItem label="Cards Played" value={rewards.cardsPlayed} />
                      <StatItem label="Turns" value={rewards.turnsTaken} />
                    </View>
                    <View style={styles.timeStat}>
                      <Text style={styles.timeLabel}>⏱️ Duration:</Text>
                      <Text style={styles.timeValue}>
                        {formatDuration(rewards.timeElapsed)}
                      </Text>
                    </View>
                  </Animated.View>
                </ScrollView>

                {/* Actions */}
                <Animated.View
                  entering={FadeInUp.delay(900).duration(400)}
                  style={styles.actions}
                >
                  {onViewDetails && (
                    <Pressable style={styles.secondaryButton} onPress={onViewDetails}>
                      <Text style={styles.secondaryButtonText}>View Details</Text>
                    </Pressable>
                  )}

                  <Pressable style={styles.primaryButton} onPress={onClose}>
                    <LinearGradient
                      colors={['#4c6ef5', '#364fc7']}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

function RewardItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.rewardItem}>
      <Text style={styles.rewardIcon}>{icon}</Text>
      <Text style={styles.rewardLabel}>{label}</Text>
      <Text style={styles.rewardValue}>{value}</Text>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%'
  },
  modal: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  modalGradient: {
    paddingTop: 24,
    paddingBottom: 16
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8
  },
  outcomeIcon: {
    fontSize: 64
  },
  outcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  scrollView: {
    maxHeight: 400
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  rewardsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  rewardItem: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  rewardIcon: {
    fontSize: 32
  },
  rewardLabel: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600'
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  itemCard: {
    width: '48%',
    borderRadius: 8,
    overflow: 'hidden'
  },
  itemGradient: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  itemIcon: {
    fontSize: 24
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  rankedCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  rankedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rankedLabel: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600'
  },
  rankedValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  rankedValueUp: {
    color: '#22c55e'
  },
  rankedValueDown: {
    color: '#ef4444'
  },
  rankUpBanner: {
    backgroundColor: '#ffd700',
    borderRadius: 8,
    padding: 12,
    marginTop: 8
  },
  rankUpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center'
  },
  questRewards: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  questRewardItem: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  timeStat: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  timeLabel: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600'
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  primaryButtonGradient: {
    padding: 16,
    alignItems: 'center'
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

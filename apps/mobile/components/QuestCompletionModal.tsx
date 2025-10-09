import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface QuestCompletionModalProps {
  visible: boolean;
  quest: EnhancedQuest | null;
  onClose: () => void;
  onAcceptRewards: () => void;
}

/**
 * Quest Completion Modal
 * 
 * Displays completion celebration and reward breakdown
 * Rewards auto-added to stash on "Accept" button press
 */
export function QuestCompletionModal({
  visible,
  quest,
  onClose,
  onAcceptRewards
}: QuestCompletionModalProps) {
  const [showRewards, setShowRewards] = useState(false);
  const scale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && quest) {
      // Entrance animation
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
      
      // Confetti animation
      confettiOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      );

      // Show rewards after animation
      setTimeout(() => setShowRewards(true), 500);
    } else {
      scale.value = 0;
      confettiOpacity.value = 0;
      setShowRewards(false);
    }
  }, [visible, quest]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const animatedConfettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value
  }));

  if (!quest) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return ['#22c55e', '#16a34a'];
      case 'medium': return ['#f59e0b', '#d97706'];
      case 'hard': return ['#ef4444', '#dc2626'];
      case 'epic': return ['#a855f7', '#9333ea'];
      case 'legendary': return ['#fbbf24', '#f59e0b'];
      default: return ['#4488ff', '#2266dd'];
    }
  };

  const handleAccept = () => {
    onAcceptRewards();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti Effect */}
        <Animated.View style={[styles.confetti, animatedConfettiStyle]}>
          <Text style={styles.confettiText}>🎉</Text>
          <Text style={styles.confettiText}>✨</Text>
          <Text style={styles.confettiText}>🎊</Text>
          <Text style={styles.confettiText}>⭐</Text>
          <Text style={styles.confettiText}>🎉</Text>
        </Animated.View>

        <Animated.View style={[styles.container, animatedContainerStyle]}>
          <LinearGradient
            colors={getDifficultyColor(quest.difficulty)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.completionBadge}>✅ QUEST COMPLETE</Text>
              <Text style={styles.questIcon}>{quest.icon || '🎯'}</Text>
              <Text style={styles.title}>{quest.title}</Text>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.difficultyBadge}
              >
                <Text style={styles.difficultyText}>
                  {quest.difficulty.toUpperCase()}
                </Text>
              </LinearGradient>
            </View>

            {/* Completion Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>
                Congratulations! You've completed this quest.
              </Text>
            </View>

            {/* Rewards Section */}
            {showRewards && (
              <ScrollView style={styles.rewardsScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.rewardsContainer}>
                  <Text style={styles.rewardsTitle}>🏆 REWARDS</Text>
                  
                  {/* Gold */}
                  {quest.rewards.gold && quest.rewards.gold > 0 && (
                    <View style={styles.rewardItem}>
                      <LinearGradient
                        colors={['rgba(251, 191, 36, 0.2)', 'rgba(245, 158, 11, 0.2)']}
                        style={styles.rewardGradient}
                      >
                        <Text style={styles.rewardIcon}>💰</Text>
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardLabel}>Gold</Text>
                          <Text style={styles.rewardValue}>{quest.rewards.gold}g</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {/* XP */}
                  {quest.rewards.xp && quest.rewards.xp > 0 && (
                    <View style={styles.rewardItem}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.2)']}
                        style={styles.rewardGradient}
                      >
                        <Text style={styles.rewardIcon}>⭐</Text>
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardLabel}>Experience</Text>
                          <Text style={styles.rewardValue}>{quest.rewards.xp} XP</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {/* Renown */}
                  {quest.rewards.renown && quest.rewards.renown > 0 && (
                    <View style={styles.rewardItem}>
                      <LinearGradient
                        colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.2)']}
                        style={styles.rewardGradient}
                      >
                        <Text style={styles.rewardIcon}>👑</Text>
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardLabel}>Renown</Text>
                          <Text style={styles.rewardValue}>+{quest.rewards.renown}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {/* Items */}
                  {quest.rewards.items && quest.rewards.items.length > 0 && (
                    <View style={styles.itemsSection}>
                      <Text style={styles.itemsTitle}>🎁 Items</Text>
                      {quest.rewards.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                          <LinearGradient
                            colors={['rgba(34, 197, 94, 0.2)', 'rgba(22, 163, 74, 0.2)']}
                            style={styles.itemGradient}
                          >
                            <Text style={styles.itemIcon}>🎴</Text>
                            <Text style={styles.itemName}>{item.name || 'Item'}</Text>
                            {item.quantity && item.quantity > 1 && (
                              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                            )}
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.acceptButton]}
                onPress={handleAccept}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Accept Rewards</Text>
                </LinearGradient>
              </Pressable>
              
              <Text style={styles.hint}>
                Rewards will be added to your stash
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20
  },
  confettiText: {
    fontSize: 40
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20
  },
  gradient: {
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  completionBadge: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20
  },
  questIcon: {
    fontSize: 64,
    marginBottom: 12
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8
  },
  difficultyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  message: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  },
  rewardsScroll: {
    maxHeight: 300
  },
  rewardsContainer: {
    gap: 12,
    marginBottom: 20
  },
  rewardsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8
  },
  rewardItem: {
    marginBottom: 8
  },
  rewardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16
  },
  rewardIcon: {
    fontSize: 32
  },
  rewardInfo: {
    flex: 1
  },
  rewardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4
  },
  rewardValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  itemsSection: {
    marginTop: 8
  },
  itemsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  itemRow: {
    marginBottom: 8
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12
  },
  itemIcon: {
    fontSize: 24
  },
  itemName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  itemQuantity: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600'
  },
  actions: {
    gap: 12
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  acceptButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic'
  }
});
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import type { EnhancedQuest, QuestObjective } from '@/types/quest-enhanced';
import * as Haptics from 'expo-haptics';

interface NavigationHUDProps {
  quest: EnhancedQuest;
  currentDistance: number; // Distance in meters
  currentEta?: number; // ETA in seconds
  objectives?: QuestObjective[]; // Quest objectives with progress
  onClose: () => void;
  onExpand?: () => void; // Optional expand to full quest details
}

/**
 * Enhanced Navigation HUD
 *
 * Features:
 * - Objective progress tracking
 * - Animated distance countdown
 * - ETA with real-time updates
 * - Pulsing arrival indicator when close
 * - Tap to expand for full details
 * - Haptic feedback
 */
export function NavigationHUD({
  quest,
  currentDistance,
  currentEta,
  objectives,
  onClose,
  onExpand
}: NavigationHUDProps) {
  const slideAnim = useSharedValue(-100);
  const pulseAnim = useSharedValue(0);
  const [expanded, setExpanded] = useState(false);

  // Slide in animation on mount
  useEffect(() => {
    slideAnim.value = withSpring(0, {
      damping: 20,
      stiffness: 90
    });
  }, []);

  // Pulsing animation when close to destination (< 100m)
  useEffect(() => {
    if (currentDistance < 100) {
      pulseAnim.value = withRepeat(
        withSequence(
          withSpring(1, { damping: 2, stiffness: 100 }),
          withSpring(0, { damping: 2, stiffness: 100 })
        ),
        -1,
        false
      );

      // Haptic feedback when entering arrival zone
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      pulseAnim.value = 0;
    }
  }, [currentDistance < 100]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }]
  }));

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.05]);
    const opacity = interpolate(pulseAnim.value, [0, 1], [1, 0.8]);

    return {
      transform: [{ scale }],
      opacity
    };
  });

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatEta = (seconds?: number) => {
    if (!seconds) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

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

  // Calculate objective progress
  const completedObjectives = objectives?.filter(obj => obj.completed).length || 0;
  const totalObjectives = objectives?.length || 0;
  const progressPercent = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

  // Find current active objective
  const currentObjective = objectives?.find(obj => !obj.completed);

  const handleToggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
    if (onExpand && !expanded) {
      onExpand();
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={pulseStyle}>
        <LinearGradient
          colors={getDifficultyColor(quest.difficulty)}
          style={styles.gradient}
        >
          <Pressable onPress={handleToggleExpand} style={styles.pressable}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.questInfo}>
                <Text style={styles.questIcon}>{quest.icon || '🗺️'}</Text>
                <View style={styles.titleContainer}>
                  <Text style={styles.questName} numberOfLines={1}>{quest.title}</Text>
                  <Text style={styles.difficultyBadge}>{quest.difficulty.toUpperCase()}</Text>
                </View>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onClose();
                }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            {/* Distance & ETA Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={[
                  styles.statValue,
                  currentDistance < 50 && styles.statValueArriving
                ]}>
                  {formatDistance(currentDistance)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ETA</Text>
                <Text style={styles.statValue}>{formatEta(currentEta)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>REWARDS</Text>
                <View style={styles.rewardsRow}>
                  {quest.rewards?.xp && <Text style={styles.rewardText}>⭐{quest.rewards.xp}</Text>}
                  {quest.rewards?.gold && <Text style={styles.rewardText}>💰{quest.rewards.gold}</Text>}
                </View>
              </View>
            </View>

            {/* Objective Progress (if expanded or has objectives) */}
            {(expanded || totalObjectives > 0) && (
              <View style={styles.objectivesSection}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercent}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {completedObjectives}/{totalObjectives} Objectives
                  </Text>
                </View>

                {/* Current Objective */}
                {currentObjective && (
                  <View style={styles.currentObjective}>
                    <Text style={styles.objectiveLabel}>CURRENT:</Text>
                    <Text style={styles.objectiveText} numberOfLines={expanded ? 3 : 1}>
                      {currentObjective.description}
                    </Text>
                    {currentObjective.target > 0 && (
                      <Text style={styles.objectiveProgress}>
                        {currentObjective.current}/{currentObjective.target}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Arrival Indicator */}
            {currentDistance < 100 && (
              <View style={styles.arrivalBanner}>
                <Text style={styles.arrivalIcon}>🎯</Text>
                <Text style={styles.arrivalText}>
                  {currentDistance < 50 ? 'YOU HAVE ARRIVED!' : 'APPROACHING DESTINATION'}
                </Text>
              </View>
            )}

            {/* Expand Indicator */}
            {!expanded && totalObjectives > 0 && (
              <View style={styles.expandHint}>
                <Text style={styles.expandText}>Tap to view objectives ▼</Text>
              </View>
            )}
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 2000,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10
  },
  gradient: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  pressable: {
    padding: 14
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  questInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  questIcon: {
    fontSize: 28
  },
  titleContainer: {
    flex: 1,
    gap: 4
  },
  questName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5
  },
  difficultyBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  closeIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  statValueArriving: {
    color: '#22c55e',
    fontSize: 20
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 6
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff'
  },
  objectivesSection: {
    marginTop: 8,
    gap: 10
  },
  progressContainer: {
    gap: 6
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center'
  },
  currentObjective: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    gap: 4
  },
  objectiveLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 1
  },
  objectiveText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 18
  },
  objectiveProgress: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '700',
    marginTop: 2
  },
  arrivalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 8
  },
  arrivalIcon: {
    fontSize: 20
  },
  arrivalText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '800',
    letterSpacing: 1
  },
  expandHint: {
    alignItems: 'center',
    paddingTop: 8
  },
  expandText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    fontStyle: 'italic'
  }
});

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface FloatingQuestDetailsProps {
  quest: EnhancedQuest | null;
  distance: number;
  eta: number;
  progress?: number;
  onClose: () => void;
  onAbandon?: () => void;
  formatDistance: (meters: number) => string;
  formatEta: (seconds: number) => string;
}

/**
 * Floating Quest Details Panel
 * 
 * Shows during navigation on right side
 * Compact view that doesn't obscure map
 */
export function FloatingQuestDetails({
  quest,
  distance,
  eta,
  progress = 0,
  onClose,
  onAbandon,
  formatDistance,
  formatEta
}: FloatingQuestDetailsProps) {
  
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

  return (
    <Animated.View style={styles.container}>
      <LinearGradient
        colors={['rgba(26, 26, 46, 0.95)', 'rgba(15, 15, 30, 0.95)']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.questIcon}>{quest.icon || '🎯'}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {quest.title}
            </Text>
            <LinearGradient
              colors={getDifficultyColor(quest.difficulty)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.difficultyBadge}
            >
              <Text style={styles.difficultyText}>
                {quest.difficulty.toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>{formatEta(eta)}</Text>
          </View>
        </View>

        {/* Progress */}
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
          </View>
        )}

        {/* Current Objective */}
        {quest.objectives && quest.objectives.length > 0 && (
          <View style={styles.objectiveContainer}>
            <Text style={styles.objectiveLabel}>Objective:</Text>
            <Text style={styles.objectiveText} numberOfLines={2}>
              {quest.objectives[0].description}
            </Text>
          </View>
        )}

        {/* Rewards Preview */}
        <View style={styles.rewards}>
          {quest.rewards.gold && (
            <Text style={styles.rewardText}>💰 {quest.rewards.gold}g</Text>
          )}
          {quest.rewards.xp && (
            <Text style={styles.rewardText}>⭐ {quest.rewards.xp} XP</Text>
          )}
        </View>

        {/* Abandon Button */}
        {onAbandon && (
          <Pressable style={styles.abandonButton} onPress={onAbandon}>
            <Text style={styles.abandonText}>End Navigation</Text>
          </Pressable>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 280,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(68, 136, 255, 0.3)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  questIcon: {
    fontSize: 28
  },
  headerInfo: {
    flex: 1,
    gap: 4
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  difficultyText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  stats: {
    gap: 8,
    marginBottom: 12
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600'
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4488ff',
    borderRadius: 3
  },
  progressText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  objectiveContainer: {
    backgroundColor: 'rgba(68, 136, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12
  },
  objectiveLabel: {
    color: '#4488ff',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  objectiveText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16
  },
  rewards: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 142, 147, 0.2)',
    paddingTop: 12
  },
  rewardText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600'
  },
  abandonButton: {
    marginTop: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  abandonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700'
  }
});

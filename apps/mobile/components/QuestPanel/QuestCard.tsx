import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface QuestCardProps {
  quest: EnhancedQuest;
  distance?: number | null;
  isActive?: boolean;
  isAccepted?: boolean;
  showActions?: boolean;
  onPress?: () => void;
  onAccept?: () => void;
  onNavigate?: () => void;
  onAddToActive?: () => void;
  onAbandon?: () => void;
  onViewLocation?: () => void;
}

/**
 * Quest Card Component
 * 
 * Displays quest information with all metadata and action buttons
 */
export function QuestCard({
  quest,
  distance,
  isActive = false,
  isAccepted = false,
  showActions = true,
  onPress,
  onAccept,
  onNavigate,
  onAddToActive,
  onAbandon,
  onViewLocation
}: QuestCardProps) {
  
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

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (meters: number) => {
    const walkingSpeed = 1.4; // m/s (average walking speed)
    const seconds = meters / walkingSpeed;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  // Calculate progress if objectives exist
  const progress = quest.objectives 
    ? (quest.objectives.filter(obj => obj.completed).length / quest.objectives.length) * 100
    : 0;

  return (
    <Pressable onPress={onPress} style={[styles.card, isActive && styles.cardActive]}>
      <LinearGradient
        colors={isActive ? ['#2a2a3e', '#1a1a2e'] : ['#232336', '#181824']}
        style={styles.gradient}
      >
        {/* Header Row */}
        <View style={styles.header}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{quest.icon || '🎯'}</Text>
          </View>
          
          {/* Title & Difficulty */}
          <View style={styles.titleContainer}>
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
        </View>

        {/* Distance & ETA */}
        {distance !== null && distance !== undefined && (
          <View style={styles.distanceRow}>
            <Text style={styles.distanceText}>
              📍 {formatDistance(distance)}
            </Text>
            <Text style={styles.etaText}>
              ⏱️ {formatTime(distance)}
            </Text>
          </View>
        )}

        {/* Progress Bar (if quest in progress) */}
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {quest.objectives.filter(obj => obj.completed).length}/{quest.objectives.length} Objectives
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* Rewards Preview */}
        <View style={styles.rewardsRow}>
          {quest.rewards.gold && (
            <Text style={styles.rewardText}>💰 {quest.rewards.gold}g</Text>
          )}
          {quest.rewards.xp && (
            <Text style={styles.rewardText}>⭐ {quest.rewards.xp} XP</Text>
          )}
          {quest.rewards.items && quest.rewards.items.length > 0 && (
            <Text style={styles.rewardText}>🎁 {quest.rewards.items.length} items</Text>
          )}
        </View>

        {/* Accepted Badge */}
        {isAccepted && (
          <View style={styles.acceptedBadge}>
            <Text style={styles.acceptedText}>✓ Accepted</Text>
          </View>
        )}

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actions}>
            {onAddToActive && (
              <Pressable style={[styles.actionButton, styles.actionButtonPrimary]} onPress={onAddToActive}>
                <Text style={styles.actionButtonTextPrimary}>Make Active</Text>
              </Pressable>
            )}
            {onViewLocation && (
              <Pressable style={styles.actionButton} onPress={onViewLocation}>
                <Text style={styles.actionButtonText}>See Location</Text>
              </Pressable>
            )}
            {onNavigate && (
              <Pressable style={[styles.actionButton, styles.actionButtonNavigate]} onPress={onNavigate}>
                <Text style={styles.actionButtonTextNavigate}>Navigate</Text>
              </Pressable>
            )}
            {onAbandon && isAccepted && (
              <Pressable style={[styles.actionButton, styles.actionButtonDanger]} onPress={onAbandon}>
                <Text style={styles.actionButtonTextDanger}>Abandon</Text>
              </Pressable>
            )}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden'
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#4488ff'
  },
  gradient: {
    padding: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  icon: {
    fontSize: 24
  },
  titleContainer: {
    flex: 1,
    gap: 4
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  difficultyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4
  },
  distanceText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '600'
  },
  etaText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '600'
  },
  progressContainer: {
    marginBottom: 8
  },
  progressLabel: {
    color: '#8e8e93',
    fontSize: 11,
    marginBottom: 4
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4488ff',
    borderRadius: 3
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 4
  },
  rewardText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600'
  },
  acceptedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  acceptedText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  actionButton: {
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  actionButtonSuccess: {
    backgroundColor: '#22c55e'
  },
  actionButtonPrimary: {
    backgroundColor: '#4488ff'
  },
  actionButtonNavigate: {
    backgroundColor: '#FF9800'
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  actionButtonTextSuccess: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  actionButtonTextNavigate: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  actionButtonTextDanger: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600'
  }
});

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { getRelativeDifficulty, getDifficultyColors, getDifficultyDisplayName } from '@/utils/questDifficulty';

interface QuestProgress {
  id: string;
  questId: string;
  userId: string;
  status: 'active' | 'completed' | 'abandoned';
  order: number;
  hidden: boolean;
  objectives: any[];
  startedAt: string;
  lastUpdated: string;
  questDetails?: EnhancedQuest;
}

interface QuestCardProps {
  quest: QuestProgress;
  distance?: number; // in meters
  playerLevel?: number; // Player's current level for difficulty calculation
  onShowOnMap: () => void;
  onNavigate: () => void;
  onHide: () => void;
  onAbandon: () => void;
  onExpand: () => void;
  isExpanded: boolean;
  onLongPress?: () => void; // For drag-to-reorder
  isActive?: boolean; // Drag state
}

export function QuestCard({
  quest,
  distance,
  playerLevel = 1,
  onShowOnMap,
  onNavigate,
  onHide,
  onAbandon,
  onExpand,
  isExpanded,
  onLongPress,
  isActive = false
}: QuestCardProps) {
  const questDetails = quest.questDetails;

  if (!questDetails) {
    return null; // Quest details not loaded
  }

  // Calculate progress
  const { current, total, percent } = getQuestProgress(quest);

  // Format distance
  const distanceText = distance !== undefined ? formatDistance(distance) : null;

  // Get level-relative difficulty
  const questLevel = questDetails.level || playerLevel;
  const relativeDifficulty = getRelativeDifficulty(questLevel, playerLevel, questDetails.difficulty);
  const difficultyColors = getDifficultyColors(relativeDifficulty);
  const difficultyName = getDifficultyDisplayName(relativeDifficulty);

  return (
    <Pressable
      onPress={onExpand}
      onLongPress={onLongPress}
      style={[
        styles.card,
        isActive && styles.cardDragging,
        quest.status === 'completed' && styles.cardCompleted,
        quest.status === 'abandoned' && styles.cardAbandoned
      ]}
    >
      <LinearGradient
        colors={isActive ? ['#4488ff', '#2266dd'] : ['#2a2a3e', '#1a1a2e']}
        style={styles.cardGradient}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <Text style={styles.dragIcon}>☰</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {/* Quest Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.questIcon}>{questDetails.icon || '🎯'}</Text>
            </View>

            {/* Title & Badges */}
            <View style={styles.titleContainer}>
              <Text style={styles.questTitle} numberOfLines={1}>
                {questDetails.title}
              </Text>
              
              <View style={styles.badgesRow}>
                {/* Difficulty Badge with level-relative coloring */}
                <LinearGradient
                  colors={difficultyColors.gradient}
                  style={styles.difficultyBadge}
                >
                  <Text style={styles.difficultyText}>
                    {difficultyName} {questLevel > playerLevel && `(Lv.${questLevel})`}
                  </Text>
                </LinearGradient>

                {/* Distance Badge */}
                {distanceText && (
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceIcon}>📍</Text>
                    <Text style={styles.distanceText}>{distanceText}</Text>
                  </View>
                )}

                {/* Status Badges */}
                {questDetails.isLegendary && (
                  <View style={styles.legendaryBadge}>
                    <Text style={styles.legendaryText}>⭐ LEGENDARY</Text>
                  </View>
                )}

                {questDetails.isBoss && (
                  <View style={styles.bossBadge}>
                    <Text style={styles.bossText}>👑 BOSS</Text>
                  </View>
                )}

                {distance !== undefined && distance < 50 && (
                  <View style={styles.nearbyBadge}>
                    <Text style={styles.nearbyText}>📍 NEAR YOU</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Progress: {current}/{total} objectives
              </Text>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={[styles.progressBarFill, { width: `${percent}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </View>

          {/* Rewards Row */}
          <View style={styles.rewardsRow}>
            <Text style={styles.rewardsLabel}>Rewards:</Text>
            <View style={styles.rewardIcons}>
              {questDetails.rewards.gold > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>💰</Text>
                  <Text style={styles.rewardText}>{questDetails.rewards.gold}</Text>
                </View>
              )}
              {questDetails.rewards.xp > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>⭐</Text>
                  <Text style={styles.rewardText}>{questDetails.rewards.xp}</Text>
                </View>
              )}
              {questDetails.rewards.items && questDetails.rewards.items.length > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>🎴</Text>
                  <Text style={styles.rewardText}>{questDetails.rewards.items.length}</Text>
                </View>
              )}
              {questDetails.rewards.badges && questDetails.rewards.badges.length > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>🏅</Text>
                  <Text style={styles.rewardText}>{questDetails.rewards.badges.length}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Expanded: Objectives & Actions */}
          {isExpanded && (
            <>
              {/* Objectives List */}
              <View style={styles.objectivesSection}>
                <Text style={styles.objectivesTitle}>🎯 Objectives:</Text>
                {quest.objectives.map((obj: any, index: number) => (
                  <View key={obj.id || index} style={styles.objectiveItem}>
                    <Text style={styles.objectiveCheckbox}>
                      {obj.completed ? '✅' : '⬜'}
                    </Text>
                    <Text
                      style={[
                        styles.objectiveText,
                        obj.completed && styles.objectiveCompleted
                      ]}
                    >
                      {obj.description}
                    </Text>
                    <Text style={styles.objectiveProgress}>
                      {obj.current}/{obj.target}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsSection}>
                <Pressable
                  style={styles.actionButton}
                  onPress={onShowOnMap}
                >
                  <Text style={styles.actionIcon}>📍</Text>
                  <Text style={styles.actionText}>Show on Map</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={onNavigate}
                >
                  <Text style={styles.actionIcon}>🧭</Text>
                  <Text style={styles.actionText}>Navigate</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={onHide}
                >
                  <Text style={styles.actionIcon}>👁️</Text>
                  <Text style={styles.actionText}>Hide</Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={onAbandon}
                >
                  <Text style={styles.actionIcon}>❌</Text>
                  <Text style={styles.actionText}>Abandon</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Expand Indicator */}
        <View style={styles.expandIndicator}>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// Helper Functions
function getQuestProgress(quest: QuestProgress): { current: number; total: number; percent: number } {
  const total = quest.objectives.length;
  const current = quest.objectives.filter((obj: any) => obj.completed).length;
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  return { current, total, percent };
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden'
  },
  cardDragging: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }]
  },
  cardCompleted: {
    opacity: 0.7
  },
  cardAbandoned: {
    opacity: 0.5
  },
  cardGradient: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#3a3a4e',
    borderRadius: 16
  },
  dragHandle: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dragIcon: {
    fontSize: 18,
    color: '#8e8e93'
  },
  mainContent: {
    marginLeft: 24
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  questIcon: {
    fontSize: 32
  },
  titleContainer: {
    flex: 1
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase'
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  distanceIcon: {
    fontSize: 10
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4FC3F7'
  },
  legendaryBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  legendaryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  bossBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  bossText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF6B6B'
  },
  nearbyBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  nearbyText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  progressSection: {
    marginBottom: 12
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  progressLabel: {
    fontSize: 12,
    color: '#8e8e93'
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  rewardsLabel: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600'
  },
  rewardIcons: {
    flexDirection: 'row',
    gap: 12
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rewardIcon: {
    fontSize: 16
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff'
  },
  objectivesSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  objectivesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8
  },
  objectiveCheckbox: {
    fontSize: 16
  },
  objectiveText: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff'
  },
  objectiveCompleted: {
    textDecorationLine: 'line-through',
    color: '#8e8e93'
  },
  objectiveProgress: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '600'
  },
  actionsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: '45%'
  },
  actionButtonPrimary: {
    backgroundColor: '#4488ff'
  },
  actionButtonDanger: {
    backgroundColor: '#ff4444'
  },
  actionIcon: {
    fontSize: 14
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff'
  },
  expandIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  expandIcon: {
    fontSize: 14,
    color: '#ffffff'
  }
});

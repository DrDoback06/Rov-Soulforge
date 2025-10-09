import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EnhancedQuest } from '../types/quest-enhanced';

interface QuestDetailModalProps {
  quest: EnhancedQuest | null;
  visible: boolean;
  onClose: () => void;
  onAccept: (quest: EnhancedQuest) => void;
  onShowOnMap?: (quest: EnhancedQuest) => void;
  onNavigate?: (quest: EnhancedQuest) => void;
  onAbandon?: (quest: EnhancedQuest) => void;
}

export function QuestDetailModal({
  quest,
  visible,
  onClose,
  onAccept,
  onShowOnMap,
  onNavigate,
  onAbandon
}: QuestDetailModalProps) {
  if (!quest) return null;

  const getDifficultyColor = () => {
    switch (quest.difficulty) {
      case 'easy': return ['#4CAF50', '#2E7D32'];
      case 'medium': return ['#FF9800', '#E65100'];
      case 'hard': return ['#F44336', '#C62828'];
      case 'epic': return ['#9C27B0', '#6A1B9A'];
      case 'legendary': return ['#FFD700', '#FFA000'];
      default: return ['#2196F3', '#1565C0'];
    }
  };

  const formatReward = () => {
    const parts = [];
    if (quest.rewards.gold) parts.push(`💰 ${quest.rewards.gold} Gold`);
    if (quest.rewards.xp) parts.push(`⭐ ${quest.rewards.xp} XP`);
    if (quest.rewards.items) parts.push(`🎁 ${quest.rewards.items.length} Items`);
    return parts.join('  •  ');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header with difficulty gradient */}
          <LinearGradient
            colors={getDifficultyColor()}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTop}>
              <Text style={styles.questIcon}>{quest.icon}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{quest.title}</Text>

            {/* Quest badges */}
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {quest.difficulty.toUpperCase()}
                </Text>
              </View>
              {quest.isLegendary && (
                <View style={[styles.badge, styles.legendaryBadge]}>
                  <Text style={styles.badgeText}>⭐ LEGENDARY</Text>
                </View>
              )}
              {quest.isBoss && (
                <View style={[styles.badge, styles.bossBadge]}>
                  <Text style={styles.badgeText}>👑 BOSS</Text>
                </View>
              )}
              {quest.maxPlayers && quest.maxPlayers > 1 && (
                <View style={[styles.badge, styles.socialBadge]}>
                  <Text style={styles.badgeText}>👥 {quest.maxPlayers} Players</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionIcon}>📍</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.locationName}>{quest.location.name || 'Unknown Location'}</Text>
                <Text style={styles.coordinates}>
                  {quest.location.latitude.toFixed(4)}, {quest.location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionIcon}>📖</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{quest.description}</Text>
              </View>
            </View>

            {/* Lore */}
            <View style={styles.loreSection}>
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(255,215,0,0.05)']}
                style={styles.loreGradient}
              >
                <Text style={styles.loreTitle}>📜 The Legend</Text>
                <Text style={styles.loreText}>{quest.lore}</Text>
              </LinearGradient>
            </View>

            {/* Quest Chain Info */}
            {quest.chainInfo && (
              <View style={styles.chainSection}>
                <Text style={styles.chainTitle}>
                  ⛓️ Part of: {quest.chainInfo.chainName}
                </Text>
                <Text style={styles.chainProgress}>
                  Quest {quest.chainInfo.position} of {quest.chainInfo.totalQuests}
                </Text>
              </View>
            )}

            {/* Objectives */}
            <View style={styles.section}>
              <Text style={styles.sectionIcon}>🎯</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Objectives</Text>
                {quest.objectives.map((obj, index) => (
                  <View key={obj.id} style={styles.objective}>
                    <Text style={styles.objectiveNumber}>{index + 1}.</Text>
                    <View style={styles.objectiveContent}>
                      <Text style={styles.objectiveDescription}>{obj.description}</Text>
                      <Text style={styles.objectiveProgress}>
                        {obj.current} / {obj.target}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Requirements */}
            <View style={styles.section}>
              <Text style={styles.sectionIcon}>⚡</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Requirements</Text>
                <Text style={styles.requirement}>
                  Required Level: {quest.requiredLevel}
                </Text>
                <Text style={styles.requirement}>
                  Recommended Level: {quest.recommendedLevel}
                </Text>
              </View>
            </View>

            {/* Rewards */}
            <View style={styles.rewardSection}>
              <LinearGradient
                colors={['rgba(76,175,80,0.1)', 'rgba(76,175,80,0.05)']}
                style={styles.rewardGradient}
              >
                <Text style={styles.rewardTitle}>🎁 Rewards</Text>

                <View style={styles.rewardGrid}>
                  {quest.rewards.gold > 0 && (
                    <View style={styles.rewardItem}>
                      <Text style={styles.rewardIcon}>💰</Text>
                      <Text style={styles.rewardText}>{quest.rewards.gold} Gold</Text>
                    </View>
                  )}
                  {quest.rewards.xp > 0 && (
                    <View style={styles.rewardItem}>
                      <Text style={styles.rewardIcon}>⭐</Text>
                      <Text style={styles.rewardText}>{quest.rewards.xp} XP</Text>
                    </View>
                  )}
                  {quest.rewards.items?.map((item, index) => (
                    <View key={index} style={styles.rewardItem}>
                      <Text style={styles.rewardIcon}>
                        {item.type === 'card' ? '🃏' : item.type === 'equipment' ? '⚔️' : '🧪'}
                      </Text>
                      <Text style={[styles.rewardText, styles[`${item.rarity}Text`]]}>
                        {item.rarity.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>

                {quest.rewards.titles && quest.rewards.titles.length > 0 && (
                  <View style={styles.titleRewards}>
                    <Text style={styles.titleRewardLabel}>Titles:</Text>
                    {quest.rewards.titles.map((title, index) => (
                      <Text key={index} style={styles.titleReward}>"{title}"</Text>
                    ))}
                  </View>
                )}

                {quest.rewards.badges && quest.rewards.badges.length > 0 && (
                  <View style={styles.badgeRewards}>
                    <Text style={styles.badgeRewardLabel}>Badges:</Text>
                    {quest.rewards.badges.map((badge, index) => (
                      <Text key={index} style={styles.badgeReward}>🏅 {badge}</Text>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Time limit if applicable */}
            {quest.duration && (
              <View style={styles.timeSection}>
                <Text style={styles.timeIcon}>⏰</Text>
                <Text style={styles.timeText}>
                  Time Limit: {quest.duration} minutes
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <LinearGradient
              colors={getDifficultyColor()}
              style={styles.acceptButton}
            >
              <Pressable onPress={() => onAccept(quest)} style={styles.acceptButtonInner}>
                <Text style={styles.acceptButtonText}>⚔️ ACCEPT QUEST</Text>
              </Pressable>
            </LinearGradient>

            {onNavigate && (
              <Pressable
                onPress={() => {
                  onNavigate(quest);
                  onClose();
                }}
                style={styles.navigateButton}
              >
                <Text style={styles.navigateButtonText}>🧭 NAVIGATE</Text>
              </Pressable>
            )}

            {onShowOnMap && (
              <Pressable
                onPress={() => {
                  onShowOnMap(quest);
                  onClose();
                }}
                style={styles.showOnMapButton}
              >
                <Text style={styles.showOnMapButtonText}>📍 SHOW ON MAP</Text>
              </Pressable>
            )}

            {onAbandon !== undefined && (
              <Pressable
                onPress={() => {
                  if (onAbandon) {
                    onAbandon(quest);
                  }
                  onClose();
                }}
                style={styles.abandonButtonModal}
              >
                <Text style={styles.abandonButtonModalText}>❌ ABANDON QUEST</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    overflow: 'hidden'
  },
  header: {
    padding: 20,
    paddingTop: 30
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  questIcon: {
    fontSize: 48
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold'
  },
  legendaryBadge: {
    backgroundColor: 'rgba(255,215,0,0.3)'
  },
  bossBadge: {
    backgroundColor: 'rgba(255,0,0,0.3)'
  },
  socialBadge: {
    backgroundColor: 'rgba(0,150,255,0.3)'
  },
  content: {
    flex: 1,
    padding: 20
  },
  section: {
    flexDirection: 'row',
    marginBottom: 24
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12
  },
  sectionContent: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8
  },
  locationName: {
    fontSize: 14,
    color: '#4FC3F7',
    marginBottom: 4
  },
  coordinates: {
    fontSize: 12,
    color: '#8e8e93'
  },
  description: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20
  },
  loreSection: {
    marginBottom: 24
  },
  loreGradient: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700'
  },
  loreTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8
  },
  loreText: {
    fontSize: 13,
    color: '#E0E0E0',
    lineHeight: 19,
    fontStyle: 'italic'
  },
  chainSection: {
    backgroundColor: 'rgba(156,39,176,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(156,39,176,0.3)'
  },
  chainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CE93D8',
    marginBottom: 4
  },
  chainProgress: {
    fontSize: 12,
    color: '#B39DDB'
  },
  objective: {
    flexDirection: 'row',
    marginBottom: 12
  },
  objectiveNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginRight: 8
  },
  objectiveContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  objectiveDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    flex: 1
  },
  objectiveProgress: {
    fontSize: 12,
    color: '#8e8e93',
    marginLeft: 8
  },
  requirement: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4
  },
  rewardSection: {
    marginBottom: 24
  },
  rewardGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.3)'
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12
  },
  rewardItem: {
    alignItems: 'center',
    minWidth: 80
  },
  rewardIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  rewardText: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center'
  },
  legendaryText: { color: '#FFD700' },
  epicText: { color: '#9C27B0' },
  rareText: { color: '#2196F3' },
  uncommonText: { color: '#4CAF50' },
  commonText: { color: '#9E9E9E' },
  titleRewards: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  titleRewardLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 6
  },
  titleReward: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 4
  },
  badgeRewards: {
    marginTop: 8
  },
  badgeRewardLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 6
  },
  badgeReward: {
    fontSize: 13,
    color: '#FFA726',
    marginBottom: 4
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20
  },
  timeIcon: {
    fontSize: 20,
    marginRight: 8
  },
  timeText: {
    fontSize: 14,
    color: '#FFB74D',
    fontWeight: 'bold'
  },
  actionButtons: {
    padding: 20,
    gap: 12
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  acceptButtonInner: {
    padding: 18,
    alignItems: 'center'
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1
  },
  navigateButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    letterSpacing: 1
  },
  showOnMapButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  showOnMapButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    letterSpacing: 1
  },
  abandonButtonModal: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center'
  },
  abandonButtonModalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 0.5
  }
});

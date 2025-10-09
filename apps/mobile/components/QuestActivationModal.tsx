import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { useState, useEffect } from 'react';

interface QuestActivationModalProps {
  quest: EnhancedQuest | null;
  visible: boolean;
  playerDistance: number | null; // Distance to quest in meters
  canAccept: boolean; // Whether player is within accept radius
  onAccept: (quest: EnhancedQuest) => void;
  onDismiss: () => void;
}

/**
 * Quest Activation Modal
 *
 * Appears when player enters quest activation radius
 * Shows quest details and allows player to accept if within accept radius
 */
export function QuestActivationModal({
  quest,
  visible,
  playerDistance,
  canAccept,
  onAccept,
  onDismiss
}: QuestActivationModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (visible && quest) {
      setShowDetails(false); // Reset when new quest appears
    }
  }, [visible, quest]);

  if (!quest) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'epic': return '#a855f7';
      case 'legendary': return '#fbbf24';
      default: return '#4488ff';
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getVisibilityBadge = () => {
    switch (quest.visibility) {
      case 'static': return { icon: '🏛️', label: 'Global Quest', color: '#3b82f6' };
      case 'local': return { icon: '📍', label: 'Local Quest', color: '#22c55e' };
      case 'dynamic': return { icon: '⚡', label: 'Personal Quest', color: '#f59e0b' };
    }
  };

  const visibilityBadge = getVisibilityBadge();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onDismiss} />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.98)', 'rgba(15, 15, 30, 0.98)']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.questIconContainer}>
                <Text style={styles.questIconLarge}>{quest.icon}</Text>
                {quest.isLegendary && (
                  <View style={styles.legendaryBadge}>
                    <Text style={styles.legendaryText}>✨ LEGENDARY</Text>
                  </View>
                )}
              </View>

              <Pressable style={styles.closeButton} onPress={onDismiss}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            {/* Title */}
            <Text style={styles.questTitle}>{quest.title}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: visibilityBadge.color + '33', borderColor: visibilityBadge.color }]}>
                <Text style={styles.badgeText}>{visibilityBadge.icon} {visibilityBadge.label}</Text>
              </View>

              <View style={[styles.badge, { backgroundColor: getDifficultyColor(quest.difficulty) + '33', borderColor: getDifficultyColor(quest.difficulty) }]}>
                <Text style={styles.badgeText}>{quest.difficulty.toUpperCase()}</Text>
              </View>

              {playerDistance !== null && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>📏 {formatDistance(playerDistance)}</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <ScrollView style={styles.descriptionScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.description}>{quest.description}</Text>

              {/* Objectives */}
              <View style={styles.objectivesSection}>
                <Text style={styles.sectionTitle}>📋 Objectives</Text>
                {quest.objectives.sort((a, b) => a.order - b.order).map((obj, index) => (
                  <View key={obj.id} style={styles.objectiveItem}>
                    <Text style={styles.objectiveNumber}>{index + 1}.</Text>
                    <Text style={styles.objectiveText}>{obj.description}</Text>
                    <Text style={styles.objectiveTarget}>
                      {obj.type === 'battle' && `⚔️ ${obj.target}`}
                      {obj.type === 'fitness' && `💪 ${obj.target}`}
                      {obj.type === 'collect' && `🎁 ${obj.target}`}
                      {obj.type === 'travel' && `🏃 ${obj.target}m`}
                      {obj.type === 'interact' && `💬 ${obj.target}`}
                      {obj.type === 'defend' && `🛡️ ${obj.target}s`}
                      {obj.type === 'summit' && `⛰️`}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Rewards */}
              <View style={styles.rewardsSection}>
                <Text style={styles.sectionTitle}>🎁 Rewards</Text>
                <View style={styles.rewardRow}>
                  {quest.rewards.xp > 0 && (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>⭐ {quest.rewards.xp} XP</Text>
                    </View>
                  )}
                  {quest.rewards.gold > 0 && (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>💰 {quest.rewards.gold} Gold</Text>
                    </View>
                  )}
                  {quest.rewards.items && quest.rewards.items.length > 0 && (
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>🎁 {quest.rewards.items.length} Items</Text>
                    </View>
                  )}
                </View>

                {quest.maxPlayers && quest.maxPlayers > 1 && (
                  <Text style={styles.coopBonus}>
                    👥 Co-op Bonus: +{quest.coopBonusPerPlayer || 25}% per player
                  </Text>
                )}
              </View>

              {/* Lore (expandable) */}
              {quest.lore && (
                <View style={styles.loreSection}>
                  <Pressable onPress={() => setShowDetails(!showDetails)}>
                    <Text style={styles.loreToggle}>
                      {showDetails ? '📖 Hide Story ▲' : '📖 Show Story ▼'}
                    </Text>
                  </Pressable>
                  {showDetails && (
                    <Text style={styles.loreText}>{quest.lore}</Text>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!canAccept && playerDistance !== null && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Get within {quest.acceptRadius || quest.activationRadius}m to accept quest
                  </Text>
                  <Text style={styles.warningSubtext}>
                    Currently {formatDistance(playerDistance)} away
                  </Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={onDismiss}
                >
                  <Text style={styles.cancelButtonText}>Not Now</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.button,
                    styles.acceptButton,
                    !canAccept && styles.buttonDisabled
                  ]}
                  onPress={() => canAccept && onAccept(quest)}
                  disabled={!canAccept}
                >
                  <LinearGradient
                    colors={canAccept ? ['#4ade80', '#22c55e'] : ['#666', '#555']}
                    style={styles.acceptButtonGradient}
                  >
                    <Text style={styles.acceptButtonText}>
                      {canAccept ? '✓ Accept Quest' : '🔒 Too Far'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  modalContent: {
    padding: 20,
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  questIconContainer: {
    alignItems: 'center'
  },
  questIconLarge: {
    fontSize: 48
  },
  legendaryBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4
  },
  legendaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fbbf24'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
  },
  questTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  badge: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#4488ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff'
  },
  descriptionScroll: {
    maxHeight: 300
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16
  },
  objectivesSection: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6
  },
  objectiveNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4488ff',
    marginRight: 8
  },
  objectiveText: {
    flex: 1,
    fontSize: 12,
    color: '#ddd'
  },
  objectiveTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 8
  },
  rewardsSection: {
    marginBottom: 16
  },
  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  rewardBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e'
  },
  coopBonus: {
    fontSize: 11,
    color: '#a855f7',
    marginTop: 8,
    fontStyle: 'italic'
  },
  loreSection: {
    marginBottom: 16
  },
  loreToggle: {
    fontSize: 13,
    color: '#4488ff',
    fontWeight: '600',
    marginBottom: 8
  },
  loreText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    fontStyle: 'italic'
  },
  actionButtons: {
    marginTop: 16
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    textAlign: 'center'
  },
  warningSubtext: {
    fontSize: 10,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 2
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  acceptButton: {
    flex: 1
  },
  acceptButtonGradient: {
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  buttonDisabled: {
    opacity: 0.5
  }
});

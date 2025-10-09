import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface EnhancedQuestListProps {
  staticQuests: EnhancedQuest[];
  dynamicQuests: any[];
  worldEvents: any[];
  onQuestPress: (quest: EnhancedQuest) => void;
  onSnapToQuest: (quest: EnhancedQuest) => void;
  onNavigateToQuest?: (quest: EnhancedQuest) => void;
  acceptedQuestIds?: string[];
  onToggleAccept?: (quest: EnhancedQuest, isAccepted: boolean) => void;
  isNavigating?: boolean;
}

/**
 * Enhanced Quest List Overlay
 *
 * Diablo II-style quest list at bottom of map
 * Features:
 * - Scrollable quest list
 * - Snap to location on map
 * - Accept quest button
 * - Show route button
 * - Quest categories (Local, Dynamic, World Events)
 */
export function EnhancedQuestList({
  staticQuests,
  dynamicQuests,
  worldEvents,
  onQuestPress,
  onSnapToQuest,
  onNavigateToQuest,
  acceptedQuestIds = [],
  onToggleAccept,
  isNavigating = false,
}: EnhancedQuestListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'local' | 'dynamic' | 'world'>('local');
  const heightAnim = useRef(new Animated.Value(180)).current;

  // Hide mini-menu when navigating
  if (isNavigating) {
    return null;
  }

  const toggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    Animated.spring(heightAnim, {
      toValue: newExpanded ? 400 : 180,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const getCurrentQuests = () => {
    switch (activeCategory) {
      case 'local':
        return staticQuests;
      case 'dynamic':
        return dynamicQuests;
      case 'world':
        return worldEvents;
      default:
        return staticQuests;
    }
  };

  const currentQuests = getCurrentQuests();

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <LinearGradient
        colors={['rgba(26, 26, 46, 0.98)', 'rgba(15, 15, 30, 0.98)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.expandButton} onPress={toggleExpand}>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▲'}</Text>
        </Pressable>

        <Text style={styles.title}>Available Quests</Text>

        <View style={styles.questCount}>
          <Text style={styles.questCountText}>
            {staticQuests.length + dynamicQuests.length + worldEvents.length}
          </Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        <Pressable
          style={[styles.categoryTab, activeCategory === 'local' && styles.categoryTabActive]}
          onPress={() => setActiveCategory('local')}
        >
          <Text style={[styles.categoryText, activeCategory === 'local' && styles.categoryTextActive]}>
            🗺️ Local ({staticQuests.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.categoryTab, activeCategory === 'dynamic' && styles.categoryTabActive]}
          onPress={() => setActiveCategory('dynamic')}
        >
          <Text style={[styles.categoryText, activeCategory === 'dynamic' && styles.categoryTextActive]}>
            ⏱️ Dynamic ({dynamicQuests.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.categoryTab, activeCategory === 'world' && styles.categoryTabActive]}
          onPress={() => setActiveCategory('world')}
        >
          <Text style={[styles.categoryText, activeCategory === 'world' && styles.categoryTextActive]}>
            🌍 Events ({worldEvents.length})
          </Text>
        </Pressable>
      </View>

      {/* Scrollable Quest List */}
      <ScrollView
        style={styles.questList}
        contentContainerStyle={styles.questListContent}
        showsVerticalScrollIndicator={true}
      >
        {currentQuests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeCategory === 'local' ? '🗺️' : activeCategory === 'dynamic' ? '⏱️' : '🌍'}
            </Text>
            <Text style={styles.emptyText}>
              {activeCategory === 'local'
                ? 'No local quests nearby'
                : activeCategory === 'dynamic'
                ? 'No active dynamic quests'
                : 'No world events active'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeCategory === 'local'
                ? 'Move to a new location or zoom out to explore'
                : 'Check back later for new challenges'}
            </Text>
          </View>
        ) : (
          currentQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onPress={() => onQuestPress(quest)}
              onSnapToLocation={() => onSnapToQuest(quest)}
              onNavigate={() => onNavigateToQuest?.(quest)}
              isAccepted={acceptedQuestIds.includes(quest.id)}
              onToggleAccept={(isAccepted) => onToggleAccept?.(quest, isAccepted)}
            />
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
}

/**
 * Individual Quest Card
 */
function QuestCard({
  quest,
  onPress,
  onSnapToLocation,
  onNavigate,
  isAccepted = false,
  onToggleAccept,
}: {
  quest: EnhancedQuest | any;
  onPress: () => void;
  onSnapToLocation: () => void;
  onNavigate?: () => void;
  isAccepted?: boolean;
  onToggleAccept?: (isAccepted: boolean) => void;
}) {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return '#00ff00';
      case 'medium':
        return '#ffaa00';
      case 'hard':
        return '#ff4444';
      default:
        return '#8e8e93';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'exploration':
        return '🗺️';
      case 'combat':
        return '⚔️';
      case 'social':
        return '👥';
      case 'spiritual':
        return '⛪';
      case 'fitness':
        return '🏃';
      default:
        return '📜';
    }
  };

  return (
    <Pressable style={styles.questCard} onPress={onPress}>
      <LinearGradient
        colors={['rgba(42, 42, 62, 0.8)', 'rgba(26, 26, 46, 0.8)']}
        style={styles.questCardGradient}
      >
        {/* Quest Header */}
        <View style={styles.questHeader}>
          <View style={styles.questTitleRow}>
            {/* Checkbox for accepting/unaccepting */}
            <Pressable
              style={[styles.checkbox, isAccepted && styles.checkboxChecked]}
              onPress={(e) => {
                e.stopPropagation();
                onToggleAccept?.(!isAccepted);
              }}
            >
              {isAccepted && <Text style={styles.checkboxIcon}>✓</Text>}
            </Pressable>

            <Text style={styles.questIcon}>{getCategoryIcon(quest.category)}</Text>
            <Text style={styles.questTitle} numberOfLines={1}>
              {quest.title}
            </Text>
          </View>

          {quest.difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quest.difficulty) }]}>
              <Text style={styles.difficultyText}>{quest.difficulty.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Quest Info */}
        <View style={styles.questInfo}>
          <Text style={styles.questDescription} numberOfLines={2}>
            {quest.description}
          </Text>

          {/* Rewards */}
          <View style={styles.rewardsRow}>
            {quest.rewards?.xp && (
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>⭐ {quest.rewards.xp} XP</Text>
              </View>
            )}
            {quest.rewards?.gold && (
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>💰 {quest.rewards.gold}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isAccepted && (
            <Pressable
              style={styles.acceptButton}
              onPress={(e) => {
                e.stopPropagation();
                onPress();
              }}
            >
              <Text style={styles.acceptButtonText}>⚔️ Accept</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onSnapToLocation();
            }}
          >
            <Text style={styles.actionButtonText}>📍 Show</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onPress();
            }}
          >
            <Text style={styles.actionButtonText}>📖 Details</Text>
          </Pressable>

          {isAccepted && onNavigate && (
            <Pressable
              style={styles.navigateButton}
              onPress={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
            >
              <Text style={styles.navigateButtonText}>🧭 Navigate</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, // Flush at bottom, above nav bar
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(68, 136, 255, 0.3)',
  },
  expandButton: {
    padding: 8,
  },
  expandIcon: {
    fontSize: 20,
    color: '#4488ff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  questCount: {
    backgroundColor: '#4488ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  questCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(42, 42, 62, 0.5)',
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: 'rgba(68, 136, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#4488ff',
  },
  categoryText: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#4488ff',
  },
  questList: {
    flex: 1,
  },
  questListContent: {
    padding: 16,
    gap: 12,
  },
  questCard: {
    marginBottom: 12,
  },
  questCardGradient: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(68, 136, 255, 0.3)',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#8e8e93',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#4488ff',
    backgroundColor: '#4488ff',
  },
  checkboxIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  questIcon: {
    fontSize: 20,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  questInfo: {
    marginBottom: 12,
    gap: 8,
  },
  questDescription: {
    fontSize: 13,
    color: '#b8b8c8',
    lineHeight: 18,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  rewardText: {
    fontSize: 11,
    color: '#ffd700',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4488ff',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4488ff',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4488ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#5e5e6e',
    textAlign: 'center',
  },
  acceptedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  acceptedIcon: {
    fontSize: 14,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  navigateButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

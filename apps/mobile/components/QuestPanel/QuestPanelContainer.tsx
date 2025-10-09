import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuestFilters } from './QuestFilters';
import { QuestSection } from './QuestSection';
import { ActiveQuestsSection } from './ActiveQuestsSection';
import { useQuestPanel } from '@/hooks/useQuestPanel';
import { useQuestFilters } from '@/hooks/useQuestFilters';
import { useSavedQuests } from '@/hooks/useSavedQuests';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface QuestPanelContainerProps {
  quests: EnhancedQuest[];
  activeQuests: EnhancedQuest[];
  acceptedQuestIds?: string[];
  playerLocation?: { latitude: number; longitude: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestPress?: (quest: EnhancedQuest) => void;
  onAcceptQuest?: (quest: EnhancedQuest) => void;
  onAbandonQuest?: (quest: EnhancedQuest) => void;
  onAddToActive?: (quest: EnhancedQuest) => void;
  onNavigate?: (quest: EnhancedQuest) => void;
  onViewLocation?: (quest: EnhancedQuest) => void;
  onReorderActive?: (newOrder: EnhancedQuest[]) => void;
  onRemoveFromActive?: (questId: string) => void;
  onNavigateAll?: () => void;
  onOptimizeRoute?: () => void;
  isRouteOptimized?: boolean;
  totalRouteDistance?: number;
  totalRouteEta?: number;
  maxActiveQuests?: number;
  panelTranslateX: Animated.SharedValue<number>;
  db?: any;
  userId?: string;
}

/**
 * Quest Panel Container
 * 
 * Main sliding panel for quest management
 * Slides in from right side of screen
 */
export function QuestPanelContainer({
  quests,
  activeQuests,
  acceptedQuestIds = [],
  playerLocation,
  isOpen,
  onClose,
  onQuestPress,
  onAcceptQuest,
  onAbandonQuest,
  onAddToActive,
  onNavigate,
  onViewLocation,
  onReorderActive,
  onRemoveFromActive,
  onNavigateAll,
  onOptimizeRoute,
  isRouteOptimized = false,
  totalRouteDistance = 0,
  totalRouteEta = 0,
  maxActiveQuests = 10,
  panelTranslateX,
  db,
  userId
}: QuestPanelContainerProps) {
  const insets = useSafeAreaInsets();
  const { panelWidth } = useQuestPanel();
  
  // Saved Quests
  const { savedQuests, loadSavedQuests, saveQuest, unsaveQuest } = useSavedQuests(db || null, userId);
  
  const {
    sortType,
    setSortType,
    difficultyFilter,
    setDifficultyFilter,
    searchQuery,
    setSearchQuery,
    groupedQuests,
    getDistance
  } = useQuestFilters({ quests, playerLocation });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panelTranslateX.value }]
  }));

  if (!isOpen) return null;

  return (
    <Animated.View style={[styles.container, { width: panelWidth }, animatedStyle]}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🎯</Text>
            <Text style={styles.headerTitle}>Quest Management</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {/* Filters */}
        <QuestFilters
          sortType={sortType}
          onSortChange={setSortType}
          difficultyFilter={difficultyFilter}
          onDifficultyChange={setDifficultyFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Quest Sections */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Saved Quests Section */}
          {savedQuests.length > 0 && (
            <QuestSection
              title="Saved Quests"
              icon="💾"
              quests={savedQuests}
              acceptedQuestIds={acceptedQuestIds}
              playerLocation={playerLocation}
              getDistance={getDistance}
              onQuestPress={onQuestPress}
              onAcceptQuest={onAcceptQuest}
              onAbandonQuest={(quest) => unsaveQuest(quest.id)}
              onAddToActive={onAddToActive}
              onNavigate={onNavigate}
              onViewLocation={onViewLocation}
              defaultExpanded={false}
            />
          )}

          {/* Active Quests Section (Multi-Stop Routing) */}
          <ActiveQuestsSection
            quests={activeQuests}
            playerLocation={playerLocation}
            getDistance={getDistance}
            onReorder={onReorderActive || (() => {})}
            onRemove={onRemoveFromActive || (() => {})}
            onNavigateAll={onNavigateAll || (() => {})}
            onOptimizeRoute={onOptimizeRoute || (() => {})}
            isOptimized={isRouteOptimized}
            totalDistance={totalRouteDistance}
            totalEta={totalRouteEta}
            maxQuests={maxActiveQuests}
          />

          {/* Main Quests */}
          <QuestSection
            title="Main Quests"
            icon="📜"
            quests={groupedQuests.main}
            acceptedQuestIds={acceptedQuestIds}
            playerLocation={playerLocation}
            getDistance={getDistance}
            onQuestPress={onQuestPress}
            onAcceptQuest={onAcceptQuest}
            onAbandonQuest={onAbandonQuest}
            onAddToActive={onAddToActive}
            onNavigate={onNavigate}
            onViewLocation={onViewLocation}
          />

          {/* World Quests */}
          <QuestSection
            title="World Quests"
            icon="🌍"
            quests={groupedQuests.world}
            acceptedQuestIds={acceptedQuestIds}
            playerLocation={playerLocation}
            getDistance={getDistance}
            onQuestPress={onQuestPress}
            onAcceptQuest={onAcceptQuest}
            onAbandonQuest={onAbandonQuest}
            onAddToActive={onAddToActive}
            onNavigate={onNavigate}
            onViewLocation={onViewLocation}
          />

          {/* Side Quests */}
          <QuestSection
            title="Side Quests"
            icon="📋"
            quests={groupedQuests.side}
            acceptedQuestIds={acceptedQuestIds}
            playerLocation={playerLocation}
            getDistance={getDistance}
            onQuestPress={onQuestPress}
            onAcceptQuest={onAcceptQuest}
            onAbandonQuest={onAbandonQuest}
            onAddToActive={onAddToActive}
            onNavigate={onNavigate}
            onViewLocation={onViewLocation}
          />

          {/* Player Created Quests */}
          <QuestSection
            title="Player Challenges"
            icon="⚔️"
            quests={groupedQuests.playerCreated}
            acceptedQuestIds={acceptedQuestIds}
            playerLocation={playerLocation}
            getDistance={getDistance}
            onQuestPress={onQuestPress}
            onAcceptQuest={onAcceptQuest}
            onAbandonQuest={onAbandonQuest}
            onAddToActive={onAddToActive}
            onNavigate={onNavigate}
            onViewLocation={onViewLocation}
          />

          {/* Empty State */}
          {quests.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyText}>No Quests Found</Text>
              <Text style={styles.emptySubtext}>
                Explore the map to discover new adventures!
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10
  },
  gradient: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerIcon: {
    fontSize: 24
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12
  },
  emptyIcon: {
    fontSize: 64
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40
  }
});

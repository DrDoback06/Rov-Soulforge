import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams
} from 'react-native-draggable-flatlist';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { useState } from 'react';

interface ActiveQuestsSectionProps {
  quests: EnhancedQuest[];
  playerLocation?: { latitude: number; longitude: number } | null;
  getDistance: (quest: EnhancedQuest) => number;
  onReorder: (newOrder: EnhancedQuest[]) => void;
  onRemove: (questId: string) => void;
  onNavigateAll: () => void;
  onOptimizeRoute: () => void;
  isOptimized: boolean;
  totalDistance?: number;
  totalEta?: number;
  maxQuests: number;
}

/**
 * Active Quests Section with Drag-and-Drop
 * 
 * Multi-stop routing interface
 * Supports reordering, optimization, and navigation
 */
export function ActiveQuestsSection({
  quests,
  playerLocation,
  getDistance,
  onReorder,
  onRemove,
  onNavigateAll,
  onOptimizeRoute,
  isOptimized,
  totalDistance,
  totalEta,
  maxQuests
}: ActiveQuestsSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatEta = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<EnhancedQuest>) => {
    const distance = playerLocation ? getDistance(item) : null;
    const questIndex = quests.findIndex(q => q.id === item.id);

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={[styles.questItem, isActive && styles.questItemActive]}
        >
          <LinearGradient
            colors={isActive ? ['#4488ff', '#2266dd'] : ['#232336', '#181824']}
            style={styles.questGradient}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle}>
              <Text style={styles.dragIcon}>☰</Text>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{questIndex + 1}</Text>
              </View>
            </View>

            {/* Quest Info */}
            <View style={styles.questInfo}>
              <View style={styles.questHeader}>
                <Text style={styles.questIcon}>{item.icon || '🎯'}</Text>
                <Text style={styles.questTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              
              {distance !== null && (
                <View style={styles.questMeta}>
                  <Text style={styles.metaText}>📍 {formatDistance(distance)}</Text>
                  <Text style={styles.metaText}>⏱️ {formatEta(distance / 1.4)}</Text>
                </View>
              )}
            </View>

            {/* Remove Button */}
            <Pressable
              style={styles.removeButton}
              onPress={() => onRemove(item.id)}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </Pressable>
          </LinearGradient>
        </Pressable>
      </ScaleDecorator>
    );
  };

  if (quests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={['#2a2a3e', '#1a1a2e']}
          style={styles.emptyGradient}
        >
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Active Quests</Text>
          <Text style={styles.emptySubtext}>
            Add quests to create a multi-stop route
          </Text>
          <Text style={styles.emptyLimit}>Max: {maxQuests} quests</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <LinearGradient
          colors={['#4488ff', '#2266dd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🧭</Text>
            <Text style={styles.headerTitle}>ACTIVE ROUTE</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{quests.length}/{maxQuests}</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
        </LinearGradient>
      </Pressable>

      {expanded && (
        <>
          {/* Route Stats */}
          {totalDistance !== undefined && totalEta !== undefined && (
            <View style={styles.routeStats}>
              <LinearGradient
                colors={['#232336', '#181824']}
                style={styles.statsGradient}
              >
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Distance</Text>
                  <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Est. Time</Text>
                  <Text style={styles.statValue}>{formatEta(totalEta)}</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.navigateButton]}
              onPress={onNavigateAll}
            >
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🧭</Text>
                <Text style={styles.actionText}>Navigate All</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.optimizeButton]}
              onPress={onOptimizeRoute}
            >
              <LinearGradient
                colors={isOptimized ? ['#22c55e', '#16a34a'] : ['#4488ff', '#2266dd']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>⚡</Text>
                <Text style={styles.actionText}>
                  {isOptimized ? 'Optimized' : 'Optimize'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Hint */}
          <Text style={styles.hint}>
            Long-press and drag to reorder • Route updates in real-time
          </Text>

          {/* Draggable Quest List */}
          <View style={styles.questList}>
            <DraggableFlatList
              data={quests}
              onDragEnd={({ data }) => onReorder(data)}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              containerStyle={styles.flatListContainer}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  emptyContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden'
  },
  emptyGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 8
  },
  emptyIcon: {
    fontSize: 48
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center'
  },
  emptyLimit: {
    color: '#4488ff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  header: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center'
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  expandIcon: {
    color: '#fff',
    fontSize: 14
  },
  routeStats: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 16
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a3e',
    marginHorizontal: 16
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8
  },
  navigateButton: {
    flex: 2
  },
  optimizeButton: {
    flex: 1
  },
  actionIcon: {
    fontSize: 18
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  hint: {
    color: '#8e8e93',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic'
  },
  questList: {
    gap: 8
  },
  flatListContainer: {
    gap: 8
  },
  questItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8
  },
  questItemActive: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }]
  },
  questGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12
  },
  dragHandle: {
    alignItems: 'center',
    gap: 4
  },
  dragIcon: {
    color: '#8e8e93',
    fontSize: 20
  },
  positionBadge: {
    backgroundColor: '#4488ff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  positionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  questInfo: {
    flex: 1,
    gap: 4
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  questIcon: {
    fontSize: 18
  },
  questTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1
  },
  questMeta: {
    flexDirection: 'row',
    gap: 12
  },
  metaText: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '600'
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  removeIcon: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700'
  }
});

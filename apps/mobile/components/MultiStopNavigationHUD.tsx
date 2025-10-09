import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface MultiStopNavigationHUDProps {
  quests: EnhancedQuest[];
  currentQuestIndex: number;
  completedQuestIds: string[];
  totalDistance: number;
  totalEta: number;
  rewardMultiplier: number;
  formatDistance: (meters: number) => string;
  formatEta: (seconds: number) => string;
  onClose: () => void;
}

/**
 * Multi-Stop Navigation HUD
 * 
 * Compact HUD for active multi-quest navigation
 * Shows current quest and upcoming quests in a horizontal scroll
 * Mirrors the FloatingQuestDetails design but for multi-stop routes
 */
export function MultiStopNavigationHUD({
  quests,
  currentQuestIndex,
  completedQuestIds,
  totalDistance,
  totalEta,
  rewardMultiplier,
  formatDistance,
  formatEta,
  onClose
}: MultiStopNavigationHUDProps) {
  
  if (quests.length === 0) return null;

  const currentQuest = quests[currentQuestIndex];
  const upcomingQuests = quests.slice(currentQuestIndex + 1);

  return (
    <Animated.View style={styles.container}>
      <LinearGradient
        colors={['#ff6b35', '#ff8c42']}
        style={styles.hud}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>NAVIGATING</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {/* Current Quest */}
        <View style={styles.currentQuest}>
          <Text style={styles.questTitle}>{currentQuest.title}</Text>
          <View style={styles.questStats}>
            <Text style={styles.statText}>
              {formatDistance(0)} • {formatEta(0)}
            </Text>
          </View>
        </View>

        {/* Upcoming Quests */}
        {upcomingQuests.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingTitle}>Next:</Text>
            <View style={styles.upcomingList}>
              {upcomingQuests.slice(0, 3).map((quest, index) => (
                <View key={quest.id} style={styles.upcomingQuest}>
                  <Text style={styles.upcomingNumber}>{currentQuestIndex + 2 + index}</Text>
                  <Text style={styles.upcomingTitle}>{quest.title}</Text>
                </View>
              ))}
              {upcomingQuests.length > 3 && (
                <Text style={styles.moreText}>+{upcomingQuests.length - 3} more</Text>
              )}
            </View>
          </View>
        )}

        {/* Route Stats */}
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>{formatEta(totalEta)}</Text>
          </View>
          {rewardMultiplier > 1 && (
            <View style={styles.multiplierBadge}>
              <Text style={styles.multiplierText}>{rewardMultiplier.toFixed(1)}x</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 16,
    width: 280,
    zIndex: 1000,
  },
  hud: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  currentQuest: {
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  questStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  upcomingSection: {
    marginBottom: 8,
  },
  upcomingTitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  upcomingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  upcomingQuest: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  upcomingNumber: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
    minWidth: 16,
    textAlign: 'center',
  },
  moreText: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  multiplierBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  multiplierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
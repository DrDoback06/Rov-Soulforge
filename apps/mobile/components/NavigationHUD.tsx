import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import type { EnhancedQuest } from '@/types/quests';

interface NavigationHUDProps {
  quest: EnhancedQuest;
  currentDistance: number; // Distance in meters
  onClose: () => void;
}

export function NavigationHUD({ quest, currentDistance, onClose }: NavigationHUDProps) {
  const slideAnim = useSharedValue(-100);

  useEffect(() => {
    slideAnim.value = withSpring(0, {
      damping: 20,
      stiffness: 90
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }]
  }));

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['rgba(26, 26, 46, 0.95)', 'rgba(15, 15, 30, 0.95)']}
        style={styles.gradient}
      >
        {/* Compact header with quest name and close */}
        <View style={styles.header}>
          <View style={styles.questInfo}>
            <Text style={styles.questIcon}>🗺️</Text>
            <Text style={styles.questName} numberOfLines={1}>{quest.title}</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {/* Compact distance and rewards */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(currentDistance)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rewards</Text>
            <View style={styles.rewardsRow}>
              {quest.rewards?.xp && <Text style={styles.rewardText}>⭐{quest.rewards.xp}</Text>}
              {quest.rewards?.gold && <Text style={styles.rewardText}>💰{quest.rewards.gold}</Text>}
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    width: 340,
    zIndex: 2000,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  gradient: {
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  questInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  questIcon: {
    fontSize: 20
  },
  questName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeIcon: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10,
    color: '#8e8e93',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 8
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700'
  }
});

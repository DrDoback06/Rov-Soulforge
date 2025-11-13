/**
 * Player Status Display
 *
 * Shows player health, mana, and status effects
 * Animated HP/Mana bars with damage/heal feedback
 * Character portrait and name display
 */

import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface PlayerStatusProps {
  playerId: string;
  playerName: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  lives?: number;
  isActive?: boolean;
  isOpponent?: boolean;
  avatarUrl?: string;
  buffsCount?: number;
  debuffsCount?: number;
}

export function PlayerStatus({
  playerId,
  playerName,
  hp,
  maxHp,
  mana,
  maxMana,
  lives = 1,
  isActive = false,
  isOpponent = false,
  avatarUrl,
  buffsCount = 0,
  debuffsCount = 0
}: PlayerStatusProps) {
  const hpProgress = useSharedValue(hp / maxHp);
  const manaProgress = useSharedValue(mana / maxMana);
  const shake = useSharedValue(0);

  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const manaPercentage = Math.max(0, Math.min(100, (mana / maxMana) * 100));

  useEffect(() => {
    const newHpProgress = hp / maxHp;
    const hpChanged = Math.abs(newHpProgress - hpProgress.value) > 0.01;

    if (hpChanged && newHpProgress < hpProgress.value) {
      // Damage taken - shake animation
      shake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }

    hpProgress.value = withSpring(newHpProgress);
  }, [hp, maxHp]);

  useEffect(() => {
    manaProgress.value = withSpring(mana / maxMana);
  }, [mana, maxMana]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }));

  const animatedHpBarStyle = useAnimatedStyle(() => ({
    width: `${hpProgress.value * 100}%`
  }));

  const animatedManaBarStyle = useAnimatedStyle(() => ({
    width: `${manaProgress.value * 100}%`
  }));

  const animatedHpColorStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      hpProgress.value,
      [0, 0.25, 0.5, 1],
      ['#ff0000', '#ff6b00', '#ffb800', '#22c55e']
    );

    return { backgroundColor };
  });

  const isDead = hp <= 0;
  const isLowHp = hpPercentage < 25;

  return (
    <Animated.View
      style={[
        styles.container,
        isOpponent && styles.containerOpponent,
        isActive && styles.containerActive,
        isDead && styles.containerDead,
        animatedContainerStyle
      ]}
    >
      <LinearGradient
        colors={
          isDead
            ? ['#3a3a4e', '#1a1a2e']
            : isActive
            ? ['#4c6ef5', '#364fc7']
            : ['#2a2a3e', '#1a1a2e']
        }
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarIcon}>
                  {isOpponent ? '👤' : '🛡️'}
                </Text>
              </View>
            )}

            {/* Active indicator */}
            {isActive && !isDead && (
              <View style={styles.activeIndicator}>
                <View style={styles.activePulse} />
              </View>
            )}

            {/* Dead overlay */}
            {isDead && (
              <View style={styles.deadOverlay}>
                <Text style={styles.deadIcon}>💀</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            {/* Name */}
            <Text style={[styles.name, isDead && styles.nameDead]} numberOfLines={1}>
              {playerName}
            </Text>

            {/* HP Bar */}
            <View style={styles.barContainer}>
              <Text style={styles.barLabel}>HP</Text>
              <View style={styles.barBackground}>
                <Animated.View
                  style={[styles.barFill, animatedHpBarStyle, animatedHpColorStyle]}
                />
              </View>
              <Text style={[styles.barValue, isLowHp && styles.barValueLow]}>
                {hp}/{maxHp}
              </Text>
            </View>

            {/* Mana Bar */}
            <View style={styles.barContainer}>
              <Text style={styles.barLabel}>MP</Text>
              <View style={styles.barBackground}>
                <Animated.View
                  style={[styles.barFill, styles.manaBar, animatedManaBarStyle]}
                />
              </View>
              <Text style={styles.barValue}>
                {mana}/{maxMana}
              </Text>
            </View>
          </View>

          {/* Status indicators */}
          <View style={styles.indicators}>
            {/* Lives */}
            {lives > 1 && (
              <View style={styles.livesBadge}>
                <Text style={styles.livesText}>×{lives}</Text>
              </View>
            )}

            {/* Buffs */}
            {buffsCount > 0 && (
              <View style={styles.buffBadge}>
                <Text style={styles.buffText}>↑{buffsCount}</Text>
              </View>
            )}

            {/* Debuffs */}
            {debuffsCount > 0 && (
              <View style={styles.debuffBadge}>
                <Text style={styles.debuffText}>↓{debuffsCount}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  containerOpponent: {
    opacity: 0.9
  },
  containerActive: {
    borderColor: '#ffd700',
    borderWidth: 3
  },
  containerDead: {
    opacity: 0.5,
    borderColor: '#8e8e93'
  },
  gradient: {
    padding: 12
  },
  content: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  avatarContainer: {
    position: 'relative',
    width: 60,
    height: 60
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarIcon: {
    fontSize: 32
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  activePulse: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#22c55e'
  },
  deadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deadIcon: {
    fontSize: 32
  },
  stats: {
    flex: 1,
    gap: 6
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  nameDead: {
    textDecorationLine: 'line-through',
    color: '#8e8e93'
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e8e93',
    width: 24
  },
  barBackground: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  barFill: {
    height: '100%',
    borderRadius: 5
  },
  manaBar: {
    backgroundColor: '#4c6ef5'
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    minWidth: 50,
    textAlign: 'right'
  },
  barValueLow: {
    color: '#ff4444'
  },
  indicators: {
    gap: 4,
    alignItems: 'flex-end'
  },
  livesBadge: {
    backgroundColor: '#ffd700',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  livesText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a2e'
  },
  buffBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  buffText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  debuffBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  debuffText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

/**
 * Animated Rewards Component
 *
 * Beautiful animated display of quest rewards with confetti and sparkles
 * Shows XP, gold, items with smooth animations
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface RewardItem {
  type: 'xp' | 'gold' | 'item' | 'card';
  amount?: number;
  name?: string;
  rarity?: string;
  icon?: string;
}

interface AnimatedRewardsProps {
  rewards: RewardItem[];
  onAnimationComplete?: () => void;
  showLeaderboardBonus?: boolean;
  bonusMultiplier?: number;
}

export function AnimatedRewards({
  rewards,
  onAnimationComplete,
  showLeaderboardBonus = false,
  bonusMultiplier = 1.0
}: AnimatedRewardsProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(
    [...Array(8)].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0)
    }))
  ).current;

  useEffect(() => {
    // Main reveal animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true
      })
    ]).start();

    // Continuous rotation for sparkles
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Sparkle animations
    sparkleAnims.forEach((anim, index) => {
      const angle = (index / sparkleAnims.length) * Math.PI * 2;
      const distance = 80;

      Animated.sequence([
        Animated.delay(100 * index),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(anim.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(anim.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
          })
        ]),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    });

    // Complete animation after delay
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      {/* Sparkles */}
      {sparkleAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.sparkle,
            {
              opacity: anim.opacity,
              transform: [
                { translateX: anim.translateX },
                { translateY: anim.translateY },
                { rotate: rotation }
              ]
            }
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>
      ))}

      {/* Main rewards container */}
      <Animated.View
        style={[
          styles.rewardsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.2)', 'rgba(245, 158, 11, 0.2)']}
          style={styles.rewardsGradient}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>🎉 Quest Complete!</Text>
            {showLeaderboardBonus && bonusMultiplier > 1 && (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusText}>
                  {Math.round((bonusMultiplier - 1) * 100)}% BONUS
                </Text>
              </View>
            )}
          </View>

          {/* Rewards list */}
          <View style={styles.rewardsList}>
            {rewards.map((reward, index) => (
              <AnimatedRewardItem
                key={index}
                reward={reward}
                delay={500 + index * 100}
                bonusMultiplier={bonusMultiplier}
              />
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function AnimatedRewardItem({
  reward,
  delay,
  bonusMultiplier
}: {
  reward: RewardItem;
  delay: number;
  bonusMultiplier: number;
}) {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay,
        duration: 400,
        useNativeDriver: true
      })
    ]).start();
  }, [delay]);

  const getRewardIcon = () => {
    switch (reward.type) {
      case 'xp':
        return '⭐';
      case 'gold':
        return '💰';
      case 'item':
      case 'card':
        return reward.icon || '🎁';
      default:
        return '🎁';
    }
  };

  const getRewardColor = () => {
    if (reward.rarity) {
      const colors: Record<string, string> = {
        common: '#9ca3af',
        magic: '#6366f1',
        rare: '#3b82f6',
        epic: '#a855f7',
        legendary: '#f59e0b',
        unique: '#ef4444'
      };
      return colors[reward.rarity] || '#ffffff';
    }
    return reward.type === 'gold' ? '#fbbf24' : '#ffffff';
  };

  const displayAmount = reward.amount ? Math.floor(reward.amount * bonusMultiplier) : null;

  return (
    <Animated.View
      style={[
        styles.rewardItem,
        {
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <Text style={styles.rewardIcon}>{getRewardIcon()}</Text>
      <View style={styles.rewardInfo}>
        <Text style={[styles.rewardName, { color: getRewardColor() }]}>
          {reward.name || reward.type.toUpperCase()}
        </Text>
        {displayAmount !== null && (
          <Text style={styles.rewardAmount}>+{displayAmount.toLocaleString()}</Text>
        )}
        {reward.rarity && (
          <Text style={[styles.rewardRarity, { color: getRewardColor() }]}>
            {reward.rarity.toUpperCase()}
          </Text>
        )}
      </View>
      {bonusMultiplier > 1 && (
        <View style={styles.multiplierBadge}>
          <Text style={styles.multiplierText}>×{bonusMultiplier.toFixed(1)}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  sparkle: {
    position: 'absolute',
    width: 24,
    height: 24
  },
  sparkleText: {
    fontSize: 24
  },
  rewardsContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  rewardsGradient: {
    padding: 24,
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 16
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  bonusBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  bonusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  rewardsList: {
    gap: 12
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  rewardIcon: {
    fontSize: 32
  },
  rewardInfo: {
    flex: 1,
    gap: 4
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600'
  },
  rewardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24'
  },
  rewardRarity: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  multiplierBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  multiplierText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

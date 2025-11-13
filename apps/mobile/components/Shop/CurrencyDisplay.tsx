/**
 * Currency Display Component
 *
 * Shows user's current gold and gems
 * Animated counter when values change
 */

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface CurrencyDisplayProps {
  gold: number;
  gems: number;
  compact?: boolean;
}

export function CurrencyDisplay({ gold, gems, compact = false }: CurrencyDisplayProps) {
  const goldScale = useSharedValue(1);
  const gemsScale = useSharedValue(1);

  useEffect(() => {
    // Bounce animation when gold changes
    goldScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );
  }, [gold]);

  useEffect(() => {
    // Bounce animation when gems change
    gemsScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );
  }, [gems]);

  const goldAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goldScale.value }]
  }));

  const gemsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gemsScale.value }]
  }));

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Animated.View style={[styles.compactCurrency, goldAnimatedStyle]}>
          <Text style={styles.compactIcon}>💰</Text>
          <Text style={styles.compactValue}>{formatNumber(gold)}</Text>
        </Animated.View>

        <Animated.View style={[styles.compactCurrency, gemsAnimatedStyle]}>
          <Text style={styles.compactIcon}>💎</Text>
          <Text style={styles.compactValue}>{formatNumber(gems)}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gold */}
      <Animated.View style={[styles.currencyCard, goldAnimatedStyle]}>
        <LinearGradient
          colors={['#fbbf24', '#f59e0b']}
          style={styles.gradientCard}
        >
          <Text style={styles.icon}>💰</Text>
          <View style={styles.currencyInfo}>
            <Text style={styles.label}>Gold</Text>
            <Text style={styles.value}>{formatNumber(gold)}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Gems */}
      <Animated.View style={[styles.currencyCard, gemsAnimatedStyle]}>
        <LinearGradient
          colors={['#a855f7', '#9333ea']}
          style={styles.gradientCard}
        >
          <Text style={styles.icon}>💎</Text>
          <View style={styles.currencyInfo}>
            <Text style={styles.label}>Gems</Text>
            <Text style={styles.value}>{formatNumber(gems)}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  currencyCard: {
    flex: 1,
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
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12
  },
  icon: {
    fontSize: 32
  },
  currencyInfo: {
    flex: 1,
    gap: 2
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  compactContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center'
  },
  compactCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  compactIcon: {
    fontSize: 20
  },
  compactValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

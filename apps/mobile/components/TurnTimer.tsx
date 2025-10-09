/**
 * Turn Timer Component (The Rope)
 *
 * Visual timer showing remaining turn time
 * Burns down like a rope/fuse when time is running out
 */

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing
} from 'react-native-reanimated';

interface TurnTimerProps {
  isMyTurn: boolean;
  turnStartedAt: number;
  turnTimeLimit: number; // seconds
  stackSize: number;
}

export function TurnTimer({
  isMyTurn,
  turnStartedAt,
  turnTimeLimit,
  stackSize
}: TurnTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(turnTimeLimit);

  // Animations
  const widthAnim = useSharedValue(1);
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    // Calculate time remaining
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartedAt) / 1000);
      const remaining = Math.max(0, turnTimeLimit - elapsed);
      setTimeRemaining(remaining);

      // Update width animation
      const percentage = remaining / turnTimeLimit;
      widthAnim.value = withTiming(percentage, {
        duration: 1000,
        easing: Easing.linear
      });

      // Pulse faster when time is low
      if (remaining <= 15) {
        pulseAnim.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 200 }),
            withTiming(1, { duration: 200 })
          ),
          -1
        );

        glowAnim.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1
        );
      } else {
        pulseAnim.value = 1;
        glowAnim.value = 0;
      }

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [turnStartedAt, turnTimeLimit]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }]
  }));

  const ropeAnimatedStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value * 100}%`,
    shadowOpacity: glowAnim.value * 0.8
  }));

  const percentage = (timeRemaining / turnTimeLimit) * 100;
  const isLowTime = timeRemaining <= 15;
  const isCritical = timeRemaining <= 5;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.timerContainer}>
        {/* Label */}
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {isMyTurn ? '⏰ Your Turn' : '⌛ Opponent'}
          </Text>
          <Text style={styles.stackInfo}>
            Stack: {stackSize} {stackSize > 0 ? '🎴' : ''}
          </Text>
        </View>

        {/* Rope/Timer bar */}
        <View style={styles.ropeTrack}>
          <Animated.View style={[ropeAnimatedStyle]}>
            <LinearGradient
              colors={getRopeColors(percentage, isLowTime, isCritical)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rope}
            >
              {/* Burning effect when low time */}
              {isLowTime && (
                <View style={styles.burningEffect}>
                  <Text style={styles.fireEmoji}>🔥</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Time display */}
        <View style={styles.timeDisplay}>
          <Text style={[
            styles.timeText,
            isCritical && styles.timeTextCritical
          ]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Stack time bonus indicator */}
      {stackSize > 0 && (
        <View style={styles.bonusIndicator}>
          <Text style={styles.bonusText}>
            +{stackSize * 15}s from Stack
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

function getRopeColors(
  percentage: number,
  isLowTime: boolean,
  isCritical: boolean
): [string, string] {
  if (isCritical) {
    return ['#ff0000', '#cc0000']; // Red (critical)
  } else if (isLowTime) {
    return ['#ff6600', '#ff3300']; // Orange-red (low time)
  } else if (percentage < 50) {
    return ['#ffaa00', '#ff8800']; // Orange (half time)
  } else {
    return ['#00ff88', '#00cc66']; // Green (plenty of time)
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${secs}s`;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  timerContainer: {
    gap: 8
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  stackInfo: {
    fontSize: 12,
    color: '#8e8e93'
  },
  ropeTrack: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative'
  },
  rope: {
    height: '100%',
    borderRadius: 6,
    position: 'relative',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8
  },
  burningEffect: {
    position: 'absolute',
    right: -8,
    top: -8
  },
  fireEmoji: {
    fontSize: 20
  },
  timeDisplay: {
    alignItems: 'center'
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums']
  },
  timeTextCritical: {
    color: '#ff0000'
  },
  bonusIndicator: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4488ff',
    alignItems: 'center'
  },
  bonusText: {
    fontSize: 11,
    color: '#4488ff',
    fontWeight: '600'
  }
});

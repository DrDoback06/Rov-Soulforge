/**
 * Turn Timer Component
 *
 * Displays countdown timer for the current turn
 * Visual urgency indicators as time runs low
 * Integrates with battle turn time limit system
 */

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface TurnTimerProps {
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  isMyTurn: boolean;
  isPaused?: boolean;
}

export function TurnTimer({
  timeRemaining,
  totalTime,
  isMyTurn,
  isPaused = false
}: TurnTimerProps) {
  const progress = useSharedValue(1);
  const pulse = useSharedValue(1);

  const percentage = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));
  const isLow = percentage < 25;
  const isCritical = percentage < 10;

  useEffect(() => {
    // Update progress bar
    progress.value = withTiming(percentage / 100, {
      duration: 300,
      easing: Easing.linear
    });

    // Pulse animation when critical
    if (isCritical && !isPaused) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [percentage, isCritical, isPaused]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }]
    };
  });

  const animatedColorStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.25, 0.5, 1],
      ['#ff0000', '#ff6b00', '#ffb800', '#22c55e']
    );

    return {
      backgroundColor
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <LinearGradient
        colors={
          isMyTurn
            ? ['#4c6ef5', '#364fc7']
            : ['#3a3a4e', '#2a2a3e']
        }
        style={styles.gradient}
      >
        {/* Timer icon and label */}
        <View style={styles.header}>
          <Text style={styles.icon}>⏱️</Text>
          <Text style={styles.label}>
            {isPaused ? 'PAUSED' : isMyTurn ? 'Your Turn' : "Opponent's Turn"}
          </Text>
        </View>

        {/* Time remaining */}
        <View style={styles.timeContainer}>
          <Text style={[styles.time, isCritical && styles.timeCritical]}>
            {formatTime(timeRemaining)}
          </Text>
          {isCritical && !isPaused && (
            <Text style={styles.warningText}>TIME RUNNING OUT!</Text>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                animatedBarStyle,
                animatedColorStyle
              ]}
            />
          </View>
          <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
        </View>

        {/* Turn info */}
        {!isPaused && (
          <Text style={styles.hint}>
            {isMyTurn ? '▶ Play a card or pass turn' : '⏸️ Waiting...'}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
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
  gradient: {
    padding: 16,
    gap: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  icon: {
    fontSize: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  timeContainer: {
    alignItems: 'center',
    gap: 4
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  timeCritical: {
    color: '#ff0000'
  },
  warningText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff0000',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  progressBarContainer: {
    gap: 8
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    textAlign: 'center'
  },
  hint: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    fontStyle: 'italic'
  }
});

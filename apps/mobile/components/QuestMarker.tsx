import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';

interface QuestMarkerProps {
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';
  pulse?: boolean;
  isLegendary?: boolean;
  isBoss?: boolean;
  onPress: () => void;
}

export function QuestMarker({
  icon,
  color,
  difficulty,
  pulse = false,
  isLegendary = false,
  isBoss = false,
  onPress
}: QuestMarkerProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FFD700';
      default: return color;
    }
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Pulse ring effect for legendary/boss quests */}
      {(isLegendary || isBoss) && (
        <Animated.View
          style={[
            styles.pulseRing,
            { backgroundColor: color },
            animatedStyle
          ]}
        />
      )}

      {/* Main marker */}
      <View style={[styles.marker, { backgroundColor: color }]}>
        <Text style={styles.icon}>{icon}</Text>

        {/* Difficulty indicator */}
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
          <Text style={styles.difficultyText}>
            {difficulty[0].toUpperCase()}
          </Text>
        </View>

        {/* Boss crown indicator */}
        {isBoss && (
          <View style={styles.bossIndicator}>
            <Text style={styles.bossIcon}>👑</Text>
          </View>
        )}

        {/* Legendary glow */}
        {isLegendary && (
          <View style={styles.legendaryGlow}>
            <Text style={styles.sparkle}>✨</Text>
          </View>
        )}
      </View>

      {/* Quest type indicator bar */}
      <View style={[styles.typeBar, { backgroundColor: getDifficultyColor() }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  marker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5
  },
  icon: {
    fontSize: 24
  },
  pulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.3
  },
  difficultyBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  bossIndicator: {
    position: 'absolute',
    top: -8,
    left: -5
  },
  bossIcon: {
    fontSize: 16
  },
  legendaryGlow: {
    position: 'absolute',
    bottom: -8,
    right: -5
  },
  sparkle: {
    fontSize: 16
  },
  typeBar: {
    width: 4,
    height: 20,
    marginTop: 2,
    borderRadius: 2
  }
});

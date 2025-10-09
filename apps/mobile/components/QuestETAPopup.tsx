import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

interface QuestETAPopupProps {
  distance: number; // meters
  duration: number; // seconds
  caloriesBurned: number;
  onClose: () => void;
}

export function QuestETAPopup({ distance, duration, caloriesBurned, onClose }: QuestETAPopupProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Pop-in animation
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150
    });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    scale.value = withSpring(0, {
      damping: 20,
      stiffness: 200
    });
    opacity.value = withTiming(0, { duration: 150 });

    setTimeout(() => {
      onClose();
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.popup, animatedStyle]}>
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1e']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🗺️</Text>
            <Text style={styles.headerTitle}>Route Calculated</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Main stats */}
          <View style={styles.mainStats}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatIcon}>📍</Text>
              <Text style={styles.mainStatValue}>{formatDistance(distance)}</Text>
              <Text style={styles.mainStatLabel}>Distance</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.mainStat}>
              <Text style={styles.mainStatIcon}>⏱️</Text>
              <Text style={styles.mainStatValue}>{formatDuration(duration)}</Text>
              <Text style={styles.mainStatLabel}>Walking Time</Text>
            </View>
          </View>

          {/* Fitness stats */}
          <View style={styles.fitnessStats}>
            <View style={styles.fitnessStat}>
              <Text style={styles.fitnessIcon}>🔥</Text>
              <Text style={styles.fitnessValue}>~{caloriesBurned}</Text>
              <Text style={styles.fitnessLabel}>Calories</Text>
            </View>

            <View style={styles.fitnessStat}>
              <Text style={styles.fitnessIcon}>👟</Text>
              <Text style={styles.fitnessValue}>~{Math.round(distance * 1.3)}</Text>
              <Text style={styles.fitnessLabel}>Steps</Text>
            </View>

            <View style={styles.fitnessStat}>
              <Text style={styles.fitnessIcon}>💪</Text>
              <Text style={styles.fitnessValue}>+{Math.round(duration / 6)}</Text>
              <Text style={styles.fitnessLabel}>Stamina XP</Text>
            </View>
          </View>

          {/* Footer hint */}
          <Text style={styles.footerHint}>
            💡 Tap outside to dismiss
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000
  },
  popup: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16
  },
  gradient: {
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10
  },
  headerIcon: {
    fontSize: 28
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold'
  },
  mainStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)'
  },
  mainStat: {
    flex: 1,
    alignItems: 'center'
  },
  mainStatIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4
  },
  mainStatLabel: {
    fontSize: 11,
    color: '#8e8e93',
    textTransform: 'uppercase'
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginHorizontal: 16
  },
  fitnessStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  fitnessStat: {
    flex: 1,
    backgroundColor: 'rgba(68, 136, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(68, 136, 255, 0.2)'
  },
  fitnessIcon: {
    fontSize: 20,
    marginBottom: 6
  },
  fitnessValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4488ff',
    marginBottom: 4
  },
  fitnessLabel: {
    fontSize: 9,
    color: '#8e8e93',
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  footerHint: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  }
});

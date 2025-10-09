import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Confetti from 'react-native-confetti';

const { width, height } = Dimensions.get('window');

interface QuestCelebrationProps {
  visible: boolean;
  questTitle: string;
  rewards: {
    gold?: number;
    xp?: number;
    items?: any[];
  };
  onComplete: () => void;
}

/**
 * Quest Completion Celebration Animation
 * Shows confetti, rewards, and celebratory messages
 */
export function QuestCelebration({
  visible,
  questTitle,
  rewards,
  onComplete
}: QuestCelebrationProps) {
  const confettiRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Start confetti
      confettiRef.current?.startConfetti();

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => {
        clearTimeout(timer);
        confettiRef.current?.stopConfetti();
      };
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      onComplete();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Confetti ref={confettiRef} count={100} />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#4488ff', '#9944ff']}
          style={styles.gradient}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎉</Text>
          </View>

          {/* Quest Complete Text */}
          <Text style={styles.title}>Quest Complete!</Text>
          <Text style={styles.questName}>{questTitle}</Text>

          {/* Rewards */}
          <View style={styles.rewardsContainer}>
            {rewards.gold && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>💰</Text>
                <Text style={styles.rewardText}>+{rewards.gold} Gold</Text>
              </View>
            )}
            {rewards.xp && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>⭐</Text>
                <Text style={styles.rewardText}>+{rewards.xp} XP</Text>
              </View>
            )}
            {rewards.items && rewards.items.length > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🎁</Text>
                <Text style={styles.rewardText}>{rewards.items.length} Item{rewards.items.length > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>

          {/* Epic Message */}
          <Text style={styles.epicMessage}>
            {getRandomCelebrationMessage()}
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function getRandomCelebrationMessage(): string {
  const messages = [
    "Victory is yours!",
    "Well done, adventurer!",
    "Another quest conquered!",
    "Glory to the brave!",
    "Your legend grows!",
    "Exceptional work!",
    "The realm thanks you!",
    "You've proven your worth!",
    "A hero rises!",
    "Triumphant as always!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10000,
    elevation: 10000
  },
  container: {
    width: width * 0.8,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#4488ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20
  },
  gradient: {
    padding: 32,
    alignItems: 'center'
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  icon: {
    fontSize: 60
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  questName: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.9
  },
  rewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8
  },
  rewardIcon: {
    fontSize: 20
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  epicMessage: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8
  }
});

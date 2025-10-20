import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';

interface DiceRollerProps {
  visible: boolean;
  onRoll: (result: number) => void;
  onClose: () => void;
  sides?: number; // D6, D20, etc.
  reason?: string; // What the roll is for
  seed?: string; // For verifiable RNG
}

/**
 * Dice Roller Component
 * 
 * Features:
 * - 3D tactile dice animation
 * - Seeded RNG for auditing
 * - Visual feedback with haptics
 * - Shows roll reason and result
 */
export function DiceRoller({ 
  visible, 
  onRoll, 
  onClose, 
  sides = 6, 
  reason = 'Random event',
  seed 
}: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setResult(null);
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [visible]);

  const handleRoll = () => {
    if (isRolling) return;

    setIsRolling(true);
    setResult(null);

    // Animate dice rolling
    Animated.parallel([
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        }),
        { iterations: 10 }
      ),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ]).start(() => {
      // Generate roll result (seeded if provided)
      const rollResult = generateRoll(sides, seed);
      setResult(rollResult);
      setIsRolling(false);

      // Trigger haptic feedback
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Auto-close after showing result
      setTimeout(() => {
        onRoll(rollResult);
      }, 1500);
    });
  };

  if (!visible) return null;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#2a1a4e', '#1a1a2e']}
          style={styles.content}
        >
          {/* Title */}
          <Text style={styles.title}>{reason}</Text>

          {/* Dice Display */}
          <Animated.View
            style={[
              styles.diceContainer,
              {
                transform: [
                  { rotate: rotation },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['#4488ff', '#2244cc']}
              style={styles.dice}
            >
              {result !== null ? (
                <Text style={styles.diceResult}>{result}</Text>
              ) : (
                <Text style={styles.diceSides}>D{sides}</Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Result Display */}
          {result !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Result:</Text>
              <Text style={styles.resultValue}>{result}</Text>
              {seed && (
                <Text style={styles.seedText}>Seed: {seed.substring(0, 8)}...</Text>
              )}
            </View>
          )}

          {/* Roll Button */}
          {result === null && (
            <Pressable
              style={[styles.rollButton, isRolling && styles.rollButtonDisabled]}
              onPress={handleRoll}
              disabled={isRolling}
            >
              <LinearGradient
                colors={isRolling ? ['#2a2a3e', '#1a1a2e'] : ['#4488ff', '#2266dd']}
                style={styles.rollButtonGradient}
              >
                <Text style={styles.rollButtonText}>
                  {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {/* Close Button */}
          {result !== null && (
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Continue</Text>
            </Pressable>
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

/**
 * Generate roll result with optional seeded RNG
 */
function generateRoll(sides: number, seed?: string): number {
  if (seed) {
    // Seeded RNG for verifiable randomness
    const hash = hashString(seed);
    return (hash % sides) + 1;
  }
  
  // Standard random
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Simple string hash for seeded RNG
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  container: {
    width: '85%',
    maxWidth: 350
  },
  content: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: '#4488ff',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center'
  },
  diceContainer: {
    marginBottom: 24
  },
  dice: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8
  },
  diceSides: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  diceResult: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    minWidth: 200
  },
  resultLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 8
  },
  seedText: {
    fontSize: 10,
    color: '#5e5e6e',
    fontFamily: 'monospace'
  },
  rollButton: {
    width: '100%'
  },
  rollButtonDisabled: {
    opacity: 0.5
  },
  rollButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  rollButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#4488ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

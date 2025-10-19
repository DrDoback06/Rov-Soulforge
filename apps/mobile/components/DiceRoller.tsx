import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import type { DiceRoll } from '@rov/types';

/**
 * Dice Roller Component
 *
 * Features:
 * - Visual dice rolling animation
 * - Support for d4, d6, d8, d10, d12, d20
 * - Physics-based animation metadata for future 3D implementation
 * - Roll history
 * - Haptic feedback
 */

interface DiceRollerProps {
  visible: boolean;
  sides: number;
  onRoll?: (result: DiceRoll) => void;
  onClose?: () => void;
  context?: string;
}

export function DiceRoller({
  visible,
  sides,
  onRoll,
  onClose,
  context
}: DiceRollerProps) {
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<DiceRoll[]>([]);

  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handleRoll = async () => {
    if (isRolling) return;

    setIsRolling(true);
    setResult(null);

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate dice roll
    rotation.value = 0;
    scale.value = 1;

    rotation.value = withSequence(
      withTiming(720, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 0 })
    );

    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1)
    );

    // Simulate roll with delay
    setTimeout(() => {
      const rollResult = Math.floor(Math.random() * sides) + 1;

      const roll: DiceRoll = {
        id: `roll_${Date.now()}`,
        seed: `seed_${Date.now()}`,
        sides,
        result: rollResult,
        timestamp: Date.now(),
        context
      };

      setResult(rollResult);
      setHistory([roll, ...history.slice(0, 9)]); // Keep last 10 rolls
      setIsRolling(false);

      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (onRoll) {
        onRoll(roll);
      }
    }, 1000);
  };

  const diceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
      opacity: opacity.value
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Roll d{sides}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Dice Display */}
          <View style={styles.diceContainer}>
            <Animated.View style={[styles.dice, diceStyle]}>
              {result !== null ? (
                <DiceFace sides={sides} value={result} />
              ) : (
                <DiceFace sides={sides} value={sides === 6 ? 6 : 1} />
              )}
            </Animated.View>

            {/* Result Display */}
            {result !== null && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Result</Text>
                <Text style={styles.resultValue}>{result}</Text>
              </View>
            )}
          </View>

          {/* Roll Button */}
          <Pressable
            style={[styles.rollButton, isRolling && styles.rollButtonDisabled]}
            onPress={handleRoll}
            disabled={isRolling}
          >
            <Text style={styles.rollButtonText}>
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Text>
          </Pressable>

          {/* Roll History */}
          {history.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Recent Rolls</Text>
              <View style={styles.historyList}>
                {history.slice(0, 5).map((roll) => (
                  <View key={roll.id} style={styles.historyItem}>
                    <Text style={styles.historyDice}>d{roll.sides}</Text>
                    <Text style={styles.historyResult}>{roll.result}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Context Info */}
          {context && (
            <Text style={styles.contextText}>
              {context}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Dice face visualization
 * Displays appropriate face based on dice type
 */
function DiceFace({ sides, value }: { sides: number; value: number }) {
  // For d6, show dots
  if (sides === 6) {
    return <D6Face value={value} />;
  }

  // For other dice, show number
  return (
    <View style={styles.diceFace}>
      <Text style={styles.diceFaceNumber}>{value}</Text>
      <Text style={styles.diceFaceLabel}>d{sides}</Text>
    </View>
  );
}

/**
 * D6 face with dots
 */
function D6Face({ value }: { value: number }) {
  const dots = getDotPattern(value);

  return (
    <View style={styles.d6Face}>
      <View style={styles.dotGrid}>
        {dots.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.dotRow}>
            {row.map((hasDot, colIdx) => (
              <View
                key={colIdx}
                style={[styles.dotSpace, hasDot && styles.dot]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Get dot pattern for d6 face
 */
function getDotPattern(value: number): boolean[][] {
  const patterns: Record<number, boolean[][]> = {
    1: [
      [false, false, false],
      [false, true, false],
      [false, false, false]
    ],
    2: [
      [true, false, false],
      [false, false, false],
      [false, false, true]
    ],
    3: [
      [true, false, false],
      [false, true, false],
      [false, false, true]
    ],
    4: [
      [true, false, true],
      [false, false, false],
      [true, false, true]
    ],
    5: [
      [true, false, true],
      [false, true, false],
      [true, false, true]
    ],
    6: [
      [true, false, true],
      [true, false, true],
      [true, false, true]
    ]
  };

  return patterns[value] || patterns[1];
}

/**
 * Hook to use dice roller
 */
export function useDiceRoller() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({ sides: 6, context: '' });

  const roll = (sides: number, context?: string) => {
    setConfig({ sides, context: context || '' });
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return {
    visible,
    sides: config.sides,
    context: config.context,
    roll,
    close
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#4a4a5e'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ffffff'
  },
  diceContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  dice: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center'
  },
  diceFace: {
    width: 160,
    height: 160,
    backgroundColor: '#2a2a3e',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4488ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4488ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12
  },
  diceFaceNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  diceFaceLabel: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 8
  },
  d6Face: {
    width: 160,
    height: 160,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  dotGrid: {
    width: '100%',
    height: '100%'
  },
  dotRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  dotSpace: {
    width: 24,
    height: 24
  },
  dot: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12
  },
  resultContainer: {
    marginTop: 24,
    alignItems: 'center'
  },
  resultLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  rollButton: {
    backgroundColor: '#4488ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  rollButtonDisabled: {
    backgroundColor: '#2a2a3e',
    opacity: 0.5
  },
  rollButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  historyContainer: {
    marginTop: 8
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 8
  },
  historyList: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  historyItem: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  historyDice: {
    fontSize: 12,
    color: '#8e8e93'
  },
  historyResult: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  contextText: {
    fontSize: 12,
    color: '#5e5e6e',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12
  }
});
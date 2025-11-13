/**
 * Floating Number Component
 *
 * Animated floating damage/heal numbers that appear during battle
 * Different styles and animations for damage, healing, buffs, and debuffs
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { useEffect } from 'react';

export type FloatingNumberType = 'damage' | 'heal' | 'buff' | 'debuff' | 'mana' | 'shield';

interface FloatingNumberProps {
  value: number;
  type: FloatingNumberType;
  x: number;
  y: number;
  onComplete?: () => void;
  critical?: boolean;
}

export function FloatingNumber({
  value,
  type,
  x,
  y,
  onComplete,
  critical = false
}: FloatingNumberProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = critical
      ? withSequence(
          withSpring(1.5, { damping: 8 }),
          withSpring(1.2, { damping: 10 })
        )
      : withSpring(1, { damping: 10 });

    // Float up animation
    translateY.value = withSequence(
      withTiming(-80, {
        duration: 1500,
        easing: Easing.out(Easing.cubic)
      }),
      withTiming(-100, { duration: 300 })
    );

    // Fade out
    opacity.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }]
  }));

  const config = getNumberConfig(type, critical);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          position: 'absolute',
          left: x,
          top: y
        },
        animatedStyle
      ]}
    >
      <View style={[styles.numberContainer, { backgroundColor: config.backgroundColor }]}>
        {config.prefix && (
          <Text style={[styles.prefix, { color: config.color }]}>{config.prefix}</Text>
        )}
        <Text
          style={[
            styles.number,
            { color: config.color },
            critical && styles.criticalNumber
          ]}
        >
          {value}
        </Text>
        {config.suffix && (
          <Text style={[styles.suffix, { color: config.color }]}>{config.suffix}</Text>
        )}
      </View>

      {critical && <Text style={styles.criticalLabel}>CRITICAL!</Text>}
    </Animated.View>
  );
}

/**
 * Hook for managing floating numbers
 */
export function useFloatingNumbers() {
  const [numbers, setNumbers] = useState<Array<{
    id: string;
    value: number;
    type: FloatingNumberType;
    x: number;
    y: number;
    critical?: boolean;
  }>>([]);

  const addNumber = useCallback(
    (
      value: number,
      type: FloatingNumberType,
      x: number,
      y: number,
      critical: boolean = false
    ) => {
      const id = `${Date.now()}_${Math.random()}`;
      setNumbers((prev) => [...prev, { id, value, type, x, y, critical }]);
    },
    []
  );

  const removeNumber = useCallback((id: string) => {
    setNumbers((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    numbers,
    addNumber,
    removeNumber
  };
}

/**
 * Container for rendering multiple floating numbers
 */
interface FloatingNumbersContainerProps {
  numbers: Array<{
    id: string;
    value: number;
    type: FloatingNumberType;
    x: number;
    y: number;
    critical?: boolean;
  }>;
  onNumberComplete: (id: string) => void;
}

export function FloatingNumbersContainer({
  numbers,
  onNumberComplete
}: FloatingNumbersContainerProps) {
  return (
    <View style={styles.absoluteContainer} pointerEvents="none">
      {numbers.map((number) => (
        <FloatingNumber
          key={number.id}
          value={number.value}
          type={number.type}
          x={number.x}
          y={number.y}
          critical={number.critical}
          onComplete={() => onNumberComplete(number.id)}
        />
      ))}
    </View>
  );
}

import { useState, useCallback } from 'react';

function getNumberConfig(type: FloatingNumberType, critical: boolean) {
  const configs: Record<
    FloatingNumberType,
    {
      color: string;
      backgroundColor: string;
      prefix?: string;
      suffix?: string;
    }
  > = {
    damage: {
      color: critical ? '#ff0000' : '#ff4444',
      backgroundColor: 'rgba(255, 68, 68, 0.2)',
      prefix: '-'
    },
    heal: {
      color: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      prefix: '+'
    },
    buff: {
      color: '#4ade80',
      backgroundColor: 'rgba(74, 222, 128, 0.2)',
      prefix: '+',
      suffix: '↑'
    },
    debuff: {
      color: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      prefix: '-',
      suffix: '↓'
    },
    mana: {
      color: '#4c6ef5',
      backgroundColor: 'rgba(76, 110, 245, 0.2)',
      prefix: '+'
    },
    shield: {
      color: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      prefix: '+',
      suffix: '🛡️'
    }
  };

  return configs[type];
}

const styles = StyleSheet.create({
  absoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000
  },
  container: {
    alignItems: 'center',
    gap: 4
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5
  },
  prefix: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 2
  },
  number: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  criticalNumber: {
    fontSize: 32
  },
  suffix: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4
  },
  criticalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff0000',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  }
});

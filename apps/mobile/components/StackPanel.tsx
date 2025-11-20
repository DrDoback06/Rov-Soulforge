import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import type { StackItem } from '@rov/types';

interface StackPanelProps {
  stack: StackItem[];
  onStackItemResolve?: (itemId: string) => void;
}

/**
 * Stack Panel Component
 * 
 * Displays the LIFO stack of pending card effects:
 * - Visual LIFO ordering (top of stack at top)
 * - Card icons and effect descriptions
 * - Real-time updates as stack resolves
 * - Animation when items are added/removed
 */
export function StackPanel({ stack, onStackItemResolve }: StackPanelProps) {
  if (stack.length === 0) {
    return (
      <View style={styles.emptyStack}>
        <Text style={styles.emptyStackText}>The Stack is empty</Text>
        <Text style={styles.emptyStackSubtext}>
          Play cards to add effects to the stack
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚡ The Stack</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{stack.length}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.stackScroll}
        contentContainerStyle={styles.stackContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reverse to show LIFO order (top of stack at top) */}
        {[...stack].reverse().map((item, index) => (
          <StackItemCard
            key={item.id}
            item={item}
            index={stack.length - 1 - index} // Original index for positioning
            isTop={index === 0}
          />
        ))}
      </ScrollView>

      {/* Resolution Indicator */}
      {stack.length > 0 && (
        <View style={styles.resolutionIndicator}>
          <Text style={styles.resolutionText}>
            ↓ Resolving from top to bottom
          </Text>
        </View>
      )}
    </View>
  );
}

interface StackItemCardProps {
  item: StackItem;
  index: number;
  isTop: boolean;
}

function StackItemCard({ item, index, isTop }: StackItemCardProps) {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const effectDescription = getEffectDescription(item.effect);

  return (
    <Animated.View
      style={[
        styles.stackItemContainer,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <LinearGradient
        colors={isTop ? ['#4488ff', '#2244cc'] : ['#2a2a3e', '#1a1a2e']}
        style={[styles.stackItem, isTop && styles.stackItemTop]}
      >
        {/* Stack Position */}
        <View style={styles.stackPosition}>
          <Text style={styles.stackPositionText}>{index + 1}</Text>
        </View>

        {/* Card Icon/Name */}
        <View style={styles.stackItemContent}>
          <Text style={styles.stackItemCard}>
            🎴 {item.cardId || 'Effect'}
          </Text>
          
          {/* Effect Description */}
          <Text style={styles.stackItemEffect}>{effectDescription}</Text>
          
          {/* Targets */}
          {item.targetIds && item.targetIds.length > 0 && (
            <View style={styles.targetsContainer}>
              <Text style={styles.targetsLabel}>→ Targets:</Text>
              {item.targetIds.map(targetId => (
                <View key={targetId} style={styles.targetBadge}>
                  <Text style={styles.targetText}>
                    {targetId.substring(0, 8)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Top of Stack Indicator */}
        {isTop && (
          <View style={styles.topIndicator}>
            <Text style={styles.topIndicatorText}>TOP</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function getEffectDescription(effect: any): string {
  switch (effect.type) {
    case 'damage':
      return `Deal ${effect.amount} damage`;
    case 'heal':
      return `Heal ${effect.amount} HP`;
    case 'draw':
      return `Draw ${effect.amount} ${effect.deck} card(s)`;
    case 'buff':
      return `+${effect.amount} ${effect.stat.toUpperCase()}`;
    case 'debuff':
      return `-${effect.amount} ${effect.stat.toUpperCase()}`;
    case 'instantCancel':
      return 'Cancel top effect';
    case 'gainGold':
      return `Gain ${effect.amount} gold`;
    case 'gainXP':
      return `Gain ${effect.amount} XP`;
    default:
      return effect.type || 'Unknown effect';
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
    maxHeight: 240
  },
  emptyStack: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120
  },
  emptyStackText: {
    fontSize: 14,
    color: '#5e5e6e',
    fontStyle: 'italic',
    marginBottom: 4
  },
  emptyStackSubtext: {
    fontSize: 12,
    color: '#3e3e4e'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  countBadge: {
    backgroundColor: '#4488ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  stackScroll: {
    flex: 1
  },
  stackContent: {
    gap: 8
  },
  stackItemContainer: {
    marginBottom: 4
  },
  stackItem: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  stackItemTop: {
    borderColor: '#4488ff',
    borderWidth: 3
  },
  stackPosition: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stackPositionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  stackItemContent: {
    paddingLeft: 36
  },
  stackItemCard: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4
  },
  stackItemEffect: {
    fontSize: 12,
    color: '#ffd700',
    marginBottom: 6
  },
  targetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  targetsLabel: {
    fontSize: 11,
    color: '#8e8e93'
  },
  targetBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  targetText: {
    fontSize: 10,
    color: '#ffffff',
    fontFamily: 'monospace'
  },
  topIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4caf50',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  topIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  resolutionIndicator: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4488ff',
    alignItems: 'center'
  },
  resolutionText: {
    fontSize: 12,
    color: '#4488ff',
    fontWeight: '600'
  }
});

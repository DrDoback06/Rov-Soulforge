/**
 * Deck Visualization Component
 *
 * Displays player's three decks (Action, Skill, Loot) as face-down card piles
 * Shows deck counts and discard pile indicators
 * Handles click-to-draw interactions with animations
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import type { Card } from '@rov/types';
import { mediumImpact } from '@/utils/haptics';

interface DeckVisualizationProps {
  // Decks
  actionDeck: Card[];
  skillDeck: Card[];
  lootDeck: Card[];

  // Discard piles
  actionDiscard: Card[];
  skillDiscard: Card[];
  lootDiscard: Card[];

  // Interactions
  onDrawAction?: () => void;
  onDrawSkill?: () => void;
  onDrawLoot?: () => void;

  // View mode (player's deck vs opponent's deck)
  isOpponent?: boolean;
  disabled?: boolean;
}

export function DeckVisualization({
  actionDeck,
  skillDeck,
  lootDeck,
  actionDiscard,
  skillDiscard,
  lootDiscard,
  onDrawAction,
  onDrawSkill,
  onDrawLoot,
  isOpponent = false,
  disabled = false
}: DeckVisualizationProps) {
  return (
    <View style={[styles.container, isOpponent && styles.containerOpponent]}>
      <DeckPile
        deckType="action"
        deckCount={actionDeck.length}
        discardCount={actionDiscard.length}
        onDraw={onDrawAction}
        disabled={disabled || actionDeck.length === 0}
        isOpponent={isOpponent}
      />

      <DeckPile
        deckType="skill"
        deckCount={skillDeck.length}
        discardCount={skillDiscard.length}
        onDraw={onDrawSkill}
        disabled={disabled || skillDeck.length === 0}
        isOpponent={isOpponent}
      />

      <DeckPile
        deckType="loot"
        deckCount={lootDeck.length}
        discardCount={lootDiscard.length}
        onDraw={onDrawLoot}
        disabled={disabled || lootDeck.length === 0}
        isOpponent={isOpponent}
      />
    </View>
  );
}

interface DeckPileProps {
  deckType: 'action' | 'skill' | 'loot';
  deckCount: number;
  discardCount: number;
  onDraw?: () => void;
  disabled?: boolean;
  isOpponent?: boolean;
}

function DeckPile({
  deckType,
  deckCount,
  discardCount,
  onDraw,
  disabled = false,
  isOpponent = false
}: DeckPileProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const config = getDeckConfig(deckType);

  const handlePress = () => {
    if (disabled || !onDraw) return;

    // Haptic feedback
    mediumImpact();

    // Animation: scale down then up
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );

    // Glow effect
    glowOpacity.value = withSequence(
      withSpring(1),
      withSpring(0, { damping: 10 })
    );

    onDraw();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowOpacity: interpolate(glowOpacity.value, [0, 1], [0, 0.8])
  }));

  const isEmpty = deckCount === 0;

  return (
    <View style={styles.deckPileContainer}>
      {/* Label */}
      <Text style={[styles.deckLabel, isOpponent && styles.deckLabelOpponent]}>
        {config.icon} {config.name}
      </Text>

      <View style={styles.pileRow}>
        {/* Deck pile */}
        <Pressable
          onPress={handlePress}
          disabled={disabled || isEmpty}
          style={styles.pilePressable}
        >
          <Animated.View style={[animatedStyle]}>
            <Animated.View style={[styles.glowContainer, glowStyle]}>
              <LinearGradient
                colors={isEmpty ? ['#2a2a3e', '#1a1a2e'] : config.gradientColors}
                style={[
                  styles.cardPile,
                  isEmpty && styles.cardPileEmpty,
                  disabled && !isEmpty && styles.cardPileDisabled
                ]}
              >
                {/* Card back design */}
                {!isEmpty && (
                  <>
                    {/* Stacked effect - multiple cards */}
                    {deckCount > 1 && (
                      <>
                        <View style={[styles.stackedCard, styles.stackedCard1]} />
                        <View style={[styles.stackedCard, styles.stackedCard2]} />
                      </>
                    )}

                    {/* Top card */}
                    <View style={styles.topCard}>
                      <View style={styles.cardBackPattern}>
                        <Text style={styles.cardBackIcon}>{config.icon}</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Empty state */}
                {isEmpty && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>∅</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Deck count badge */}
            {!isEmpty && (
              <View style={[styles.countBadge, { backgroundColor: config.accentColor }]}>
                <Text style={styles.countText}>{deckCount}</Text>
              </View>
            )}
          </Animated.View>
        </Pressable>

        {/* Discard pile */}
        <View style={styles.discardPile}>
          <LinearGradient
            colors={discardCount > 0 ? ['#3a3a4e', '#2a2a3e'] : ['#1a1a2e', '#0a0a1e']}
            style={[
              styles.discardPileCard,
              discardCount === 0 && styles.discardPileEmpty
            ]}
          >
            {discardCount > 0 ? (
              <>
                <Text style={styles.discardIcon}>🗑️</Text>
                <Text style={styles.discardCount}>{discardCount}</Text>
              </>
            ) : (
              <Text style={styles.emptyIcon}>∅</Text>
            )}
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

function getDeckConfig(deckType: 'action' | 'skill' | 'loot') {
  const configs = {
    action: {
      name: 'Action',
      icon: '⚔️',
      gradientColors: ['#ff6b6b', '#c92a2a'],
      accentColor: '#ff6b6b'
    },
    skill: {
      name: 'Skill',
      icon: '✨',
      gradientColors: ['#4c6ef5', '#364fc7'],
      accentColor: '#4c6ef5'
    },
    loot: {
      name: 'Loot',
      icon: '🎁',
      gradientColors: ['#ffd43b', '#fab005'],
      accentColor: '#ffd43b'
    }
  };

  return configs[deckType];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 12
  },
  containerOpponent: {
    opacity: 0.8
  },
  deckPileContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8
  },
  deckLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center'
  },
  deckLabelOpponent: {
    color: '#8e8e93'
  },
  pileRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  pilePressable: {
    position: 'relative'
  },
  glowContainer: {
    shadowColor: '#fff',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }
  },
  cardPile: {
    width: 70,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible'
  },
  cardPileEmpty: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed'
  },
  cardPileDisabled: {
    opacity: 0.5
  },
  stackedCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  stackedCard1: {
    top: -4,
    left: -2,
    transform: [{ rotate: '-2deg' }]
  },
  stackedCard2: {
    top: -2,
    left: -1,
    transform: [{ rotate: '-1deg' }]
  },
  topCard: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardBackPattern: {
    width: '80%',
    height: '80%',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  cardBackIcon: {
    fontSize: 32
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 32,
    color: '#3a3a4e'
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  discardPile: {
    width: 50,
    height: 70
  },
  discardPileCard: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4
  },
  discardPileEmpty: {
    borderStyle: 'dashed'
  },
  discardIcon: {
    fontSize: 20
  },
  discardCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e8e93'
  }
});

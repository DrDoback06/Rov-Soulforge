/**
 * Draggable Card Component
 *
 * Enables drag-and-drop card playing with smooth animations
 * Supports target selection and visual feedback
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import type { Card } from '@rov/types';
import { useState } from 'react';

interface DraggableCardProps {
  card: Card;
  index: number;
  totalCards: number;
  enabled: boolean;
  onDragStart?: () => void;
  onDragEnd?: (dropped: boolean) => void;
  onPlay?: (cardId: string, index: number) => void;
}

export function DraggableCard({
  card,
  index,
  totalCards,
  enabled,
  onDragStart,
  onDragEnd,
  onPlay
}: DraggableCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Calculate fan position
  const fanSpread = Math.min(totalCards * 8, 120); // Max spread of 120px
  const fanRotation = (index - (totalCards - 1) / 2) * 5; // ±5 degrees per card
  const fanOffset = (index - (totalCards - 1) / 2) * (fanSpread / totalCards);

  // Drag gesture
  const dragGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      runOnJS(onDragStart)?.();
      scale.value = withSpring(1.2);
      rotation.value = withSpring(0); // Straighten card when dragging
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      // Check if dropped in valid play zone (above y = -150)
      const dropped = event.translationY < -150;

      if (dropped && enabled) {
        // Play the card
        runOnJS(onPlay)?.(card.id, index);
      }

      // Reset position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      rotation.value = withSpring(fanRotation);

      runOnJS(onDragEnd)?.(dropped);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + fanOffset },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
    zIndex: translateY.value < 0 ? 1000 : index
  }));

  // Set initial rotation for fan effect
  if (rotation.value === 0 && !isHovered) {
    rotation.value = fanRotation;
  }

  function handleHover(hovered: boolean) {
    setIsHovered(hovered);
    if (enabled) {
      if (hovered) {
        scale.value = withSpring(1.1);
        rotation.value = withSpring(0);
      } else {
        scale.value = withSpring(1);
        rotation.value = withSpring(fanRotation);
      }
    }
  }

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View
        style={[styles.cardContainer, animatedStyle]}
        onPointerEnter={() => handleHover(true)}
        onPointerLeave={() => handleHover(false)}
      >
        <Pressable
          disabled={!enabled}
          onPress={() => enabled && onPlay?.(card.id, index)}
        >
          <CardDisplay card={card} enabled={enabled} />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

function CardDisplay({ card, enabled }: { card: Card; enabled: boolean }) {
  const deckColors = getCardColors(card.deck);

  return (
    <View style={[styles.card, !enabled && styles.cardDisabled]}>
      <LinearGradient
        colors={deckColors}
        style={styles.cardGradient}
      >
        {/* Mana cost */}
        <View style={styles.manaCostBadge}>
          <Text style={styles.manaCostText}>⚡{card.manaCost || 0}</Text>
        </View>

        {/* Card art placeholder */}
        <View style={styles.cardArt}>
          {card.art?.iconUrl ? (
            <Text style={styles.cardIcon}>{card.art.iconUrl}</Text>
          ) : (
            <Text style={styles.cardIconPlaceholder}>🎴</Text>
          )}
        </View>

        {/* Card name */}
        <View style={styles.cardNameContainer}>
          <Text style={styles.cardName} numberOfLines={2}>
            {card.name}
          </Text>
        </View>

        {/* Deck type indicator */}
        <View style={styles.deckTypeBadge}>
          <Text style={styles.deckTypeText}>{getDeckTypeIcon(card.deck)}</Text>
        </View>

        {/* Rarity indicator */}
        <View style={[styles.rarityBorder, { borderColor: getRarityColor(card.rarity) }]} />
      </LinearGradient>
    </View>
  );
}

function getCardColors(deckType: string): [string, string] {
  const colors: Record<string, [string, string]> = {
    Action: ['#ff4444', '#cc0000'],
    Skill: ['#4488ff', '#2244cc'],
    Loot: ['#ffd700', '#cc8800'],
    Boss: ['#8b00ff', '#6600cc'],
    Summon: ['#00ff88', '#00cc66']
  };
  return colors[deckType] || ['#666666', '#444444'];
}

function getDeckTypeIcon(deckType: string): string {
  const icons: Record<string, string> = {
    Action: '⚔️',
    Skill: '✨',
    Loot: '💎',
    Boss: '👑',
    Summon: '🐉'
  };
  return icons[deckType] || '🎴';
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: '#9ca3af',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#f59e0b'
  };
  return colors[rarity] || '#9ca3af';
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 100,
    height: 140,
    position: 'absolute'
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  cardDisabled: {
    opacity: 0.5
  },
  cardGradient: {
    flex: 1,
    padding: 8,
    position: 'relative'
  },
  manaCostBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#FFD700'
  },
  manaCostText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  cardArt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  cardIcon: {
    fontSize: 40
  },
  cardIconPlaceholder: {
    fontSize: 40,
    opacity: 0.5
  },
  cardNameContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    borderRadius: 4,
    marginTop: 8
  },
  cardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center'
  },
  deckTypeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deckTypeText: {
    fontSize: 14
  },
  rarityBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 8,
    pointerEvents: 'none'
  }
});

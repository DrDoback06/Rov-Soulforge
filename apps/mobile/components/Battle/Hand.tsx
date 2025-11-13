/**
 * Hand Component
 *
 * Displays player's hand of cards in a fan layout
 * Features smooth fan animation
 * Interactive card hover/press effects
 * Drag-and-drop support for playing cards
 */

import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Card } from '@rov/types';
import { mediumImpact, lightImpact } from '@/utils/haptics';
import { useState } from 'react';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;
const FAN_SPREAD = 0.8; // How spread out the cards are
const HOVER_LIFT = -40; // How much a card lifts when pressed

interface HandProps {
  cards: Card[];
  onCardPlay?: (card: Card, index: number) => void;
  onCardView?: (card: Card) => void;
  disabled?: boolean;
  maxHandSize?: number;
}

export function Hand({
  cards,
  onCardPlay,
  onCardView,
  disabled = false,
  maxHandSize = 10
}: HandProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleCardPress = (card: Card, index: number) => {
    if (disabled) return;

    mediumImpact();
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  const handleCardPlay = (card: Card, index: number) => {
    if (disabled || !onCardPlay) return;

    mediumImpact();
    onCardPlay(card, index);
    setSelectedIndex(null);
  };

  const handleCardView = (card: Card) => {
    if (onCardView) {
      lightImpact();
      onCardView(card);
    }
  };

  const cardCount = cards.length;
  const isOverLimit = cardCount > maxHandSize;

  return (
    <View style={styles.container}>
      {/* Hand size indicator */}
      <View style={styles.handInfo}>
        <Text style={[styles.handCount, isOverLimit && styles.handCountOverLimit]}>
          {cardCount} / {maxHandSize}
        </Text>
        <Text style={styles.handLabel}>Hand</Text>
      </View>

      {/* Cards in fan layout */}
      <View style={styles.fanContainer}>
        {cards.length === 0 ? (
          <View style={styles.emptyHand}>
            <Text style={styles.emptyHandText}>No cards in hand</Text>
          </View>
        ) : (
          cards.map((card, index) => (
            <FanCard
              key={`${card.id}_${index}`}
              card={card}
              index={index}
              totalCards={cardCount}
              isSelected={selectedIndex === index}
              onPress={() => handleCardPress(card, index)}
              onPlay={() => handleCardPlay(card, index)}
              onView={() => handleCardView(card)}
              disabled={disabled}
            />
          ))
        )}
      </View>

      {/* Play button for selected card */}
      {selectedIndex !== null && onCardPlay && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.playButtonContainer}
        >
          <Pressable
            style={styles.playButton}
            onPress={() => handleCardPlay(cards[selectedIndex], selectedIndex)}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.playButtonGradient}
            >
              <Text style={styles.playButtonText}>▶ Play Card</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

interface FanCardProps {
  card: Card;
  index: number;
  totalCards: number;
  isSelected: boolean;
  onPress: () => void;
  onPlay: () => void;
  onView: () => void;
  disabled: boolean;
}

function FanCard({
  card,
  index,
  totalCards,
  isSelected,
  onPress,
  onView,
  disabled
}: FanCardProps) {
  const pressed = useSharedValue(false);
  const scale = useSharedValue(1);

  // Calculate fan positioning
  const centerIndex = (totalCards - 1) / 2;
  const offset = index - centerIndex;
  const rotation = offset * 5 * FAN_SPREAD; // Degrees of rotation
  const horizontalOffset = offset * (CARD_WIDTH * 0.4) * FAN_SPREAD;
  const verticalOffset = Math.abs(offset) * 5; // Cards at edges slightly lower

  const gesture = Gesture.LongPress()
    .onStart(() => {
      pressed.value = true;
      scale.value = withSpring(1.05);
      onView();
    })
    .onEnd(() => {
      pressed.value = false;
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const lift = isSelected ? HOVER_LIFT : pressed.value ? HOVER_LIFT * 0.5 : 0;

    return {
      transform: [
        { translateX: horizontalOffset },
        { translateY: verticalOffset + lift },
        { rotate: `${isSelected ? 0 : rotation}deg` },
        { scale: scale.value }
      ],
      zIndex: isSelected ? 100 : totalCards - Math.abs(offset)
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={styles.cardPressable}
        >
          <LinearGradient
            colors={getCardGradient(card.rarity)}
            style={[
              styles.card,
              isSelected && styles.cardSelected
            ]}
          >
            {/* Card border glow when selected */}
            {isSelected && <View style={styles.cardGlow} />}

            {/* Card content */}
            <View style={styles.cardContent}>
              {/* Mana cost */}
              <View style={styles.manaCost}>
                <Text style={styles.manaCostText}>{card.manaCost || 0}</Text>
              </View>

              {/* Card art placeholder */}
              <View style={styles.cardArt}>
                <Text style={styles.cardArtIcon}>{getCardIcon(card.type)}</Text>
              </View>

              {/* Card name */}
              <View style={styles.cardNameContainer}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {card.name}
                </Text>
              </View>

              {/* Rarity indicator */}
              <View style={styles.rarityBadge}>
                <Text style={styles.rarityText}>{getRaritySymbol(card.rarity)}</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

import { FadeIn, FadeOut } from 'react-native-reanimated';

function getCardGradient(rarity: string): string[] {
  const gradients: Record<string, string[]> = {
    common: ['#4a5568', '#2d3748'],
    uncommon: ['#2f855a', '#22543d'],
    rare: ['#2b6cb0', '#2c5282'],
    epic: ['#805ad5', '#6b46c1'],
    legendary: ['#d69e2e', '#b7791f'],
    mythic: ['#e53e3e', '#c53030']
  };
  return gradients[rarity] || gradients.common;
}

function getCardIcon(type: string): string {
  const icons: Record<string, string> = {
    action: '⚔️',
    skill: '✨',
    loot: '🎁',
    creature: '🐉',
    spell: '🔮',
    artifact: '⚡'
  };
  return icons[type] || '🎴';
}

function getRaritySymbol(rarity: string): string {
  const symbols: Record<string, string> = {
    common: '○',
    uncommon: '◇',
    rare: '◆',
    epic: '★',
    legendary: '✦',
    mythic: '✧'
  };
  return symbols[rarity] || '○';
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16
  },
  handInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  handCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  handCountOverLimit: {
    color: '#ff4444'
  },
  handLabel: {
    fontSize: 14,
    color: '#8e8e93'
  },
  fanContainer: {
    height: CARD_HEIGHT + 60,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyHand: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyHandText: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic'
  },
  cardWrapper: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT
  },
  cardPressable: {
    width: '100%',
    height: '100%'
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6
  },
  cardSelected: {
    borderColor: '#ffd700',
    borderWidth: 3,
    shadowColor: '#ffd700',
    shadowOpacity: 0.8,
    shadowRadius: 10
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8
  },
  cardContent: {
    flex: 1,
    padding: 8
  },
  manaCost: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4c6ef5',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 10
  },
  manaCostText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  cardArt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    marginTop: 20,
    marginBottom: 8
  },
  cardArtIcon: {
    fontSize: 40
  },
  cardNameContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 6,
    minHeight: 36
  },
  cardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 13
  },
  rarityBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rarityText: {
    fontSize: 12,
    color: '#ffffff'
  },
  playButtonContainer: {
    marginTop: 16
  },
  playButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  playButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center'
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

/**
 * Pack Opening Modal
 *
 * Animated card pack opening experience
 * Sequential card reveals with rarity-based effects
 */

import { Modal, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import type { PackOpeningResult } from '@/types/shop';
import { heavyImpact, successNotification } from '@/utils/haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PackOpeningModalProps {
  visible: boolean;
  result: PackOpeningResult | null;
  onClose: () => void;
  onCardPress?: (cardId: string) => void;
}

export function PackOpeningModal({
  visible,
  result,
  onClose,
  onCardPress
}: PackOpeningModalProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  const packScale = useSharedValue(0);
  const packRotation = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardRotateY = useSharedValue(180);

  useEffect(() => {
    if (visible && result) {
      setCurrentCardIndex(0);
      setIsRevealing(false);

      // Pack entrance animation
      packScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );

      packRotation.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      heavyImpact();
    } else {
      packScale.value = 0;
      cardOpacity.value = 0;
      cardScale.value = 0;
    }
  }, [visible, result]);

  const handleOpenPack = () => {
    if (!result || isRevealing) return;

    setIsRevealing(true);
    heavyImpact();

    // Pack explosion animation
    packScale.value = withSpring(1.5, { damping: 6 });
    packRotation.value = withTiming(360, {
      duration: 500,
      easing: Easing.out(Easing.cubic)
    });

    // Show first card after pack animation
    setTimeout(() => {
      revealCard(0);
    }, 600);
  };

  const revealCard = (index: number) => {
    if (!result || index >= result.cards.length) {
      // All cards revealed
      successNotification();
      return;
    }

    setCurrentCardIndex(index);

    // Card flip animation
    cardOpacity.value = 0;
    cardScale.value = 0;
    cardRotateY.value = 180;

    cardOpacity.value = withTiming(1, { duration: 200 });
    cardScale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );
    cardRotateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic)
    });

    const card = result.cards[index];
    if (card.rarity === 'legendary' || card.rarity === 'mythic') {
      heavyImpact();
    }
  };

  const handleNextCard = () => {
    if (!result) return;

    if (currentCardIndex < result.cards.length - 1) {
      revealCard(currentCardIndex + 1);
    } else {
      // All cards seen, close modal
      onClose();
    }
  };

  const animatedPackStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: packScale.value },
      { rotate: `${packRotation.value}deg` }
    ],
    opacity: isRevealing ? 0 : 1
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { rotateY: `${cardRotateY.value}deg` }
    ]
  }));

  if (!result) return null;

  const currentCard = result.cards[currentCardIndex];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={80} style={styles.backdrop}>
        <View style={styles.container}>
          {/* Pack (before opening) */}
          {!isRevealing && (
            <Animated.View style={[styles.packContainer, animatedPackStyle]}>
              <Pressable onPress={handleOpenPack}>
                <View style={styles.pack}>
                  <Text style={styles.packIcon}>📦</Text>
                  <Text style={styles.packName}>{result.packName}</Text>
                  <Text style={styles.tapToOpen}>Tap to Open!</Text>
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Card reveal */}
          {isRevealing && currentCard && (
            <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
              <Pressable
                onPress={handleNextCard}
                style={styles.cardPressable}
              >
                <LinearGradient
                  colors={getRarityGradient(currentCard.rarity)}
                  style={styles.card}
                >
                  {/* Rarity indicator */}
                  <View style={styles.rarityBadge}>
                    <Text style={styles.rarityText}>
                      {currentCard.rarity.toUpperCase()}
                    </Text>
                  </View>

                  {/* Pity indicator */}
                  {currentCard.isPityCard && (
                    <View style={styles.pityBadge}>
                      <Text style={styles.pityText}>🎯 PITY!</Text>
                    </View>
                  )}

                  {/* New indicator */}
                  {currentCard.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newText}>✨ NEW</Text>
                    </View>
                  )}

                  {/* Card icon */}
                  <View style={styles.cardIconContainer}>
                    <Text style={styles.cardIcon}>{currentCard.icon || '🎴'}</Text>
                  </View>

                  {/* Card name */}
                  <View style={styles.cardNameContainer}>
                    <Text style={styles.cardName}>{currentCard.name}</Text>
                  </View>

                  {/* Card count */}
                  <Text style={styles.cardCount}>
                    {currentCardIndex + 1} / {result.cards.length}
                  </Text>

                  {/* Tap to continue */}
                  <Text style={styles.tapToContinue}>
                    {currentCardIndex < result.cards.length - 1
                      ? 'Tap for next card'
                      : 'Tap to finish'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Pity notification */}
          {result.pityTriggered && currentCardIndex === 0 && (
            <View style={styles.pityNotification}>
              <Text style={styles.pityNotificationText}>
                🎯 Pity activated! {result.pityTriggered.rarity.toUpperCase()} guaranteed
                after {result.pityTriggered.pullCount} pulls!
              </Text>
            </View>
          )}

          {/* Skip button */}
          {isRevealing && (
            <Pressable style={styles.skipButton} onPress={onClose}>
              <Text style={styles.skipButtonText}>Skip ⏭️</Text>
            </Pressable>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

function getRarityGradient(rarity: string): string[] {
  const gradients: Record<string, string[]> = {
    common: ['#6b7280', '#4b5563'],
    uncommon: ['#22c55e', '#16a34a'],
    rare: ['#3b82f6', '#2563eb'],
    epic: ['#a855f7', '#9333ea'],
    legendary: ['#fbbf24', '#f59e0b'],
    mythic: ['#e11d48', '#be123c']
  };
  return gradients[rarity] || gradients.common;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  packContainer: {
    alignItems: 'center'
  },
  pack: {
    width: SCREEN_WIDTH * 0.7,
    padding: 40,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#ffd700',
    alignItems: 'center',
    gap: 16
  },
  packIcon: {
    fontSize: 120
  },
  packName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  tapToOpen: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: '600',
    textAlign: 'center'
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400
  },
  cardPressable: {
    width: '100%',
    aspectRatio: 0.7
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  rarityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1
  },
  pityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  pityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1
  },
  newBadge: {
    position: 'absolute',
    top: 50,
    left: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  newText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1
  },
  cardIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardIcon: {
    fontSize: 100
  },
  cardNameContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 16,
    width: '100%'
  },
  cardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  cardCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600'
  },
  tapToContinue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center'
  },
  pityNotification: {
    position: 'absolute',
    top: 60,
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    maxWidth: '90%'
  },
  pityNotificationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  skipButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { CardDef, Rarity } from '@rov/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Pack Opening Screen
 *
 * Features:
 * - Animated pack opening sequence
 * - Rarity reveal with color-coded effects
 * - Card flip animations
 * - Pity system indicator
 * - Multiple card display
 */

interface PackOpeningProps {
  packId: string;
  visible: boolean;
  onClose: () => void;
}

export default function PackOpeningScreen() {
  const [visible, setVisible] = useState(false);
  const [packId, setPackId] = useState('basic-pack');

  const handleOpen = (id: string) => {
    setPackId(id);
    setVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <Text style={styles.title}>Shop</Text>

      {/* Pack options */}
      <View style={styles.packsList}>
        <PackOption
          id="basic-pack"
          name="Basic Pack"
          price={100}
          cardCount={5}
          onPress={() => handleOpen('basic-pack')}
        />
        <PackOption
          id="premium-pack"
          name="Premium Pack"
          price={250}
          cardCount={5}
          onPress={() => handleOpen('premium-pack')}
        />
        <PackOption
          id="legendary-pack"
          name="Legendary Pack"
          price={1000}
          cardCount={3}
          onPress={() => handleOpen('legendary-pack')}
        />
      </View>

      <PackOpeningModal
        packId={packId}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </View>
  );
}

/**
 * Pack option card
 */
function PackOption({
  id,
  name,
  price,
  cardCount,
  onPress
}: {
  id: string;
  name: string;
  price: number;
  cardCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.packOption} onPress={onPress}>
      <View style={styles.packIcon}>
        <Text style={styles.packIconText}>📦</Text>
      </View>
      <View style={styles.packInfo}>
        <Text style={styles.packName}>{name}</Text>
        <Text style={styles.packDetails}>{cardCount} cards</Text>
        <Text style={styles.packPrice}>💰 {price} Gold</Text>
      </View>
    </Pressable>
  );
}

/**
 * Pack Opening Modal
 */
function PackOpeningModal({ packId, visible, onClose }: PackOpeningProps) {
  const [stage, setStage] = useState<'idle' | 'opening' | 'revealing' | 'complete'>('idle');
  const [cards, setCards] = useState<Array<{ cardId: string; rarity: Rarity }>>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [pityTriggered, setPityTriggered] = useState(false);

  // Animation values
  const packScale = useSharedValue(1);
  const packRotation = useSharedValue(0);
  const packOpacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setStage('idle');
      setCurrentCardIndex(0);
    }
  }, [visible]);

  const handleOpenPack = async () => {
    if (stage !== 'idle') return;

    setStage('opening');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Animate pack opening
    packScale.value = withSequence(
      withSpring(1.2),
      withSpring(1.5),
      withTiming(0, { duration: 300 })
    );

    packRotation.value = withTiming(360, {
      duration: 800,
      easing: Easing.out(Easing.cubic)
    });

    packOpacity.value = withDelay(
      600,
      withTiming(0, { duration: 200 }, () => {
        runOnJS(revealCards)();
      })
    );
  };

  const revealCards = async () => {
    // Call Firebase function to open pack
    // For now, use mock data
    const mockCards = [
      { cardId: 'card_1', rarity: 'Common' as Rarity },
      { cardId: 'card_2', rarity: 'Common' as Rarity },
      { cardId: 'card_3', rarity: 'Uncommon' as Rarity },
      { cardId: 'card_4', rarity: 'Rare' as Rarity },
      { cardId: 'card_5', rarity: 'Epic' as Rarity }
    ];

    setCards(mockCards);
    setPityTriggered(false);
    setStage('revealing');

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setStage('complete');
    }
  };

  const handleClose = () => {
    packScale.value = 1;
    packRotation.value = 0;
    packOpacity.value = 1;
    onClose();
  };

  const packStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: packScale.value },
      { rotate: `${packRotation.value}deg` }
    ],
    opacity: packOpacity.value
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {stage === 'idle' && (
          <View style={styles.modalContent}>
            <Animated.View style={[styles.packContainer, packStyle]}>
              <View style={styles.pack}>
                <Text style={styles.packEmoji}>📦</Text>
                <Text style={styles.packLabel}>{packId}</Text>
              </View>
            </Animated.View>

            <Pressable style={styles.openButton} onPress={handleOpenPack}>
              <Text style={styles.openButtonText}>Open Pack</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {stage === 'opening' && (
          <View style={styles.modalContent}>
            <Animated.View style={[styles.packContainer, packStyle]}>
              <View style={styles.pack}>
                <Text style={styles.packEmoji}>📦</Text>
              </View>
            </Animated.View>
          </View>
        )}

        {stage === 'revealing' && cards.length > 0 && (
          <CardReveal
            card={cards[currentCardIndex]}
            cardNumber={currentCardIndex + 1}
            totalCards={cards.length}
            onNext={handleNextCard}
          />
        )}

        {stage === 'complete' && (
          <View style={styles.modalContent}>
            <Text style={styles.completeTitle}>Pack Opened!</Text>
            <Text style={styles.completeSubtitle}>
              {cards.length} cards added to your collection
            </Text>

            {pityTriggered && (
              <View style={styles.pityBadge}>
                <Text style={styles.pityText}>🎁 Pity System Activated!</Text>
              </View>
            )}

            <View style={styles.cardsGrid}>
              {cards.map((card, index) => (
                <View
                  key={index}
                  style={[
                    styles.miniCard,
                    { borderColor: getRarityColor(card.rarity) }
                  ]}
                >
                  <Text style={styles.miniCardRarity}>{card.rarity}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

/**
 * Card Reveal Animation
 */
function CardReveal({
  card,
  cardNumber,
  totalCards,
  onNext
}: {
  card: { cardId: string; rarity: Rarity };
  cardNumber: number;
  totalCards: number;
  onNext: () => void;
}) {
  const flipProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Flip animation
    flipProgress.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic)
    });

    // Glow animation
    glowOpacity.value = withSequence(
      withDelay(300, withTiming(1, { duration: 300 })),
      withTiming(0.6, { duration: 400 })
    );

    // Haptic for rarity
    setTimeout(() => {
      if (card.rarity === 'Legendary') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (card.rarity === 'Epic') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 300);
  }, [card]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${flipProgress.value * 180}deg` }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value
  }));

  const rarityColor = getRarityColor(card.rarity);

  return (
    <View style={styles.revealContainer}>
      <Text style={styles.cardCounter}>
        {cardNumber} / {totalCards}
      </Text>

      <View style={styles.cardRevealArea}>
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.cardGlow,
            glowStyle,
            { backgroundColor: rarityColor }
          ]}
        />

        {/* Card */}
        <Animated.View style={[styles.revealCard, cardStyle]}>
          <LinearGradient
            colors={[rarityColor, '#1a1a2e']}
            style={styles.cardGradient}
          >
            <Text style={styles.cardRarity}>{card.rarity}</Text>
            <Text style={styles.cardId}>{card.cardId}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      <Pressable style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextButtonText}>
          {cardNumber < totalCards ? 'Next Card' : 'View All'}
        </Text>
      </Pressable>
    </View>
  );
}

function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    Common: '#ffffff',
    Uncommon: '#00ff00',
    Rare: '#0088ff',
    Epic: '#ff00ff',
    Legendary: '#ffd700'
  };
  return colors[rarity];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24
  },
  packsList: {
    gap: 16
  },
  packOption: {
    flexDirection: 'row',
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  packIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  packIconText: {
    fontSize: 32
  },
  packInfo: {
    flex: 1
  },
  packName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  packDetails: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4
  },
  packPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    alignItems: 'center'
  },
  packContainer: {
    marginBottom: 40
  },
  pack: {
    width: 200,
    height: 280,
    backgroundColor: '#2a2a3e',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4488ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  packEmoji: {
    fontSize: 80
  },
  packLabel: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 16
  },
  openButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  openButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  cancelButton: {
    paddingVertical: 12
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8e8e93'
  },
  revealContainer: {
    width: '100%',
    alignItems: 'center'
  },
  cardCounter: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 24
  },
  cardRevealArea: {
    width: 240,
    height: 340,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40
  },
  cardGlow: {
    position: 'absolute',
    width: 280,
    height: 380,
    borderRadius: 24,
    opacity: 0.3
  },
  revealCard: {
    width: 240,
    height: 340,
    borderRadius: 20,
    overflow: 'hidden'
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  cardRarity: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textTransform: 'uppercase'
  },
  cardId: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center'
  },
  nextButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 24
  },
  pityBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24
  },
  pityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e'
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32
  },
  miniCard: {
    width: 80,
    height: 112,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  miniCardRarity: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff'
  },
  doneButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});
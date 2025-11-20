import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef } from 'react';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 80;
const CARD_HEIGHT = 110;

interface Card {
  id: string;
  name: string;
  cost: number;
  type: string;
  description?: string;
}

interface BattleHandProps {
  cards: Card[];
  onCardPlay: (cardId: string, targets?: string[]) => void;
  isMyTurn: boolean;
  disabled?: boolean;
}

/**
 * Battle Hand Component
 * 
 * Features:
 * - Fan animation of cards
 * - Drag-and-drop card playing
 * - Visual feedback for valid/invalid targets
 * - Mana cost display
 */
export function BattleHand({ cards, onCardPlay, isMyTurn, disabled }: BattleHandProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  if (cards.length === 0) {
    return (
      <View style={styles.emptyHand}>
        <Text style={styles.emptyHandText}>No cards in hand</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hand}>
        {cards.map((card, index) => (
          <DraggableCard
            key={card.id}
            card={card}
            index={index}
            totalCards={cards.length}
            isMyTurn={isMyTurn}
            disabled={disabled}
            isSelected={selectedCard === card.id}
            onSelect={() => setSelectedCard(card.id)}
            onPlay={() => {
              onCardPlay(card.id);
              setSelectedCard(null);
            }}
            onDragStart={() => setDraggedCard(card.id)}
            onDragEnd={() => setDraggedCard(null)}
          />
        ))}
      </View>
    </View>
  );
}

interface DraggableCardProps {
  card: Card;
  index: number;
  totalCards: number;
  isMyTurn: boolean;
  disabled?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function DraggableCard({
  card,
  index,
  totalCards,
  isMyTurn,
  disabled,
  isSelected,
  onSelect,
  onPlay,
  onDragStart,
  onDragEnd
}: DraggableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Calculate fan positioning
  const getFanPosition = () => {
    const centerIndex = (totalCards - 1) / 2;
    const offset = index - centerIndex;
    const horizontalSpacing = Math.min(CARD_WIDTH * 0.7, SCREEN_WIDTH / (totalCards + 1));
    
    return {
      x: offset * horizontalSpacing,
      rotation: offset * 5, // Slight rotation for fan effect
      y: Math.abs(offset) * 5 // Slight arc
    };
  };

  const fanPosition = getFanPosition();

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY
        }
      }
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY } = event.nativeEvent;
      
      // If dragged up significantly, play the card
      if (translationY < -80 && isMyTurn && !disabled) {
        onPlay();
      }
      
      // Reset position
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true
        })
      ]).start();
      
      onDragEnd();
    } else if (event.nativeEvent.state === State.BEGAN) {
      onDragStart();
      Animated.spring(scale, {
        toValue: 1.1,
        useNativeDriver: true
      }).start();
    }
  };

  const handlePress = () => {
    if (!isMyTurn || disabled) return;
    
    if (isSelected) {
      onPlay();
    } else {
      onSelect();
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      enabled={isMyTurn && !disabled}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: Animated.add(translateX as any, fanPosition.x) },
              { translateY: Animated.add(translateY as any, fanPosition.y) },
              { rotate: `${fanPosition.rotation}deg` },
              { scale }
            ],
            zIndex: isSelected ? 100 : index
          }
        ]}
      >
        <Pressable onPress={handlePress} disabled={!isMyTurn || disabled}>
          <LinearGradient
            colors={getCardGradient(card.type)}
            style={[
              styles.card,
              isSelected && styles.cardSelected,
              (!isMyTurn || disabled) && styles.cardDisabled
            ]}
          >
            {/* Mana Cost */}
            <View style={styles.manaCost}>
              <Text style={styles.manaText}>⚡{card.cost}</Text>
            </View>

            {/* Card Name */}
            <View style={styles.cardContent}>
              <Text style={styles.cardName} numberOfLines={2}>
                {card.name}
              </Text>
            </View>

            {/* Card Type Badge */}
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{card.type}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
  );
}

function getCardGradient(type: string): [string, string] {
  const gradients: Record<string, [string, string]> = {
    Action: ['#ff4444', '#cc0000'],
    Skill: ['#4488ff', '#2244cc'],
    Loot: ['#ffd700', '#cc8800'],
    Quest: ['#44ff44', '#22cc22'],
    Summon: ['#ff44ff', '#cc22cc']
  };
  return gradients[type] || ['#666666', '#444444'];
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT + 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyHand: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyHandText: {
    color: '#5e5e6e',
    fontSize: 14
  },
  hand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: CARD_HEIGHT + 40
  },
  cardContainer: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  cardSelected: {
    borderColor: '#ffff00',
    borderWidth: 3
  },
  cardDisabled: {
    opacity: 0.5
  },
  manaCost: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  manaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12
  },
  cardName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center'
  },
  typeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'center'
  },
  typeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600'
  }
});

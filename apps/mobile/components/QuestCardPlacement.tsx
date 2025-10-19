import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDragDropContext } from '@/contexts/DragDropContext';
import { useFirebase } from '@/lib/firebase-context';
import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import type { QuestCard, GameCard } from '@rov/types';

interface QuestCardPlacementProps {
  visible: boolean;
  onClose: () => void;
  mapLocation: { latitude: number; longitude: number };
  onQuestCreated?: (questId: string) => void;
}

const { width, height } = Dimensions.get('window');

export function QuestCardPlacement({ 
  visible, 
  onClose, 
  mapLocation, 
  onQuestCreated 
}: QuestCardPlacementProps) {
  const { db, user } = useFirebase();
  const { dragState, endDrag } = useDragDropContext();
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedCard, setPlacedCard] = useState<QuestCard | null>(null);

  const handlePlaceQuestCard = async (card: QuestCard) => {
    if (!user || !db) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    setIsPlacing(true);
    try {
      // Create quest from quest card
      const questData = {
        id: `quest_${Date.now()}`,
        title: card.questData.title,
        description: card.questData.description,
        type: 'Quest' as const,
        rarity: card.rarity,
        placeType: 'Any' as const,
        dynamic: true,
        timerSec: card.questData.duration * 3600, // Convert hours to seconds
        requirements: card.questData.objectives.map(obj => ({
          kind: obj.type === 'fitness' ? 'steps' as const : 'distanceKm' as const,
          value: obj.target
        })),
        rewards: [
          { kind: 'xp' as const, value: card.questData.rewards.xp },
          { kind: 'gold' as const, value: card.questData.rewards.gold },
          ...(card.questData.rewards.cards || []).map(cardReward => ({
            kind: 'card' as const,
            cardId: cardReward.cardId
          }))
        ],
        spawnRules: {
          ttlMinutes: card.questData.duration * 60,
          budget: 1
        }
      };

      // Add quest to Firestore
      const questRef = await addDoc(collection(db, 'dynamicQuests'), {
        ...questData,
        location: mapLocation,
        createdBy: user.uid,
        createdAt: Date.now(),
        status: 'active'
      });

      // Remove quest card from inventory
      const inventoryRef = doc(db, 'inventories', user.uid);
      await updateDoc(inventoryRef, {
        cards: arrayRemove(card)
      });

      // Add quest to user's active quests
      const userQuestsRef = doc(db, 'userQuests', user.uid);
      await updateDoc(userQuestsRef, {
        activeQuests: arrayUnion(questRef.id)
      });

      setPlacedCard(card);
      Alert.alert(
        'Quest Created!', 
        `"${card.questData.title}" has been placed on the map.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onQuestCreated?.(questRef.id);
              onClose();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error placing quest card:', error);
      Alert.alert('Error', 'Failed to place quest card. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  const handleDrop = (itemId: string, itemData: GameCard) => {
    if (itemData.type === 'Quest') {
      handlePlaceQuestCard(itemData as QuestCard);
    } else {
      Alert.alert('Invalid Card', 'Only Quest cards can be placed on the map.');
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.overlayGradient}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Place Quest Card</Text>
          <Text style={styles.subtitle}>
            Drag a Quest card from your inventory to this area to create a quest at this location.
          </Text>

          <View style={styles.dropZone}>
            <LinearGradient
              colors={['#2a2a3e', '#1a1a2e']}
              style={styles.dropZoneGradient}
            >
              <Text style={styles.dropZoneText}>
                {isPlacing ? 'Creating Quest...' : 'Drop Quest Card Here'}
              </Text>
              <Text style={styles.dropZoneSubtext}>
                Quest will be created at: {mapLocation.latitude.toFixed(4)}, {mapLocation.longitude.toFixed(4)}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>How to use:</Text>
            <Text style={styles.instructionText}>
              1. Open your inventory
            </Text>
            <Text style={styles.instructionText}>
              2. Find a Quest card
            </Text>
            <Text style={styles.instructionText}>
              3. Drag it to this area
            </Text>
            <Text style={styles.instructionText}>
              4. The quest will be created at this map location
            </Text>
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000
  },
  overlayGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#4488ff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  dropZone: {
    marginBottom: 24
  },
  dropZoneGradient: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4488ff',
    borderStyle: 'dashed',
    alignItems: 'center'
  },
  dropZoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  dropZoneSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center'
  },
  instructions: {
    marginBottom: 24
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  instructionText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4,
    paddingLeft: 8
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  cancelButton: {
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#5e5e6e'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8e93'
  }
});






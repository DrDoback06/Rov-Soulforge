/**
 * Deck Builder Screen
 *
 * Build and manage decks with card collection
 */

import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useFirebase } from '@/lib/firebase-context';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Card } from '@rov/types';
import { CardGrid } from '@/components/CardGrid';
import { CardDetailModal } from '@/components/CardDetailModal';

export default function DecksScreen() {
  const { db, user } = useFirebase();
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [ownedCardIds, setOwnedCardIds] = useState<Set<string>>(new Set());
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'collection' | 'deck'>('collection');

  // Load cards
  useEffect(() => {
    if (!db) return;

    loadCards();
    loadOwnedCards();
  }, [db, user]);

  async function loadCards() {
    if (!db) return;

    try {
      const cardsRef = collection(db, 'cards');
      const snapshot = await getDocs(cardsRef);

      const cards: Card[] = [];
      snapshot.forEach(doc => {
        cards.push(doc.data() as Card);
      });

      setAllCards(cards);
      console.log(`✅ Loaded ${cards.length} cards`);
    } catch (error) {
      console.error('Error loading cards:', error);
      Alert.alert('Error', 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }

  async function loadOwnedCards() {
    if (!db || !user) return;

    try {
      const collectionRef = collection(db, 'users', user.uid, 'cardCollection');
      const snapshot = await getDocs(collectionRef);

      const owned = new Set<string>();
      snapshot.forEach(doc => {
        owned.add(doc.id);
      });

      setOwnedCardIds(owned);
      console.log(`✅ Loaded ${owned.size} owned cards`);
    } catch (error) {
      console.error('Error loading owned cards:', error);
    }
  }

  function handleCardPress(card: Card) {
    setSelectedCard(card);
    setShowDetail(true);
  }

  function handleAddToDeck(card: Card) {
    if (currentDeck.length >= 60) {
      Alert.alert('Deck Full', 'Maximum 60 cards per deck');
      return;
    }

    // Check if owned
    if (!ownedCardIds.has(card.id)) {
      Alert.alert('Card Not Owned', 'You must own this card to add it to your deck');
      return;
    }

    // Count how many of this card are already in deck
    const countInDeck = currentDeck.filter(c => c.id === card.id).length;

    // Check max copies (usually 3 for common, 1 for legendary)
    const maxCopies = card.rarity === 'Legendary' ? 1 : 3;

    if (countInDeck >= maxCopies) {
      Alert.alert(
        'Max Copies',
        `Maximum ${maxCopies} ${card.rarity === 'Legendary' ? 'copy' : 'copies'} of this card allowed`
      );
      return;
    }

    setCurrentDeck([...currentDeck, card]);
    setShowDetail(false);
    Alert.alert('Added', `${card.name} added to deck`);
  }

  function handleRemoveFromDeck(card: Card) {
    const index = currentDeck.findIndex(c => c.id === card.id);
    if (index >= 0) {
      const newDeck = [...currentDeck];
      newDeck.splice(index, 1);
      setCurrentDeck(newDeck);
    }
  }

  async function handleSaveDeck() {
    if (!db || !user) return;

    if (currentDeck.length < 30) {
      Alert.alert('Deck Too Small', 'Minimum 30 cards required');
      return;
    }

    try {
      const deckId = `deck_${Date.now()}`;
      const deckRef = doc(db, 'users', user.uid, 'decks', deckId);

      // Organize by deck type
      const actionCards = currentDeck.filter(c => c.deck === 'Action').map(c => c.id);
      const skillCards = currentDeck.filter(c => c.deck === 'Skill').map(c => c.id);
      const lootCards = currentDeck.filter(c => c.deck === 'Loot').map(c => c.id);

      await setDoc(deckRef, {
        id: deckId,
        name: 'My Deck',
        actionCards,
        skillCards,
        lootCards,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      Alert.alert('Saved', 'Deck saved successfully');
    } catch (error) {
      console.error('Error saving deck:', error);
      Alert.alert('Error', 'Failed to save deck');
    }
  }

  function handleClearDeck() {
    Alert.alert(
      'Clear Deck',
      'Remove all cards from current deck?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setCurrentDeck([])
        }
      ]
    );
  }

  // Filter cards based on view
  const displayCards = view === 'collection'
    ? allCards.filter(c => ownedCardIds.has(c.id))
    : allCards;

  const deckSize = currentDeck.length;
  const deckColor = deckSize < 30 ? '#ef4444' : deckSize > 60 ? '#f59e0b' : '#22c55e';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.loadingText}>Loading cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ Deck Builder</Text>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.viewButton, view === 'collection' && styles.viewButtonActive]}
            onPress={() => setView('collection')}
          >
            <Text style={[styles.viewButtonText, view === 'collection' && styles.viewButtonTextActive]}>
              Collection ({ownedCardIds.size})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.viewButton, view === 'deck' && styles.viewButtonActive]}
            onPress={() => setView('deck')}
          >
            <Text style={[styles.viewButtonText, view === 'deck' && styles.viewButtonTextActive]}>
              All Cards ({allCards.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Deck Summary */}
      <View style={styles.deckSummary}>
        <LinearGradient
          colors={[deckColor + '40', deckColor + '20']}
          style={styles.deckSummaryGradient}
        >
          <View style={styles.deckSummaryContent}>
            <View>
              <Text style={styles.deckSummaryLabel}>Current Deck</Text>
              <Text style={[styles.deckSummaryValue, { color: deckColor }]}>
                {deckSize} / 60 cards
              </Text>
              <Text style={styles.deckSummaryHint}>
                {deckSize < 30 && 'Minimum 30 cards'}
                {deckSize >= 30 && deckSize <= 60 && 'Ready to save!'}
                {deckSize > 60 && 'Maximum 60 cards'}
              </Text>
            </View>

            <View style={styles.deckActions}>
              <Pressable
                style={[styles.deckActionButton, deckSize === 0 && styles.deckActionButtonDisabled]}
                onPress={handleClearDeck}
                disabled={deckSize === 0}
              >
                <Text style={styles.deckActionButtonText}>🗑️</Text>
              </Pressable>

              <Pressable
                style={[styles.deckActionButton, (deckSize < 30 || deckSize > 60) && styles.deckActionButtonDisabled]}
                onPress={handleSaveDeck}
                disabled={deckSize < 30 || deckSize > 60}
              >
                <Text style={styles.deckActionButtonText}>💾</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Card Grid */}
      {view === 'deck' ? (
        <CardGrid
          cards={displayCards}
          onCardPress={handleCardPress}
          selectedCards={new Set(currentDeck.map(c => c.id))}
          showFilters={true}
          showSearch={true}
          emptyMessage="No cards available"
        />
      ) : (
        <CardGrid
          cards={displayCards}
          onCardPress={handleCardPress}
          selectedCards={new Set(currentDeck.map(c => c.id))}
          showFilters={true}
          showSearch={true}
          emptyMessage={view === 'collection' ? 'No cards owned. Open packs to get cards!' : 'No cards in deck'}
        />
      )}

      {/* Card Detail Modal */}
      <CardDetailModal
        visible={showDetail}
        card={selectedCard}
        onClose={() => setShowDetail(false)}
        onAddToDeck={handleAddToDeck}
        showDeckButton={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e93'
  },
  header: {
    padding: 16,
    paddingTop: 60,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    gap: 4
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  viewButtonActive: {
    backgroundColor: '#4488ff'
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93'
  },
  viewButtonTextActive: {
    color: '#ffffff'
  },
  deckSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  deckSummaryGradient: {
    padding: 16
  },
  deckSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deckSummaryLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4
  },
  deckSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  deckSummaryHint: {
    fontSize: 12,
    color: '#8e8e93'
  },
  deckActions: {
    flexDirection: 'row',
    gap: 12
  },
  deckActionButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4488ff'
  },
  deckActionButtonDisabled: {
    opacity: 0.3,
    borderColor: '#3a3a4e'
  },
  deckActionButtonText: {
    fontSize: 24
  }
});

import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useInventory } from '@/hooks/useInventory';
import { useCharacter } from '@/hooks/useCharacter';
import { useFirebase } from '@/lib/firebase-context';
import { doc, setDoc } from 'firebase/firestore';
import type { CardDef, DeckType, Rarity } from '@rov/types';

/**
 * Deck Builder Screen
 *
 * Allows players to create and manage custom decks from their collection
 * - Separate decks for Action, Skill, and Loot
 * - Deck size limits and requirements
 * - Card count management
 */
export default function DeckBuilderScreen() {
  const [selectedDeckType, setSelectedDeckType] = useState<DeckType>('Action');
  const [deckCards, setDeckCards] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');

  const { allCards, getCardCount, isLoading } = useInventory();
  const { character } = useCharacter();
  const { db } = useFirebase();

  const DECK_LIMITS = {
    Action: 30,
    Skill: 20,
    Loot: 15
  };

  const currentDeckSize = Object.values(deckCards).reduce((sum, count) => sum + count, 0);
  const maxDeckSize = DECK_LIMITS[selectedDeckType];

  const availableCards = allCards?.filter(card => {
    if (card.deck !== selectedDeckType) return false;
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedRarity !== 'all' && card.rarity !== selectedRarity) return false;
    return getCardCount(card.id) > 0;
  }) || [];

  const addCardToDeck = (cardId: string) => {
    const currentCount = deckCards[cardId] || 0;
    const ownedCount = getCardCount(cardId);

    if (currentCount >= ownedCount) {
      Alert.alert('Max Copies', 'You have added all copies of this card.');
      return;
    }

    if (currentDeckSize >= maxDeckSize) {
      Alert.alert('Deck Full', `${selectedDeckType} deck can only have ${maxDeckSize} cards.`);
      return;
    }

    setDeckCards(prev => ({ ...prev, [cardId]: currentCount + 1 }));
  };

  const removeCardFromDeck = (cardId: string) => {
    const currentCount = deckCards[cardId] || 0;
    if (currentCount <= 0) return;

    if (currentCount === 1) {
      const newDeck = { ...deckCards };
      delete newDeck[cardId];
      setDeckCards(newDeck);
    } else {
      setDeckCards(prev => ({ ...prev, [cardId]: currentCount - 1 }));
    }
  };

  const saveDeck = async () => {
    if (currentDeckSize < maxDeckSize) {
      Alert.alert(
        'Incomplete Deck',
        `Your ${selectedDeckType} deck needs ${maxDeckSize - currentDeckSize} more cards.`,
        [
          { text: 'Continue Editing', style: 'cancel' },
          { text: 'Save Anyway', onPress: performSave }
        ]
      );
      return;
    }

    performSave();
  };

  const performSave = async () => {
    if (!character) return;

    try {
      const deckRef = doc(db, 'decks', `${character.id}_${selectedDeckType.toLowerCase()}`);
      await setDoc(deckRef, {
        userId: character.id,
        deckType: selectedDeckType,
        cards: deckCards,
        updatedAt: new Date().toISOString()
      });

      Alert.alert('Deck Saved!', `Your ${selectedDeckType} deck has been saved.`);
      router.back();
    } catch (error) {
      console.error('Failed to save deck:', error);
      Alert.alert('Error', 'Failed to save deck. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Deck Builder</Text>
        <Pressable onPress={saveDeck} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      {/* Deck Type Selector */}
      <View style={styles.deckTypeContainer}>
        {(['Action', 'Skill', 'Loot'] as DeckType[]).map(type => (
          <Pressable
            key={type}
            style={[styles.deckTypeButton, selectedDeckType === type && styles.deckTypeButtonActive]}
            onPress={() => setSelectedDeckType(type)}
          >
            <Text style={[styles.deckTypeText, selectedDeckType === type && styles.deckTypeTextActive]}>
              {type}
            </Text>
            <Text style={styles.deckTypeCount}>
              {Object.entries(deckCards)
                .filter(([id]) => allCards?.find(c => c.id === id)?.deck === type)
                .reduce((sum, [, count]) => sum + count, 0)
              }/{DECK_LIMITS[type]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search and Filter */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cards..."
          placeholderTextColor="#5e5e6e"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal style={styles.rarityFilters} showsHorizontalScrollIndicator={false}>
          {(['all', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as (Rarity | 'all')[]).map(rarity => (
            <Pressable
              key={rarity}
              style={[styles.rarityButton, selectedRarity === rarity && styles.rarityButtonActive]}
              onPress={() => setSelectedRarity(rarity)}
            >
              <Text style={styles.rarityButtonText}>{rarity}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Card List */}
      <FlatList
        data={availableCards}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CardRow
            card={item}
            owned={getCardCount(item.id)}
            inDeck={deckCards[item.id] || 0}
            onAdd={() => addCardToDeck(item.id)}
            onRemove={() => removeCardFromDeck(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No cards available</Text>
          </View>
        }
      />
    </View>
  );
}

function CardRow({
  card,
  owned,
  inDeck,
  onAdd,
  onRemove
}: {
  card: CardDef;
  owned: number;
  inDeck: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.cardRow}>
      <LinearGradient
        colors={getCardColors(card.rarity)}
        style={styles.cardRowGradient}
      >
        <View style={styles.cardRowContent}>
          <View style={styles.cardRowInfo}>
            <Text style={styles.cardRowMana}>⚡{card.manaCost}</Text>
            <View style={styles.cardRowTextContainer}>
              <Text style={styles.cardRowName}>{card.name}</Text>
              <Text style={styles.cardRowEffect} numberOfLines={1}>{card.effects.map(e => e.type).join(', ')}</Text>
            </View>
          </View>

          <View style={styles.cardRowActions}>
            <Text style={styles.cardRowCount}>
              {inDeck}/{owned}
            </Text>
            <View style={styles.cardRowButtons}>
              <Pressable
                style={[styles.cardButton, inDeck === 0 && styles.cardButtonDisabled]}
                onPress={onRemove}
                disabled={inDeck === 0}
              >
                <Text style={styles.cardButtonText}>−</Text>
              </Pressable>
              <Pressable
                style={[styles.cardButton, styles.cardButtonAdd, inDeck >= owned && styles.cardButtonDisabled]}
                onPress={onAdd}
                disabled={inDeck >= owned}
              >
                <Text style={styles.cardButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function getCardColors(rarity: string): [string, string] {
  const colors: Record<string, [string, string]> = {
    Common: ['#5a5a6e', '#3a3a4e'],
    Uncommon: ['#00aa00', '#006600'],
    Rare: ['#0066cc', '#003388'],
    Epic: ['#aa00aa', '#660066'],
    Legendary: ['#cc8800', '#884400']
  };
  return colors[rarity] || colors.Common;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  backButtonText: { color: '#4488ff', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  saveButton: { backgroundColor: '#00ff00', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: '#1a1a2e', fontSize: 14, fontWeight: 'bold' },
  deckTypeContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  deckTypeButton: { flex: 1, backgroundColor: '#2a2a3e', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  deckTypeButtonActive: { backgroundColor: '#4488ff' },
  deckTypeText: { fontSize: 16, fontWeight: '600', color: '#8e8e93', marginBottom: 4 },
  deckTypeTextActive: { color: '#ffffff' },
  deckTypeCount: { fontSize: 12, color: '#8e8e93' },
  filtersContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { backgroundColor: '#2a2a3e', borderRadius: 12, padding: 12, color: '#ffffff', fontSize: 16, marginBottom: 12 },
  rarityFilters: { maxHeight: 40 },
  rarityButton: { backgroundColor: '#2a2a3e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  rarityButtonActive: { backgroundColor: '#4488ff' },
  rarityButtonText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 0 },
  cardRow: { marginBottom: 12 },
  cardRowGradient: { borderRadius: 12, padding: 12 },
  cardRowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardRowInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardRowMana: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  cardRowTextContainer: { flex: 1 },
  cardRowName: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  cardRowEffect: { fontSize: 12, color: '#cccccc' },
  cardRowActions: { alignItems: 'flex-end', gap: 8 },
  cardRowCount: { fontSize: 12, color: '#ffffff', fontWeight: 'bold' },
  cardRowButtons: { flexDirection: 'row', gap: 8 },
  cardButton: { width: 32, height: 32, backgroundColor: '#ff4444', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardButtonAdd: { backgroundColor: '#00ff00' },
  cardButtonDisabled: { backgroundColor: '#2a2a3e', opacity: 0.5 },
  cardButtonText: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#5e5e6e' }
});

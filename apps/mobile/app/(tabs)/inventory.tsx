import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useInventory } from '@/hooks/useInventory';
import type { CardDef, Rarity, DeckType } from '@rov/types';

/**
 * Inventory Tab - View cards and collection
 */
export default function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<DeckType | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');

  const { inventory, getFilteredCards, getCardCount, isLoading } = useInventory();

  const deckTypes: Array<DeckType | 'all'> = ['all', 'Action', 'Skill', 'Loot'];
  const rarities: Array<Rarity | 'all'> = ['all', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

  // Get filtered cards using the hook
  const filteredCards = getFilteredCards({
    searchQuery,
    deck: selectedDeck,
    rarity: selectedRarity
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Collection</Text>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search cards..."
          placeholderTextColor="#5e5e6e"
        />

        {/* Filters */}
        <View style={styles.filtersRow}>
          {/* Deck Filter */}
          <View style={styles.filterGroup}>
            {deckTypes.map((deck) => (
              <Pressable
                key={deck}
                style={[
                  styles.filterButton,
                  selectedDeck === deck && styles.filterButtonActive
                ]}
                onPress={() => setSelectedDeck(deck)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedDeck === deck && styles.filterButtonTextActive
                  ]}
                >
                  {deck}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Rarity Filter */}
        <View style={styles.filtersRow}>
          {rarities.map((rarity) => (
            <Pressable
              key={rarity}
              style={[
                styles.rarityButton,
                selectedRarity === rarity && styles.rarityButtonActive
              ]}
              onPress={() => setSelectedRarity(rarity)}
            >
              <Text
                style={[
                  styles.rarityButtonText,
                  selectedRarity === rarity && styles.rarityButtonTextActive
                ]}
              >
                {rarity}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Cards Grid */}
      <FlatList
        data={filteredCards || []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <CardItem
            card={item}
            count={getCardCount(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No cards found</Text>
          </View>
        }
      />
    </View>
  );
}

function CardItem({ card, count }: { card: CardDef; count: number }) {
  const getRarityColor = (rarity: Rarity) => {
    const colors: Record<Rarity, string> = {
      Common: '#ffffff',
      Uncommon: '#00ff00',
      Rare: '#0088ff',
      Epic: '#ff00ff',
      Legendary: '#ffd700'
    };
    return colors[rarity];
  };

  return (
    <Pressable style={styles.cardItem}>
      <LinearGradient
        colors={[getRarityColor(card.rarity) + '20', '#2a2a3e']}
        style={styles.cardGradient}
      >
        {/* Count Badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>×{count}</Text>
        </View>

        {/* Mana Cost */}
        {card.manaCost !== undefined && (
          <View style={styles.manaBadge}>
            <Text style={styles.manaText}>⚡{card.manaCost}</Text>
          </View>
        )}

        {/* Card Info */}
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, { color: getRarityColor(card.rarity) }]}
            numberOfLines={2}
          >
            {card.name}
          </Text>
          <Text style={styles.cardDeck}>{card.deck}</Text>
          <Text style={styles.cardText} numberOfLines={3}>
            {card.text}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  searchInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#4a4a5e'
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8
  },
  filterButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  filterButtonActive: {
    backgroundColor: '#4488ff'
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93'
  },
  filterButtonTextActive: {
    color: '#ffffff'
  },
  rarityButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  rarityButtonActive: {
    backgroundColor: '#4488ff'
  },
  rarityButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e8e93'
  },
  rarityButtonTextActive: {
    color: '#ffffff'
  },
  gridContent: {
    padding: 16,
    paddingTop: 120
  },
  row: {
    gap: 12,
    marginBottom: 12
  },
  cardItem: {
    flex: 1,
    aspectRatio: 0.7,
    maxWidth: '50%'
  },
  cardGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#4a4a5e'
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a4a5e'
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  manaBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4488ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  manaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  cardDeck: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 6
  },
  cardText: {
    fontSize: 11,
    color: '#8e8e93',
    lineHeight: 14
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyText: {
    fontSize: 16,
    color: '#5e5e6e'
  }
});
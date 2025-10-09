/**
 * Card Grid Component
 *
 * Displays a filterable, searchable grid of cards
 * Used in collection view, deck builder, and card browser
 */

import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useMemo } from 'react';
import type { Card, DeckType, Rarity, Alignment } from '@rov/types';

interface CardGridProps {
  cards: Card[];
  onCardPress?: (card: Card) => void;
  selectedCards?: Set<string>;
  showFilters?: boolean;
  showSearch?: boolean;
  emptyMessage?: string;
}

export function CardGrid({
  cards,
  onCardPress,
  selectedCards,
  showFilters = true,
  showSearch = true,
  emptyMessage = 'No cards found'
}: CardGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deckFilter, setDeckFilter] = useState<DeckType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [alignmentFilter, setAlignmentFilter] = useState<Alignment | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'rarity'>('name');

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let filtered = [...cards];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(query) ||
        card.text.toLowerCase().includes(query) ||
        card.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Deck filter
    if (deckFilter !== 'all') {
      filtered = filtered.filter(card => card.deck === deckFilter);
    }

    // Rarity filter
    if (rarityFilter !== 'all') {
      filtered = filtered.filter(card => card.rarity === rarityFilter);
    }

    // Alignment filter
    if (alignmentFilter !== 'all') {
      filtered = filtered.filter(card => card.alignment === alignmentFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return (a.manaCost || 0) - (b.manaCost || 0);
        case 'rarity':
          return getRarityOrder(a.rarity) - getRarityOrder(b.rarity);
        default:
          return 0;
      }
    });

    return filtered;
  }, [cards, searchQuery, deckFilter, rarityFilter, alignmentFilter, sortBy]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            placeholderTextColor="#8e8e93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
      )}

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Deck Filter */}
          <FilterRow
            label="Deck"
            options={['all', 'Action', 'Skill', 'Loot', 'Boss', 'Summon']}
            selected={deckFilter}
            onSelect={(value) => setDeckFilter(value as DeckType | 'all')}
          />

          {/* Rarity Filter */}
          <FilterRow
            label="Rarity"
            options={['all', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']}
            selected={rarityFilter}
            onSelect={(value) => setRarityFilter(value as Rarity | 'all')}
          />

          {/* Alignment Filter */}
          <FilterRow
            label="Align"
            options={['all', 'Holy', 'Chaos', 'Arcane', 'Neutral']}
            selected={alignmentFilter}
            onSelect={(value) => setAlignmentFilter(value as Alignment | 'all')}
          />

          {/* Sort */}
          <FilterRow
            label="Sort"
            options={['name', 'cost', 'rarity']}
            selected={sortBy}
            onSelect={(value) => setSortBy(value as 'name' | 'cost' | 'rarity')}
          />
        </View>
      )}

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Card Grid */}
      <FlatList
        data={filteredCards}
        renderItem={({ item }) => (
          <CardGridItem
            card={item}
            onPress={() => onCardPress?.(item)}
            isSelected={selectedCards?.has(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎴</Text>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />
    </View>
  );
}

// ============================================================================
// Filter Row Component
// ============================================================================

interface FilterRowProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

function FilterRow({ label, options, selected, onSelect }: FilterRowProps) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}:</Text>
      <View style={styles.filterOptions}>
        {options.map(option => (
          <Pressable
            key={option}
            style={[
              styles.filterOption,
              selected === option && styles.filterOptionSelected
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.filterOptionText,
              selected === option && styles.filterOptionTextSelected
            ]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Card Grid Item Component
// ============================================================================

interface CardGridItemProps {
  card: Card;
  onPress?: () => void;
  isSelected?: boolean;
}

function CardGridItem({ card, onPress, isSelected }: CardGridItemProps) {
  const rarityColor = getRarityColor(card.rarity);
  const alignmentColor = getAlignmentColor(card.alignment);

  return (
    <Pressable
      style={[styles.cardContainer, isSelected && styles.cardContainerSelected]}
      onPress={onPress}
    >
      <LinearGradient
        colors={[rarityColor + '40', rarityColor + '20']}
        style={styles.cardGradient}
      >
        {/* Rarity border */}
        <View style={[styles.rarityBorder, { borderColor: rarityColor }]} />

        {/* Mana cost */}
        <View style={styles.manaCostBadge}>
          <Text style={styles.manaCostText}>⚡{card.manaCost || 0}</Text>
        </View>

        {/* Card art */}
        <View style={styles.cardArt}>
          <Text style={styles.cardIcon}>{card.art?.iconUrl || '🎴'}</Text>
        </View>

        {/* Card name */}
        <View style={styles.cardNameContainer}>
          <Text style={styles.cardName} numberOfLines={2}>
            {card.name}
          </Text>
        </View>

        {/* Deck type & Rarity */}
        <View style={styles.cardFooter}>
          <View style={styles.deckBadge}>
            <Text style={styles.deckText}>{getDeckIcon(card.deck)}</Text>
          </View>

          {card.alignment && (
            <View style={[styles.alignmentBadge, { backgroundColor: alignmentColor + '40' }]}>
              <Text style={styles.alignmentText}>{getAlignmentIcon(card.alignment)}</Text>
            </View>
          )}

          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    Common: '#9ca3af',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#f59e0b'
  };
  return colors[rarity];
}

function getAlignmentColor(alignment?: Alignment): string {
  if (!alignment) return '#666666';

  const colors: Record<Alignment, string> = {
    Holy: '#FFD700',
    Chaos: '#ff4444',
    Arcane: '#8b5cf6',
    Neutral: '#8e8e93'
  };
  return colors[alignment];
}

function getDeckIcon(deck: DeckType): string {
  const icons: Record<DeckType, string> = {
    Action: '🎴',
    Skill: '✨',
    Loot: '💎',
    Boss: '👑',
    Summon: '🐉',
    Renown: '🏆',
    Quest: '📜',
    Class: '🎭'
  };
  return icons[deck] || '🎴';
}

function getAlignmentIcon(alignment: Alignment): string {
  const icons: Record<Alignment, string> = {
    Holy: '☀️',
    Chaos: '🔥',
    Arcane: '🔮',
    Neutral: '⚖️'
  };
  return icons[alignment];
}

function getRarityOrder(rarity: Rarity): number {
  const order: Record<Rarity, number> = {
    Common: 1,
    Uncommon: 2,
    Rare: 3,
    Epic: 4,
    Legendary: 5
  };
  return order[rarity];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    marginRight: 12
  },
  searchIcon: {
    fontSize: 20
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    width: 50
  },
  filterOptions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  filterOption: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#3a3a4e',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  filterOptionSelected: {
    backgroundColor: '#4488ff',
    borderColor: '#4488ff'
  },
  filterOptionText: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600'
  },
  filterOptionTextSelected: {
    color: '#ffffff'
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  resultsText: {
    fontSize: 14,
    color: '#8e8e93'
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  gridContent: {
    paddingBottom: 32
  },
  cardContainer: {
    width: '48%',
    aspectRatio: 0.7,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0
  },
  cardContainerSelected: {
    borderWidth: 3,
    borderColor: '#4ade80'
  },
  cardGradient: {
    flex: 1,
    padding: 8,
    position: 'relative'
  },
  rarityBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 12,
    pointerEvents: 'none'
  },
  manaCostBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
    zIndex: 10
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
    marginTop: 24
  },
  cardIcon: {
    fontSize: 48
  },
  cardNameContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center'
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  deckBadge: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deckText: {
    fontSize: 16
  },
  alignmentBadge: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  alignmentText: {
    fontSize: 14
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    backgroundColor: '#4ade80',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  selectedIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5
  },
  emptyText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center'
  }
});

import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import type { QuestSortType, QuestDifficultyFilter } from '@/hooks/useQuestFilters';

interface QuestFiltersProps {
  sortType: QuestSortType;
  onSortChange: (sort: QuestSortType) => void;
  difficultyFilter: QuestDifficultyFilter;
  onDifficultyChange: (difficulty: QuestDifficultyFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Quest Filters Component
 * 
 * Filter and sort controls for quest list
 */
export function QuestFilters({
  sortType,
  onSortChange,
  difficultyFilter,
  onDifficultyChange,
  searchQuery,
  onSearchChange
}: QuestFiltersProps) {
  
  const sortOptions: { value: QuestSortType; label: string; icon: string }[] = [
    { value: 'distance', label: 'Distance', icon: '📍' },
    { value: 'difficulty', label: 'Difficulty', icon: '⚔️' },
    { value: 'type', label: 'Type', icon: '📋' }
  ];

  const difficultyOptions: { value: QuestDifficultyFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'epic', label: 'Epic' },
    { value: 'legendary', label: 'Legendary' }
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search quests..."
          placeholderTextColor="#8e8e93"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      {/* Sort Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SORT BY</Text>
        <View style={styles.buttonRow}>
          {sortOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.filterButton,
                sortType === option.value && styles.filterButtonActive
              ]}
              onPress={() => onSortChange(option.value)}
            >
              <Text style={styles.filterIcon}>{option.icon}</Text>
              <Text style={[
                styles.filterLabel,
                sortType === option.value && styles.filterLabelActive
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Difficulty Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DIFFICULTY</Text>
        <View style={styles.buttonRow}>
          {difficultyOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.difficultyButton,
                difficultyFilter === option.value && styles.difficultyButtonActive
              ]}
              onPress={() => onDifficultyChange(option.value)}
            >
              <Text style={[
                styles.difficultyLabel,
                difficultyFilter === option.value && styles.difficultyLabelActive
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    gap: 16
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232336',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  searchIcon: {
    fontSize: 18
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14
  },
  section: {
    gap: 8
  },
  sectionLabel: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  filterButtonActive: {
    backgroundColor: '#4488ff'
  },
  filterIcon: {
    fontSize: 14
  },
  filterLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600'
  },
  filterLabelActive: {
    color: '#fff'
  },
  difficultyButton: {
    backgroundColor: '#232336',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16
  },
  difficultyButtonActive: {
    backgroundColor: '#4488ff'
  },
  difficultyLabel: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '600'
  },
  difficultyLabelActive: {
    color: '#fff'
  }
});

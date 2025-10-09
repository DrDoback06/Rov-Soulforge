import { useState, useMemo } from 'react';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * Quest Filtering & Sorting Hook
 * 
 * Manages filter and sort state for quest lists
 */

export type QuestFilterType = 'all' | 'main' | 'world' | 'side' | 'player_created';
export type QuestSortType = 'distance' | 'difficulty' | 'type' | 'custom';
export type QuestDifficultyFilter = 'all' | 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';

interface UseQuestFiltersOptions {
  quests: EnhancedQuest[];
  playerLocation?: { latitude: number; longitude: number } | null;
}

const DIFFICULTY_ORDER = {
  easy: 1,
  medium: 2,
  hard: 3,
  epic: 4,
  legendary: 5
};

export function useQuestFilters({ quests, playerLocation }: UseQuestFiltersOptions) {
  const [filterType, setFilterType] = useState<QuestFilterType>('all');
  const [sortType, setSortType] = useState<QuestSortType>('distance');
  const [difficultyFilter, setDifficultyFilter] = useState<QuestDifficultyFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Calculate distance to quest
   */
  const getDistance = (quest: EnhancedQuest): number => {
    if (!playerLocation || !quest.location) return Infinity;
    
    const lat1 = playerLocation.latitude;
    const lon1 = playerLocation.longitude;
    const lat2 = quest.location.latitude;
    const lon2 = quest.location.longitude;
    
    // Haversine formula
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  /**
   * Filter and sort quests
   */
  const filteredQuests = useMemo(() => {
    let filtered = [...quests];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.type === filterType);
    }

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(query) ||
        q.description.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortType === 'distance' && playerLocation) {
      filtered.sort((a, b) => getDistance(a) - getDistance(b));
    } else if (sortType === 'difficulty') {
      filtered.sort((a, b) => 
        DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
      );
    } else if (sortType === 'type') {
      filtered.sort((a, b) => a.type.localeCompare(b.type));
    }

    return filtered;
  }, [quests, filterType, sortType, difficultyFilter, searchQuery, playerLocation]);

  /**
   * Group quests by type for sections
   */
  const groupedQuests = useMemo(() => {
    return {
      main: filteredQuests.filter(q => q.type === 'main'),
      world: filteredQuests.filter(q => q.type === 'world'),
      side: filteredQuests.filter(q => q.type === 'side'),
      playerCreated: filteredQuests.filter(q => q.type === 'player_created')
    };
  }, [filteredQuests]);

  return {
    // State
    filterType,
    sortType,
    difficultyFilter,
    searchQuery,
    
    // Setters
    setFilterType,
    setSortType,
    setDifficultyFilter,
    setSearchQuery,
    
    // Results
    filteredQuests,
    groupedQuests,
    
    // Utilities
    getDistance
  };
}

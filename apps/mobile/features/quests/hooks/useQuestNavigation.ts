import { useState, useEffect, useCallback } from 'react';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { distanceBetween } from 'geofire-common';

/**
 * Quest Navigation Hook with Real-Time Updates
 * 
 * Manages multi-stop navigation with dynamic route recalculation
 * Updates distance, ETA, and route as player moves
 */

interface PlayerLocation {
  latitude: number;
  longitude: number;
}

interface NavigationState {
  isNavigating: boolean;
  currentQuestIndex: number;
  currentQuest: EnhancedQuest | null;
  nextQuest: EnhancedQuest | null;
  distanceToCurrentQuest: number;
  etaToCurrentQuest: number; // seconds
  totalDistance: number;
  totalEta: number;
  completedQuests: string[];
}

const WALKING_SPEED_MPS = 1.4; // meters per second (average walking speed)
const ARRIVAL_THRESHOLD = 50; // meters - consider "arrived" within this distance
const REROUTE_THRESHOLD = 100; // meters - trigger reroute if deviated by this much

export function useQuestNavigation(
  quests: EnhancedQuest[],
  playerLocation: PlayerLocation | null
) {
  const [navState, setNavState] = useState<NavigationState>({
    isNavigating: false,
    currentQuestIndex: 0,
    currentQuest: null,
    nextQuest: null,
    distanceToCurrentQuest: 0,
    etaToCurrentQuest: 0,
    totalDistance: 0,
    totalEta: 0,
    completedQuests: []
  });

  /**
   * Calculate distance between two points in meters
   */
  const calculateDistance = useCallback((
    from: PlayerLocation,
    to: { latitude: number; longitude: number }
  ): number => {
    const distanceKm = distanceBetween(
      [from.latitude, from.longitude],
      [to.latitude, to.longitude]
    );
    return distanceKm * 1000; // Convert to meters
  }, []);

  /**
   * Calculate ETA in seconds based on distance
   */
  const calculateEta = useCallback((distanceMeters: number): number => {
    return Math.ceil(distanceMeters / WALKING_SPEED_MPS);
  }, []);

  /**
   * Start navigation to all quests in order
   */
  const startNavigation = useCallback(() => {
    if (quests.length === 0 || !playerLocation) return;

    setNavState({
      isNavigating: true,
      currentQuestIndex: 0,
      currentQuest: quests[0],
      nextQuest: quests.length > 1 ? quests[1] : null,
      distanceToCurrentQuest: calculateDistance(playerLocation, quests[0].location),
      etaToCurrentQuest: 0, // Will be calculated in effect
      totalDistance: 0,
      totalEta: 0,
      completedQuests: []
    });
  }, [quests, playerLocation, calculateDistance]);

  /**
   * Stop navigation
   */
  const stopNavigation = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      isNavigating: false
    }));
  }, []);

  /**
   * Mark current quest as complete and move to next
   */
  const completeCurrentQuest = useCallback(() => {
    setNavState(prev => {
      const nextIndex = prev.currentQuestIndex + 1;
      const hasMore = nextIndex < quests.length;

      if (!hasMore) {
        // All quests completed
        return {
          ...prev,
          isNavigating: false,
          currentQuest: null,
          nextQuest: null
        };
      }

      return {
        ...prev,
        currentQuestIndex: nextIndex,
        currentQuest: quests[nextIndex],
        nextQuest: nextIndex + 1 < quests.length ? quests[nextIndex + 1] : null,
        completedQuests: [...prev.completedQuests, prev.currentQuest?.id || '']
      };
    });
  }, [quests]);

  /**
   * Skip current quest and move to next
   */
  const skipCurrentQuest = useCallback(() => {
    completeCurrentQuest();
  }, [completeCurrentQuest]);

  /**
   * Real-time route updates
   * Recalculates distance, ETA, and total route as player moves
   */
  useEffect(() => {
    if (!navState.isNavigating || !playerLocation || !navState.currentQuest) return;

    // Calculate distance to current quest
    const distanceToCurrent = calculateDistance(
      playerLocation,
      navState.currentQuest.location
    );

    // Calculate ETA to current quest
    const etaToCurrent = calculateEta(distanceToCurrent);

    // Calculate total distance for remaining quests
    let totalDistance = distanceToCurrent;
    let totalEta = etaToCurrent;

    if (quests.length > navState.currentQuestIndex + 1) {
      let prevLocation = navState.currentQuest.location;
      
      for (let i = navState.currentQuestIndex + 1; i < quests.length; i++) {
        const dist = calculateDistance(prevLocation, quests[i].location);
        totalDistance += dist;
        totalEta += calculateEta(dist);
        prevLocation = quests[i].location;
      }
    }

    // Update state
    setNavState(prev => ({
      ...prev,
      distanceToCurrentQuest: distanceToCurrent,
      etaToCurrentQuest: etaToCurrent,
      totalDistance,
      totalEta
    }));

    // Auto-advance if arrived at quest
    if (distanceToCurrent <= ARRIVAL_THRESHOLD) {
      console.log('🎯 Arrived at quest:', navState.currentQuest.title);
      // Note: In real implementation, this would trigger quest activation
      // For now, we'll let the user manually complete it
    }

  }, [
    navState.isNavigating,
    navState.currentQuest,
    navState.currentQuestIndex,
    playerLocation,
    quests,
    calculateDistance,
    calculateEta
  ]);

  /**
   * Format distance for display
   */
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  /**
   * Format ETA for display
   */
  const formatEta = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }, []);

  return {
    // State
    ...navState,
    
    // Actions
    startNavigation,
    stopNavigation,
    completeCurrentQuest,
    skipCurrentQuest,
    
    // Utilities
    formatDistance,
    formatEta,
    calculateDistance
  };
}

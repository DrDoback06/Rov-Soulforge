import { useMemo, useCallback } from 'react';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { distanceBetween } from 'geofire-common';

/**
 * Route Optimization Hook
 * 
 * Implements traveling salesman algorithm for optimal quest routing
 * Uses greedy nearest-neighbor approach (O(n²))
 */

interface RoutePoint {
  latitude: number;
  longitude: number;
}

export function useRouteOptimization() {
  
  /**
   * Calculate distance between two points in meters
   */
  const calculateDistance = useCallback((point1: RoutePoint, point2: RoutePoint): number => {
    const distanceKm = distanceBetween(
      [point1.latitude, point1.longitude],
      [point2.latitude, point2.longitude]
    );
    return distanceKm * 1000; // Convert to meters
  }, []);

  /**
   * Calculate total route distance
   */
  const calculateTotalDistance = useCallback((
    start: RoutePoint,
    quests: EnhancedQuest[]
  ): number => {
    if (quests.length === 0) return 0;

    let total = 0;
    let current = start;

    for (const quest of quests) {
      total += calculateDistance(current, quest.location);
      current = quest.location;
    }

    return total;
  }, [calculateDistance]);

  /**
   * Optimize quest order using greedy nearest-neighbor algorithm
   * 
   * Algorithm:
   * 1. Start at player location
   * 2. Find nearest unvisited quest
   * 3. Move to that quest
   * 4. Repeat until all quests visited
   */
  const optimizeRoute = useCallback((
    playerLocation: RoutePoint,
    quests: EnhancedQuest[]
  ): EnhancedQuest[] => {
    if (quests.length <= 1) return quests;

    const unvisited = [...quests];
    const optimized: EnhancedQuest[] = [];
    let current = playerLocation;

    while (unvisited.length > 0) {
      // Find nearest quest to current position
      let nearestIndex = 0;
      let nearestDistance = calculateDistance(current, unvisited[0].location);

      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateDistance(current, unvisited[i].location);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // Add nearest quest to optimized route
      const nearest = unvisited.splice(nearestIndex, 1)[0];
      optimized.push(nearest);
      current = nearest.location;
    }

    return optimized;
  }, [calculateDistance]);

  /**
   * Calculate savings from optimization
   */
  const calculateOptimizationSavings = useCallback((
    playerLocation: RoutePoint,
    originalOrder: EnhancedQuest[],
    optimizedOrder: EnhancedQuest[]
  ): { saved: number; percentage: number } => {
    const originalDistance = calculateTotalDistance(playerLocation, originalOrder);
    const optimizedDistance = calculateTotalDistance(playerLocation, optimizedOrder);
    const saved = originalDistance - optimizedDistance;
    const percentage = originalDistance > 0 ? (saved / originalDistance) * 100 : 0;

    return { saved, percentage };
  }, [calculateTotalDistance]);

  return {
    calculateDistance,
    calculateTotalDistance,
    optimizeRoute,
    calculateOptimizationSavings
  };
}

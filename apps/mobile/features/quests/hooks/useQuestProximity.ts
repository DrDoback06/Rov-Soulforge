import { useState, useEffect, useCallback, useRef } from 'react';
import { distanceBetween } from 'geofire-common';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface QuestProximityOptions {
  playerLocation: { latitude: number; longitude: number } | null;
  quests: EnhancedQuest[];
  onQuestEntered?: (quest: EnhancedQuest) => void;
  onQuestExited?: (quest: EnhancedQuest) => void;
}

/**
 * Quest Proximity Detection Hook
 *
 * Monitors player location and detects when they enter/exit quest activation radius
 * Triggers quest activation popup when player enters range
 */
export function useQuestProximity({
  playerLocation,
  quests,
  onQuestEntered,
  onQuestExited
}: QuestProximityOptions) {
  const [nearbyQuests, setNearbyQuests] = useState<EnhancedQuest[]>([]);
  const [activeQuests, setActiveQuests] = useState<Set<string>>(new Set());
  const previousNearbyRef = useRef<Set<string>>(new Set());

  /**
   * Calculate distance to quest in meters
   */
  const getDistanceToQuest = useCallback((quest: EnhancedQuest): number | null => {
    if (!playerLocation || !quest.location) return null;

    const distance = distanceBetween(
      [playerLocation.latitude, playerLocation.longitude],
      [quest.location.latitude, quest.location.longitude]
    );

    // Convert km to meters
    return distance * 1000;
  }, [playerLocation]);

  /**
   * Check if player is within activation radius
   */
  const isWithinActivationRadius = useCallback((quest: EnhancedQuest): boolean => {
    const distance = getDistanceToQuest(quest);
    if (distance === null) return false;

    return distance <= quest.activationRadius;
  }, [getDistanceToQuest]);

  /**
   * Check if player is within accept radius (for accepting quest)
   */
  const isWithinAcceptRadius = useCallback((quest: EnhancedQuest): boolean => {
    const distance = getDistanceToQuest(quest);
    if (distance === null) return false;

    const acceptRadius = quest.acceptRadius || quest.activationRadius;
    return distance <= acceptRadius;
  }, [getDistanceToQuest]);

  /**
   * Update nearby quests based on player location
   */
  useEffect(() => {
    if (!playerLocation || quests.length === 0) {
      setNearbyQuests([]);
      return;
    }

    // Find all quests within activation radius
    const nearby = quests.filter(quest => isWithinActivationRadius(quest));
    setNearbyQuests(nearby);

    // Track which quests are newly entered or exited
    const currentNearbyIds = new Set(nearby.map(q => q.id));
    const previousNearbyIds = previousNearbyRef.current;

    // Quests newly entered
    nearby.forEach(quest => {
      if (!previousNearbyIds.has(quest.id) && !activeQuests.has(quest.id)) {
        console.log(`🎯 Player entered quest radius: ${quest.title}`);
        onQuestEntered?.(quest);
        setActiveQuests(prev => new Set(prev).add(quest.id));
      }
    });

    // Quests exited
    previousNearbyIds.forEach(questId => {
      if (!currentNearbyIds.has(questId)) {
        const exitedQuest = quests.find(q => q.id === questId);
        if (exitedQuest) {
          console.log(`🚪 Player exited quest radius: ${exitedQuest.title}`);
          onQuestExited?.(exitedQuest);
          setActiveQuests(prev => {
            const newSet = new Set(prev);
            newSet.delete(questId);
            return newSet;
          });
        }
      }
    });

    // Update previous nearby set
    previousNearbyRef.current = currentNearbyIds;

  }, [playerLocation, quests, isWithinActivationRadius, onQuestEntered, onQuestExited, activeQuests]);

  /**
   * Get closest quest from nearby quests
   */
  const getClosestQuest = useCallback((): EnhancedQuest | null => {
    if (nearbyQuests.length === 0) return null;

    let closest = nearbyQuests[0];
    let closestDistance = getDistanceToQuest(closest) || Infinity;

    for (const quest of nearbyQuests) {
      const distance = getDistanceToQuest(quest);
      if (distance !== null && distance < closestDistance) {
        closest = quest;
        closestDistance = distance;
      }
    }

    return closest;
  }, [nearbyQuests, getDistanceToQuest]);

  /**
   * Get all quests sorted by distance
   */
  const getQuestsByDistance = useCallback((): Array<{ quest: EnhancedQuest; distance: number }> => {
    return nearbyQuests
      .map(quest => ({
        quest,
        distance: getDistanceToQuest(quest) || Infinity
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [nearbyQuests, getDistanceToQuest]);

  return {
    nearbyQuests,
    closestQuest: getClosestQuest(),
    questsByDistance: getQuestsByDistance(),
    getDistanceToQuest,
    isWithinActivationRadius,
    isWithinAcceptRadius
  };
}

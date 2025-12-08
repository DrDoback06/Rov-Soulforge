import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface QuestLoaderOptions {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  includeWorldEvents?: boolean;
}

/**
 * Automatic Quest Loading Hook
 *
 * Loads quests based on player location within a radius
 * - Static quests: Permanent landmarks
 * - Dynamic quests: Timed events
 * - World events: Global/promoted quests
 *
 * No manual seeding required!
 */
export function useQuestLoader(options: QuestLoaderOptions) {
  const { db } = useFirebase();
  const { latitude, longitude, radiusMiles = 10, includeWorldEvents = true } = options;

  const [staticQuests, setStaticQuests] = useState<EnhancedQuest[]>([]);
  const [dynamicQuests, setDynamicQuests] = useState<any[]>([]);
  const [worldEvents, setWorldEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoadLocation, setLastLoadLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Convert miles to kilometers for geohash
  const radiusKm = radiusMiles * 1.60934;

  /**
   * Load static landmark quests within radius
   */
  const loadStaticQuests = useCallback(async () => {
    try {
      // Skip if coordinates are invalid
      if (!latitude || !longitude || latitude === 0 || longitude === 0) {
        console.log('⚠️ [QuestLoader] Invalid coordinates, skipping quest load');
        return;
      }

      console.log(`🗺️ [QuestLoader] Loading static quests within ${radiusMiles} miles of ${latitude}, ${longitude}...`);

      const staticQuestsRef = collection(db, 'staticQuests');

      // Get geohash query bounds - ensure latitude and longitude are numbers
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ [QuestLoader] Invalid lat/lng:', { latitude, longitude });
        return;
      }

      const bounds = geohashQueryBounds([lat, lng], radiusKm * 1000);

      const allQuests: EnhancedQuest[] = [];

      // Query each geohash range
      for (const bound of bounds) {
        const q = query(
          staticQuestsRef,
          orderBy('geohash'),
          where('geohash', '>=', bound[0]),
          where('geohash', '<=', bound[1])
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          const quest = { id: doc.id, ...doc.data() } as EnhancedQuest;

          // Calculate distance to verify it's within radius
          if (quest.location) {
            // Validate quest coordinates
            const questLat = quest.location.latitude;
            const questLng = quest.location.longitude;

            if (typeof questLat === 'number' && typeof questLng === 'number' &&
                !isNaN(questLat) && !isNaN(questLng) &&
                questLat !== 0 && questLng !== 0) {

              const distance = distanceBetween(
                [latitude, longitude],
                [questLat, questLng]
              );

              // Convert to miles
              const distanceMiles = distance * 0.621371;

              if (distanceMiles <= radiusMiles) {
                allQuests.push(quest);
              }
            } else {
              console.warn(`⚠️ [QuestLoader] Quest ${quest.id} has invalid coordinates:`, questLat, questLng);
            }
          }
        });
      }

      // Remove duplicates
      const uniqueQuests = Array.from(
        new Map(allQuests.map(q => [q.id, q])).values()
      );

      console.log(`✅ [QuestLoader] Loaded ${uniqueQuests.length} static quests`);
      setStaticQuests(uniqueQuests);

    } catch (error) {
      console.error('❌ [QuestLoader] Error loading static quests:', error);
      // Fallback: Load all quests if geohash query fails
      await loadAllStaticQuests();
    }
  }, [latitude, longitude, radiusMiles, db]);

  /**
   * Fallback: Load all static quests (used when geohash not available)
   */
  const loadAllStaticQuests = async () => {
    try {
      const staticQuestsRef = collection(db, 'staticQuests');
      const q = query(staticQuestsRef, limit(100));
      const snapshot = await getDocs(q);

      const quests: EnhancedQuest[] = [];
      snapshot.forEach((doc) => {
        const quest = { id: doc.id, ...doc.data() } as EnhancedQuest;

        // Filter by distance
        if (quest.location) {
          const distance = distanceBetween(
            [latitude, longitude],
            [quest.location.latitude, quest.location.longitude]
          );
          const distanceMiles = distance * 0.621371;

          if (distanceMiles <= radiusMiles) {
            quests.push(quest);
          }
        }
      });

      console.log(`✅ [QuestLoader] Loaded ${quests.length} static quests (fallback)`);
      setStaticQuests(quests);
    } catch (error) {
      console.error('❌ [QuestLoader] Error in fallback loading:', error);
    }
  };

  /**
   * Load dynamic timed quests
   */
  const loadDynamicQuests = useCallback(async () => {
    try {
      console.log('⏱️ [QuestLoader] Loading dynamic quests...');

      const dynamicQuestsRef = collection(db, 'dynamicQuests');
      const now = new Date().toISOString();

      // Query only non-expired quests
      const q = query(
        dynamicQuestsRef,
        where('expiresAt', '>', now),
        limit(50)
      );

      const snapshot = await getDocs(q);

      // Collection might be empty, not an error
      if (snapshot.empty) {
        console.log('ℹ️ [QuestLoader] No dynamic quests available');
        setDynamicQuests([]);
        return;
      }
      const quests: any[] = [];

      snapshot.forEach((doc) => {
        const quest = { id: doc.id, ...doc.data() };

        // Check if within radius or global
        if (quest.location) {
          if (quest.location.radius) {
            // Area-based quest
            const distance = distanceBetween(
              [latitude, longitude],
              [quest.location.latitude, quest.location.longitude]
            );
            const distanceMiles = distance * 0.621371;

            if (distanceMiles <= radiusMiles) {
              quests.push(quest);
            }
          } else {
            // Point-based quest
            const distance = distanceBetween(
              [latitude, longitude],
              [quest.location.latitude, quest.location.longitude]
            );
            const distanceMiles = distance * 0.621371;

            if (distanceMiles <= radiusMiles) {
              quests.push(quest);
            }
          }
        }
      });

      console.log(`✅ [QuestLoader] Loaded ${quests.length} dynamic quests`);
      setDynamicQuests(quests);

    } catch (error) {
      console.error('❌ [QuestLoader] Error loading dynamic quests:', error);
      // Don't fail completely, just set empty array
      setDynamicQuests([]);
    }
  }, [latitude, longitude, radiusMiles, db]);

  /**
   * Load world events (global/promoted quests)
   */
  const loadWorldEvents = useCallback(async () => {
    if (!includeWorldEvents) return;

    try {
      console.log('🌍 [QuestLoader] Loading world events...');

      const worldEventsRef = collection(db, 'worldEvents');
      const now = new Date().toISOString();

      // Query active world events
      const q = query(
        worldEventsRef,
        where('active', '==', true),
        where('endsAt', '>', now),
        limit(10)
      );

      const snapshot = await getDocs(q);

      // Collection might be empty, not an error
      if (snapshot.empty) {
        console.log('ℹ️ [QuestLoader] No world events available');
        setWorldEvents([]);
        return;
      }

      const events: any[] = [];

      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });

      console.log(`✅ [QuestLoader] Loaded ${events.length} world events`);
      setWorldEvents(events);

    } catch (error) {
      console.error('❌ [QuestLoader] Error loading world events:', error);
      // Don't fail completely, just set empty array
      setWorldEvents([]);
    }
  }, [includeWorldEvents, db]);

  /**
   * Check if location has changed significantly (more than 0.5 miles)
   */
  const hasLocationChanged = useCallback(() => {
    if (!lastLoadLocation) return true;

    const distance = distanceBetween(
      [lastLoadLocation.lat, lastLoadLocation.lng],
      [latitude, longitude]
    );
    const distanceMiles = distance * 0.621371;

    return distanceMiles > 0.5; // Reload if moved more than 0.5 miles
  }, [lastLoadLocation, latitude, longitude]);

  /**
   * Load all quests
   */
  const loadQuests = useCallback(async () => {
    // Don't reload if location hasn't changed significantly
    if (!hasLocationChanged()) {
      console.log('📍 [QuestLoader] Location unchanged, skipping reload');
      return;
    }

    setLoading(true);

    try {
      await Promise.all([
        loadStaticQuests(),
        loadDynamicQuests(),
        loadWorldEvents(),
      ]);

      setLastLoadLocation({ lat: latitude, lng: longitude });
    } catch (error) {
      console.error('❌ [QuestLoader] Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  }, [
    latitude,
    longitude,
    loadStaticQuests,
    loadDynamicQuests,
    loadWorldEvents,
    hasLocationChanged,
  ]);

  /**
   * Initial load and reload on location change
   */
  useEffect(() => {
    if (latitude && longitude) {
      loadQuests();
    }
  }, [latitude, longitude, loadQuests]);

  /**
   * Reload quests manually (for "Search Here" button)
   */
  const reloadQuests = useCallback(async (newLat: number, newLng: number) => {
    setLastLoadLocation({ lat: newLat, lng: newLng });
    setLoading(true);

    try {
      // Temporarily update coordinates for query
      const tempOptions = { latitude: newLat, longitude: newLng, radiusMiles, includeWorldEvents };

      await Promise.all([
        loadStaticQuests(),
        loadDynamicQuests(),
        loadWorldEvents(),
      ]);
    } catch (error) {
      console.error('❌ [QuestLoader] Error reloading quests:', error);
    } finally {
      setLoading(false);
    }
  }, [radiusMiles, includeWorldEvents, loadStaticQuests, loadDynamicQuests, loadWorldEvents]);

  return {
    staticQuests,
    dynamicQuests,
    worldEvents,
    loading,
    reloadQuests,
    totalQuests: staticQuests.length + dynamicQuests.length + worldEvents.length,
  };
}

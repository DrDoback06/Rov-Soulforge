import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * Viewport-Based Quest Loading
 * 
 * Loads quests based on the current map viewport
 * Improves performance by only loading relevant quests
 * Perfect for the "Search This Area" feature
 */

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface QuestLoaderOptions {
  viewport: ViewportBounds;
  zoom: number;
  maxQuests?: number;
}

/**
 * Load quests within the current viewport
 * 
 * @param db Firestore instance
 * @param options Viewport and loading options
 * @returns Array of quests within the viewport
 */
export async function loadViewportQuests(
  db: Firestore,
  options: QuestLoaderOptions
): Promise<EnhancedQuest[]> {
  const { viewport, zoom, maxQuests = 50 } = options;
  
  try {
    console.log('🗺️ Loading quests for viewport:', viewport);
    
    // Calculate center point for geohash query
    const centerLat = (viewport.north + viewport.south) / 2;
    const centerLng = (viewport.east + viewport.west) / 2;
    
    // Calculate geohash precision based on zoom level
    // Higher zoom = more precise geohash = smaller area
    const geohashPrecision = Math.min(7, Math.max(3, Math.floor(zoom / 2)));
    
    // Generate geohash for the center point
    const centerGeohash = geohashForLocation([centerLat, centerLng]);
    const geohashPrefix = centerGeohash.substring(0, geohashPrecision);
    
    console.log(`📍 Geohash query: ${geohashPrefix} (precision: ${geohashPrecision})`);
    
    // Query static quests within the geohash area
    const staticQuests = await loadStaticQuestsInViewport(db, geohashPrefix, maxQuests);
    
    // Query local quests within the viewport bounds
    const localQuests = await loadLocalQuestsInViewport(db, viewport, maxQuests);
    
    // Combine and filter by actual viewport bounds
    const allQuests = [...staticQuests, ...localQuests];
    const viewportQuests = filterQuestsByViewport(allQuests, viewport);
    
    console.log(`✅ Loaded ${viewportQuests.length} quests in viewport`);
    return viewportQuests;
    
  } catch (error) {
    console.error('Error loading viewport quests:', error);
    return [];
  }
}

/**
 * Load static quests using geohash prefix
 */
async function loadStaticQuestsInViewport(
  db: Firestore,
  geohashPrefix: string,
  maxQuests: number
): Promise<EnhancedQuest[]> {
  try {
    const staticQuestsRef = collection(db, 'staticQuests');
    const q = query(
      staticQuestsRef,
      where('location.geohash', '>=', geohashPrefix),
      where('location.geohash', '<=', geohashPrefix + '\uf8ff'),
      limit(maxQuests)
    );
    
    const snapshot = await getDocs(q);
    const quests: EnhancedQuest[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      quests.push({
        id: doc.id,
        ...data
      } as EnhancedQuest);
    });
    
    return quests;
  } catch (error) {
    console.error('Error loading static quests in viewport:', error);
    return [];
  }
}

/**
 * Load local quests within viewport bounds
 */
async function loadLocalQuestsInViewport(
  db: Firestore,
  viewport: ViewportBounds,
  maxQuests: number
): Promise<EnhancedQuest[]> {
  try {
    const localQuestsRef = collection(db, 'localQuests');
    const q = query(
      localQuestsRef,
      where('location.latitude', '>=', viewport.south),
      where('location.latitude', '<=', viewport.north),
      where('location.longitude', '>=', viewport.west),
      where('location.longitude', '<=', viewport.east),
      limit(maxQuests)
    );
    
    const snapshot = await getDocs(q);
    const quests: EnhancedQuest[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      quests.push({
        id: doc.id,
        ...data
      } as EnhancedQuest);
    });
    
    return quests;
  } catch (error) {
    console.error('Error loading local quests in viewport:', error);
    return [];
  }
}

/**
 * Filter quests to ensure they're actually within the viewport
 */
function filterQuestsByViewport(quests: EnhancedQuest[], viewport: ViewportBounds): EnhancedQuest[] {
  return quests.filter(quest => {
    const { latitude, longitude } = quest.location;
    return (
      latitude >= viewport.south &&
      latitude <= viewport.north &&
      longitude >= viewport.west &&
      longitude <= viewport.east
    );
  });
}

/**
 * Calculate viewport bounds from map center and zoom
 */
export function calculateViewportBounds(
  centerLat: number,
  centerLng: number,
  zoom: number
): ViewportBounds {
  // Calculate degrees per pixel (approximate)
  const degreesPerPixel = 360 / Math.pow(2, zoom);
  
  // Calculate viewport size based on zoom
  const viewportHeight = degreesPerPixel * 1000; // ~1000px height
  const viewportWidth = degreesPerPixel * 1000;  // ~1000px width
  
  return {
    north: centerLat + (viewportHeight / 2),
    south: centerLat - (viewportHeight / 2),
    east: centerLng + (viewportWidth / 2),
    west: centerLng - (viewportWidth / 2)
  };
}

/**
 * Check if a quest is within the current viewport
 */
export function isQuestInViewport(quest: EnhancedQuest, viewport: ViewportBounds): boolean {
  const { latitude, longitude } = quest.location;
  return (
    latitude >= viewport.south &&
    latitude <= viewport.north &&
    longitude >= viewport.west &&
    longitude <= viewport.east
  );
}

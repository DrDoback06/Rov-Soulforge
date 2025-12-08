/**
 * Point of Interest (POI) Discovery System
 *
 * Handles discovery of new locations, fog of war, and exploration rewards
 */

export interface POI {
  id: string;
  name: string;
  type: 'landmark' | 'dungeon' | 'town' | 'secret' | 'resource';
  location: {
    lat: number;
    lng: number;
  };
  discoveryRadius: number; // meters
  discovered: boolean;
  visitCount: number;
  firstDiscoveryReward?: {
    xp: number;
    gold: number;
    title?: string;
  };
}

export interface ExplorationZone {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  exploredPercent: number; // 0-100
  pois: POI[];
  fog: boolean; // If true, area is hidden until explored
}

/**
 * Check if player is within discovery range of POI
 */
export function isWithinDiscoveryRange(
  playerLocation: { lat: number; lng: number },
  poi: POI
): boolean {
  const distance = calculateDistance(
    playerLocation.lat,
    playerLocation.lng,
    poi.location.lat,
    poi.location.lng
  );
  return distance <= poi.discoveryRadius;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate exploration progress for a zone
 */
export function calculateExplorationProgress(zone: ExplorationZone): number {
  if (zone.pois.length === 0) return 0;

  const discoveredCount = zone.pois.filter(poi => poi.discovered).length;
  return (discoveredCount / zone.pois.length) * 100;
}

/**
 * Get discovery rewards for POI type
 */
export function getDiscoveryReward(poiType: POI['type']): {
  xp: number;
  gold: number;
  title?: string;
} {
  const rewards = {
    landmark: { xp: 50, gold: 25, title: 'Explorer' },
    dungeon: { xp: 100, gold: 50, title: 'Dungeon Delver' },
    town: { xp: 75, gold: 30, title: 'Town Visitor' },
    secret: { xp: 200, gold: 100, title: 'Secret Seeker' },
    resource: { xp: 25, gold: 15 }
  };

  return rewards[poiType];
}

/**
 * Generate nearby POIs based on player location
 */
export function generateNearbyPOIs(
  playerLocation: { lat: number; lng: number },
  radius: number = 1000, // meters
  count: number = 5
): POI[] {
  const pois: POI[] = [];

  for (let i = 0; i < count; i++) {
    // Random angle and distance
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radius;

    // Convert to lat/lng offset (approximation)
    const latOffset = (distance * Math.cos(angle)) / 111320; // 1 degree lat ≈ 111.32km
    const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(playerLocation.lat * Math.PI / 180));

    const poi: POI = {
      id: `poi_${Date.now()}_${i}`,
      name: `Mystery Location ${i + 1}`,
      type: ['landmark', 'dungeon', 'secret', 'resource'][Math.floor(Math.random() * 4)] as POI['type'],
      location: {
        lat: playerLocation.lat + latOffset,
        lng: playerLocation.lng + lngOffset
      },
      discoveryRadius: 50,
      discovered: false,
      visitCount: 0
    };

    pois.push(poi);
  }

  return pois;
}

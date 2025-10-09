import { getDistance } from 'geolib';

/**
 * Distance and ETA calculation utilities for Realm of Valor
 * Used for quest distance, routing, and navigation features
 */

export interface DistanceResult {
  meters: number;
  miles: number;
  km: number;
  feet: number;
}

export interface ETAResult {
  minutes: number;
  hours: number;
  formatted: string; // e.g., "~46 min walk" or "2h 15m walk"
}

export interface StepsResult {
  steps: number;
  formatted: string; // e.g., "3,450 steps"
}

/**
 * Calculate distance between two coordinate points
 * Uses the Haversine formula via geolib
 *
 * @param lat1 - Starting latitude
 * @param lng1 - Starting longitude
 * @param lat2 - Ending latitude
 * @param lng2 - Ending longitude
 * @returns Distance in various units
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): DistanceResult {
  const meters = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );

  return {
    meters,
    miles: meters * 0.000621371,
    km: meters / 1000,
    feet: meters * 3.28084
  };
}

/**
 * Calculate estimated walking time to destination
 * Assumes average walking speed of 3 mph (4.8 km/h)
 *
 * @param distanceMeters - Distance in meters
 * @param speedMph - Optional custom walking speed (default: 3 mph)
 * @returns ETA in minutes and formatted string
 */
export function calculateWalkingETA(
  distanceMeters: number,
  speedMph: number = 3
): ETAResult {
  const distanceMiles = distanceMeters * 0.000621371;
  const hours = distanceMiles / speedMph;
  const totalMinutes = Math.round(hours * 60);

  let formatted: string;

  if (totalMinutes < 1) {
    formatted = '< 1 min walk';
  } else if (totalMinutes < 60) {
    formatted = `~${totalMinutes} min walk`;
  } else {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) {
      formatted = `${hrs}h walk`;
    } else {
      formatted = `${hrs}h ${mins}m walk`;
    }
  }

  return {
    minutes: totalMinutes,
    hours,
    formatted
  };
}

/**
 * Calculate estimated driving time to destination
 * Assumes average driving speed of 30 mph in city
 *
 * @param distanceMeters - Distance in meters
 * @param speedMph - Optional custom driving speed (default: 30 mph)
 * @returns ETA in minutes and formatted string
 */
export function calculateDrivingETA(
  distanceMeters: number,
  speedMph: number = 30
): ETAResult {
  const distanceMiles = distanceMeters * 0.000621371;
  const hours = distanceMiles / speedMph;
  const totalMinutes = Math.round(hours * 60);

  let formatted: string;

  if (totalMinutes < 1) {
    formatted = '< 1 min drive';
  } else if (totalMinutes < 60) {
    formatted = `~${totalMinutes} min drive`;
  } else {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) {
      formatted = `${hrs}h drive`;
    } else {
      formatted = `${hrs}h ${mins}m drive`;
    }
  }

  return {
    minutes: totalMinutes,
    hours,
    formatted
  };
}

/**
 * Calculate estimated cycling time to destination
 * Assumes average cycling speed of 12 mph
 *
 * @param distanceMeters - Distance in meters
 * @param speedMph - Optional custom cycling speed (default: 12 mph)
 * @returns ETA in minutes and formatted string
 */
export function calculateCyclingETA(
  distanceMeters: number,
  speedMph: number = 12
): ETAResult {
  const distanceMiles = distanceMeters * 0.000621371;
  const hours = distanceMiles / speedMph;
  const totalMinutes = Math.round(hours * 60);

  let formatted: string;

  if (totalMinutes < 1) {
    formatted = '< 1 min cycle';
  } else if (totalMinutes < 60) {
    formatted = `~${totalMinutes} min cycle`;
  } else {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) {
      formatted = `${hrs}h cycle`;
    } else {
      formatted = `${hrs}h ${mins}m cycle`;
    }
  }

  return {
    minutes: totalMinutes,
    hours,
    formatted
  };
}

/**
 * Calculate estimated step count for the distance
 * Assumes average step length of 2.5 feet (0.762 meters)
 *
 * @param distanceMeters - Distance in meters
 * @param stepLengthMeters - Optional custom step length (default: 0.762m)
 * @returns Step count and formatted string
 */
export function calculateSteps(
  distanceMeters: number,
  stepLengthMeters: number = 0.762
): StepsResult {
  const steps = Math.round(distanceMeters / stepLengthMeters);

  // Format with commas (e.g., "3,450")
  const formatted = `${steps.toLocaleString()} steps`;

  return {
    steps,
    formatted
  };
}

/**
 * Format distance for display
 * Automatically chooses the most appropriate unit
 *
 * @param distanceMeters - Distance in meters
 * @param preferredUnit - Optional preferred unit (default: auto-detect)
 * @returns Formatted distance string
 */
export function formatDistance(
  distanceMeters: number,
  preferredUnit: 'miles' | 'km' | 'auto' = 'auto'
): string {
  const miles = distanceMeters * 0.000621371;
  const km = distanceMeters / 1000;
  const feet = distanceMeters * 3.28084;

  // Auto-detect best unit
  if (preferredUnit === 'auto') {
    if (distanceMeters < 100) {
      // Use feet for very short distances
      return `${Math.round(feet)} ft`;
    } else if (miles < 0.1) {
      // Use feet for short distances
      return `${Math.round(feet)} ft`;
    } else if (miles < 10) {
      // Use miles with 1 decimal for medium distances
      return `${miles.toFixed(1)} mi`;
    } else {
      // Use miles without decimals for long distances
      return `${Math.round(miles)} mi`;
    }
  }

  // Use preferred unit
  if (preferredUnit === 'miles') {
    if (miles < 0.1) {
      return `${Math.round(feet)} ft`;
    } else if (miles < 10) {
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${Math.round(miles)} mi`;
    }
  } else {
    // km
    if (km < 1) {
      return `${Math.round(distanceMeters)} m`;
    } else if (km < 10) {
      return `${km.toFixed(1)} km`;
    } else {
      return `${Math.round(km)} km`;
    }
  }
}

/**
 * Check if a location is within a certain radius of another location
 *
 * @param lat1 - Center point latitude
 * @param lng1 - Center point longitude
 * @param lat2 - Test point latitude
 * @param lng2 - Test point longitude
 * @param radiusMeters - Radius in meters
 * @returns True if point is within radius
 */
export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMeters: number
): boolean {
  const distance = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );

  return distance <= radiusMeters;
}

/**
 * Get the bearing (compass direction) from one point to another
 *
 * @param lat1 - Starting latitude
 * @param lng1 - Starting longitude
 * @param lat2 - Ending latitude
 * @param lng2 - Ending longitude
 * @returns Bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360

  return bearing;
}

/**
 * Convert bearing to cardinal direction (N, NE, E, SE, S, SW, W, NW)
 *
 * @param bearing - Bearing in degrees (0-360)
 * @returns Cardinal direction string
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Get direction emoji arrow based on bearing
 *
 * @param bearing - Bearing in degrees (0-360)
 * @returns Arrow emoji pointing in the direction
 */
export function bearingToArrow(bearing: number): string {
  const arrows = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
  const index = Math.round(bearing / 45) % 8;
  return arrows[index];
}

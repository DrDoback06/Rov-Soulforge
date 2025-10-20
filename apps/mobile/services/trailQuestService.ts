import type { Trail } from '@/types/trail';
import type { EnhancedQuest, QuestObjective } from '@/types/quest-enhanced';
import { UK_TRAILS } from '@/data/ukTrails';

/**
 * Trail Quest Service
 * 
 * Generates repeatable quests from trails
 * Integrates with quest system, leaderboards, and rewards
 */

export class TrailQuestService {
  /**
   * Generate quest from trail
   */
  static generateQuestFromTrail(trail: Trail): EnhancedQuest {
    const objectives = this.createObjectivesFromTrail(trail);
    const rewards = this.calculateRewards(trail);

    return {
      id: trail.questId || `trail_quest_${trail.id}`,
      title: trail.name,
      description: trail.description,
      type: 'Physical', // Fitness quest type
      rarity: this.getDifficultyRarity(trail.difficulty),
      dynamic: false, // Trails are static locations
      placeType: 'Trail',
      timerSec: this.estimateTimeSeconds(trail.metadata.estimatedTime),
      latitude: trail.startLocation.latitude,
      longitude: trail.startLocation.longitude,
      objectives,
      rewards,
      icon: this.getTrailIcon(trail),
      status: 'active',
      spawnedAt: Date.now(),
      expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year (permanent)
      metadata: {
        trail: trail.id,
        isTrail: true,
        distance: trail.distance,
        elevationGain: trail.elevationGain,
        difficulty: trail.difficulty,
        type: trail.type,
      },
    };
  }

  /**
   * Create objectives for trail quest
   */
  private static createObjectivesFromTrail(trail: Trail): QuestObjective[] {
    const objectives: QuestObjective[] = [];

    // Main objective: Complete the trail
    objectives.push({
      id: 'complete_trail',
      type: 'fitness',
      description: `Complete the ${trail.name} trail`,
      target: trail.distance,
      current: 0,
      completed: false,
      metadata: {
        activityType: trail.type.toLowerCase(),
        minDistance: trail.distance * 0.9, // Allow 10% variance
        geofences: trail.waypoints.map(wp => ({
          latitude: wp.latitude,
          longitude: wp.longitude,
          radius: 50, // 50m tolerance
          name: wp.name,
        })),
      },
    });

    // Elevation objective if significant
    if (trail.elevationGain > 200) {
      objectives.push({
        id: 'elevation_gain',
        type: 'fitness',
        description: `Gain ${trail.elevationGain}m elevation`,
        target: trail.elevationGain,
        current: 0,
        completed: false,
      });
    }

    // Waypoint objectives for longer trails
    if (trail.waypoints.length > 2) {
      trail.waypoints.slice(1, -1).forEach((waypoint, index) => {
        if (waypoint.name) {
          objectives.push({
            id: `waypoint_${index}`,
            type: 'defend', // Using defend type for location check-ins
            description: `Reach ${waypoint.name}`,
            target: 1,
            current: 0,
            completed: false,
            metadata: {
              location: {
                latitude: waypoint.latitude,
                longitude: waypoint.longitude,
                radius: 50,
              },
            },
          });
        }
      });
    }

    return objectives;
  }

  /**
   * Calculate rewards based on trail difficulty and length
   */
  private static calculateRewards(trail: Trail) {
    // Base rewards from difficulty
    let goldBase = 0;
    let xpBase = 0;

    switch (trail.difficulty) {
      case 'Easy':
        goldBase = 25;
        xpBase = 50;
        break;
      case 'Moderate':
        goldBase = 50;
        xpBase = 100;
        break;
      case 'Hard':
        goldBase = 100;
        xpBase = 200;
        break;
      case 'Expert':
        goldBase = 200;
        xpBase = 400;
        break;
    }

    // Scale by distance (every 5km adds 20%)
    const distanceMultiplier = 1 + Math.floor(trail.distance / 5000) * 0.2;

    // Scale by elevation (every 500m adds 15%)
    const elevationMultiplier = 1 + Math.floor(trail.elevationGain / 500) * 0.15;

    const totalMultiplier = distanceMultiplier * elevationMultiplier;

    const gold = Math.floor(goldBase * totalMultiplier);
    const xp = Math.floor(xpBase * totalMultiplier);

    return {
      gold,
      xp,
      renown: Math.floor(xp * 0.2), // 20% of XP as renown
      items: [], // Cards added for first 5 completions by repeatable system
    };
  }

  /**
   * Get rarity from difficulty
   */
  private static getDifficultyRarity(difficulty: string): 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' {
    switch (difficulty) {
      case 'Easy':
        return 'Common';
      case 'Moderate':
        return 'Uncommon';
      case 'Hard':
        return 'Rare';
      case 'Expert':
        return 'Epic';
      default:
        return 'Common';
    }
  }

  /**
   * Estimate time in seconds from string
   */
  private static estimateTimeSeconds(timeString: string): number {
    // Parse strings like "4-6 hours", "1.5 hours", "45 minutes"
    const hoursMatch = timeString.match(/(\d+(?:\.\d+)?)-?(\d+(?:\.\d+)?)?\s*hours?/i);
    const minutesMatch = timeString.match(/(\d+)\s*minutes?/i);

    if (hoursMatch) {
      const avgHours = hoursMatch[2] 
        ? (parseFloat(hoursMatch[1]) + parseFloat(hoursMatch[2])) / 2 
        : parseFloat(hoursMatch[1]);
      return avgHours * 3600;
    }

    if (minutesMatch) {
      return parseInt(minutesMatch[1]) * 60;
    }

    // Default to 2 hours
    return 7200;
  }

  /**
   * Get icon for trail type
   */
  private static getTrailIcon(trail: Trail): string {
    if (trail.tags.includes('mountain') || trail.tags.includes('summit')) return '🏔️';
    if (trail.tags.includes('waterfall')) return '💧';
    if (trail.tags.includes('lake') || trail.tags.includes('loch')) return '🏞️';
    if (trail.tags.includes('coastal') || trail.tags.includes('beach')) return '🌊';
    if (trail.tags.includes('forest') || trail.tags.includes('woodland')) return '🌲';
    if (trail.type === 'Running') return '🏃';
    if (trail.type === 'Cycling') return '🚴';
    return '🥾'; // Default hiking icon
  }

  /**
   * Get all trail quests near a location
   */
  static getTrailQuestsNear(
    location: { latitude: number; longitude: number },
    radiusKm: number = 50
  ): EnhancedQuest[] {
    // Get trails near location
    const nearbyTrails = UK_TRAILS.filter(trail => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        trail.startLocation.latitude,
        trail.startLocation.longitude
      );
      return distance <= radiusKm;
    });

    // Convert to quests
    return nearbyTrails.map(trail => this.generateQuestFromTrail(trail));
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

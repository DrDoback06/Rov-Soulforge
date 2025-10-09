import { geohashForLocation } from 'geofire-common';
import type { EnhancedQuest } from '@/types/quest-enhanced';

/**
 * Quest Generator - Procedurally generate quests based on location
 *
 * Quest Types:
 * - Local: Static global quests at landmarks (all players see same)
 * - Dynamic: Timed personal quests (unique per player, expire)
 * - World Events: Global time-limited events (all players see same)
 */

interface LocationContext {
  latitude: number;
  longitude: number;
  placeName?: string;
  placeType?: 'city' | 'town' | 'landmark' | 'rural' | 'park';
}

/**
 * Get a random offset for quest location (within ~3km radius)
 */
function getRandomOffset(): { lat: number; lng: number } {
  // Random angle
  const angle = Math.random() * 2 * Math.PI;
  // Random distance (0-3km, converted to degrees)
  const distance = Math.random() * 0.027; // ~3km in degrees

  return {
    lat: Math.cos(angle) * distance,
    lng: Math.sin(angle) * distance
  };
}

/**
 * Generate a static local quest for a specific location
 * These are saved globally so all players see the same quest
 */
export function generateLocalQuest(context: LocationContext): EnhancedQuest {
  // Add random offset to spread quests around the area
  const offset = getRandomOffset();
  const questLat = context.latitude + offset.lat;
  const questLng = context.longitude + offset.lng;

  const questTemplates = [
    {
      title: `Defend ${context.placeName || 'the Area'}`,
      description: `Protect ${context.placeName || 'this location'} from incoming threats. Defeat 10 enemies to complete this quest.`,
      icon: '⚔️',
      difficulty: 'medium' as const,
      objectives: [
        {
          id: 'defeat-enemies',
          description: 'Defeat 10 enemies',
          type: 'defeat' as const,
          target: 'enemies',
          required: 10,
          completed: false,
          progress: 0
        }
      ],
      rewards: {
        xp: 500,
        gold: 250,
        items: []
      }
    },
    {
      title: `Explore ${context.placeName || 'the Region'}`,
      description: `Discover hidden secrets around ${context.placeName || 'this area'}. Find 5 hidden caches.`,
      icon: '🗺️',
      difficulty: 'easy' as const,
      objectives: [
        {
          id: 'find-caches',
          description: 'Find 5 hidden caches',
          type: 'collect' as const,
          target: 'caches',
          required: 5,
          completed: false,
          progress: 0
        }
      ],
      rewards: {
        xp: 300,
        gold: 150,
        items: []
      }
    },
    {
      title: `Champion of ${context.placeName || 'the Realm'}`,
      description: `Prove your worth in ${context.placeName || 'this location'}. Complete a series of challenges.`,
      icon: '👑',
      difficulty: 'hard' as const,
      objectives: [
        {
          id: 'complete-challenges',
          description: 'Complete 3 challenges',
          type: 'complete' as const,
          target: 'challenges',
          required: 3,
          completed: false,
          progress: 0
        }
      ],
      rewards: {
        xp: 1000,
        gold: 500,
        items: []
      },
      isBoss: true
    }
  ];

  const template = questTemplates[Math.floor(Math.random() * questTemplates.length)];
  const geohash = geohashForLocation([questLat, questLng]);

  return {
    id: `local_${geohash}_${Date.now()}`,
    ...template,
    location: {
      latitude: questLat,
      longitude: questLng,
      placeName: context.placeName,
      radius: 100 // 100 meters to complete
    },
    geohash,
    type: 'local',
    createdAt: new Date().toISOString(),
    cooldownHours: 24, // Can repeat once per day
    isLegendary: false,
    color: '#4488ff'
  };
}

/**
 * Generate dynamic personal quests
 * These are time-limited and unique to each player
 */
export function generateDynamicQuests(context: LocationContext, count: number = 3): any[] {
  const dynamicTemplates = [
    {
      title: 'Patrol Duty',
      description: 'Patrol the area and defeat any enemies you encounter.',
      icon: '🛡️',
      durationHours: 2,
      rewards: { xp: 200, gold: 100 }
    },
    {
      title: 'Treasure Hunt',
      description: 'A mysterious treasure is hidden nearby. Find it before time runs out!',
      icon: '💰',
      durationHours: 4,
      rewards: { xp: 400, gold: 300 }
    },
    {
      title: 'Speed Challenge',
      description: 'Complete objectives as fast as possible for bonus rewards.',
      icon: '⚡',
      durationHours: 1,
      rewards: { xp: 500, gold: 200 }
    }
  ];

  const quests: any[] = [];

  for (let i = 0; i < count; i++) {
    const template = dynamicTemplates[Math.floor(Math.random() * dynamicTemplates.length)];
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + template.durationHours * 60 * 60 * 1000);

    quests.push({
      id: `dynamic_${context.latitude}_${context.longitude}_${Date.now()}_${i}`,
      title: template.title,
      description: template.description,
      icon: template.icon,
      location: {
        latitude: context.latitude,
        longitude: context.longitude,
        radius: 1000 // 1km radius
      },
      rewards: template.rewards,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      type: 'dynamic'
    });
  }

  return quests;
}

/**
 * Generate world events
 * These are major global events all players can see
 */
export function generateWorldEvent(eventType?: 'dragon' | 'invasion' | 'festival'): any {
  const events = {
    dragon: {
      title: 'Dragon Attack!',
      description: 'A fearsome dragon threatens the realm! Join forces with other players to defeat it.',
      icon: '🐉',
      durationHours: 12,
      rewards: { xp: 2000, gold: 1000 }
    },
    invasion: {
      title: 'Enemy Invasion',
      description: 'An army of enemies is invading! Defend the realm alongside fellow adventurers.',
      icon: '⚔️',
      durationHours: 6,
      rewards: { xp: 1500, gold: 750 }
    },
    festival: {
      title: 'Festival of Valor',
      description: 'Join the celebration! Complete special festival activities for unique rewards.',
      icon: '🎉',
      durationHours: 24,
      rewards: { xp: 1000, gold: 500 }
    }
  };

  const type = eventType || (['dragon', 'invasion', 'festival'][Math.floor(Math.random() * 3)] as keyof typeof events);
  const event = events[type];
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + event.durationHours * 60 * 60 * 1000);

  return {
    id: `worldevent_${type}_${Date.now()}`,
    ...event,
    type: 'worldEvent',
    active: true,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

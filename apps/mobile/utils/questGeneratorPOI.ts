import { geohashForLocation } from 'geofire-common';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { fetchPOIs, getQuestTypeForPOI, type POI } from './poiService';

/**
 * Generate quests at REAL POI locations (parks, landmarks, etc.)
 */
export async function generateQuestsAtPOIs(
  latitude: number,
  longitude: number,
  count: number = 10
): Promise<EnhancedQuest[]> {
  console.log(`🔍 Fetching POIs near ${latitude}, ${longitude}...`);

  // Fetch real POIs from OpenStreetMap
  const pois = await fetchPOIs(latitude, longitude, 5000);

  if (pois.length === 0) {
    console.warn('⚠️ No POIs found, falling back to random generation');
    return [];
  }

  const quests: EnhancedQuest[] = [];

  // Generate quests at POI locations
  for (let i = 0; i < Math.min(count, pois.length); i++) {
    const poi = pois[i];
    const quest = generateQuestForPOI(poi);
    quests.push(quest);
  }

  console.log(`✅ Generated ${quests.length} quests at real POI locations`);
  return quests;
}

/**
 * Generate a quest tailored to a specific POI type
 */
function generateQuestForPOI(poi: POI): EnhancedQuest {
  const questType = getQuestTypeForPOI(poi.type);
  const geohash = geohashForLocation([poi.latitude, poi.longitude]);

  // Quest templates by type
  const templates = {
    combat: {
      title: `Defend ${poi.name}`,
      description: `Dark forces threaten ${poi.name}! Defeat 10 enemies to protect this sacred place.`,
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
      rewards: { xp: 500, gold: 250, items: [] }
    },
    exploration: {
      title: `Explore ${poi.name}`,
      description: `Discover the hidden secrets of ${poi.name}. Find 5 ancient artifacts.`,
      icon: '🗺️',
      difficulty: 'easy' as const,
      objectives: [
        {
          id: 'find-artifacts',
          description: 'Find 5 artifacts',
          type: 'collect' as const,
          target: 'artifacts',
          required: 5,
          completed: false,
          progress: 0
        }
      ],
      rewards: { xp: 300, gold: 150, items: [] }
    },
    challenge: {
      title: `${poi.name} Challenge`,
      description: `Complete a physical challenge at ${poi.name}. Walk 2km within the area.`,
      icon: '🏃',
      difficulty: 'medium' as const,
      objectives: [
        {
          id: 'walk-distance',
          description: 'Walk 2km',
          type: 'walk' as const,
          target: 'distance',
          required: 2000,
          completed: false,
          progress: 0
        }
      ],
      rewards: { xp: 400, gold: 200, items: [] }
    },
    defend: {
      title: `Conquer ${poi.name}`,
      description: `Claim ${poi.name} for your faction! Defend it against other players.`,
      icon: '🏰',
      difficulty: 'hard' as const,
      objectives: [
        {
          id: 'hold-position',
          description: 'Hold the position for 10 minutes',
          type: 'defend' as const,
          target: 'time',
          required: 600,
          completed: false,
          progress: 0
        }
      ],
      rewards: { xp: 1000, gold: 500, items: [] },
      isBoss: true,
      pvpEnabled: true
    },
    collection: {
      title: `Gather at ${poi.name}`,
      description: `Visit ${poi.name} and collect special items found only here.`,
      icon: '🎁',
      difficulty: 'easy' as const,
      objectives: [
        {
          id: 'collect-items',
          description: 'Collect 3 special items',
          type: 'collect' as const,
          target: 'items',
          required: 3,
          completed: false,
          progress: 0
        }
      ],
      rewards: { xp: 250, gold: 125, items: [] }
    }
  };

  const template = templates[questType];

  return {
    id: `poi_${poi.id}_${Date.now()}`,
    ...template,
    location: {
      latitude: poi.latitude,
      longitude: poi.longitude,
      placeName: poi.name,
      radius: 100 // 100 meters to complete
    },
    poiType: poi.type,
    poiSubtype: poi.subtype,
    geohash,
    type: 'local',
    createdAt: new Date().toISOString(),
    cooldownHours: 24,
    isLegendary: poi.type === 'castle' || poi.type === 'monument',
    color: getColorForPOIType(poi.type)
  };
}

function getColorForPOIType(poiType: string): string {
  const colors: Record<string, string> = {
    park: '#22c55e', // Green
    landmark: '#3b82f6', // Blue
    historical: '#8b5cf6', // Purple
    pub: '#f59e0b', // Orange
    cafe: '#f59e0b',
    restaurant: '#f59e0b',
    trail: '#10b981', // Emerald
    viewpoint: '#06b6d4', // Cyan
    monument: '#fbbf24', // Amber
    castle: '#dc2626', // Red
    museum: '#8b5cf6', // Purple
    church: '#a855f7', // Purple
    stadium: '#ef4444' // Red
  };

  return colors[poiType] || '#4488ff';
}

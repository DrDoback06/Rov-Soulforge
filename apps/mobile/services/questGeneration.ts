import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { EnhancedQuest } from '@/types/quest-enhanced';
// import { seedUKStaticQuests } from './ukStaticQuests';

/**
 * Quest Generation Service
 * 
 * Generates 3 types of quests:
 * - Static: Epic UK landmarks (permanent, global)
 * - Local: Nearby landmarks (2 week lifespan, global after first load)
 * - Dynamic: Player-specific quests (private)
 */

interface Location {
  latitude: number;
  longitude: number;
}

interface Landmark {
  name: string;
  location: Location;
  type: string;
  placeId?: string;
}

/**
 * Generate Static Quests (Epic UK Landmarks)
 * These never expire and are visible to all players
 */
export async function generateStaticQuests(
  db: Firestore,
  playerLocation: Location,
  playerLevel: number
): Promise<EnhancedQuest[]> {
  try {
    // Load all static quests (no complex query needed)
    const snapshot = await getDocs(collection(db, 'staticQuests'));

    // If no static quests exist, seed them
    if (snapshot.empty) {
      console.log('📍 No static quests found, seeding UK landmarks...');
      // await seedUKStaticQuests(db);
      console.log('📍 UK static quests seeding temporarily disabled');
      
      // Reload after seeding
      const reloadSnapshot = await getDocs(collection(db, 'staticQuests'));
      const staticQuests: EnhancedQuest[] = [];
      reloadSnapshot.forEach(doc => {
        const data = doc.data();
        staticQuests.push({
          id: doc.id,
          ...data
        } as EnhancedQuest);
      });
      return staticQuests;
    }

    // Load static quests (show big epic ones regardless of distance)
    const staticQuests: EnhancedQuest[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      staticQuests.push({
        id: doc.id,
        ...data
      } as EnhancedQuest);
    });

    console.log(`📍 Loaded ${staticQuests.length} static quests`);
    return staticQuests;
  } catch (error) {
    console.error('Error generating static quests:', error);
    return [];
  }
}

/**
 * Generate Local Quests (Nearby landmarks, global after first load)
 * Lifespan: 2 weeks, then refreshed
 */
export async function generateLocalQuests(
  db: Firestore,
  playerLocation: Location,
  playerLevel: number,
  userId: string
): Promise<EnhancedQuest[]> {
  try {
    const radiusMeters = 8000; // ~5 miles

    // Load all local quests and filter client-side
    const snapshot = await getDocs(collection(db, 'localQuests'));

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const existingQuests: EnhancedQuest[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Check if quest is within radius
      if (data.location) {
        const distance = calculateDistance(
          playerLocation,
          { latitude: data.location.latitude, longitude: data.location.longitude }
        );
        
        if (distance <= radiusMeters) {
          // Check if quest is still valid (less than 2 weeks old)
          const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
          if (createdAt > twoWeeksAgo) {
            existingQuests.push({
              id: doc.id,
              ...data
            } as EnhancedQuest);
          }
        }
      }
    });

    console.log(`📍 Found ${existingQuests.length} existing local quests within ${radiusMeters}m`);

    // If we have enough local quests, return them
    if (existingQuests.length >= 5) {
      return existingQuests;
    }

    // Otherwise, generate new local quests using Google Places
    const landmarks = await fetchNearbyLandmarks(playerLocation, radiusMeters);
    const newQuests: EnhancedQuest[] = [];

    for (const landmark of landmarks.slice(0, 10 - existingQuests.length)) {
      const quest = createQuestFromLandmark(landmark, playerLevel, 'local');
      
      // Add to Firestore (global for all players)
      const docRef = await addDoc(collection(db, 'localQuests'), {
        ...quest,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
      });

      newQuests.push({ ...quest, id: docRef.id });
    }

    return [...existingQuests, ...newQuests];
  } catch (error) {
    console.error('Error generating local quests:', error);
    return [];
  }
}

/**
 * Generate Dynamic Quests (Player-specific, private)
 */
export async function generateDynamicQuests(
  db: Firestore,
  playerLocation: Location,
  playerLevel: number,
  userId: string
): Promise<EnhancedQuest[]> {
  try {
    // Check for existing dynamic quests for this player
    const dynamicQuery = query(
      collection(db, 'dynamicQuests'),
      where('userId', '==', userId)
    );
    const existing = await getDocs(dynamicQuery);

    const existingQuests: EnhancedQuest[] = [];
    existing.forEach(doc => {
      const data = doc.data();
      // Filter for active quests client-side
      if (data.status === 'active' || !data.status) {
        existingQuests.push({
          id: doc.id,
          ...data
        } as EnhancedQuest);
      }
    });

    console.log(`📍 Found ${existingQuests.length} existing dynamic quests for user`);

    // Generate new dynamic quests if needed (maintain 5-10)
    if (existingQuests.length >= 5) {
      return existingQuests;
    }

    const radiusMeters = 8000; // ~5 miles
    const landmarks = await fetchNearbyLandmarks(playerLocation, radiusMeters);
    const newQuests: EnhancedQuest[] = [];

    for (const landmark of landmarks.slice(0, 5 - existingQuests.length)) {
      const quest = createQuestFromLandmark(landmark, playerLevel, 'dynamic');
      
      // Add to Firestore (private to player)
      const docRef = await addDoc(collection(db, 'dynamicQuests'), {
        ...quest,
        userId,
        status: 'active',
        createdAt: serverTimestamp()
      });

      newQuests.push({ ...quest, id: docRef.id });
    }

    return [...existingQuests, ...newQuests];
  } catch (error) {
    console.error('Error generating dynamic quests:', error);
    return [];
  }
}

/**
 * Fetch nearby landmarks using Google Places API
 */
async function fetchNearbyLandmarks(
  location: Location,
  radius: number
): Promise<Landmark[]> {
  try {
    // TODO: Implement Google Places API call
    // For now, return mock data
    return generateMockLandmarks(location);
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    return generateMockLandmarks(location);
  }
}

/**
 * Generate mock landmarks for testing
 */
function generateMockLandmarks(location: Location): Landmark[] {
  const types = ['park', 'museum', 'restaurant', 'cafe', 'gym', 'trail', 'monument'];
  const landmarks: Landmark[] = [];

  for (let i = 0; i < 10; i++) {
    const offsetLat = (Math.random() - 0.5) * 0.05; // ~5km range
    const offsetLng = (Math.random() - 0.5) * 0.05;

    landmarks.push({
      name: `${types[i % types.length]} ${i + 1}`,
      location: {
        latitude: location.latitude + offsetLat,
        longitude: location.longitude + offsetLng
      },
      type: types[i % types.length]
    });
  }

  return landmarks;
}

/**
 * Create quest from landmark
 */
function createQuestFromLandmark(
  landmark: Landmark,
  playerLevel: number,
  questType: 'static' | 'local' | 'dynamic'
): Omit<EnhancedQuest, 'id'> {
  const difficulties = ['easy', 'medium', 'hard', 'epic', 'legendary'];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)] as any;

  // Scale rewards based on difficulty and type
  const baseGold = questType === 'static' ? 1000 : 100;
  const baseXP = questType === 'static' ? 500 : 50;
  
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    epic: 3,
    legendary: 5
  }[difficulty];

  return {
    title: `${landmark.type === 'monument' ? 'Epic' : ''} ${landmark.name}`,
    description: `Visit ${landmark.name} and complete the challenge`,
    type: questType === 'static' ? 'main' : questType === 'local' ? 'world' : 'side',
    difficulty,
    location: landmark.location,
    icon: getQuestIcon(landmark.type),
    objectives: [
      {
        id: '1',
        type: 'travel',
        description: `Travel to ${landmark.name}`,
        targetLocation: landmark.location,
        radius: 50,
        completed: false,
        required: true
      }
    ],
    rewards: {
      gold: Math.floor(baseGold * difficultyMultiplier),
      xp: Math.floor(baseXP * difficultyMultiplier),
      renown: Math.floor(10 * difficultyMultiplier),
      items: []
    },
    requirements: {
      minLevel: Math.max(1, playerLevel - 2),
      maxLevel: playerLevel + 2
    }
  };
}

/**
 * Get quest icon based on landmark type
 */
function getQuestIcon(type: string): string {
  const icons: Record<string, string> = {
    park: '🌳',
    museum: '🏛️',
    restaurant: '🍽️',
    cafe: '☕',
    gym: '💪',
    trail: '🥾',
    monument: '🗿',
    mountain: '⛰️',
    castle: '🏰',
    church: '⛪'
  };
  return icons[type] || '🎯';
}

/**
 * Calculate distance between two points (Haversine)
 */
function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Seed UK Static Quests (Epic Landmarks)
 */
async function seedUKStaticQuests(db: Firestore) {
  const ukLandmarks = [
    { name: 'Snowdon Summit', lat: 53.0685, lng: -4.0763, type: 'mountain' },
    { name: 'Ben Nevis', lat: 56.7969, lng: -5.0038, type: 'mountain' },
    { name: 'Scafell Pike', lat: 54.4542, lng: -3.2119, type: 'mountain' },
    { name: 'Stonehenge', lat: 51.1789, lng: -1.8262, type: 'monument' },
    { name: 'Edinburgh Castle', lat: 55.9486, lng: -3.1999, type: 'castle' },
    { name: 'Tower of London', lat: 51.5081, lng: -0.0759, type: 'castle' },
    { name: 'Lake District', lat: 54.4609, lng: -3.0886, type: 'trail' },
    { name: 'Giant\'s Causeway', lat: 55.2408, lng: -6.5116, type: 'monument' },
    { name: 'White Cliffs of Dover', lat: 51.1244, lng: 1.3733, type: 'trail' },
    { name: 'Hadrian\'s Wall', lat: 55.0244, lng: -2.2916, type: 'monument' }
  ];

  for (const landmark of ukLandmarks) {
    const quest = createQuestFromLandmark(
      {
        name: landmark.name,
        location: { latitude: landmark.lat, longitude: landmark.lng },
        type: landmark.type
      },
      50, // High level for epic quests
      'static'
    );

    await addDoc(collection(db, 'staticQuests'), {
      ...quest,
      isPermanent: true,
      isEpic: true,
      createdAt: serverTimestamp()
    });
  }

  console.log('✅ Seeded UK static quests');
}

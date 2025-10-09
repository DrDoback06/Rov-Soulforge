/**
 * Test Quest Seeder
 *
 * Seeds Firestore with a variety of test quests to demonstrate all quest types
 * Run with: npx ts-node scripts/seedTestQuests.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';

// Firebase config - use your project's config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_WEB
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Test quest locations (Northampton, UK area)
 */
const TEST_LOCATIONS = [
  { name: 'Northampton Market Square', lat: 52.2405, lng: -0.9027 },
  { name: 'Delapre Abbey', lat: 52.2233, lng: -0.8829 },
  { name: 'Abington Park', lat: 52.2500, lng: -0.8833 },
  { name: 'Billing Aquadrome', lat: 52.2167, lng: -0.8333 },
  { name: 'Salcey Forest', lat: 52.1167, lng: -0.8333 }
];

/**
 * Battle Quest - Defeat 10 enemies
 */
async function createBattleQuest() {
  const location = TEST_LOCATIONS[0]; // Market Square
  const geohash = geohashForLocation([location.lat, location.lng]);

  return await addDoc(collection(db, 'staticQuests'), {
    type: 'landmark',
    difficulty: 'medium',
    status: 'available',
    visibility: 'static',
    title: 'Market Square Defense',
    description: 'Dark creatures have invaded Northampton Market Square! Defeat 10 enemies to restore peace.',
    lore: 'The ancient market square has been a gathering place for centuries. Now, sinister forces threaten its sanctity.',
    location: {
      latitude: location.lat,
      longitude: location.lng,
      geohash,
      name: location.name,
      type: 'landmark'
    },
    activationRadius: 100,
    acceptRadius: 50,
    objectives: [
      {
        id: 'defeat-enemies',
        type: 'battle',
        description: 'Defeat 10 enemies',
        target: 10,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          enemyTypes: ['goblin', 'orc', 'troll'],
          enemyCount: 10,
          spawnedEnemies: []
        }
      }
    ],
    rewards: {
      gold: 500,
      xp: 1000,
      items: [
        {
          id: 'unidentified_weapon_1',
          type: 'unidentified',
          rarity: 'rare',
          quantity: 1,
          needsIdentification: true
        }
      ],
      titles: [],
      badges: []
    },
    requiredLevel: 1,
    recommendedLevel: 5,
    spawnedAt: new Date(),
    maxPlayers: 4,
    coopBonusPerPlayer: 25,
    isLegendary: false,
    isBoss: false,
    isSeasonal: false,
    icon: '⚔️',
    color: '#ef4444',
    pulseEffect: false,
    tags: ['combat', 'beginner-friendly'],
    createdBy: 'system',
    completionCount: 0
  });
}

/**
 * Fitness Quest - Complete a workout
 */
async function createFitnessQuest() {
  const location = TEST_LOCATIONS[2]; // Abington Park
  const geohash = geohashForLocation([location.lat, location.lng]);

  return await addDoc(collection(db, 'staticQuests'), {
    type: 'landmark',
    difficulty: 'easy',
    status: 'available',
    visibility: 'static',
    title: 'Abington Park WOD',
    description: 'Complete the Workout of the Day at Abington Park to prove your strength!',
    lore: 'Warriors train their bodies as much as their minds. Only the fit survive the challenges ahead.',
    location: {
      latitude: location.lat,
      longitude: location.lng,
      geohash,
      name: location.name,
      type: 'poi'
    },
    activationRadius: 100,
    acceptRadius: 50,
    objectives: [
      {
        id: 'fitness-wod',
        type: 'fitness',
        description: 'Complete: 20 pushups, 30 situps, 40 squats',
        target: 1,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          fitnessType: 'circuit',
          timeLimit: 600, // 10 minutes
          tracked: false
        }
      }
    ],
    rewards: {
      gold: 300,
      xp: 600,
      items: []
    },
    requiredLevel: 1,
    recommendedLevel: 3,
    spawnedAt: new Date(),
    maxPlayers: 1,
    isLegendary: false,
    isBoss: false,
    isSeasonal: false,
    icon: '🏃',
    color: '#22c55e',
    pulseEffect: false,
    tags: ['fitness', 'solo'],
    createdBy: 'system',
    completionCount: 0
  });
}

/**
 * Legendary Boss Quest
 */
async function createBossQuest() {
  const location = TEST_LOCATIONS[4]; // Salcey Forest
  const geohash = geohashForLocation([location.lat, location.lng]);

  return await addDoc(collection(db, 'staticQuests'), {
    type: 'boss',
    difficulty: 'legendary',
    status: 'available',
    visibility: 'static',
    title: 'The Ancient Guardian of Salcey',
    description: 'A legendary beast has awakened in Salcey Forest! Gather your allies and face this incredible challenge.',
    lore: 'For centuries, the Guardian has slumbered beneath the ancient oaks. Now, disturbed by dark magic, it rises to defend its domain.',
    location: {
      latitude: location.lat,
      longitude: location.lng,
      geohash,
      name: location.name,
      type: 'natural'
    },
    activationRadius: 200,
    acceptRadius: 100,
    objectives: [
      {
        id: 'defeat-boss',
        type: 'battle',
        description: 'Defeat the Ancient Guardian',
        target: 1,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          enemyTypes: ['dragon'],
          enemyCount: 1,
          spawnedEnemies: []
        }
      }
    ],
    rewards: {
      gold: 5000,
      xp: 10000,
      items: [
        {
          id: 'legendary_armor_1',
          type: 'unidentified',
          rarity: 'legendary',
          quantity: 1,
          needsIdentification: true
        },
        {
          id: 'epic_weapon_1',
          type: 'unidentified',
          rarity: 'epic',
          quantity: 1,
          needsIdentification: true
        }
      ],
      titles: ['Guardian Slayer'],
      badges: ['legendary_boss_defeated']
    },
    requiredLevel: 15,
    recommendedLevel: 20,
    spawnedAt: new Date(),
    maxPlayers: 4,
    coopBonusPerPlayer: 25,
    isLegendary: true,
    isBoss: true,
    isSeasonal: false,
    bossPhases: 3,
    icon: '🐉',
    color: '#fbbf24',
    pulseEffect: true,
    tags: ['boss', 'legendary', 'multiplayer'],
    createdBy: 'system',
    completionCount: 0
  });
}

/**
 * Collection Quest
 */
async function createCollectionQuest() {
  const location = TEST_LOCATIONS[1]; // Delapre Abbey
  const geohash = geohashForLocation([location.lat, location.lng]);

  return await addDoc(collection(db, 'staticQuests'), {
    type: 'landmark',
    difficulty: 'easy',
    status: 'available',
    visibility: 'static',
    title: 'Abbey Artifacts',
    description: 'Search Delapre Abbey for 5 ancient artifacts hidden throughout the grounds.',
    lore: 'The Abbey holds many secrets from centuries past. Historians believe valuable artifacts remain undiscovered.',
    location: {
      latitude: location.lat,
      longitude: location.lng,
      geohash,
      name: location.name,
      type: 'landmark'
    },
    activationRadius: 100,
    acceptRadius: 50,
    objectives: [
      {
        id: 'collect-artifacts',
        type: 'collect',
        description: 'Find 5 ancient artifacts',
        target: 5,
        current: 0,
        completed: false,
        order: 1,
        metadata: {
          collectibleItems: ['Ancient Coin', 'Stone Tablet', 'Iron Key', 'Glass Vial', 'Leather Journal']
        }
      }
    ],
    rewards: {
      gold: 400,
      xp: 800,
      items: [
        {
          id: 'magic_item_1',
          type: 'unidentified',
          rarity: 'magic',
          quantity: 1,
          needsIdentification: true
        }
      ]
    },
    requiredLevel: 1,
    recommendedLevel: 4,
    spawnedAt: new Date(),
    maxPlayers: 2,
    coopBonusPerPlayer: 25,
    isLegendary: false,
    isBoss: false,
    isSeasonal: false,
    icon: '🎁',
    color: '#8b5cf6',
    pulseEffect: false,
    tags: ['collection', 'exploration'],
    createdBy: 'system',
    completionCount: 0
  });
}

/**
 * Quest Chain - Part 1
 */
async function createQuestChain() {
  const location = TEST_LOCATIONS[3]; // Billing Aquadrome
  const geohash = geohashForLocation([location.lat, location.lng]);

  const chain1 = await addDoc(collection(db, 'staticQuests'), {
    type: 'chain',
    difficulty: 'medium',
    status: 'available',
    visibility: 'static',
    title: 'The Water\'s Edge - Part 1',
    description: 'Strange occurrences at the Aquadrome. Investigate the area and defeat any threats.',
    lore: 'Locals report seeing mysterious lights over the water at night. Something unnatural lurks here.',
    location: {
      latitude: location.lat,
      longitude: location.lng,
      geohash,
      name: location.name,
      type: 'poi'
    },
    activationRadius: 100,
    acceptRadius: 50,
    objectives: [
      {
        id: 'investigate',
        type: 'travel',
        description: 'Reach the investigation point',
        target: 1,
        current: 0,
        completed: false,
        order: 1
      },
      {
        id: 'defeat-enemies',
        type: 'battle',
        description: 'Defeat 5 water creatures',
        target: 5,
        current: 0,
        completed: false,
        order: 2,
        metadata: {
          enemyTypes: ['elemental'],
          enemyCount: 5
        }
      }
    ],
    rewards: {
      gold: 600,
      xp: 1200,
      items: []
    },
    requiredLevel: 5,
    recommendedLevel: 8,
    spawnedAt: new Date(),
    chainInfo: {
      chainId: 'waters_edge',
      chainName: 'The Water\'s Edge',
      position: 1,
      totalQuests: 3,
      nextQuestId: 'to_be_created'
    },
    maxPlayers: 2,
    coopBonusPerPlayer: 25,
    isLegendary: false,
    isBoss: false,
    isSeasonal: false,
    icon: '🌊',
    color: '#06b6d4',
    pulseEffect: false,
    tags: ['chain', 'story', 'combat'],
    createdBy: 'system',
    completionCount: 0
  });

  console.log('✅ Created quest chain part 1:', chain1.id);
  return chain1;
}

/**
 * Seed all test quests
 */
async function seedAllQuests() {
  console.log('🌱 Starting quest seed...\n');

  try {
    const battle = await createBattleQuest();
    console.log('✅ Created Battle Quest:', battle.id);

    const fitness = await createFitnessQuest();
    console.log('✅ Created Fitness Quest:', fitness.id);

    const boss = await createBossQuest();
    console.log('✅ Created Boss Quest:', boss.id);

    const collection = await createCollectionQuest();
    console.log('✅ Created Collection Quest:', collection.id);

    const chain = await createQuestChain();

    console.log('\n✨ All test quests created successfully!');
    console.log('\n📍 Quest Locations:');
    TEST_LOCATIONS.forEach(loc => {
      console.log(`   - ${loc.name}: ${loc.lat}, ${loc.lng}`);
    });

    console.log('\n🎮 To test quests:');
    console.log('   1. Use LocationSpoofer in the app');
    console.log('   2. Set location near a quest (within 100m)');
    console.log('   3. Quest activation modal should appear');
    console.log('   4. Accept quest and complete objectives!');

  } catch (error) {
    console.error('❌ Error seeding quests:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeder
seedAllQuests();

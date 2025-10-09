/**
 * Fresh Start Script
 *
 * Complete reset for testing:
 * 1. Clears all old quests
 * 2. Resets user data (keeps login)
 * 3. Seeds new test quests with enhanced features
 *
 * Usage: npx ts-node scripts/freshStart.ts <userId>
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

const TEST_LOCATIONS = [
  { name: 'Northampton Market Square', lat: 52.2405, lng: -0.9027 },
  { name: 'Delapre Abbey', lat: 52.2233, lng: -0.8829 },
  { name: 'Abington Park', lat: 52.2500, lng: -0.8833 }
];

async function clearAllQuests() {
  console.log('\n🧹 Step 1: Clearing old quests...\n');

  const collections = ['staticQuests', 'dynamicQuests', 'worldEvents'];
  let total = 0;

  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   ✅ Cleared ${snapshot.size} from ${collectionName}`);
      total += snapshot.size;
    }
  }

  console.log(`   ✨ Total quests cleared: ${total}\n`);
}

async function resetUserData(userId: string) {
  console.log(`🔄 Step 2: Resetting user data for: ${userId}\n`);

  const collections = ['questProgress', 'userInventory', 'userDecks', 'userCards'];
  let total = 0;

  for (const collectionName of collections) {
    try {
      const q = query(
        collection(db, collectionName),
        where(collectionName === 'questProgress' ? 'uid' : 'userId', '==', userId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`   ✅ Cleared ${snapshot.size} from ${collectionName}`);
        total += snapshot.size;
      }
    } catch (error) {
      console.log(`   ⚠️  ${collectionName} - no data or permission issue`);
    }
  }

  console.log(`   ✨ Total user data cleared: ${total}\n`);
}

async function seedNewQuests() {
  console.log('🌱 Step 3: Seeding new enhanced quests...\n');

  // Battle Quest
  const location1 = TEST_LOCATIONS[0];
  await addDoc(collection(db, 'staticQuests'), {
    type: 'landmark',
    difficulty: 'medium',
    status: 'available',
    visibility: 'static',
    title: 'Market Square Defense',
    description: 'Dark creatures have invaded! Defeat 10 enemies to restore peace.',
    lore: 'The market square has been overrun by monsters from the shadow realm.',
    location: {
      latitude: location1.lat,
      longitude: location1.lng,
      geohash: geohashForLocation([location1.lat, location1.lng]),
      name: location1.name,
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
          enemyTypes: ['goblin', 'orc'],
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
          id: 'rare_sword_1',
          type: 'unidentified',
          rarity: 'rare',
          quantity: 1,
          needsIdentification: true
        }
      ]
    },
    requiredLevel: 1,
    recommendedLevel: 5,
    spawnedAt: new Date(),
    maxPlayers: 4,
    coopBonusPerPlayer: 25,
    isLegendary: false,
    isBoss: false,
    icon: '⚔️',
    color: '#ef4444',
    tags: ['combat', 'beginner'],
    createdBy: 'system',
    completionCount: 0
  });
  console.log('   ✅ Created: Market Square Defense (Battle Quest)');

  // Fitness Quest
  const location2 = TEST_LOCATIONS[2];
  await addDoc(collection(db, 'staticQuests'), {
    type: 'landmark',
    difficulty: 'easy',
    status: 'available',
    visibility: 'static',
    title: 'Park Workout Challenge',
    description: 'Complete a workout to prove your strength!',
    lore: 'Warriors train both mind and body.',
    location: {
      latitude: location2.lat,
      longitude: location2.lng,
      geohash: geohashForLocation([location2.lat, location2.lng]),
      name: location2.name,
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
          timeLimit: 600,
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
    icon: '🏃',
    color: '#22c55e',
    tags: ['fitness', 'solo'],
    createdBy: 'system',
    completionCount: 0
  });
  console.log('   ✅ Created: Park Workout Challenge (Fitness Quest)');

  // Collection Quest
  const location3 = TEST_LOCATIONS[1];
  await addDoc(collection(db, 'staticQuests'), {
    type: 'landmark',
    difficulty: 'easy',
    status: 'available',
    visibility: 'static',
    title: 'Ancient Artifacts',
    description: 'Find 5 hidden artifacts in the area.',
    lore: 'Historians believe valuable artifacts remain undiscovered.',
    location: {
      latitude: location3.lat,
      longitude: location3.lng,
      geohash: geohashForLocation([location3.lat, location3.lng]),
      name: location3.name,
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
          id: 'magic_ring',
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
    icon: '🎁',
    color: '#8b5cf6',
    tags: ['collection', 'exploration'],
    createdBy: 'system',
    completionCount: 0
  });
  console.log('   ✅ Created: Ancient Artifacts (Collection Quest)');

  console.log('\n   ✨ Seeded 3 new enhanced quests!\n');
}

async function freshStart(userId: string) {
  console.log('\n🚀 FRESH START - Resetting Everything\n');
  console.log('=' .repeat(50));

  try {
    await clearAllQuests();
    await resetUserData(userId);
    await seedNewQuests();

    console.log('=' .repeat(50));
    console.log('\n✨ FRESH START COMPLETE!\n');
    console.log('📍 Quest Locations:');
    TEST_LOCATIONS.forEach(loc => {
      console.log(`   - ${loc.name}: ${loc.lat}, ${loc.lng}`);
    });
    console.log('\n🎮 Ready to test:');
    console.log('   1. Reload the app');
    console.log('   2. Use LocationSpoofer to go near a quest');
    console.log('   3. Accept quest within 50m');
    console.log('   4. Test battle flow with enemy spawns\n');

  } catch (error) {
    console.error('\n❌ Error during fresh start:', error);
    throw error;
  }
}

const userId = process.argv[2];

if (!userId) {
  console.error('\n❌ Error: User ID is required\n');
  console.log('Usage: npx ts-node scripts/freshStart.ts <userId>\n');
  console.log('Example: npx ts-node scripts/freshStart.ts abc123xyz\n');
  process.exit(1);
}

freshStart(userId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

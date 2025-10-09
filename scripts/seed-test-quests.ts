import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';

// Firebase config from your environment
const firebaseConfig = {
  apiKey: "AIzaSyDCpKhXkXQCrE75XxfU9v9U-y5KXyVi6Lk",
  authDomain: "realm-of-valor-adventure.firebaseapp.com",
  projectId: "realm-of-valor-adventure",
  storageBucket: "realm-of-valor-adventure.firebasestorage.app",
  messagingSenderId: "999257397788",
  appId: "1:999257397788:web:6ab9fac7dda2c8f7bb0de6",
  measurementId: "G-J94XTH3Y7Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test quest locations matching LocationSpoofer presets
// Note: Using simplified quest structure for activeQuests collection (not the full Quest type)
interface SimpleQuest {
  id?: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
  };
  rarity: string;
  rewards: Array<{ type: string; amount: number }>;
  requirements: {
    minLevel: number;
  };
  expires: Date;
}

const testQuests: SimpleQuest[] = [
  {
    title: "Tower of London Mystery",
    description: "Investigate strange occurrences at the historic Tower of London. Rumors speak of ghostly apparitions and hidden treasure.",
    location: {
      latitude: 51.5081,
      longitude: -0.0759,
      geohash: geohashForLocation([51.5081, -0.0759])
    },
    rarity: 'Rare',
    rewards: [
      { type: 'gold', amount: 150 },
      { type: 'xp', amount: 300 }
    ],
    requirements: {
      minLevel: 1
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  {
    title: "Thames River Challenge",
    description: "A water elemental has been spotted near the Thames. Defeat it to protect the city!",
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      geohash: geohashForLocation([51.5074, -0.1278])
    },
    rarity: 'Epic',
    rewards: [
      { type: 'gold', amount: 250 },
      { type: 'xp', amount: 500 }
    ],
    requirements: {
      minLevel: 3
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Central Park Adventure",
    description: "Explore Central Park and discover ancient runes hidden beneath the trees.",
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      geohash: geohashForLocation([40.7829, -73.9654])
    },
    rarity: 'Uncommon',
    rewards: [
      { type: 'gold', amount: 100 },
      { type: 'xp', amount: 200 }
    ],
    requirements: {
      minLevel: 1
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Brooklyn Bridge Battle",
    description: "A gang of goblins has taken over the Brooklyn Bridge. Clear them out!",
    location: {
      latitude: 40.7061,
      longitude: -73.9969,
      geohash: geohashForLocation([40.7061, -73.9969])
    },
    rarity: 'Rare',
    rewards: [
      { type: 'gold', amount: 180 },
      { type: 'xp', amount: 350 }
    ],
    requirements: {
      minLevel: 2
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Tokyo Tower Showdown",
    description: "A powerful yokai has appeared at Tokyo Tower. Brave adventurers needed!",
    location: {
      latitude: 35.6586,
      longitude: 139.7454,
      geohash: geohashForLocation([35.6586, 139.7454])
    },
    rarity: 'Epic',
    rewards: [
      { type: 'gold', amount: 300 },
      { type: 'xp', amount: 600 }
    ],
    requirements: {
      minLevel: 4
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Shibuya Crossing Quest",
    description: "Find the lost shrine hidden in the bustling Shibuya district.",
    location: {
      latitude: 35.6595,
      longitude: 139.7004,
      geohash: geohashForLocation([35.6595, 139.7004])
    },
    rarity: 'Common',
    rewards: [
      { type: 'gold', amount: 80 },
      { type: 'xp', amount: 150 }
    ],
    requirements: {
      minLevel: 1
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Sydney Opera House Mystery",
    description: "Strange melodies emanate from the Opera House at night. Investigate!",
    location: {
      latitude: -33.8568,
      longitude: 151.2153,
      geohash: geohashForLocation([-33.8568, 151.2153])
    },
    rarity: 'Rare',
    rewards: [
      { type: 'gold', amount: 200 },
      { type: 'xp', amount: 400 }
    ],
    requirements: {
      minLevel: 2
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Bondi Beach Challenge",
    description: "Sea creatures have been spotted near Bondi Beach. Drive them back!",
    location: {
      latitude: -33.8915,
      longitude: 151.2767,
      geohash: geohashForLocation([-33.8915, 151.2767])
    },
    rarity: 'Uncommon',
    rewards: [
      { type: 'gold', amount: 120 },
      { type: 'xp', amount: 250 }
    ],
    requirements: {
      minLevel: 1
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Eiffel Tower Enigma",
    description: "A magical anomaly has appeared at the top of the Eiffel Tower.",
    location: {
      latitude: 48.8584,
      longitude: 2.2945,
      geohash: geohashForLocation([48.8584, 2.2945])
    },
    rarity: 'Legendary',
    rewards: [
      { type: 'gold', amount: 500 },
      { type: 'xp', amount: 1000 }
    ],
    requirements: {
      minLevel: 5
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Louvre Treasure Hunt",
    description: "A secret chamber has been discovered beneath the Louvre. Explore it!",
    location: {
      latitude: 48.8606,
      longitude: 2.3376,
      geohash: geohashForLocation([48.8606, 2.3376])
    },
    rarity: 'Epic',
    rewards: [
      { type: 'gold', amount: 280 },
      { type: 'xp', amount: 550 }
    ],
    requirements: {
      minLevel: 3
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Alpine Dragon Encounter",
    description: "A mountain dragon has been spotted in the Swiss Alps. Only the bravest should accept!",
    location: {
      latitude: 46.5197,
      longitude: 8.7266,
      geohash: geohashForLocation([46.5197, 8.7266])
    },
    rarity: 'Legendary',
    rewards: [
      { type: 'gold', amount: 600 },
      { type: 'xp', amount: 1200 }
    ],
    requirements: {
      minLevel: 6
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Yosemite Trail Quest",
    description: "Follow the ancient trail markers to discover a hidden grove in Yosemite.",
    location: {
      latitude: 37.8651,
      longitude: -119.5383,
      geohash: geohashForLocation([37.8651, -119.5383])
    },
    rarity: 'Rare',
    rewards: [
      { type: 'gold', amount: 220 },
      { type: 'xp', amount: 450 }
    ],
    requirements: {
      minLevel: 2
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Hawaiian Beach Mystery",
    description: "Tiki statues along the beach have started glowing. Investigate this phenomenon!",
    location: {
      latitude: 21.2793,
      longitude: -157.8293,
      geohash: geohashForLocation([21.2793, -157.8293])
    },
    rarity: 'Epic',
    rewards: [
      { type: 'gold', amount: 320 },
      { type: 'xp', amount: 650 }
    },
    requirements: {
      minLevel: 4
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
];

async function seedQuests() {
  console.log('🌱 Starting quest seeding...');

  for (const quest of testQuests) {
    const questRef = doc(collection(db, 'activeQuests'));
    const questWithId: SimpleQuest = {
      id: questRef.id,
      ...quest
    };

    await setDoc(questRef, questWithId);
    console.log(`✅ Created quest: ${quest.title} (${quest.location.latitude}, ${quest.location.longitude})`);
  }

  console.log(`\n🎉 Successfully seeded ${testQuests.length} test quests!`);
  console.log('\nLocations covered:');
  console.log('  - London, UK (2 quests)');
  console.log('  - New York, USA (2 quests)');
  console.log('  - Tokyo, Japan (2 quests)');
  console.log('  - Sydney, Australia (2 quests)');
  console.log('  - Paris, France (2 quests)');
  console.log('  - Swiss Alps (1 quest)');
  console.log('  - Yosemite (1 quest)');
  console.log('  - Hawaii (1 quest)');
  console.log('\nUse the Location Spoofer to teleport to these locations and test!');
}

// Run the seeder
seedQuests()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding quests:', error);
    process.exit(1);
  });

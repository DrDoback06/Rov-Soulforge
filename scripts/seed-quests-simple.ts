import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import questsData from './test-quests.json' assert { type: 'json' };

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

async function seedQuests() {
  console.log('🌱 Starting quest seeding...');

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + 7); // 7 days from now

  for (const quest of questsData) {
    const questRef = doc(collection(db, 'activeQuests'));

    const questDoc = {
      id: questRef.id,
      title: quest.title,
      description: quest.description,
      location: {
        latitude: quest.location.latitude,
        longitude: quest.location.longitude,
        geohash: geohashForLocation([quest.location.latitude, quest.location.longitude])
      },
      rarity: quest.rarity,
      rewards: quest.rewards,
      requirements: quest.requirements,
      expires: expiresDate
    };

    await setDoc(questRef, questDoc);
    console.log(`✅ Created quest: ${quest.title}`);
  }

  console.log(`\n🎉 Successfully seeded ${questsData.length} test quests!`);
  console.log('\nUse the Location Spoofer to teleport to these locations and test!');
}

seedQuests()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding quests:', error);
    process.exit(1);
  });

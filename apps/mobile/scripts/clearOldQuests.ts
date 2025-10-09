/**
 * Clear Old Quests Script
 *
 * Removes all old quest data and replaces with new enhanced quest structure
 *
 * Usage: npx ts-node scripts/clearOldQuests.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
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

async function clearOldQuests() {
  console.log('\n🧹 Clearing old quest data...\n');

  const questCollections = [
    'staticQuests',
    'dynamicQuests',
    'worldEvents',
    'questProgress'
  ];

  let totalDeleted = 0;

  for (const collectionName of questCollections) {
    try {
      console.log(`📂 Clearing ${collectionName}...`);

      const snapshot = await getDocs(collection(db, collectionName));

      if (snapshot.empty) {
        console.log(`   ℹ️  Collection empty`);
        continue;
      }

      // Delete in batches of 500
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      for (const docSnapshot of snapshot.docs) {
        currentBatch.delete(docSnapshot.ref);
        operationCount++;

        if (operationCount === 500) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      }

      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      // Commit all batches
      for (const batch of batches) {
        await batch.commit();
      }

      console.log(`   ✅ Deleted ${snapshot.size} documents`);
      totalDeleted += snapshot.size;

    } catch (error: any) {
      console.error(`   ❌ Error clearing ${collectionName}:`, error.message);
    }
  }

  console.log(`\n✨ Cleared ${totalDeleted} old quests!\n`);
  console.log(`💡 Next steps:`);
  console.log(`   1. Run: npx ts-node scripts/seedTestQuests.ts`);
  console.log(`   2. Or use the "Generate Quests" button in the app\n`);
}

clearOldQuests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

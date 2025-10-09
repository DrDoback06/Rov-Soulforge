/**
 * Reset User Data Script
 *
 * Resets Firebase data for admin/test accounts
 * Keeps authentication but clears all quest data, inventory, progress, etc.
 *
 * Usage: npx ts-node scripts/resetUserData.ts <userId>
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
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

async function resetUserData(userId: string) {
  console.log(`\n🔄 Resetting data for user: ${userId}\n`);

  const collectionsToReset = [
    'questProgress',
    'userInventory',
    'userDecks',
    'userCards',
    'userStats',
    'userAchievements',
    'userBadges',
    'userTitles',
    'activityEvents',
    'fitnessData'
  ];

  let totalDeleted = 0;

  for (const collectionName of collectionsToReset) {
    try {
      console.log(`📂 Checking ${collectionName}...`);

      // Query for documents belonging to this user
      let q;
      if (collectionName === 'questProgress') {
        q = query(collection(db, collectionName), where('uid', '==', userId));
      } else if (collectionName === 'userInventory' || collectionName === 'userDecks' || collectionName === 'userCards') {
        q = query(collection(db, collectionName), where('userId', '==', userId));
      } else {
        // Try both uid and userId fields
        q = query(collection(db, collectionName), where('uid', '==', userId));
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log(`   ℹ️  No documents found`);
        continue;
      }

      // Delete in batches of 500 (Firestore limit)
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
      if (error.code === 'permission-denied') {
        console.log(`   ⚠️  Permission denied (might not exist)`);
      } else {
        console.error(`   ❌ Error:`, error.message);
      }
    }
  }

  // Also delete any battles involving this user
  try {
    console.log(`\n📂 Checking battles...`);
    const battlesQuery = query(
      collection(db, 'battles'),
      where('playerIds', 'array-contains', userId)
    );
    const battlesSnapshot = await getDocs(battlesQuery);

    if (!battlesSnapshot.empty) {
      const batch = writeBatch(db);
      battlesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   ✅ Deleted ${battlesSnapshot.size} battles`);
      totalDeleted += battlesSnapshot.size;
    } else {
      console.log(`   ℹ️  No battles found`);
    }
  } catch (error: any) {
    console.error(`   ❌ Error deleting battles:`, error.message);
  }

  console.log(`\n✨ Reset complete! Deleted ${totalDeleted} total documents.`);
  console.log(`\n🎮 User ${userId} now has a fresh account (login preserved).`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Reload the app`);
  console.log(`   2. Generate new quests using the map`);
  console.log(`   3. Test quest acceptance and battle flow\n`);
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('\nUsage: npx ts-node scripts/resetUserData.ts <userId>');
  console.log('\nExample: npx ts-node scripts/resetUserData.ts abc123xyz\n');
  process.exit(1);
}

resetUserData(userId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

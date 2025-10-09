/**
 * Firebase Structure Migration Script
 *
 * Migrates from flat structure to organized hierarchical structure
 * See FIREBASE_STRUCTURE.md for details
 *
 * Usage: npx ts-node scripts/migrateFirebaseStructure.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

interface MigrationStats {
  users: number;
  questProgress: number;
  inventory: number;
  decks: number;
  characters: number;
  stashes: number;
  staticQuests: number;
  dynamicQuests: number;
  battles: number;
  errors: number;
}

const stats: MigrationStats = {
  users: 0,
  questProgress: 0,
  inventory: 0,
  decks: 0,
  characters: 0,
  stashes: 0,
  staticQuests: 0,
  dynamicQuests: 0,
  battles: 0,
  errors: 0
};

async function migrateUsers() {
  console.log('\n📦 Migrating users...');

  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Create user profile document
      const profileRef = doc(db, `users/${userId}/profile/main`);
      await setDoc(profileRef, {
        displayName: userData.displayName || userData.name || 'Unknown',
        email: userData.email || null,
        level: userData.level || 1,
        xp: userData.xp || 0,
        gold: userData.gold || 0,
        createdAt: userData.createdAt || new Date(),
        lastLogin: userData.lastLogin || new Date()
      });

      // Create user stats document
      const statsRef = doc(db, `users/${userId}/stats/main`);
      await setDoc(statsRef, {
        health: userData.health || 100,
        experience: userData.experience || 0,
        questsCompleted: userData.questsCompleted || 0,
        battlesWon: userData.battlesWon || 0,
        distanceTraveled: userData.distanceTraveled || 0
      });

      stats.users++;
      console.log(`   ✅ Migrated user: ${userId}`);
    }
  } catch (error: any) {
    console.error('   ❌ Error migrating users:', error.message);
    stats.errors++;
  }
}

async function migrateQuestProgress() {
  console.log('\n📋 Migrating quest progress...');

  try {
    const progressSnapshot = await getDocs(collection(db, 'questProgress'));

    for (const progressDoc of progressSnapshot.docs) {
      const progressData = progressDoc.data();
      const userId = progressData.uid || progressData.userId;

      if (!userId) {
        console.log(`   ⚠️  Skipping quest progress ${progressDoc.id} - no user ID`);
        continue;
      }

      // Move to user's questProgress subcollection
      const newRef = doc(db, `users/${userId}/questProgress/${progressDoc.id}`);
      await setDoc(newRef, {
        questId: progressData.questId,
        status: progressData.status || 'in_progress',
        objectives: progressData.objectives || [],
        startedAt: progressData.startedAt || new Date(),
        completedAt: progressData.completedAt || null,
        teammates: progressData.teammates || [],
        rewards: progressData.rewards || {}
      });

      stats.questProgress++;
    }

    console.log(`   ✅ Migrated ${stats.questProgress} quest progress entries`);
  } catch (error: any) {
    console.error('   ❌ Error migrating quest progress:', error.message);
    stats.errors++;
  }
}

async function migrateInventories() {
  console.log('\n🎒 Migrating inventories...');

  try {
    const inventoriesSnapshot = await getDocs(collection(db, 'inventories'));

    for (const invDoc of inventoriesSnapshot.docs) {
      const invData = invDoc.data();
      const userId = invData.userId;

      if (!userId) {
        console.log(`   ⚠️  Skipping inventory ${invDoc.id} - no user ID`);
        continue;
      }

      // Migrate each item in inventory
      const items = invData.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemRef = doc(db, `users/${userId}/inventory/item_${i}`);
        await setDoc(itemRef, {
          cardId: item.cardId || item.id,
          quantity: item.quantity || 1,
          rarity: item.rarity || 'common',
          identified: item.identified !== false,
          stats: item.stats || {},
          acquiredAt: item.acquiredAt || new Date()
        });
      }

      stats.inventory += items.length;
    }

    console.log(`   ✅ Migrated ${stats.inventory} inventory items`);
  } catch (error: any) {
    console.error('   ❌ Error migrating inventories:', error.message);
    stats.errors++;
  }
}

async function migrateDecks() {
  console.log('\n🃏 Migrating decks...');

  try {
    const decksSnapshot = await getDocs(collection(db, 'userDecks'));

    for (const deckDoc of decksSnapshot.docs) {
      const deckData = deckDoc.data();
      const userId = deckData.userId;

      if (!userId) {
        console.log(`   ⚠️  Skipping deck ${deckDoc.id} - no user ID`);
        continue;
      }

      const newRef = doc(db, `users/${userId}/decks/${deckDoc.id}`);
      await setDoc(newRef, {
        name: deckData.name || 'Untitled Deck',
        actionCards: deckData.actionCards || [],
        skillCards: deckData.skillCards || [],
        lootCards: deckData.lootCards || [],
        isActive: deckData.isActive || false
      });

      stats.decks++;
    }

    console.log(`   ✅ Migrated ${stats.decks} decks`);
  } catch (error: any) {
    console.error('   ❌ Error migrating decks:', error.message);
    stats.errors++;
  }
}

async function migrateCharacters() {
  console.log('\n🧙 Migrating characters...');

  try {
    const charactersSnapshot = await getDocs(collection(db, 'characters'));

    for (const charDoc of charactersSnapshot.docs) {
      const charData = charDoc.data();
      const userId = charData.userId;

      if (!userId) {
        console.log(`   ⚠️  Skipping character ${charDoc.id} - no user ID`);
        continue;
      }

      const newRef = doc(db, `users/${userId}/characters/${charDoc.id}`);
      await setDoc(newRef, {
        class: charData.class || 'Holy',
        level: charData.level || 1,
        equippedItems: charData.equippedItems || {},
        isActive: charData.isActive || false,
        name: charData.name || 't'
      });

      stats.characters++;
    }

    console.log(`   ✅ Migrated ${stats.characters} characters`);
  } catch (error: any) {
    console.error('   ❌ Error migrating characters:', error.message);
    stats.errors++;
  }
}

async function migrateStashes() {
  console.log('\n📦 Migrating stashes...');

  try {
    const stashesSnapshot = await getDocs(collection(db, 'stashes'));

    for (const stashDoc of stashesSnapshot.docs) {
      const stashData = stashDoc.data();
      const userId = stashData.userId;

      if (!userId) {
        console.log(`   ⚠️  Skipping stash ${stashDoc.id} - no user ID`);
        continue;
      }

      const items = stashData.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemRef = doc(db, `users/${userId}/stash/item_${i}`);
        await setDoc(itemRef, {
          cardId: item.cardId || item.id,
          quantity: item.quantity || 1,
          rarity: item.rarity || 'common',
          identified: item.identified !== false,
          stats: item.stats || {},
          storedAt: item.storedAt || new Date()
        });
      }

      stats.stashes += items.length;
    }

    console.log(`   ✅ Migrated ${stats.stashes} stash items`);
  } catch (error: any) {
    console.error('   ❌ Error migrating stashes:', error.message);
    stats.errors++;
  }
}

async function migrateStaticQuests() {
  console.log('\n🗺️  Migrating static quests...');

  try {
    const questsSnapshot = await getDocs(collection(db, 'staticQuests'));

    for (const questDoc of questsSnapshot.docs) {
      const questData = questDoc.data();

      const newRef = doc(db, `quests/static/${questDoc.id}`);
      await setDoc(newRef, questData);

      stats.staticQuests++;
    }

    console.log(`   ✅ Migrated ${stats.staticQuests} static quests`);
  } catch (error: any) {
    console.error('   ❌ Error migrating static quests:', error.message);
    stats.errors++;
  }
}

async function migrateDynamicQuests() {
  console.log('\n🎲 Migrating dynamic quests...');

  try {
    const questsSnapshot = await getDocs(collection(db, 'dynamicQuests'));

    for (const questDoc of questsSnapshot.docs) {
      const questData = questDoc.data();

      const newRef = doc(db, `quests/dynamic/${questDoc.id}`);
      await setDoc(newRef, questData);

      stats.dynamicQuests++;
    }

    console.log(`   ✅ Migrated ${stats.dynamicQuests} dynamic quests`);
  } catch (error: any) {
    console.error('   ❌ Error migrating dynamic quests:', error.message);
    stats.errors++;
  }
}

async function migrateBattles() {
  console.log('\n⚔️  Migrating battles...');

  try {
    const battlesSnapshot = await getDocs(collection(db, 'battles'));

    for (const battleDoc of battlesSnapshot.docs) {
      const battleData = battleDoc.data();

      const newRef = doc(db, `battles/${battleDoc.id}`);
      await setDoc(newRef, battleData);

      stats.battles++;
    }

    console.log(`   ✅ Migrated ${stats.battles} battles`);
  } catch (error: any) {
    console.error('   ❌ Error migrating battles:', error.message);
    stats.errors++;
  }
}

async function deleteOldCollections() {
  console.log('\n🗑️  Cleaning up old collections...');

  const oldCollections = [
    'questProgress',
    'inventories',
    'userDecks',
    'characters',
    'stashes',
    'staticQuests',
    'dynamicQuests',
    'activeQuests'
  ];

  for (const collectionName of oldCollections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));

      if (snapshot.empty) {
        console.log(`   ℹ️  ${collectionName} already empty`);
        continue;
      }

      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();
      console.log(`   ✅ Deleted ${count} documents from ${collectionName}`);
    } catch (error: any) {
      console.error(`   ❌ Error deleting ${collectionName}:`, error.message);
    }
  }
}

async function runMigration() {
  console.log('\n🚀 FIREBASE STRUCTURE MIGRATION');
  console.log('=' .repeat(60));
  console.log('\n⚠️  WARNING: This will reorganize your Firebase structure!');
  console.log('Make sure you have a backup before proceeding.\n');

  try {
    await migrateUsers();
    await migrateQuestProgress();
    await migrateInventories();
    await migrateDecks();
    await migrateCharacters();
    await migrateStashes();
    await migrateStaticQuests();
    await migrateDynamicQuests();
    await migrateBattles();

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION COMPLETE!\n');
    console.log('Statistics:');
    console.log(`   Users migrated: ${stats.users}`);
    console.log(`   Quest progress: ${stats.questProgress}`);
    console.log(`   Inventory items: ${stats.inventory}`);
    console.log(`   Decks: ${stats.decks}`);
    console.log(`   Characters: ${stats.characters}`);
    console.log(`   Stash items: ${stats.stashes}`);
    console.log(`   Static quests: ${stats.staticQuests}`);
    console.log(`   Dynamic quests: ${stats.dynamicQuests}`);
    console.log(`   Battles: ${stats.battles}`);
    console.log(`   Errors: ${stats.errors}`);

    if (stats.errors === 0) {
      console.log('\n✅ Migration successful with no errors!');
      console.log('\n🗑️  Do you want to delete old collections? (Run cleanup manually)');
      console.log('   Run: npx ts-node scripts/cleanupOldCollections.ts\n');
    } else {
      console.log('\n⚠️  Migration completed with errors. Review logs above.');
      console.log('DO NOT delete old collections until errors are fixed!\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal migration error:', error);
    process.exit(1);
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

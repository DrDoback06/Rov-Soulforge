/**
 * Firebase Admin Utilities
 *
 * Firebase configuration and utility functions for admin panel.
 * Handles real-time sync between admin panel and mobile app.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
  serverTimestamp,
} from 'firebase/firestore';

// Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore | null = null;

export function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  db = getFirestore(app);
  return { app, db };
}

// Get Firestore instance
export function getDB(): Firestore {
  if (!db) {
    const { db: firestore } = initializeFirebase();
    return firestore;
  }
  return db;
}

// Quest Operations
export async function createQuest(questData: any) {
  const db = getDB();
  const docRef = await addDoc(collection(db, 'activeQuests'), {
    ...questData,
    createdAt: serverTimestamp(),
    status: 'active',
  });
  console.log('✅ Quest created:', docRef.id);
  return { id: docRef.id, ...questData };
}

export async function updateQuest(questId: string, updates: any) {
  const db = getDB();
  await updateDoc(doc(db, 'activeQuests', questId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  console.log('✅ Quest updated:', questId);
}

export async function deleteQuest(questId: string) {
  const db = getDB();
  await deleteDoc(doc(db, 'activeQuests', questId));
  console.log('✅ Quest deleted:', questId);
}

export async function getQuest(questId: string) {
  const db = getDB();
  const docSnap = await getDoc(doc(db, 'activeQuests', questId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function listQuests(options?: { limit?: number; orderBy?: string }) {
  const db = getDB();
  let q = query(collection(db, 'activeQuests'));

  if (options?.orderBy) {
    q = query(q, orderBy(options.orderBy, 'desc'));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Item Operations
export async function createItem(itemData: any) {
  const db = getDB();
  const docRef = await addDoc(collection(db, 'items'), {
    ...itemData,
    createdAt: serverTimestamp(),
  });
  console.log('✅ Item created:', docRef.id);
  return { id: docRef.id, ...itemData };
}

export async function updateItem(itemId: string, updates: any) {
  const db = getDB();
  await updateDoc(doc(db, 'items', itemId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  console.log('✅ Item updated:', itemId);
}

export async function deleteItem(itemId: string) {
  const db = getDB();
  await deleteDoc(doc(db, 'items', itemId));
  console.log('✅ Item deleted:', itemId);
}

// Enemy Operations
export async function createEnemy(enemyData: any) {
  const db = getDB();
  const docRef = await addDoc(collection(db, 'enemies'), {
    ...enemyData,
    createdAt: serverTimestamp(),
  });
  console.log('✅ Enemy created:', docRef.id);
  return { id: docRef.id, ...enemyData };
}

export async function updateEnemy(enemyId: string, updates: any) {
  const db = getDB();
  await updateDoc(doc(db, 'enemies', enemyId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  console.log('✅ Enemy updated:', enemyId);
}

// Character Operations
export async function searchCharacters(searchTerm: string) {
  const db = getDB();

  // Try searching by character ID
  const byIdQuery = query(
    collection(db, 'characters'),
    where('id', '==', searchTerm),
    limit(10)
  );

  const snapshot = await getDocs(byIdQuery);

  if (!snapshot.empty) {
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Try searching by user ID
  const byUserIdQuery = query(
    collection(db, 'characters'),
    where('uid', '==', searchTerm),
    limit(10)
  );

  const userSnapshot = await getDocs(byUserIdQuery);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateCharacter(characterId: string, updates: any) {
  const db = getDB();
  await updateDoc(doc(db, 'characters', characterId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  console.log('✅ Character updated:', characterId);
}

// NPC Operations
export async function createNPC(npcData: any) {
  const db = getDB();
  const docRef = await addDoc(collection(db, 'npcs'), {
    ...npcData,
    createdAt: serverTimestamp(),
  });
  console.log('✅ NPC created:', docRef.id);
  return { id: docRef.id, ...npcData };
}

export async function updateNPC(npcId: string, updates: any) {
  const db = getDB();
  await updateDoc(doc(db, 'npcs', npcId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  console.log('✅ NPC updated:', npcId);
}

// Analytics
export async function getAnalytics() {
  const db = getDB();

  const [users, characters, quests] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'characters')),
    getDocs(query(collection(db, 'activeQuests'), where('status', '==', 'active'))),
  ]);

  return {
    totalUsers: users.size,
    totalCharacters: characters.size,
    activeQuests: quests.size,
  };
}

/**
 * Firebase Client Configuration
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug: Log configuration (remove in production)
console.log('🔥 Firebase Config Check:');
console.log('- API Key exists:', !!firebaseConfig.apiKey);
console.log('- Project ID:', firebaseConfig.projectId);
console.log('- App ID exists:', !!firebaseConfig.appId);

// Validate required fields - use fallback for development
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('⚠️ Firebase configuration is incomplete, using fallback for development');
  console.warn('Make sure .env file exists in apps/mobile/ with all EXPO_PUBLIC_FIREBASE_* variables');
  
  // Use fallback configuration for development
  firebaseConfig.apiKey = firebaseConfig.apiKey || 'demo-api-key';
  firebaseConfig.projectId = firebaseConfig.projectId || 'demo-project';
  firebaseConfig.authDomain = firebaseConfig.authDomain || 'demo-project.firebaseapp.com';
  firebaseConfig.storageBucket = firebaseConfig.storageBucket || 'demo-project.appspot.com';
  firebaseConfig.messagingSenderId = firebaseConfig.messagingSenderId || '123456789';
  firebaseConfig.appId = firebaseConfig.appId || 'demo-app-id';
}

// Initialize Firebase
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
  } else {
    app = getApp();
    console.log('✅ Firebase app already initialized');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.warn('⚠️ Continuing without Firebase - some features may not work');
  // Don't throw error, just log it and continue
}

// Initialize Auth
let auth;
try {
  if (!app) throw new Error('No Firebase app available');

  if (Platform.OS === 'web') {
    // On web, use the standard browser Auth implementation
    auth = getAuth(app);
  } else {
    // On native, use React Native persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch (error) {
  console.warn('⚠️ Auth initialization failed:', error);
  auth = null;
}

// Initialize Firestore
let db;
try {
  if (app) {
    db = getFirestore(app);
  } else {
    throw new Error('No Firebase app available');
  }
} catch (error) {
  console.warn('⚠️ Firestore initialization failed:', error);
  db = null;
}

// Initialize Functions
let functions;
try {
  if (app) {
    functions = getFunctions(app);
  } else {
    throw new Error('No Firebase app available');
  }
} catch (error) {
  console.warn('⚠️ Functions initialization failed:', error);
  functions = null;
}

export { app, auth, db, functions };

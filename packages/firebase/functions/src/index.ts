import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
admin.initializeApp();

// Export all function modules
export * from './battle';
export * from './quests';
export * from './activity';
export * from './shop';
export * from './admin';
export * from './leaderboard';
export * from './social';
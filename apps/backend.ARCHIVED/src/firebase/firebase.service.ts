import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

/**
 * Firebase Admin Service
 * Provides access to Firestore, Auth, and other Firebase services
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;
  private firestore: admin.firestore.Firestore;
  private auth: admin.auth.Auth;

  onModuleInit() {
    // Initialize Firebase Admin SDK
    this.app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    this.firestore = admin.firestore();
    this.auth = admin.auth();

    console.log('✅ Firebase Admin initialized');
  }

  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }

  getAuth(): admin.auth.Auth {
    return this.auth;
  }

  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return this.auth.verifyIdToken(token);
  }

  collection(path: string): admin.firestore.CollectionReference {
    return this.firestore.collection(path);
  }

  doc(path: string): admin.firestore.DocumentReference {
    return this.firestore.doc(path);
  }
}
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  getAuth,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { auth, db, functions } from './firebase';
import type { Functions } from 'firebase/functions';

/**
 * Firebase Context
 * Provides Firebase instances and auth state to the app
 */

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  db: Firestore | null;
  functions: Functions | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Firebase Provider - Setting up auth listener...');

    // Prefer provided auth, but fall back to on-demand instance
    let authInstance = auth;
    try {
      if (!authInstance) {
        authInstance = getAuth();
      }
    } catch (e) {
      console.warn('⚠️ Could not obtain Firebase Auth instance:', e);
      setLoading(false);
      return;
    }

    // Listen to auth state changes using the resolved instance
    const unsubscribe = onAuthStateChanged(
      authInstance,
      (user) => {
        console.log('🔐 Auth state changed:');
        console.log('  - User:', user ? `${user.uid} (${user.email || 'anonymous'})` : 'null');
        setUser(user);
        setLoading(false);
        console.log('  - Loading set to false');
      },
      (error) => {
        console.error('❌ Auth state change error:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔐 Firebase Provider - Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const a = auth ?? getAuth();
    if (!a) throw new Error('Firebase Auth not available');
    await signInWithEmailAndPassword(a, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const a = auth ?? getAuth();
    if (!a) throw new Error('Firebase Auth not available');
    return await createUserWithEmailAndPassword(a, email, password);
  };

  const signInAsGuest = async () => {
    const a = auth ?? getAuth();
    if (!a) throw new Error('Firebase Auth not available');
    await signInAnonymously(a);
  };

  const signOut = async () => {
    const a = auth ?? getAuth();
    if (!a) throw new Error('Firebase Auth not available');
    await firebaseSignOut(a);
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        db,
        functions,
        signIn,
        signUp,
        signInAsGuest,
        signOut
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

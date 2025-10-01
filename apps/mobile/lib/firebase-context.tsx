import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
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
  db: Firestore;
  functions: Functions;
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

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
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

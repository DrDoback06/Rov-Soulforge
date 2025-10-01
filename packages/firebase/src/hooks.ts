/**
 * React hooks for Firebase integration
 *
 * Note: These are type-only exports - actual implementations
 * should be in the React Native app to avoid bundling issues
 */

import type { Battle, Character, User } from '@rov/types';

/**
 * Hook types - implement these in your app using react-firebase-hooks or custom logic
 */

export interface UseAuthResult {
  user: any | null;
  loading: boolean;
  error: Error | null;
}

export interface UseDocumentResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Usage examples:
 *
 * // In your React Native app:
 * import { useAuthState } from 'react-firebase-hooks/auth';
 * import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
 *
 * export function useAuth(): UseAuthResult {
 *   const [user, loading, error] = useAuthState(auth);
 *   return { user, loading, error };
 * }
 *
 * export function useCharacter(charId: string): UseDocumentResult<Character> {
 *   const [snapshot, loading, error] = useDocument(
 *     doc(db, 'characters', charId)
 *   );
 *   return {
 *     data: snapshot?.data() as Character,
 *     loading,
 *     error
 *   };
 * }
 *
 * export function useBattle(battleId: string): UseDocumentResult<Battle> {
 *   const [snapshot, loading, error] = useDocument(
 *     doc(db, 'battles', battleId)
 *   );
 *   return {
 *     data: snapshot?.data() as Battle,
 *     loading,
 *     error
 *   };
 * }
 *
 * export function useNearbyQuests(
 *   lat: number,
 *   lng: number,
 *   radiusKm: number
 * ): UseCollectionResult<Quest> {
 *   // Use GeoFire queries
 *   const [data, setData] = useState<Quest[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<Error | null>(null);
 *
 *   useEffect(() => {
 *     // Implement geohash query
 *   }, [lat, lng, radiusKm]);
 *
 *   return { data, loading, error };
 * }
 */

export const HOOK_EXAMPLES = `
// Example hook implementations for your React Native app

import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from './firebase-config';

export function useAuth() {
  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
}

export function useCharacter(charId: string) {
  const [snapshot, loading, error] = useDocument(
    doc(db, 'characters', charId)
  );
  return {
    data: snapshot?.data() as Character,
    loading,
    error
  };
}

export function useUserCharacter(uid: string) {
  const [snapshot, loading, error] = useCollection(
    query(
      collection(db, 'characters'),
      where('uid', '==', uid),
      limit(1)
    )
  );
  return {
    data: snapshot?.docs[0]?.data() as Character,
    loading,
    error
  };
}

export function useBattle(battleId: string) {
  const [snapshot, loading, error] = useDocument(
    doc(db, 'battles', battleId)
  );
  return {
    data: snapshot?.data() as Battle,
    loading,
    error
  };
}

export function useQuestProgress(uid: string) {
  const [snapshot, loading, error] = useCollection(
    query(
      collection(db, 'questProgress'),
      where('uid', '==', uid),
      where('status', 'in', ['active', 'ready']),
      orderBy('startedAt', 'desc')
    )
  );
  return {
    data: snapshot?.docs.map(d => d.data()),
    loading,
    error
  };
}

export function useInventory(uid: string) {
  const [snapshot, loading, error] = useDocument(
    doc(db, 'cardInventory', uid)
  );
  return {
    data: snapshot?.data(),
    loading,
    error
  };
}
`;
import { useFirebase } from '@/lib/firebase-context';

/**
 * Hook to access Firebase auth state
 */
export function useAuth() {
  const { user, loading, signIn, signUp, signInAsGuest, signOut } = useFirebase();

  return {
    user,
    loading,
    signIn,
    signUp,
    signInAsGuest,
    signOut
  };
}
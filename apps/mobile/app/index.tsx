import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useCharacter } from '@/hooks/useCharacter';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Index/Splash Screen
 * Routes to login, character creation, or tabs based on auth state
 */
export default function IndexScreen() {
  const { user, loading: authLoading } = useAuth();
  const { character, loading: characterLoading } = useCharacter();

  useEffect(() => {
    console.log('🔍 Index Screen - Routing Logic:');
    console.log('  - authLoading:', authLoading);
    console.log('  - characterLoading:', characterLoading);
    console.log('  - user exists:', !!user);
    console.log('  - character exists:', !!character);

    if (authLoading || characterLoading) {
      console.log('  ⏳ Still loading, waiting...');
      return;
    }

    if (!user) {
      // No user, go to login
      console.log('  → Navigating to /auth/login (no user)');
      router.replace('/auth/login');
      return;
    }

    if (!character) {
      // User logged in but no character created
      console.log('  → Navigating to /character/create (user but no character)');
      router.replace('/character/create');
      return;
    }

    // User logged in with character, go to app
    console.log('  → Navigating to /(tabs) (user with character)');
    router.replace('/(tabs)');
  }, [user, character, authLoading, characterLoading]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        <Text style={styles.logo}>⚔️</Text>
        <Text style={styles.title}>Realm of Valor</Text>
        <ActivityIndicator size="large" color="#4488ff" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e93',
  },
});

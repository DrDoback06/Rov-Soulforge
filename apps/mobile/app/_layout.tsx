import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FirebaseProvider } from '@/lib/firebase-context';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

/**
 * Root layout for the app
 * Sets up providers and navigation structure
 */
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2
      }
    }
  }));

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📱 App starting...');
    // Give Firebase a moment to initialize
    const timer = setTimeout(() => {
      setLoading(false);
      console.log('✅ App ready');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4488ff" />
        <Text style={styles.loadingText}>Starting Realm of Valor...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <FirebaseProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1a1a2e' }
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
              <Stack.Screen name="character/create" options={{ headerShown: false }} />
              <Stack.Screen
                name="battle/[id]"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'fade'
                }}
              />
              <Stack.Screen
                name="quest/[id]"
                options={{
                  presentation: 'modal'
                }}
              />
            </Stack>
          </FirebaseProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#8e8e93',
    fontSize: 16
  }
});

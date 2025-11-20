import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { HealthKitAuth } from '@/lib/healthkit-auth';
import { GoogleFitAuth } from '@/lib/googlefit-auth';
import { GarminAuth } from '@/lib/garmin-auth';
import { WhoopAuth } from '@/lib/whoop-auth';

interface FitnessTrackerManagerProps {
  userId: string;
  onSync?: (data: any) => void;
}

interface PlatformStatus {
  connected: boolean;
  lastSync?: string;
  todaySteps?: number;
  todayDistance?: number;
  recentActivities?: number;
}

/**
 * Unified Fitness Tracker Manager
 * 
 * Manages all fitness platform connections:
 * - Strava (already integrated)
 * - HealthKit (iOS)
 * - Google Fit (Android)
 * - Garmin (cross-platform)
 * - WHOOP (cross-platform)
 * 
 * Shows:
 * - Connection status for each platform
 * - Recent activities (merged timeline)
 * - Daily/weekly stats aggregated
 * - Sync buttons
 */
export function FitnessTrackerManager({ userId, onSync }: FitnessTrackerManagerProps) {
  const [healthKitStatus, setHealthKitStatus] = useState<PlatformStatus>({ connected: false });
  const [googleFitStatus, setGoogleFitStatus] = useState<PlatformStatus>({ connected: false });
  const [garminStatus, setGarminStatus] = useState<PlatformStatus>({ connected: false });
  const [whoopStatus, setWhoopStatus] = useState<PlatformStatus>({ connected: false });
  const [stravaStatus, setStravaStatus] = useState<PlatformStatus>({ connected: false });

  const [syncing, setSyncing] = useState<string | null>(null);

  // Load connection statuses on mount
  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    // Check which platforms are connected
    // In production, load from Firestore: users/{userId}/connections

    // For now, check availability
    const hkAvailable = await HealthKitAuth.checkAvailability();
    const gfAvailable = await GoogleFitAuth.checkAvailability();

    setHealthKitStatus({ connected: hkAvailable });
    setGoogleFitStatus({ connected: gfAvailable });
  };

  const handleConnectHealthKit = async () => {
    try {
      setSyncing('healthkit');
      const available = await HealthKitAuth.checkAvailability();
      
      if (!available) {
        Alert.alert('Not Available', 'HealthKit is only available on iOS');
        return;
      }

      await HealthKitAuth.requestPermissions(['steps', 'distance', 'workouts', 'heartRate']);
      const data = await HealthKitAuth.syncRecentData();

      setHealthKitStatus({
        connected: true,
        lastSync: new Date().toISOString(),
        todaySteps: data.dailySummaries[0]?.steps,
        todayDistance: data.dailySummaries[0]?.distance,
        recentActivities: data.workouts.length
      });

      Alert.alert('Connected!', 'HealthKit connected successfully');
      onSync?.(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect HealthKit');
    } finally {
      setSyncing(null);
    }
  };

  const handleConnectGoogleFit = async () => {
    try {
      setSyncing('googlefit');
      const available = await GoogleFitAuth.checkAvailability();
      
      if (!available) {
        Alert.alert('Not Available', 'Google Fit is only available on Android');
        return;
      }

      await GoogleFitAuth.authorize();
      const data = await GoogleFitAuth.syncRecentData();

      setGoogleFitStatus({
        connected: true,
        lastSync: new Date().toISOString(),
        todaySteps: data.totalSteps / 7, // Average
        recentActivities: data.activities.length
      });

      Alert.alert('Connected!', 'Google Fit connected successfully');
      onSync?.(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect Google Fit');
    } finally {
      setSyncing(null);
    }
  };

  const handleConnectGarmin = async () => {
    try {
      setSyncing('garmin');
      
      // In production, get from env vars
      const consumerKey = process.env.EXPO_PUBLIC_GARMIN_CONSUMER_KEY || 'mock_key';
      const consumerSecret = process.env.EXPO_PUBLIC_GARMIN_CONSUMER_SECRET || 'mock_secret';

      const authUrl = await GarminAuth.initiateOAuth(consumerKey, consumerSecret);
      
      // Open OAuth flow (simplified for now)
      Alert.alert(
        'Garmin OAuth',
        'In production, this would open Garmin login in-app browser',
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await GarminAuth.completeOAuth('mock_token', 'mock_verifier');
              const data = await GarminAuth.syncRecentData();

              setGarminStatus({
                connected: true,
                lastSync: new Date().toISOString(),
                todaySteps: data.dailySummaries[0]?.steps,
                todayDistance: data.dailySummaries[0]?.distance,
                recentActivities: data.activities.length
              });

              Alert.alert('Connected!', 'Garmin connected successfully');
              onSync?.(data);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect Garmin');
    } finally {
      setSyncing(null);
    }
  };

  const handleConnectWhoop = async () => {
    try {
      setSyncing('whoop');
      
      const clientId = process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID || 'mock_client_id';
      const clientSecret = process.env.EXPO_PUBLIC_WHOOP_CLIENT_SECRET || 'mock_secret';

      const authUrl = await WhoopAuth.initiateOAuth(clientId, clientSecret);
      
      Alert.alert(
        'WHOOP OAuth',
        'In production, this would open WHOOP login in-app browser',
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await WhoopAuth.exchangeCodeForToken('mock_code', 'mock_redirect');
              const data = await WhoopAuth.syncRecentData();

              setWhoopStatus({
                connected: true,
                lastSync: new Date().toISOString(),
                recentActivities: data.workouts.length
              });

              Alert.alert('Connected!', 'WHOOP connected successfully');
              onSync?.(data);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect WHOOP');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏃 Fitness Trackers</Text>
      <Text style={styles.subtitle}>Connect your fitness devices to automatically sync activities</Text>

      {/* HealthKit */}
      {Platform.OS === 'ios' && (
        <PlatformCard
          name="Apple Health"
          icon="❤️"
          platform="healthkit"
          status={healthKitStatus}
          onConnect={handleConnectHealthKit}
          syncing={syncing === 'healthkit'}
        />
      )}

      {/* Google Fit */}
      {Platform.OS === 'android' && (
        <PlatformCard
          name="Google Fit"
          icon="🏃"
          platform="googlefit"
          status={googleFitStatus}
          onConnect={handleConnectGoogleFit}
          syncing={syncing === 'googlefit'}
        />
      )}

      {/* Garmin */}
      <PlatformCard
        name="Garmin Connect"
        icon="📱"
        platform="garmin"
        status={garminStatus}
        onConnect={handleConnectGarmin}
        syncing={syncing === 'garmin'}
      />

      {/* WHOOP */}
      <PlatformCard
        name="WHOOP"
        icon="💪"
        platform="whoop"
        status={whoopStatus}
        onConnect={handleConnectWhoop}
        syncing={syncing === 'whoop'}
      />

      {/* Strava */}
      <PlatformCard
        name="Strava"
        icon="🔶"
        platform="strava"
        status={stravaStatus}
        onConnect={() => Alert.alert('Strava', 'Strava integration already available in app')}
        syncing={false}
      />
    </ScrollView>
  );
}

function PlatformCard({ 
  name, 
  icon, 
  platform, 
  status, 
  onConnect, 
  syncing 
}: { 
  name: string; 
  icon: string; 
  platform: string;
  status: PlatformStatus; 
  onConnect: () => void;
  syncing: boolean;
}) {
  return (
    <LinearGradient
      colors={status.connected ? ['#2a4a3e', '#1a3a2e'] : ['#2a2a3e', '#1a1a2e']}
      style={styles.platformCard}
    >
      <View style={styles.platformHeader}>
        <Text style={styles.platformIcon}>{icon}</Text>
        <View style={styles.platformInfo}>
          <Text style={styles.platformName}>{name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: status.connected ? '#4caf50' : '#666666' }
          ]}>
            <Text style={styles.statusText}>
              {status.connected ? '✓ Connected' : '○ Not Connected'}
            </Text>
          </View>
        </View>
      </View>

      {status.connected && (
        <View style={styles.platformStats}>
          {status.lastSync && (
            <Text style={styles.statText}>Last sync: {new Date(status.lastSync).toLocaleTimeString()}</Text>
          )}
          {status.todaySteps && (
            <Text style={styles.statText}>Steps: {status.todaySteps.toLocaleString()}</Text>
          )}
          {status.todayDistance && (
            <Text style={styles.statText}>Distance: {(status.todayDistance / 1000).toFixed(1)}km</Text>
          )}
          {status.recentActivities && (
            <Text style={styles.statText}>Recent activities: {status.recentActivities}</Text>
          )}
        </View>
      )}

      <Pressable
        style={[styles.connectButton, syncing && styles.connectButtonDisabled]}
        onPress={onConnect}
        disabled={syncing}
      >
        <Text style={styles.connectButtonText}>
          {syncing ? '⏳ Syncing...' : status.connected ? '🔄 Sync Now' : '🔗 Connect'}
        </Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 24,
    lineHeight: 20
  },
  platformCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12
  },
  platformIcon: {
    fontSize: 48
  },
  platformInfo: {
    flex: 1
  },
  platformName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  platformStats: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 4
  },
  statText: {
    fontSize: 12,
    color: '#8e8e93'
  },
  connectButton: {
    backgroundColor: '#4488ff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  connectButtonDisabled: {
    opacity: 0.5
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

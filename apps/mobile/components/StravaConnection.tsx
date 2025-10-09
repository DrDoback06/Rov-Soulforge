/**
 * Strava Connection Component
 *
 * Displays Strava connection status and allows connect/disconnect
 * Shows recent activities and athlete profile when connected
 */

import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useFitnessTracker } from '@/hooks/useFitnessTracker';
import type { StravaActivity } from '@/lib/strava-auth';

export function StravaConnection() {
  const {
    state,
    isLoading,
    isConnected,
    connectStrava,
    disconnectFitnessTracker,
    getRecentWorkouts
  } = useFitnessTracker();

  const [recentActivities, setRecentActivities] = useState<StravaActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadRecentActivities();
    }
  }, [isConnected]);

  async function loadRecentActivities() {
    setLoadingActivities(true);
    try {
      const activities = await getRecentWorkouts(5);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  }

  async function handleConnect() {
    const success = await connectStrava();
    if (success) {
      await loadRecentActivities();
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fc4c02" />
        <Text style={styles.loadingText}>Loading Strava connection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.card}
      >
        {/* Header with Strava logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.stravaLogo}>
              <Text style={styles.stravaText}>STRAVA</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Fitness Tracker</Text>
              <Text style={styles.headerSubtitle}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isConnected && styles.statusBadgeConnected]}>
            <Text style={styles.statusText}>{isConnected ? '✓' : '○'}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {isConnected
            ? 'Your fitness tracker is connected! Complete tracked workouts for 100% quest rewards.'
            : 'Connect your Strava account to earn full rewards on fitness quests. Manual completion gives 50% rewards.'
          }
        </Text>

        {/* Connection button */}
        {!isConnected ? (
          <Pressable
            style={styles.connectButton}
            onPress={handleConnect}
          >
            <LinearGradient
              colors={['#fc4c02', '#e34402']}
              style={styles.connectButtonGradient}
            >
              <Text style={styles.connectButtonText}>Connect Strava</Text>
              <Text style={styles.connectButtonIcon}>→</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <>
            {/* Athlete info */}
            {state.athlete && (
              <View style={styles.athleteInfo}>
                <View style={styles.athleteAvatar}>
                  <Text style={styles.athleteAvatarText}>
                    {state.athlete.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.athleteDetails}>
                  <Text style={styles.athleteName}>{state.athlete.name}</Text>
                  <Text style={styles.athleteId}>ID: {state.athlete.id}</Text>
                </View>
              </View>
            )}

            {/* Recent activities */}
            <View style={styles.activitiesSection}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>

              {loadingActivities ? (
                <ActivityIndicator size="small" color="#fc4c02" />
              ) : recentActivities.length > 0 ? (
                <ScrollView style={styles.activitiesList} nestedScrollEnabled>
                  {recentActivities.map(activity => (
                    <View key={activity.id} style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityType}>{getActivityIcon(activity.type)}</Text>
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityName} numberOfLines={1}>
                            {activity.name}
                          </Text>
                          <Text style={styles.activityDate}>
                            {formatDate(activity.start_date_local)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.activityStats}>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Distance</Text>
                          <Text style={styles.statValue}>{formatDistance(activity.distance)}</Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statLabel}>Time</Text>
                          <Text style={styles.statValue}>{formatDuration(activity.moving_time)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noActivities}>No recent activities found</Text>
              )}
            </View>

            {/* Disconnect button */}
            <Pressable
              style={styles.disconnectButton}
              onPress={disconnectFitnessTracker}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </Pressable>
          </>
        )}

        {/* Benefits list */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>✓ 100% rewards on fitness quests</Text>
            <Text style={styles.benefitItem}>✓ Automatic workout verification</Text>
            <Text style={styles.benefitItem}>✓ Compete on leaderboards</Text>
            <Text style={styles.benefitItem}>✓ Sync your progress</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Swim: '🏊',
    Hike: '🥾',
    Walk: '🚶',
    Workout: '💪',
    default: '🎯'
  };
  return icons[type] || icons.default;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km < 1) return `${meters.toFixed(0)}m`;
  return `${km.toFixed(2)}km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  loadingText: {
    color: '#8e8e93',
    marginTop: 12,
    fontSize: 14
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  stravaLogo: {
    backgroundColor: '#fc4c02',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  stravaText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a4e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusBadgeConnected: {
    backgroundColor: '#22c55e'
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  description: {
    color: '#c7c7cc',
    fontSize: 14,
    lineHeight: 20
  },
  connectButton: {
    marginTop: 8
  },
  connectButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  connectButtonIcon: {
    color: 'white',
    fontSize: 20
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12
  },
  athleteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fc4c02',
    justifyContent: 'center',
    alignItems: 'center'
  },
  athleteAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  athleteDetails: {
    flex: 1
  },
  athleteName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  athleteId: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2
  },
  activitiesSection: {
    gap: 8
  },
  sectionTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  activitiesList: {
    maxHeight: 200
  },
  activityCard: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8
  },
  activityType: {
    fontSize: 24
  },
  activityInfo: {
    flex: 1
  },
  activityName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  activityDate: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2
  },
  activityStats: {
    flexDirection: 'row',
    gap: 16
  },
  stat: {
    flex: 1
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 10,
    textTransform: 'uppercase'
  },
  statValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2
  },
  noActivities: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20
  },
  disconnectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3a3a4e',
    alignItems: 'center'
  },
  disconnectButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600'
  },
  benefitsSection: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    marginTop: 8
  },
  benefitsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  benefitsList: {
    gap: 6
  },
  benefitItem: {
    color: '#c7c7cc',
    fontSize: 13,
    lineHeight: 18
  }
});

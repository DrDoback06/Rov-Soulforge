import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useCharacter } from '@/hooks/useCharacter';

/**
 * Profile Tab - User profile and settings
 */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { character, loading } = useCharacter();
  const [stravaConnecting, setStravaConnecting] = useState(false);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1e']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4488ff" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {character && (
          <>
            {/* Character Card */}
            <View style={styles.characterCard}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={getAlignmentColors(character.alignment)}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {character.classId[0]}
                  </Text>
                </LinearGradient>
              </View>
              <Text style={styles.characterName}>
                {character.classId}
              </Text>
              <Text style={styles.characterLevel}>
                Level {character.level}
              </Text>
              <View style={styles.alignmentBadge}>
                <Text style={styles.alignmentText}>
                  {character.alignment}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{character.counters.hp}</Text>
                <Text style={styles.statLabel}>HP</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{character.counters.mana}</Text>
                <Text style={styles.statLabel}>Mana</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{character.gold}</Text>
                <Text style={styles.statLabel}>Gold</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{character.counters.renown}</Text>
                <Text style={styles.statLabel}>Renown</Text>
              </View>
            </View>

            {/* Combat Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Combat Stats</Text>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>⚔️ Attack</Text>
                <Text style={styles.statRowValue}>{character.stats.atk}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>🛡️ Defense</Text>
                <Text style={styles.statRowValue}>{character.stats.def}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>⚡ Speed</Text>
                <Text style={styles.statRowValue}>{character.stats.spd}</Text>
              </View>
            </View>

            {/* Account Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <Text style={styles.accountEmail}>{user?.email || 'Guest'}</Text>
            </View>

            {/* Strava Integration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fitness Integration</Text>
              <Text style={styles.sectionDescription}>
                Connect your Strava account to earn rewards for real-world activities
              </Text>
              <Pressable
                style={styles.stravaButton}
                onPress={handleStravaConnect}
                disabled={stravaConnecting}
              >
                <LinearGradient
                  colors={['#fc4c02', '#e34402']}
                  style={styles.stravaButtonGradient}
                >
                  <Text style={styles.stravaButtonText}>
                    {stravaConnecting ? 'Connecting...' : '🚴 Connect Strava'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </>
        )}

        {/* Sign Out */}
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  async function handleStravaConnect() {
    setStravaConnecting(true);
    try {
      const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
      const redirectUri = process.env.EXPO_PUBLIC_STRAVA_REDIRECT_URI || 'realmofvalor://strava-callback';
      const scope = 'read,activity:read_all';

      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
      } else {
        Alert.alert('Error', 'Unable to open Strava authorization');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to Strava');
      console.error(error);
    } finally {
      setStravaConnecting(false);
    }
  }
}

function getAlignmentColors(alignment: string): [string, string] {
  const colors: Record<string, [string, string]> = {
    Holy: ['#ffd700', '#ffaa00'],
    Chaos: ['#ff4444', '#cc0000'],
    Arcane: ['#4488ff', '#2244cc'],
    Neutral: ['#888888', '#555555']
  };
  return colors[alignment] || colors.Neutral;
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  content: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  characterCard: {
    backgroundColor: '#2a2a3e',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  avatarContainer: {
    marginBottom: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#1a1a2e'
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  characterLevel: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 12
  },
  alignmentBadge: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12
  },
  alignmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase'
  },
  section: {
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  statRowLabel: {
    fontSize: 16,
    color: '#ffffff'
  },
  statRowValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4488ff'
  },
  accountEmail: {
    fontSize: 14,
    color: '#8e8e93'
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
    lineHeight: 20
  },
  stravaButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  stravaButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  stravaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  }
});
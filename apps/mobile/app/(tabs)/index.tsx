import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, Pressable, Text, Platform } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';
import type { Quest } from '@rov/types';
import { geohashQueryBounds } from 'geofire-common';

// Set Mapbox access token (only on native platforms)
if (Platform.OS !== 'web') {
  MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');
}

/**
 * Map Tab - Main adventure screen
 *
 * Features:
 * - User location tracking
 * - Nearby quest markers
 * - Geofence visualization
 * - Quest interaction
 */
export default function MapScreen() {
  const { db } = useFirebase();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyQuests, setNearbyQuests] = useState<Quest[]>([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Watch user location
  useEffect(() => {
    if (!locationPermission) return;

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      // On web, use one-time location instead of watching
      if (Platform.OS === 'web') {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });
          setLocation(loc);
          loadNearbyQuests(loc.coords.latitude, loc.coords.longitude);
        } catch (error) {
          console.error('Failed to get location on web:', error);
        }
      } else {
        // On native, watch position
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10 // Update every 10 meters
          },
          (newLocation) => {
            setLocation(newLocation);
            loadNearbyQuests(newLocation.coords.latitude, newLocation.coords.longitude);
          }
        );
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [locationPermission]);

  async function requestLocationPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Realm of Valor needs your location to show nearby quests and adventures.'
      );
      return;
    }

    setLocationPermission(true);

    // Get initial location
    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);
  }

  async function loadNearbyQuests(lat: number, lng: number) {
    try {
      // Query active quests within 5km radius using geohash
      const radiusInM = 5000;
      const bounds = geohashQueryBounds([lat, lng], radiusInM);

      const promises = bounds.map((b) => {
        const q = query(
          collection(db, 'activeQuests'),
          where('location.geohash', '>=', b[0]),
          where('location.geohash', '<=', b[1])
        );
        return getDocs(q);
      });

      const snapshots = await Promise.all(promises);
      const quests: Quest[] = [];

      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const quest = { id: doc.id, ...doc.data() } as Quest;

          // Filter by actual distance
          if (quest.location) {
            const dist = calculateDistance(
              lat,
              lng,
              quest.location.latitude,
              quest.location.longitude
            );

            if (dist <= radiusInM) {
              quests.push(quest);
            }
          }
        }
      }

      setNearbyQuests(quests);
    } catch (error) {
      console.error('Failed to load quests:', error);
      // Fallback to empty array on error
      setNearbyQuests([]);
    }
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  function handleQuestPress(quest: Quest) {
    router.push(`/quest/${quest.id}`);
  }

  if (!locationPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Location permission required</Text>
        <Pressable style={styles.permissionButton} onPress={requestLocationPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Web doesn't support Mapbox native, show placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webMapTitle}>🗺️ Map View</Text>
          <Text style={styles.webMapText}>
            Interactive map is only available on iOS and Android devices.
          </Text>
          <Text style={styles.webMapText}>
            Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
          <Text style={styles.webMapText}>
            Nearby quests: {nearbyQuests.length}
          </Text>
        </View>
        <QuestListOverlay quests={nearbyQuests} onQuestPress={handleQuestPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={15}
          centerCoordinate={[location.coords.longitude, location.coords.latitude]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* User location marker */}
        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
        />

        {/* Quest markers */}
        {nearbyQuests.map((quest) => (
          <QuestMarker
            key={quest.id}
            quest={quest}
            onPress={() => handleQuestPress(quest)}
          />
        ))}
      </MapboxGL.MapView>

      {/* Quest list overlay */}
      <QuestListOverlay quests={nearbyQuests} onQuestPress={handleQuestPress} />
    </View>
  );
}

/**
 * Quest marker on map
 */
function QuestMarker({
  quest,
  onPress
}: {
  quest: Quest;
  onPress: () => void;
}) {
  // In full implementation, quest would have location data
  const coordinate: [number, number] = [-122.4, 37.8]; // Mock coordinates

  const rarityColors = {
    Common: '#ffffff',
    Uncommon: '#00ff00',
    Rare: '#0088ff',
    Epic: '#ff00ff',
    Legendary: '#ffd700'
  };

  return (
    <MapboxGL.PointAnnotation
      id={quest.id}
      coordinate={coordinate}
      onSelected={onPress}
    >
      <View
        style={[
          styles.markerContainer,
          { borderColor: rarityColors[quest.rarity] }
        ]}
      >
        <Text style={styles.markerIcon}>⚔️</Text>
      </View>

      {/* Geofence circle */}
      {quest.spawnRules?.geofenceM && (
        <MapboxGL.CircleLayer
          id={`geofence-${quest.id}`}
          style={{
            circleRadius: quest.spawnRules.geofenceM,
            circleColor: rarityColors[quest.rarity],
            circleOpacity: 0.2,
            circleStrokeColor: rarityColors[quest.rarity],
            circleStrokeWidth: 2
          }}
        />
      )}
    </MapboxGL.PointAnnotation>
  );
}

/**
 * Quest list overlay at bottom
 */
function QuestListOverlay({
  quests,
  onQuestPress
}: {
  quests: Quest[];
  onQuestPress: (quest: Quest) => void;
}) {
  if (quests.length === 0) {
    return (
      <View style={styles.overlay}>
        <Text style={styles.noQuestsText}>No quests nearby</Text>
        <Text style={styles.noQuestsSubtext}>Explore to discover adventures!</Text>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayTitle}>Nearby Quests</Text>
      {quests.map((quest) => (
        <Pressable
          key={quest.id}
          style={styles.questCard}
          onPress={() => onQuestPress(quest)}
        >
          <View style={styles.questHeader}>
            <Text style={styles.questTitle}>{quest.title}</Text>
            <Text style={[styles.questRarity, { color: getRarityColor(quest.rarity) }]}>
              {quest.rarity}
            </Text>
          </View>
          <Text style={styles.questDescription} numberOfLines={2}>
            {quest.description}
          </Text>
          <View style={styles.questRewards}>
            {quest.rewards.map((reward, idx) => (
              <Text key={idx} style={styles.rewardText}>
                {reward.type === 'gold' && `💰 ${reward.amount}`}
                {reward.type === 'xp' && `⭐ ${reward.amount} XP`}
              </Text>
            ))}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: '#ffffff',
    Uncommon: '#00ff00',
    Rare: '#0088ff',
    Epic: '#ff00ff',
    Legendary: '#ffd700'
  };
  return colors[rarity] || '#ffffff';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  map: {
    flex: 1
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16
  },
  permissionButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center'
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16,
    textAlign: 'center'
  },
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a2e',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  markerIcon: {
    fontSize: 24
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f0f1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  noQuestsText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 4
  },
  noQuestsSubtext: {
    fontSize: 14,
    color: '#5e5e6e',
    textAlign: 'center'
  },
  questCard: {
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1
  },
  questRarity: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8
  },
  questDescription: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8
  },
  questRewards: {
    flexDirection: 'row',
    gap: 12
  },
  rewardText: {
    fontSize: 12,
    color: '#ffd700',
    fontWeight: '600'
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0f0f1e'
  },
  webMapTitle: {
    fontSize: 32,
    marginBottom: 24,
    color: '#ffffff'
  },
  webMapText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 12
  }
});
import { useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Quest } from '@rov/types';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface SpawnedEnemy {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  defeated: boolean;
  level: number;
  icon: string;
}

interface MapViewProps {
  location: { latitude: number; longitude: number };
  quests: Quest[];
  onQuestPress: (quest: Quest) => void;
  staticQuests?: EnhancedQuest[];
  onStaticQuestPress?: (quest: EnhancedQuest) => void;
  onMapMove?: (center: { lat: number; lng: number }) => void;
  focusQuest?: EnhancedQuest | null;
  navigatingToQuest?: EnhancedQuest | null;
  activeQuests?: EnhancedQuest[];
  onRouteData?: (distance: number) => void;
  spawnedEnemies?: SpawnedEnemy[];
  onEnemyPress?: (enemy: SpawnedEnemy) => void;
  driveMode?: boolean;
}

export function MapView({ location, quests, onQuestPress, staticQuests = [], onStaticQuestPress, onMapMove, focusQuest, navigatingToQuest, activeQuests = [], onRouteData, spawnedEnemies = [], onEnemyPress, driveMode = false }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: location.longitude,
    latitude: location.latitude,
    zoom: 14,
    pitch: 0,
    bearing: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [userHasPanned, setUserHasPanned] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const lastRouteLocationRef = useRef<{ lat: number; lng: number; questId?: string } | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    console.log('🗺️ MapView initializing with token:', token ? `${token.substring(0, 10)}...` : 'MISSING');

    if (!token) {
      setError('❌ Mapbox token is missing from environment variables');
    } else if (token.startsWith('sk.')) {
      setError('❌ Wrong token type! You are using a SECRET token (sk.). Web maps need a PUBLIC token (pk.).\n\nGet your public token from: https://account.mapbox.com/');
    } else if (!token.startsWith('pk.')) {
      setError('❌ Invalid Mapbox token format. Expected token starting with "pk."');
    }
  }, []);

  // Calculate bearing (direction of movement) for drive mode
  const calculateBearing = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const startLat = start.lat * Math.PI / 180;
    const startLng = start.lng * Math.PI / 180;
    const endLat = end.lat * Math.PI / 180;
    const endLng = end.lng * Math.PI / 180;

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;

    return (bearing + 360) % 360; // Normalize to 0-360
  };

  // Reset camera when drive mode is disabled
  useEffect(() => {
    if (!driveMode) {
      setViewState(prev => ({
        ...prev,
        pitch: 0,
        bearing: 0,
        zoom: 14
      }));
      // Allow auto-centering again
      setUserHasPanned(false);
    } else {
      // When drive mode is enabled, reset userHasPanned to allow camera following
      setUserHasPanned(false);
    }
  }, [driveMode]);

  // Follow player location and update bearing in drive mode
  useEffect(() => {
    if (!error && !userHasPanned) {
      const currentLoc = { lat: location.latitude, lng: location.longitude };
      let newBearing = viewState.bearing;

      // Calculate bearing in drive mode if we have previous location
      if (driveMode && lastLocationRef.current) {
        const distMoved = Math.sqrt(
          Math.pow(currentLoc.lat - lastLocationRef.current.lat, 2) +
          Math.pow(currentLoc.lng - lastLocationRef.current.lng, 2)
        );
        // Only update bearing if moved more than ~1 meter
        if (distMoved > 0.00001) {
          newBearing = calculateBearing(lastLocationRef.current, currentLoc);
        }
      }

      // Update last location
      lastLocationRef.current = currentLoc;

      const newViewState = {
        ...viewState,
        longitude: location.longitude,
        latitude: location.latitude,
        // Drive mode: tilted view with higher zoom, following bearing
        pitch: driveMode ? 60 : 0,
        zoom: driveMode ? 17 : 14,
        bearing: driveMode ? newBearing : 0
      };

      if (driveMode) {
        console.log('🚗 Drive Mode Active:', {
          pitch: newViewState.pitch,
          zoom: newViewState.zoom,
          bearing: newViewState.bearing,
          location: { lat: location.latitude, lng: location.longitude }
        });
      }

      setViewState(newViewState);
    }
  }, [location.latitude, location.longitude, error, userHasPanned, driveMode]);

  // Snap to quest location when focusQuest changes
  useEffect(() => {
    if (focusQuest && focusQuest.location && mapRef.current) {
      console.log('🎯 Snapping to quest:', focusQuest.title, focusQuest.location);
      mapRef.current.flyTo({
        center: [focusQuest.location.longitude, focusQuest.location.latitude],
        zoom: 16,
        duration: 2000,
      });
      setUserHasPanned(true);
    }
  }, [focusQuest]);

  // Fetch walking route when showing or navigating to quest
  useEffect(() => {
    async function fetchRoute() {
      const targetQuest = navigatingToQuest || focusQuest;

      if (!targetQuest || !targetQuest.location) {
        setRouteGeometry(null);
        lastRouteLocationRef.current = null;
        return;
      }

      const currentLoc = { lat: location.latitude, lng: location.longitude, questId: targetQuest.id };
      const lastLoc = lastRouteLocationRef.current;

      // Only fetch if:
      // 1. Quest changed, OR
      // 2. Location changed significantly (>10 meters)
      if (lastLoc && lastLoc.questId === targetQuest.id) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lastLoc.lat * Math.PI) / 180;
        const φ2 = (currentLoc.lat * Math.PI) / 180;
        const Δφ = ((currentLoc.lat - lastLoc.lat) * Math.PI) / 180;
        const Δλ = ((currentLoc.lng - lastLoc.lng) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Skip fetch if same quest and moved less than 10 meters
        if (distance < 10) {
          return;
        }
      }

      try {
        const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const start = `${location.longitude},${location.latitude}`;
        const end = `${targetQuest.location.longitude},${targetQuest.location.latitude}`;

        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start};${end}?geometries=geojson&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          console.log('🗺️ Route fetched:', data.routes[0].distance, 'meters');
          setRouteGeometry(data.routes[0].geometry);
          lastRouteLocationRef.current = currentLoc;

          // Pass distance back to parent
          if (onRouteData) {
            onRouteData(data.routes[0].distance);
          }
        }
      } catch (error) {
        console.error('Failed to fetch route:', error);
      }
    }

    fetchRoute();
  }, [navigatingToQuest?.id, focusQuest?.id, location.longitude, location.latitude]);

  // Fetch multi-stop route when activeQuests change (if not in drive mode)
  useEffect(() => {
    async function fetchMultiStopRoute() {
      if (!activeQuests || activeQuests.length === 0 || driveMode) {
        return; // Don't show multi-stop route during drive mode
      }

      try {
        const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
        
        // Build waypoint string: start;quest1;quest2;quest3...
        const waypoints = [
          `${location.longitude},${location.latitude}`, // Start from player
          ...activeQuests.map(quest => 
            `${quest.location.longitude},${quest.location.latitude}`
          )
        ].join(';');

        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${waypoints}?geometries=geojson&overview=full&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          console.log('🗺️ Multi-stop route fetched:', data.routes[0].distance, 'meters');
          setRouteGeometry(data.routes[0].geometry);
        }
      } catch (error) {
        console.error('Failed to fetch multi-stop route:', error);
      }
    }

    fetchMultiStopRoute();
  }, [activeQuests, location.longitude, location.latitude, driveMode]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        color: '#ff4444',
        fontSize: 16,
        fontFamily: 'monospace',
        padding: 20,
        whiteSpace: 'pre-wrap',
        textAlign: 'center'
      }}>
        {error}
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => {
        setViewState(evt.viewState);
        // Only set userHasPanned if not in drive mode
        if (!driveMode) {
          setUserHasPanned(true); // User has manually moved the map
        }
        if (onMapMove) {
          onMapMove({ lat: evt.viewState.latitude, lng: evt.viewState.longitude });
        }
      }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl
        position="top-right"
        trackUserLocation
        showUserHeading
      />

      {/* Walking route when navigating to a quest */}
      {routeGeometry && (
        <Source
          id="route"
          type="geojson"
          data={{
            type: 'Feature',
            geometry: routeGeometry,
            properties: {}
          }}
        >
          <Layer
            id="route-line"
            type="line"
            paint={{
              'line-color': '#4488ff',
              'line-width': 5,
              'line-opacity': 0.75
            }}
            layout={{
              'line-join': 'round',
              'line-cap': 'round'
            }}
          />
          <Layer
            id="route-line-border"
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 7,
              'line-opacity': 0.4
            }}
            layout={{
              'line-join': 'round',
              'line-cap': 'round'
            }}
          />
        </Source>
      )}

      {/* User location marker */}
      <Marker
        longitude={location.longitude}
        latitude={location.latitude}
        anchor="center"
      >
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#4488ff',
          border: '3px solid white',
          boxShadow: '0 0 10px rgba(68, 136, 255, 0.5)'
        }} />
      </Marker>

      {/* Quest markers */}
      {quests.map((quest) => (
        quest.location && (
          <Marker
            key={quest.id}
            longitude={quest.location.longitude}
            latitude={quest.location.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onQuestPress(quest);
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                fontSize: 32,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
              title={quest.title}
            >
              ⚔️
            </div>
          </Marker>
        )
      ))}

      {/* Epic static quest markers */}
      {staticQuests.map((quest) => (
        quest.location && (
          <Marker
            key={quest.id}
            longitude={quest.location.longitude}
            latitude={quest.location.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onStaticQuestPress?.(quest);
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={quest.title}
            >
              {/* Pulse effect for legendary/boss quests */}
              {(quest.isLegendary || quest.isBoss) && (
                <div
                  style={{
                    position: 'absolute',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: quest.color || '#ffd700',
                    opacity: 0.3,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
              )}

              {/* Main marker */}
              <div
                style={{
                  fontSize: 36,
                  filter: `drop-shadow(0 2px 8px ${quest.color || '#ffd700'})`,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {quest.icon}
              </div>

              {/* Boss crown */}
              {quest.isBoss && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    fontSize: 16,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                  }}
                >
                  👑
                </div>
              )}

              {/* Legendary sparkle */}
              {quest.isLegendary && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    fontSize: 16,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                  }}
                >
                  ✨
                </div>
              )}
            </div>
          </Marker>
        )
      ))}

      {/* Enemy markers */}
      {spawnedEnemies.map((enemy) => (
        !enemy.defeated && (
          <Marker
            key={enemy.id}
            longitude={enemy.longitude}
            latitude={enemy.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onEnemyPress?.(enemy);
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={`${enemy.name} (Lv ${enemy.level})`}
            >
              {/* Pulsing red glow for enemies */}
              <div
                style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#ff4444',
                  opacity: 0.3,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}
              />

              {/* Enemy icon */}
              <div
                style={{
                  fontSize: 28,
                  filter: 'drop-shadow(0 2px 6px #ff0000)',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {enemy.icon}
              </div>

              {/* Level badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -8,
                  backgroundColor: '#ff4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: 8,
                  border: '1px solid white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  zIndex: 2
                }}
              >
                {enemy.level}
              </div>
            </div>
          </Marker>
        )
      ))}
    </Map>
  );
}

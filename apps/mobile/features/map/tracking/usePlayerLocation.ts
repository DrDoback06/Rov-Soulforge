/**
 * Player Location Tracking Hook
 *
 * Manages real-time player location tracking with support for:
 * - Foreground location updates
 * - Platform-specific implementations (web vs native)
 * - Mock location for testing
 * - Location permissions
 */

import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from '@/lib/location';

export interface PlayerLocation {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface UsePlayerLocationOptions {
  /** Enable mock location for testing (DEV ONLY) */
  enableMockLocation?: boolean;
  /** Distance interval for location updates (meters) */
  distanceInterval?: number;
  /** Accuracy level */
  accuracy?: Location.Accuracy;
}

export interface UsePlayerLocationReturn {
  /** Current location */
  location: PlayerLocation | null;
  /** Whether location permission is granted */
  hasPermission: boolean;
  /** Whether location tracking is active */
  isTracking: boolean;
  /** Request location permission */
  requestPermission: () => Promise<boolean>;
  /** Start tracking location */
  startTracking: () => void;
  /** Stop tracking location */
  stopTracking: () => void;
  /** Enable mock location (testing only) */
  enableMockMovement: (enable: boolean) => void;
  /** Control mock movement direction */
  setMockDirection: (direction: 'forward' | 'backward' | 'left' | 'right' | 'stop') => void;
  /** Set mock movement speed */
  setMockSpeed: (speed: number) => void;
  /** Set mock movement angle */
  setMockAngle: (angle: number) => void;
}

/**
 * Hook for tracking player location
 */
export function usePlayerLocation(
  options: UsePlayerLocationOptions = {}
): UsePlayerLocationReturn {
  const {
    enableMockLocation = false,
    distanceInterval = 10,
    accuracy = Location.Accuracy.High
  } = options;

  const [location, setLocation] = useState<PlayerLocation | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [mockEnabled, setMockEnabled] = useState(enableMockLocation);

  // Mock location state (DEV ONLY)
  const mockAngle = useRef(0);
  const mockSpeed = useRef(0.0001); // Speed in degrees per update
  const mockDirection = useRef<'forward' | 'backward' | 'left' | 'right' | 'stop'>('stop');

  // Request location permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  // Request permission on mount
  useEffect(() => {
    requestPermission();
  }, []);

  // Mock movement for testing camera follow
  useEffect(() => {
    if (!mockEnabled || !location) return;

    // Store initial center point
    let centerLat = location.coords.latitude;
    let centerLng = location.coords.longitude;

    const interval = setInterval(() => {
      if (mockDirection.current === 'stop') return;

      let deltaLat = 0;
      let deltaLng = 0;
      const speed = mockSpeed.current;

      switch (mockDirection.current) {
        case 'forward':
          deltaLat = speed * Math.cos(mockAngle.current * Math.PI / 180);
          deltaLng = speed * Math.sin(mockAngle.current * Math.PI / 180);
          break;
        case 'backward':
          deltaLat = -speed * Math.cos(mockAngle.current * Math.PI / 180);
          deltaLng = -speed * Math.sin(mockAngle.current * Math.PI / 180);
          break;
        case 'left':
          mockAngle.current -= 5; // Turn left
          break;
        case 'right':
          mockAngle.current += 5; // Turn right
          break;
      }

      // Calculate new position
      const newLat = centerLat + deltaLat;
      const newLng = centerLng + deltaLng;

      // Update center for next movement
      centerLat = newLat;
      centerLng = newLng;

      setLocation(prev => prev ? {
        ...prev,
        coords: {
          ...prev.coords,
          latitude: newLat,
          longitude: newLng,
          heading: mockAngle.current,
          speed: mockDirection.current === 'stop' ? 0 : 1.0
        }
      } : prev);
    }, 100); // Update every 100ms for smoother movement

    return () => clearInterval(interval);
  }, [mockEnabled, location]); // Depend on mockEnabled and location

  // Watch user location
  useEffect(() => {
    if (!hasPermission || mockEnabled) return; // Don't watch if mocking

    let subscription: Location.LocationSubscription | null = null;
    setIsTracking(true);

    (async () => {
      try {
        if (Platform.OS === 'web') {
          // Web: Use getCurrentPositionAsync (no watch support)
          const loc = await Location.getCurrentPositionAsync({ accuracy });
          setLocation(loc as PlayerLocation);

          // Poll for updates on web
          const webInterval = setInterval(async () => {
            try {
              const updatedLoc = await Location.getCurrentPositionAsync({ accuracy });
              setLocation(updatedLoc as PlayerLocation);
            } catch (error) {
              console.error('Error getting web location:', error);
            }
          }, 5000); // Update every 5 seconds on web

          return () => clearInterval(webInterval);
        } else {
          // Native: Use watchPositionAsync
          subscription = await Location.watchPositionAsync(
            {
              accuracy,
              distanceInterval
            },
            (loc) => {
              setLocation(loc as PlayerLocation);
            }
          );
        }
      } catch (error) {
        console.error('Error watching location:', error);
        setIsTracking(false);
      }
    })();

    return () => {
      subscription?.remove();
      setIsTracking(false);
    };
  }, [hasPermission, mockEnabled, distanceInterval, accuracy]);

  const startTracking = () => {
    if (!hasPermission) {
      requestPermission();
    }
    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const enableMockMovement = (enable: boolean) => {
    setMockEnabled(enable);
  };

  const setMockDirection = (direction: 'forward' | 'backward' | 'left' | 'right' | 'stop') => {
    mockDirection.current = direction;
  };

  const setMockSpeed = (speed: number) => {
    mockSpeed.current = speed;
  };

  const setMockAngle = (angle: number) => {
    mockAngle.current = angle;
  };

  return {
    location,
    hasPermission,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
    enableMockMovement,
    setMockDirection,
    setMockSpeed,
    setMockAngle
  };
}

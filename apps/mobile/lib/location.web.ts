/**
 * Web-compatible location service
 * Uses browser Geolocation API instead of expo-location
 */

export interface LocationObject {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface LocationSubscription {
  remove: () => void;
}

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export async function requestForegroundPermissionsAsync() {
  // On web, we check permission through Geolocation API
  if (!navigator.geolocation) {
    return { status: 'denied' as const, granted: false };
  }
  
  try {
    // Try to get position to trigger permission prompt
    await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    return { status: 'granted' as const, granted: true };
  } catch (error) {
    return { status: 'denied' as const, granted: false };
  }
}

export async function getCurrentPositionAsync(options?: any): Promise<LocationObject> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          timestamp: position.timestamp,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

export async function watchPositionAsync(
  options: any,
  callback: (location: LocationObject) => void
): Promise<LocationSubscription> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        },
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('Location watch error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );

  return {
    remove: () => {
      navigator.geolocation.clearWatch(watchId);
    },
  };
}


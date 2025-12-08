# 🗺️ Map System

## Overview
The Map System handles all map rendering, player location tracking, routing, and navigation functionality for the Realm of Valor mobile app.

## Purpose
- Display the game map using Mapbox GL
- Track player location in real-time
- Show quest markers and points of interest
- Handle navigation and routing to multiple destinations
- Support auto-routing and path optimization

## Structure

```
map/
├── README.md (this file)
├── rendering/           # Map display and visualization
│   ├── MapContainer.tsx         # Main map component wrapper
│   ├── MapStyle.ts              # Mapbox style configuration
│   ├── MapControls.tsx          # Map controls (zoom, center, etc.)
│   └── index.ts
├── tracking/            # Player location tracking
│   ├── PlayerTracker.ts         # Real-time location updates
│   ├── LocationService.ts       # Location permissions & access
│   ├── usePlayerLocation.ts     # React hook for location state
│   └── index.ts
├── routing/             # Navigation and pathfinding
│   ├── RouteCalculator.ts       # Calculate routes between points
│   ├── RouteRenderer.tsx        # Display routes on map
│   ├── AutoRouting.ts           # Auto re-routing logic
│   └── index.ts
├── markers/             # Map markers (generic)
│   ├── MarkerRenderer.tsx       # Render markers on map
│   ├── MarkerClusterer.ts       # Cluster nearby markers
│   └── index.ts
└── types.ts             # Map-specific TypeScript types
```

## Key Features

### 1. Map Rendering (`rendering/`)
- **MapContainer.tsx**: Main map component that wraps Mapbox GL
- **MapStyle.ts**: Defines map styles, themes, layers
- **MapControls.tsx**: UI controls for map interaction

### 2. Player Tracking (`tracking/`)
- **PlayerTracker.ts**: Core location tracking service
  - Updates player position every N seconds
  - Handles foreground/background location updates
  - Supports mock locations for testing
- **LocationService.ts**: Manages location permissions
  - Requests location access
  - Handles permission denied cases
  - Platform-specific implementations (iOS/Android/Web)
- **usePlayerLocation.ts**: React hook for location state
  ```typescript
  const { location, isTracking, startTracking, stopTracking } = usePlayerLocation();
  ```

### 3. Routing (`routing/`)
- **RouteCalculator.ts**: Calculate optimal routes
  - Single destination routing
  - Multi-stop route optimization
  - ETA and distance calculations
- **RouteRenderer.tsx**: Display routes as polylines
- **AutoRouting.ts**: Auto re-routing when player deviates from path

### 4. Markers (`markers/`)
- Generic marker rendering system
- Marker clustering for performance
- Custom marker icons and styles

## Usage

### Displaying the Map
```typescript
import { MapContainer } from '@/features/map/rendering';
import { usePlayerLocation } from '@/features/map/tracking';

function MyMapScreen() {
  const { location } = usePlayerLocation();

  return (
    <MapContainer
      center={location ? [location.coords.longitude, location.coords.latitude] : undefined}
      zoom={15}
    />
  );
}
```

### Tracking Player Location
```typescript
import { usePlayerLocation } from '@/features/map/tracking';

function LocationTracker() {
  const { location, isTracking, startTracking, error } = usePlayerLocation();

  useEffect(() => {
    startTracking();
  }, []);

  if (error) return <Text>Location Error: {error}</Text>;
  if (!location) return <Text>Getting location...</Text>;

  return <Text>Lat: {location.coords.latitude}, Lng: {location.coords.longitude}</Text>;
}
```

### Calculating Routes
```typescript
import { RouteCalculator } from '@/features/map/routing';

const calculator = new RouteCalculator();
const route = await calculator.calculateRoute(
  { latitude: 51.5074, longitude: -0.1278 }, // Start
  { latitude: 51.5154, longitude: -0.0914 }  // End
);

console.log(`Distance: ${route.distance}m, ETA: ${route.eta}s`);
```

## Dependencies
- `expo-location` - Location services
- `mapbox-gl` (web) / `@rnmapbox/maps` (native) - Map rendering
- `geofire-common` - Geohashing and distance calculations

## AI Editing Guide

### To change map appearance:
Edit: `rendering/MapStyle.ts` (~100 lines)

### To change location tracking frequency:
Edit: `tracking/PlayerTracker.ts` (~200 lines)

### To modify routing logic:
Edit: `routing/RouteCalculator.ts` (~250 lines)

### To add new marker types:
Edit: `markers/MarkerRenderer.tsx` (~150 lines)

## Related Features
- **Quests** (`features/quests/`) - Quest markers on map
- **Enemies** (`features/enemies/`) - Enemy spawn markers
- **Social** (`features/social/`) - Friend locations on map

## Firebase Integration
- Saves player location periodically to Firestore `/users/{uid}/location`
- Used for proximity-based features (nearby quests, friends, etc.)

## Testing
```bash
# Run map feature tests
pnpm test features/map/

# Test with mock location
# See: tracking/LocationService.ts - enableMockLocation()
```

## Known Issues
- None currently

## Future Enhancements
- [ ] Offline map caching
- [ ] Custom map themes (dark mode, fantasy style)
- [ ] 3D terrain rendering
- [ ] Weather overlay

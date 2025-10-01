import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Layer, Source } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Map Picker Component
 * Interactive map for selecting quest spawn locations
 */
export function MapPicker({
  onLocationSelect,
  selectedLocation,
  geofenceRadius
}: {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  selectedLocation: { lat: number; lng: number } | null;
  geofenceRadius: number;
}) {
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 12
  });

  const handleMapClick = (event: any) => {
    const { lngLat } = event;
    onLocationSelect({
      lat: lngLat.lat,
      lng: lngLat.lng
    });
  };

  // Create geofence circle
  const geofenceCircle = selectedLocation ? {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [selectedLocation.lng, selectedLocation.lat]
    }
  } : null;

  return (
    <div className="h-96 rounded-lg overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        {selectedLocation && (
          <>
            {/* Marker */}
            <Marker
              longitude={selectedLocation.lng}
              latitude={selectedLocation.lat}
              anchor="bottom"
            >
              <div className="bg-primary text-white p-2 rounded-full text-2xl">
                ⚔️
              </div>
            </Marker>

            {/* Geofence Circle */}
            {geofenceCircle && (
              <Source
                id="geofence"
                type="geojson"
                data={geofenceCircle as any}
              >
                <Layer
                  id="geofence-circle"
                  type="circle"
                  paint={{
                    'circle-radius': {
                      stops: [
                        [0, 0],
                        [20, geofenceRadius * 10]
                      ],
                      base: 2
                    },
                    'circle-color': '#4488ff',
                    'circle-opacity': 0.2,
                    'circle-stroke-color': '#4488ff',
                    'circle-stroke-width': 2
                  }}
                />
              </Source>
            )}
          </>
        )}
      </Map>
    </div>
  );
}
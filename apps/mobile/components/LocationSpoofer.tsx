import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';

interface LocationSpooferProps {
  onLocationChange: (lat: number, lng: number) => void;
  currentLocation: { latitude: number; longitude: number };
}

const PRESET_LOCATIONS = [
  { name: '🏰 Northampton, UK', lat: 52.2405, lng: -0.9027 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  { name: 'Mountains', lat: 46.5197, lng: 8.7266 }, // Swiss Alps
  { name: 'Trail', lat: 37.8651, lng: -119.5383 }, // Yosemite
  { name: 'Beach', lat: 21.2793, lng: -157.8293 }, // Hawaii
];

export function LocationSpoofer({ onLocationChange, currentLocation }: LocationSpooferProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customLat, setCustomLat] = useState(currentLocation.latitude.toString());
  const [customLng, setCustomLng] = useState(currentLocation.longitude.toString());

  if (Platform.OS !== 'web') {
    return null; // Only show on web for testing
  }

  const handlePreset = (lat: number, lng: number) => {
    onLocationChange(lat, lng);
    setCustomLat(lat.toString());
    setCustomLng(lng.toString());
  };

  const handleCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onLocationChange(lat, lng);
    }
  };

  const moveInDirection = (direction: 'north' | 'south' | 'east' | 'west') => {
    const delta = 0.001; // ~100m
    let newLat = currentLocation.latitude;
    let newLng = currentLocation.longitude;

    switch (direction) {
      case 'north': newLat += delta; break;
      case 'south': newLat -= delta; break;
      case 'east': newLng += delta; break;
      case 'west': newLng -= delta; break;
    }

    onLocationChange(newLat, newLng);
    setCustomLat(newLat.toString());
    setCustomLng(newLng.toString());
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.toggleText}>
          🗺️ Location Spoofer {isExpanded ? '▼' : '▶'}
        </Text>
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
          {/* Current Location Display */}
          <View style={styles.section}>
            <Text style={styles.label}>Current Location:</Text>
            <Text style={styles.coords}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>

          {/* Movement Controls */}
          <View style={styles.section}>
            <Text style={styles.label}>Move (~100m per click):</Text>
            <View style={styles.dpad}>
              <Pressable style={styles.dpadBtn} onPress={() => moveInDirection('north')}>
                <Text style={styles.dpadText}>▲</Text>
              </Pressable>
              <View style={styles.dpadRow}>
                <Pressable style={styles.dpadBtn} onPress={() => moveInDirection('west')}>
                  <Text style={styles.dpadText}>◀</Text>
                </Pressable>
                <View style={styles.dpadCenter} />
                <Pressable style={styles.dpadBtn} onPress={() => moveInDirection('east')}>
                  <Text style={styles.dpadText}>▶</Text>
                </Pressable>
              </View>
              <Pressable style={styles.dpadBtn} onPress={() => moveInDirection('south')}>
                <Text style={styles.dpadText}>▼</Text>
              </Pressable>
            </View>
          </View>

          {/* Preset Locations */}
          <View style={styles.section}>
            <Text style={styles.label}>Quick Teleport:</Text>
            <View style={styles.presets}>
              {PRESET_LOCATIONS.map((loc) => (
                <Pressable
                  key={loc.name}
                  style={styles.presetButton}
                  onPress={() => handlePreset(loc.lat, loc.lng)}
                >
                  <Text style={styles.presetText}>{loc.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Custom Coordinates */}
          <View style={styles.section}>
            <Text style={styles.label}>Custom Coordinates:</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={customLat}
                onChangeText={setCustomLat}
                placeholder="Latitude"
                placeholderTextColor="#5e5e6e"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                value={customLng}
                onChangeText={setCustomLng}
                placeholder="Longitude"
                placeholderTextColor="#5e5e6e"
                keyboardType="numeric"
              />
            </View>
            <Pressable style={styles.setButton} onPress={handleCustomLocation}>
              <Text style={styles.setButtonText}>Set Location</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 70,
    left: 10,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 12,
    padding: 12,
    zIndex: 1000,
    maxWidth: 350,
    borderWidth: 2,
    borderColor: '#4488ff',
  },
  toggleButton: {
    padding: 8,
  },
  toggleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    marginTop: 12,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  label: {
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '600',
  },
  coords: {
    color: '#4488ff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  dpad: {
    alignItems: 'center',
    gap: 4,
  },
  dpadRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dpadBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a4a5e',
  },
  dpadCenter: {
    width: 50,
    height: 50,
  },
  dpadText: {
    color: '#fff',
    fontSize: 24,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a4a5e',
  },
  presetText: {
    color: '#fff',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a4a5e',
    fontSize: 14,
  },
  setButton: {
    backgroundColor: '#4488ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

# Realm of Valor Mobile App - Comprehensive Overhaul Guide

## Overview
This guide documents all changes needed for the complete mobile app overhaul.

## Prerequisites

### 1. Install geolib Package
```bash
cd f:/Soulforge 09-2025/rov/apps/mobile
npm install geolib
```

## Files Created

### 1. UniversalCardItem Component
**File**: `f:/Soulforge 09-2025/rov/apps/mobile/components/UniversalCardItem.tsx`
**Status**: ✅ CREATED

Universal card component that can be used in:
- Inventory tab
- Stash tab
- Shop tab
- Any location requiring card display

**Features**:
- Accepts `sourceZone` prop
- Full drag & drop support
- Rarity colors
- Stack counts
- Exports helper functions: `getRarityColor`, `isCardUsableInApp`, `detectDropZoneAtPosition`

### 2. Distance Utilities
**File**: `f:/Soulforge 09-2025/rov/apps/mobile/utils/distance.ts`
**Status**: ✅ CREATED

Comprehensive distance and ETA calculation utilities including:
- `calculateDistance()` - Distance between two points
- `calculateWalkingETA()` - Walking time estimates
- `calculateDrivingETA()` - Driving time estimates
- `calculateCyclingETA()` - Cycling time estimates
- `calculateSteps()` - Step count estimates
- `formatDistance()` - Auto-formatting for display
- `isWithinRadius()` - Proximity checks
- `calculateBearing()` - Compass direction
- `bearingToCardinal()` - Convert to N/S/E/W
- `bearingToArrow()` - Get direction emoji arrow

## Files to Modify

### 3. Inventory Tab
**File**: `f:/Soulforge 09-2025/rov/apps/mobile/app/(tabs)/inventory.tsx`

#### Changes Required:
1. **Update imports** (lines 1-8):
```typescript
import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useInventory } from '@/hooks/useInventory';
import { CardSeeder } from '@/components/CardSeeder';
import { DropZone } from '@/components/DropZone';
import { UniversalCardItem, getRarityColor, isCardUsableInApp } from '@/components/UniversalCardItem';
import type { Rarity, DeckType } from '@rov/types';
```

2. **Add inventory capacity** (after line 20):
```typescript
// Inventory capacity
const INVENTORY_CAPACITY = 50;
```

3. **Update card count display** (line 113-115):
```typescript
const totalCards = stackedCards.reduce((sum, c) => sum + c.count, 0);

<Text style={styles.cardCount}>
  {stackedCards.length} unique • {totalCards} total • {totalCards}/{INVENTORY_CAPACITY} capacity
</Text>
```

4. **Wrap FlatList in DropZone** (lines 118-139):
```typescript
{/* Inventory Drop Zone - Accepts items from stash */}
<DropZone
  zoneId="inventory"
  acceptedSources={['stash-equipment', 'stash-consumables', 'stash-materials', 'stash-misc']}
  onDrop={(itemId, itemData, sourceZone) => {
    console.log('✅ Item dropped in inventory:', itemData.name, 'from', sourceZone);
    // The transfer is handled by the stash tab's transfer hook
  }}
  style={{ flex: 1 }}
>
  {/* Diablo II-style Grid - Smaller cards, more per row */}
  <FlatList
    data={stackedCards}
    keyExtractor={(item) => item.id}
    numColumns={6}
    contentContainerStyle={styles.gridContent}
    columnWrapperStyle={styles.row}
    renderItem={({ item }) => (
      <UniversalCardItem
        card={item}
        count={item.count}
        sourceZone="inventory"
        onHover={setHoveredCard}
      />
    )}
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🃏</Text>
        <Text style={styles.emptyText}>No cards found</Text>
        <Text style={styles.emptySubtext}>Seed test cards or purchase packs from the shop</Text>
      </View>
    }
  />
</DropZone>
```

5. **Remove CardIconItem function** (lines 210-314) - now using UniversalCardItem
6. **Remove helper functions** (lines 316-361) - now exported from UniversalCardItem

### 4. Stash Tab
**File**: `f:/Soulforge 09-2025/rov/apps/mobile/app/(tabs)/stash.tsx`

#### Changes Required:

1. **Update imports** (add UniversalCardItem):
```typescript
import { UniversalCardItem, getRarityColor } from '@/components/UniversalCardItem';
```

2. **Update STASH_CAPACITY** (line 28):
```typescript
const STASH_CAPACITY = 200; // Changed from 40
```

3. **Add inventory dropdown state** (after line 25):
```typescript
const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
const { dragState } = useDragDropContext();

// Show inventory dropdown when dragging from stash
useEffect(() => {
  if (dragState.isDragging && dragState.sourceZone?.startsWith('stash-')) {
    setShowInventoryDropdown(true);
  } else {
    setShowInventoryDropdown(false);
  }
}, [dragState.isDragging, dragState.sourceZone]);
```

4. **Replace CardIconItem usage** (lines 287-294):
```typescript
renderItem={({ item }) => (
  <UniversalCardItem
    card={item}
    count={item.count || 1}
    sourceZone={`stash-${activeTab}`}
    onHover={setHoverCard}
  />
)}
```

5. **Add inventory dropdown at bottom** (before closing View tag):
```typescript
{/* Inventory Dropdown - Shows when dragging from stash */}
{showInventoryDropdown && (
  <View style={styles.inventoryDropdown}>
    <View style={styles.inventoryDropdownHeader}>
      <Text style={styles.inventoryDropdownTitle}>📦 Drop to Inventory</Text>
      <Text style={styles.inventoryDropdownSubtitle}>Release to transfer item</Text>
    </View>
    <DropZone
      zoneId="inventory-dropdown"
      acceptedSources={['stash-equipment', 'stash-consumables', 'stash-materials', 'stash-misc']}
      onDrop={(itemId, itemData, sourceZone) => {
        console.log('✅ Item dropped to inventory:', itemData.name);
        // Handle transfer here
      }}
      style={styles.inventoryDropdownZone}
    >
      <View style={styles.inventoryDropdownContent}>
        <Text style={styles.inventoryDropdownIcon}>🎒</Text>
        <Text style={styles.inventoryDropdownText}>Inventory</Text>
      </View>
    </DropZone>
  </View>
)}
```

6. **Add styles** (in StyleSheet.create):
```typescript
inventoryDropdown: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#2a2a3e',
  borderTopWidth: 2,
  borderTopColor: '#ffd700',
  paddingHorizontal: 16,
  paddingVertical: 12,
  elevation: 10,
  zIndex: 1000
},
inventoryDropdownHeader: {
  alignItems: 'center',
  marginBottom: 8
},
inventoryDropdownTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#ffd700'
},
inventoryDropdownSubtitle: {
  fontSize: 12,
  color: '#8e8e93'
},
inventoryDropdownZone: {
  height: 100
},
inventoryDropdownContent: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#1a1a2e',
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#4488ff',
  borderStyle: 'dashed'
},
inventoryDropdownIcon: {
  fontSize: 32,
  marginBottom: 4
},
inventoryDropdownText: {
  fontSize: 14,
  color: '#ffffff',
  fontWeight: '600'
}
```

7. **Remove CardIconItem function** (lines 392-460) - now using UniversalCardItem
8. **Remove getRarityColor function** (lines 462-472) - now imported from UniversalCardItem

### 5. Quests Tab
**File**: `f:/Soulforge 09-2025/rov/apps/mobile/app/(tabs)/quests.tsx`

#### Major Changes Required:

1. **Add imports**:
```typescript
import { useEffect, useMemo } from 'react';
import { calculateDistance, calculateWalkingETA, formatDistance } from '@/utils/distance';
import { useFirebase } from '@/lib/firebase-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

2. **Add state for player location** (after existing state):
```typescript
const [playerLocation, setPlayerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
const [sortBy, setSortBy] = useState<'distance' | 'none'>('none');
const [filterType, setFilterType] = useState<'all' | 'combat' | 'exploration' | 'challenge' | 'defend' | 'collection'>('all');
const [trackedQuestId, setTrackedQuestId] = useState<string | null>(null);
```

3. **Load player location** (add useEffect):
```typescript
useEffect(() => {
  // Get player location from expo-location or stored location
  const loadPlayerLocation = async () => {
    // Try to get from location hook/context
    // For now, use stored or default
    const stored = await AsyncStorage.getItem('playerLocation');
    if (stored) {
      setPlayerLocation(JSON.parse(stored));
    }
  };
  loadPlayerLocation();
}, []);
```

4. **Add quest sorting and filtering**:
```typescript
const filteredAndSortedQuests = useMemo(() => {
  let quests = [...(questProgress || [])];

  // Filter by type
  if (filterType !== 'all') {
    quests = quests.filter(q => q.type === filterType);
  }

  // Sort by distance
  if (sortBy === 'distance' && playerLocation) {
    quests.sort((a, b) => {
      const distA = calculateDistance(
        playerLocation.latitude,
        playerLocation.longitude,
        a.location.latitude,
        a.location.longitude
      ).meters;

      const distB = calculateDistance(
        playerLocation.latitude,
        playerLocation.longitude,
        b.location.latitude,
        b.location.longitude
      ).meters;

      return distA - distB;
    });
  }

  return quests;
}, [questProgress, filterType, sortBy, playerLocation]);
```

5. **Add filter buttons** (in header):
```typescript
{/* Sort and Filter Controls */}
<View style={styles.controlsRow}>
  <Pressable
    style={[styles.controlButton, sortBy === 'distance' && styles.controlButtonActive]}
    onPress={() => setSortBy(sortBy === 'distance' ? 'none' : 'distance')}
  >
    <Text style={styles.controlButtonText}>📍 By Distance</Text>
  </Pressable>
</View>

<View style={styles.filterRow}>
  {['all', 'combat', 'exploration', 'challenge', 'defend', 'collection'].map((type) => (
    <Pressable
      key={type}
      style={[styles.filterChip, filterType === type && styles.filterChipActive]}
      onPress={() => setFilterType(type as any)}
    >
      <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
    </Pressable>
  ))}
</View>
```

6. **Update QuestProgressCard to include distance and ETA**:
```typescript
function QuestProgressCard({ quest, onRefresh, playerLocation, isTracked, onTrack }: {
  quest: any;
  onRefresh: () => void;
  playerLocation: { latitude: number; longitude: number } | null;
  isTracked: boolean;
  onTrack: (questId: string) => void;
}) {
  // Calculate distance and ETA
  const distanceInfo = useMemo(() => {
    if (!playerLocation || !quest.location) return null;

    const distance = calculateDistance(
      playerLocation.latitude,
      playerLocation.longitude,
      quest.location.latitude,
      quest.location.longitude
    );

    const eta = calculateWalkingETA(distance.meters);

    return {
      distance: formatDistance(distance.meters),
      eta: eta.formatted
    };
  }, [playerLocation, quest.location]);

  // ... existing code ...

  return (
    <Pressable style={styles.questCard} onPress={handleNavigateToQuest}>
      {/* Add distance/ETA badge */}
      {distanceInfo && (
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>📍 {distanceInfo.distance}</Text>
          <Text style={styles.etaText}>{distanceInfo.eta}</Text>
        </View>
      )}

      {/* ... existing quest content ... */}

      {/* Update action buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.trackButton, isTracked && styles.trackButtonActive]}
          onPress={(e) => {
            e.stopPropagation();
            onTrack(quest.id);
          }}
        >
          <Text style={styles.trackButtonText}>{isTracked ? '★ Tracked' : '☆ Track'}</Text>
        </Pressable>

        <Pressable
          style={styles.viewOnMapButton}
          onPress={(e) => {
            e.stopPropagation();
            handleNavigateToQuest();
          }}
        >
          <Text style={styles.viewOnMapButtonText}>📍 View on Map</Text>
        </Pressable>

        <Pressable
          style={[styles.abandonButton, abandoning && styles.abandonButtonDisabled]}
          onPress={(e) => {
            e.stopPropagation();
            handleAbandonQuest();
          }}
          disabled={abandoning}
        >
          <Text style={styles.abandonButtonText}>{abandoning ? 'Abandoning...' : '❌ Abandon'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
```

7. **Add new styles**:
```typescript
controlsRow: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 12
},
controlButton: {
  backgroundColor: '#2a2a3e',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#3a3a4e'
},
controlButtonActive: {
  backgroundColor: '#4488ff',
  borderColor: '#4488ff'
},
controlButtonText: {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: '600'
},
filterRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 12
},
filterChip: {
  backgroundColor: '#2a2a3e',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#3a3a4e'
},
filterChipActive: {
  backgroundColor: '#4488ff',
  borderColor: '#4488ff'
},
filterChipText: {
  color: '#8e8e93',
  fontSize: 11,
  fontWeight: '600'
},
filterChipTextActive: {
  color: '#ffffff'
},
distanceBadge: {
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: '#1a1a2e',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#4488ff',
  alignItems: 'flex-end'
},
distanceText: {
  fontSize: 12,
  color: '#4488ff',
  fontWeight: '600',
  marginBottom: 2
},
etaText: {
  fontSize: 10,
  color: '#8e8e93'
},
trackButton: {
  flex: 1,
  backgroundColor: '#2a2a3e',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ffd700'
},
trackButtonActive: {
  backgroundColor: '#ffd700',
  borderColor: '#ffd700'
},
trackButtonText: {
  color: '#ffd700',
  fontSize: 13,
  fontWeight: '600'
}
```

### 6. Quest Detail Popup
**File**: `f:/Soulforge 09-2025/rov/apps/mobile/app/quest/[id].tsx`

#### Major Changes Required:

1. **Add imports**:
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useQuests } from '@/hooks/useQuests';
import { calculateDistance, calculateWalkingETA, formatDistance } from '@/utils/distance';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

2. **Add state**:
```typescript
const [playerLocation, setPlayerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
const [isAccepted, setIsAccepted] = useState(false);
const [isTracked, setIsTracked] = useState(false);
const [accepting, setAccepting] = useState(false);
const [abandoning, setAbandoning] = useState(false);
const { user } = useAuth();
const { questProgress } = useQuests();
```

3. **Check if quest is already accepted**:
```typescript
useEffect(() => {
  if (quest && questProgress) {
    const accepted = questProgress.some(q => q.questId === quest.id || q.id === quest.id);
    setIsAccepted(accepted);
  }
}, [quest, questProgress]);
```

4. **Load player location and tracked quest**:
```typescript
useEffect(() => {
  const loadData = async () => {
    const stored = await AsyncStorage.getItem('playerLocation');
    if (stored) {
      setPlayerLocation(JSON.parse(stored));
    }

    const tracked = await AsyncStorage.getItem('trackedQuest');
    if (tracked === id) {
      setIsTracked(true);
    }
  };
  loadData();
}, [id]);
```

5. **Add distance/ETA calculation**:
```typescript
const distanceInfo = useMemo(() => {
  if (!playerLocation || !quest?.location) return null;

  const distance = calculateDistance(
    playerLocation.latitude,
    playerLocation.longitude,
    quest.location.latitude,
    quest.location.longitude
  );

  const eta = calculateWalkingETA(distance.meters);

  return {
    distance: formatDistance(distance.meters),
    eta: eta.formatted,
    meters: distance.meters
  };
}, [playerLocation, quest]);
```

6. **Add handler functions**:
```typescript
const handleAcceptQuest = async () => {
  if (!user || !quest) return;

  setAccepting(true);
  try {
    const progressDoc = {
      questId: quest.id,
      userId: user.uid,
      status: 'active',
      title: quest.title,
      description: quest.description,
      icon: quest.icon,
      location: quest.location,
      objectives: quest.objectives.map(obj => ({
        ...obj,
        completed: false,
        current: 0
      })),
      rewards: quest.rewards,
      progress: 0,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await setDoc(
      doc(db, 'questProgress', `${user.uid}_${quest.id}`),
      progressDoc
    );

    Alert.alert('Quest Accepted!', `You have accepted "${quest.title}"`);
    setIsAccepted(true);
  } catch (error) {
    console.error('Failed to accept quest:', error);
    Alert.alert('Error', 'Failed to accept quest');
  } finally {
    setAccepting(false);
  }
};

const handleAbandonQuest = async () => {
  if (!user || !quest) return;

  Alert.alert(
    'Abandon Quest',
    `Are you sure you want to abandon "${quest.title}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: async () => {
          setAbandoning(true);
          try {
            await deleteDoc(doc(db, 'questProgress', `${user.uid}_${quest.id}`));
            Alert.alert('Quest Abandoned', `You have abandoned "${quest.title}"`);
            setIsAccepted(false);
            router.back();
          } catch (error) {
            console.error('Failed to abandon quest:', error);
            Alert.alert('Error', 'Failed to abandon quest');
          } finally {
            setAbandoning(false);
          }
        }
      }
    ]
  );
};

const handleTrackQuest = async () => {
  if (!quest) return;

  if (isTracked) {
    await AsyncStorage.removeItem('trackedQuest');
    setIsTracked(false);
    Alert.alert('Quest Untracked', `Stopped tracking "${quest.title}"`);
  } else {
    await AsyncStorage.setItem('trackedQuest', quest.id);
    setIsTracked(true);
    Alert.alert('Quest Tracked', `Now tracking "${quest.title}"`);
  }
};

const handleRouteToQuest = () => {
  if (!quest?.location) return;

  router.push({
    pathname: '/(tabs)',
    params: {
      questId: quest.id,
      lat: quest.location.latitude,
      lng: quest.location.longitude,
      showRoute: 'true'
    }
  });
};

const handleViewOnMap = () => {
  if (!quest?.location) return;

  router.push({
    pathname: '/(tabs)',
    params: {
      questId: quest.id,
      lat: quest.location.latitude,
      lng: quest.location.longitude
    }
  });
};
```

7. **Update the UI - add distance/ETA display** (after location section):
```typescript
{/* Distance and ETA */}
{distanceInfo && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>🚶 Travel Info</Text>
    <View style={styles.travelInfo}>
      <View style={styles.travelInfoItem}>
        <Text style={styles.travelInfoLabel}>Distance</Text>
        <Text style={styles.travelInfoValue}>{distanceInfo.distance}</Text>
      </View>
      <View style={styles.travelInfoDivider} />
      <View style={styles.travelInfoItem}>
        <Text style={styles.travelInfoLabel}>Walking Time</Text>
        <Text style={styles.travelInfoValue}>{distanceInfo.eta}</Text>
      </View>
    </View>
  </View>
)}
```

8. **Update bottom buttons** (replace the info text with action buttons):
```typescript
{/* Action Buttons */}
<View style={styles.actionButtonsContainer}>
  {!isAccepted ? (
    <>
      <Pressable
        style={[styles.primaryButton, accepting && styles.buttonDisabled]}
        onPress={handleAcceptQuest}
        disabled={accepting}
      >
        <Text style={styles.primaryButtonText}>
          {accepting ? 'Accepting...' : '✓ ACCEPT QUEST'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={handleViewOnMap}
      >
        <Text style={styles.secondaryButtonText}>📍 View on Map</Text>
      </Pressable>
    </>
  ) : (
    <>
      <Pressable
        style={styles.primaryButton}
        onPress={handleRouteToQuest}
      >
        <Text style={styles.primaryButtonText}>🗺️ Route to Quest</Text>
      </Pressable>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.secondaryButton, { flex: 1 }]}
          onPress={handleViewOnMap}
        >
          <Text style={styles.secondaryButtonText}>📍 View on Map</Text>
        </Pressable>

        <Pressable
          style={[styles.trackButton, isTracked && styles.trackButtonActive, { flex: 1 }]}
          onPress={handleTrackQuest}
        >
          <Text style={[styles.trackButtonText, isTracked && styles.trackButtonTextActive]}>
            {isTracked ? '★ Tracked' : '☆ Track Quest'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.dangerButton, abandoning && styles.buttonDisabled]}
        onPress={handleAbandonQuest}
        disabled={abandoning}
      >
        <Text style={styles.dangerButtonText}>
          {abandoning ? 'Abandoning...' : '❌ Abandon Quest'}
        </Text>
      </Pressable>
    </>
  )}
</View>
```

9. **Add new styles**:
```typescript
travelInfo: {
  flexDirection: 'row',
  backgroundColor: '#1a1a2e',
  borderRadius: 12,
  padding: 16
},
travelInfoItem: {
  flex: 1,
  alignItems: 'center'
},
travelInfoLabel: {
  fontSize: 12,
  color: '#8e8e93',
  marginBottom: 4,
  textTransform: 'uppercase'
},
travelInfoValue: {
  fontSize: 18,
  color: '#4488ff',
  fontWeight: 'bold'
},
travelInfoDivider: {
  width: 1,
  backgroundColor: '#3a3a4e',
  marginHorizontal: 16
},
actionButtonsContainer: {
  gap: 12,
  marginTop: 24,
  marginBottom: 16
},
primaryButton: {
  backgroundColor: '#4488ff',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center'
},
primaryButtonText: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 'bold',
  textTransform: 'uppercase'
},
secondaryButton: {
  backgroundColor: '#2a2a3e',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#4488ff'
},
secondaryButtonText: {
  color: '#4488ff',
  fontSize: 15,
  fontWeight: '600'
},
trackButton: {
  backgroundColor: '#2a2a3e',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ffd700'
},
trackButtonActive: {
  backgroundColor: '#ffd700',
  borderColor: '#ffd700'
},
trackButtonText: {
  color: '#ffd700',
  fontSize: 15,
  fontWeight: '600'
},
trackButtonTextActive: {
  color: '#1a1a2e'
},
dangerButton: {
  backgroundColor: '#ff4444',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center'
},
dangerButtonText: {
  color: '#ffffff',
  fontSize: 15,
  fontWeight: '600'
},
buttonRow: {
  flexDirection: 'row',
  gap: 12
},
buttonDisabled: {
  opacity: 0.5
}
```

### 7. Map Tab
**File**: `f:/Soulforge 09-2025/rov/apps/mobile/app/(tabs)/index.tsx`

#### Changes Required:

1. **Add imports**:
```typescript
import { useLocalSearchParams } from 'expo-router';
```

2. **Add state for quest navigation**:
```typescript
const params = useLocalSearchParams<{ questId?: string; lat?: string; lng?: string; showRoute?: string }>();
const [selectedQuestForRoute, setSelectedQuestForRoute] = useState<string | null>(null);
const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
```

3. **Handle quest navigation from params**:
```typescript
useEffect(() => {
  if (params.questId && params.lat && params.lng) {
    const questLat = parseFloat(params.lat);
    const questLng = parseFloat(params.lng);

    // Center map on quest
    setMapCenter({ lat: questLat, lng: questLng });

    // If showRoute is true, draw route line
    if (params.showRoute === 'true' && displayLocation) {
      setSelectedQuestForRoute(params.questId);
      setRouteCoordinates([
        [displayLocation.coords.longitude, displayLocation.coords.latitude],
        [questLng, questLat]
      ]);
    }
  }
}, [params, displayLocation]);
```

4. **Pass route data to MapView component**:
```typescript
<MapView
  location={displayLocation}
  quests={[...staticQuests, ...dynamicQuests, ...worldEvents]}
  onQuestPress={handleQuestPress}
  onMapMove={handleMapMove}
  highlightedQuestId={params.questId || selectedQuestForRoute}
  routeCoordinates={routeCoordinates}
/>
```

5. **Update MapView component** (in `components/MapView.web.tsx`):

Add props:
```typescript
interface MapViewProps {
  location: Location.LocationObject | null;
  quests: EnhancedQuest[];
  onQuestPress: (quest: EnhancedQuest) => void;
  onMapMove?: (center: { lat: number; lng: number }) => void;
  highlightedQuestId?: string;
  routeCoordinates?: [number, number][] | null;
}
```

Add route layer when map loads and coords are provided:
```typescript
useEffect(() => {
  if (!map.current || !routeCoordinates) return;

  // Remove existing route
  if (map.current.getLayer('route-line')) {
    map.current.removeLayer('route-line');
    map.current.removeSource('route-line-source');
  }

  // Add new route
  map.current.addSource('route-line-source', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates
      }
    }
  });

  map.current.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route-line-source',
    paint: {
      'line-color': '#4488ff',
      'line-width': 4,
      'line-dasharray': [2, 2]
    }
  });
}, [routeCoordinates]);
```

Add quest highlight effect:
```typescript
// In quest marker rendering, add pulse animation for highlighted quest
{highlightedQuestId === quest.id && (
  <div className="quest-marker-pulse" />
)}
```

Add CSS for pulse animation:
```css
.quest-marker-pulse {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(68, 136, 255, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

## Additional QOL Features

### Quest History Tab
Add a new tab to show completed quests (last 20).

**File**: `f:/Soulforge 09-2025/rov/apps/mobile/app/(tabs)/quest-history.tsx` (NEW FILE)

```typescript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useFirebase } from '@/lib/firebase-context';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function QuestHistoryScreen() {
  const { user } = useAuth();
  const { db } = useFirebase();
  const [completedQuests, setCompletedQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompletedQuests();
  }, [user]);

  async function loadCompletedQuests() {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'questProgress'),
        where('userId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompletedQuests(quests);
    } catch (error) {
      console.error('Failed to load quest history:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <Text style={styles.title}>Quest History</Text>
        <Text style={styles.subtitle}>{completedQuests.length} Completed</Text>
      </View>

      <FlatList
        data={completedQuests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.questCard}>
            <Text style={styles.questIcon}>{item.icon || '⚔️'}</Text>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>{item.title}</Text>
              <Text style={styles.questDate}>
                Completed: {new Date(item.completedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 14, color: '#8e8e93', marginTop: 4 },
  listContent: { padding: 16 },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a4e'
  },
  questIcon: { fontSize: 32, marginRight: 12 },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  questDate: { fontSize: 12, color: '#8e8e93' },
  checkmark: { fontSize: 24, color: '#4ade80' }
});
```

### Auto-Accept Nearby Quests
Add setting and background logic.

**File**: `f:/Soulforge 09-2025/rov/apps/mobile/hooks/useAutoAcceptQuests.ts` (NEW FILE)

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useFirebase } from '@/lib/firebase-context';
import { calculateDistance } from '@/utils/distance';
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAutoAcceptQuests(
  playerLocation: { latitude: number; longitude: number } | null,
  nearbyQuests: any[]
) {
  const { user } = useAuth();
  const { db } = useFirebase();
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
  const [autoAcceptRadius] = useState(100); // 100 meters

  // Load setting
  useEffect(() => {
    AsyncStorage.getItem('autoAcceptQuests').then(value => {
      setAutoAcceptEnabled(value === 'true');
    });
  }, []);

  // Auto-accept logic
  useEffect(() => {
    if (!autoAcceptEnabled || !user || !playerLocation || nearbyQuests.length === 0) {
      return;
    }

    nearbyQuests.forEach(async (quest) => {
      if (!quest.location) return;

      const distance = calculateDistance(
        playerLocation.latitude,
        playerLocation.longitude,
        quest.location.latitude,
        quest.location.longitude
      );

      if (distance.meters <= autoAcceptRadius) {
        // Auto-accept quest
        try {
          const progressDoc = {
            questId: quest.id,
            userId: user.uid,
            status: 'active',
            title: quest.title,
            description: quest.description,
            icon: quest.icon,
            location: quest.location,
            objectives: quest.objectives.map((obj: any) => ({
              ...obj,
              completed: false,
              current: 0
            })),
            rewards: quest.rewards,
            progress: 0,
            startedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            autoAccepted: true
          };

          await setDoc(
            doc(db, 'questProgress', `${user.uid}_${quest.id}`),
            progressDoc
          );

          console.log(`✅ Auto-accepted quest: ${quest.title}`);
        } catch (error) {
          console.error('Failed to auto-accept quest:', error);
        }
      }
    });
  }, [autoAcceptEnabled, playerLocation, nearbyQuests, autoAcceptRadius]);

  return {
    autoAcceptEnabled,
    setAutoAcceptEnabled: async (enabled: boolean) => {
      setAutoAcceptEnabled(enabled);
      await AsyncStorage.setItem('autoAcceptQuests', enabled.toString());
    }
  };
}
```

## Testing Instructions

### 1. Universal Card Component
1. Navigate to inventory tab
2. Verify cards display correctly
3. Drag a card from inventory
4. Check console for drag events
5. Drop on stash tab
6. Verify card transfers

### 2. Stash to Inventory Drag & Drop
1. Open stash tab
2. Drag an item from stash
3. Verify inventory dropdown appears at bottom
4. Drop item on inventory dropdown
5. Check that item transfers to inventory
6. Verify stash updates

### 3. Quest Distance & ETA
1. Open quests tab
2. Verify each quest shows distance badge
3. Verify ETA is displayed
4. Sort by distance
5. Verify quests reorder by nearest first

### 4. Quest Detail Popup
1. Tap a quest to open detail view
2. Verify distance and ETA display
3. Test "Accept Quest" button
4. Test "Route to Quest" button
5. Verify map centers on quest with route line
6. Test "Track Quest" toggle
7. Test "Abandon Quest" button

### 5. Map Quest Navigation
1. From quest detail, tap "Route to Quest"
2. Verify map centers on quest location
3. Verify blue dashed route line appears
4. Verify quest marker has pulse animation
5. Verify distance overlay shows

### 6. Quest Filters
1. Open quests tab
2. Test each filter button (combat, exploration, etc.)
3. Verify quests filter correctly
4. Test "By Distance" sort toggle
5. Verify quests sort by distance

## Known Limitations

1. **Routing**: Currently uses straight-line routing. For real navigation, integrate a routing API like Mapbox Directions or Google Maps Directions.

2. **Real-time Location**: The app needs active location tracking. Ensure location permissions are granted and location services are running.

3. **Performance**: With many quests, distance calculations may be slow. Consider:
   - Caching distance calculations
   - Using spatial indexing for nearby quests
   - Limiting calculations to visible quests

4. **Firebase Rules**: Update Firestore security rules to allow quest progress creation/deletion:

```javascript
// Firestore Rules
match /questProgress/{progressId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
}

match /stashes/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Summary of Created Files

1. `components/UniversalCardItem.tsx` - Universal reusable card component
2. `utils/distance.ts` - Distance and ETA calculation utilities
3. `COMPREHENSIVE_OVERHAUL_GUIDE.md` - This documentation file

## Summary of Modified Files

1. `app/(tabs)/inventory.tsx` - Added drop zone, universal card component, capacity limit
2. `app/(tabs)/stash.tsx` - Increased capacity, added inventory dropdown, universal card component
3. `app/(tabs)/quests.tsx` - Added distance/ETA, filters, sorting, tracking
4. `app/quest/[id].tsx` - Added distance/ETA, route button, accept/abandon/track buttons
5. `app/(tabs)/index.tsx` - Added quest navigation, route line rendering, quest highlighting

## Next Steps

1. Install geolib: `npm install geolib`
2. Apply all file modifications listed above
3. Test each feature thoroughly
4. Update Firebase security rules
5. Consider adding the optional QOL features (quest history, auto-accept)

## Additional QOL Features Not Yet Implemented

These require additional development time:

1. Quest completion animation - Requires animation library setup
2. Quest rewards preview on tap - Requires modal component
3. Quest share functionality - Requires deep linking setup
4. Quest expiration timer - Requires dynamic quest system enhancement
5. Difficulty color indicators - Requires character level context

These can be added in future iterations once the core functionality is stable.

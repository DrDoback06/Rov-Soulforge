# Quick Start Guide - ROV Mobile App Overhaul

## Installation

```bash
cd f:/Soulforge\ 09-2025/rov/apps/mobile

# Install required packages
npm install geolib @react-native-async-storage/async-storage
```

## Files Already Created

1. `components/UniversalCardItem.tsx` ✅
2. `utils/distance.ts` ✅
3. `COMPREHENSIVE_OVERHAUL_GUIDE.md` ✅
4. `IMPLEMENTATION_SUMMARY.md` ✅

## Quick Implementation Steps

### Step 1: Update Inventory Tab (5 min)

Open `app/(tabs)/inventory.tsx`:

1. **Update imports** (lines 1-8):
```typescript
import { DropZone } from '@/components/DropZone';
import { UniversalCardItem, getRarityColor, isCardUsableInApp } from '@/components/UniversalCardItem';
```

2. **Add capacity** (after line 20):
```typescript
const INVENTORY_CAPACITY = 50;
const totalCards = stackedCards.reduce((sum, c) => sum + c.count, 0);
```

3. **Update card count text** (line ~114):
```typescript
<Text style={styles.cardCount}>
  {stackedCards.length} unique • {totalCards} total • {totalCards}/{INVENTORY_CAPACITY} capacity
</Text>
```

4. **Wrap FlatList in DropZone** (replace lines ~118-139):
```typescript
<DropZone
  zoneId="inventory"
  acceptedSources={['stash-equipment', 'stash-consumables', 'stash-materials', 'stash-misc']}
  onDrop={(itemId, itemData, sourceZone) => {
    console.log('✅ Item dropped in inventory:', itemData.name, 'from', sourceZone);
  }}
  style={{ flex: 1 }}
>
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
    {/* ... rest of FlatList props ... */}
  </FlatList>
</DropZone>
```

5. **Delete** CardIconItem function and helper functions (lines ~210-361)

### Step 2: Update Stash Tab (5 min)

Open `app/(tabs)/stash.tsx`:

1. **Update imports**:
```typescript
import { UniversalCardItem, getRarityColor } from '@/components/UniversalCardItem';
```

2. **Change capacity** (line 28):
```typescript
const STASH_CAPACITY = 200; // Changed from 40
```

3. **Update renderItem** (line ~288):
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

4. **Delete** CardIconItem function (lines ~392-460)

### Step 3: Add Distance to Quests (10 min)

Open `app/(tabs)/quests.tsx`:

1. **Add imports**:
```typescript
import { useMemo } from 'react';
import { calculateDistance, calculateWalkingETA, formatDistance } from '@/utils/distance';
```

2. **Add state** (after line ~15):
```typescript
const [playerLocation, setPlayerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
const [sortBy, setSortBy] = useState<'distance' | 'none'>('none');
```

3. **Calculate distance in QuestProgressCard** (add this logic):
```typescript
const distanceInfo = useMemo(() => {
  if (!playerLocation || !quest.location) return null;

  const distance = calculateDistance(
    playerLocation.latitude,
    playerLocation.longitude,
    quest.location.latitude,
    quest.location.longitude
  );

  return {
    distance: formatDistance(distance.meters),
    eta: calculateWalkingETA(distance.meters).formatted
  };
}, [playerLocation, quest.location]);
```

4. **Add distance badge to quest card**:
```typescript
{distanceInfo && (
  <View style={styles.distanceBadge}>
    <Text style={styles.distanceText}>📍 {distanceInfo.distance}</Text>
    <Text style={styles.etaText}>{distanceInfo.eta}</Text>
  </View>
)}
```

5. **Add styles**:
```typescript
distanceBadge: {
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: '#1a1a2e',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#4488ff'
},
distanceText: {
  fontSize: 12,
  color: '#4488ff',
  fontWeight: '600'
},
etaText: {
  fontSize: 10,
  color: '#8e8e93'
}
```

### Step 4: Update Quest Detail (15 min)

Open `app/quest/[id].tsx`:

1. **Add imports**:
```typescript
import { useAuth } from '@/hooks/useAuth';
import { calculateDistance, calculateWalkingETA, formatDistance } from '@/utils/distance';
import { doc, setDoc } from 'firebase/firestore';
```

2. **Add state**:
```typescript
const [playerLocation, setPlayerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
const { user } = useAuth();
```

3. **Add accept handler**:
```typescript
const handleAcceptQuest = async () => {
  if (!user || !quest) return;

  try {
    await setDoc(doc(db, 'questProgress', `${user.uid}_${quest.id}`), {
      questId: quest.id,
      userId: user.uid,
      status: 'active',
      title: quest.title,
      description: quest.description,
      location: quest.location,
      objectives: quest.objectives.map(obj => ({ ...obj, completed: false })),
      rewards: quest.rewards,
      progress: 0,
      startedAt: new Date().toISOString()
    });

    Alert.alert('Quest Accepted!', `You have accepted "${quest.title}"`);
  } catch (error) {
    Alert.alert('Error', 'Failed to accept quest');
  }
};
```

4. **Add accept button** (replace info text at bottom):
```typescript
<Pressable style={styles.acceptButton} onPress={handleAcceptQuest}>
  <Text style={styles.acceptButtonText}>✓ ACCEPT QUEST</Text>
</Pressable>
```

5. **Add button style**:
```typescript
acceptButton: {
  backgroundColor: '#4488ff',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 24
},
acceptButtonText: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 'bold',
  textTransform: 'uppercase'
}
```

## Testing Checklist

- [ ] Drag card from inventory to stash
- [ ] Drag card from stash to inventory
- [ ] See distance on quest cards
- [ ] Accept quest from detail view
- [ ] View quest on map
- [ ] Abandon quest

## Full Documentation

For complete implementation details, see:
- `COMPREHENSIVE_OVERHAUL_GUIDE.md` - Full step-by-step guide
- `IMPLEMENTATION_SUMMARY.md` - Feature summary and testing

## Troubleshooting

**Cards won't drag**: Check DragDropContext is wrapping app
**Distance shows NaN**: Install geolib: `npm install geolib`
**Buttons don't work**: Check Firebase auth is initialized

## Next Steps

1. Install packages
2. Follow quick implementation steps above
3. Test basic features
4. Refer to full guides for advanced features
5. Update Firebase security rules

## Advanced Features

For quest filters, sorting, tracking, and routing - see the comprehensive guide.

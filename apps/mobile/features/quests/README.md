# 🎯 Quest System

## Overview
The Quest System manages all quest-related functionality including quest discovery, display, progression tracking, objectives, and rewards.

## Purpose
- Display available quests on the map
- Handle quest acceptance and activation
- Track quest progress and objectives
- Manage quest completion and rewards
- Support multiple quest objective types (location, fitness, battle, collection, etc.)

## Structure

```
quests/
├── README.md (this file)
├── display/             # Quest UI components
│   ├── QuestMarker.tsx          # Quest marker on map
│   ├── QuestCard.tsx            # Quest card in list view
│   ├── QuestModal.tsx           # Quest detail modal
│   ├── QuestList.tsx            # List of available quests
│   └── index.ts
├── content/             # Quest data and generation
│   ├── QuestGenerator.ts        # Procedural quest generation
│   ├── QuestTemplates.ts        # Quest templates by type
│   ├── QuestValidation.ts       # Validate quest data
│   └── index.ts
├── progression/         # Quest progress tracking
│   ├── QuestProgress.ts         # Track objective completion
│   ├── QuestRewards.ts          # Calculate and grant rewards
│   ├── QuestCompletion.ts       # Handle quest completion
│   └── index.ts
├── objectives/          # Quest objective types
│   ├── FitnessObjective.ts      # Walk/run X distance
│   ├── LocationObjective.ts     # Visit a location
│   ├── DistanceObjective.ts     # Travel X meters
│   ├── GeocacheObjective.ts     # Find hidden cache
│   ├── BattleObjective.ts       # Defeat enemies
│   ├── CollectionObjective.ts   # Collect items
│   └── index.ts
├── hooks/               # React hooks for quests
│   ├── useQuests.ts             # Main quest data hook
│   ├── useQuestProgress.ts      # Track quest progress
│   ├── useNearbyQuests.ts       # Find quests near player
│   └── index.ts
└── types.ts             # Quest-specific TypeScript types
```

## Key Features

### 1. Quest Display (`display/`)
- **QuestMarker.tsx**: Shows quest locations on map
  - Color-coded by rarity (common, rare, epic, legendary)
  - Icons based on quest type
  - Pulsing animation for active quests
- **QuestCard.tsx**: Quest card in list view
  - Shows quest name, level, rewards
  - Quick accept button
  - Distance to quest
- **QuestModal.tsx**: Full quest details
  - Quest description and lore
  - Objectives list
  - Rewards preview
  - Accept/Decline buttons
- **QuestList.tsx**: Scrollable list of quests
  - Filter by type, level, distance
  - Sort by proximity, rewards, level

### 2. Quest Content (`content/`)
- **QuestGenerator.ts**: Procedural quest generation
  ```typescript
  // Generate quests based on player location and level
  const quests = await QuestGenerator.generate({
    center: { lat: 51.5074, lng: -0.1278 },
    radius: 5000, // meters
    playerLevel: 10,
    count: 20
  });
  ```
- **QuestTemplates.ts**: Pre-defined quest templates
  - Combat quests (defeat enemies)
  - Exploration quests (visit locations)
  - Fitness quests (walk/run distance)
  - Collection quests (gather items)
  - Story quests (narrative-driven)
- **QuestValidation.ts**: Validate quest data integrity

### 3. Quest Progression (`progression/`)
- **QuestProgress.ts**: Track objective completion
  ```typescript
  const progress = await QuestProgress.updateObjective(questId, objectiveIndex, {
    current: 500,  // 500 meters walked
    target: 1000   // 1000 meters required
  });
  ```
- **QuestRewards.ts**: Calculate and grant rewards
  - XP, gold, items, renown
  - Bonus multipliers for quest chains
  - Random loot tables
- **QuestCompletion.ts**: Handle quest completion
  - Verify all objectives met
  - Grant rewards
  - Update player stats
  - Trigger next quest in chain

### 4. Quest Objectives (`objectives/`)

Each objective type has its own module:

#### FitnessObjective.ts
```typescript
{
  type: 'fitness',
  activity: 'walking',
  distance: 1000,  // meters
  duration: 1800   // seconds (optional)
}
```

#### LocationObjective.ts
```typescript
{
  type: 'location',
  latitude: 51.5074,
  longitude: -0.1278,
  radius: 50  // acceptance radius in meters
}
```

#### BattleObjective.ts
```typescript
{
  type: 'battle',
  enemyType: 'goblin',
  count: 5,
  minLevel: 3,
  maxLevel: 5
}
```

#### CollectionObjective.ts
```typescript
{
  type: 'collection',
  itemId: 'common_herb',
  count: 10
}
```

#### GeocacheObjective.ts
```typescript
{
  type: 'geocache',
  cacheId: 'hidden_treasure_01',
  location: { lat: 51.5074, lng: -0.1278 },
  hint: 'Near the old oak tree'
}
```

## Usage

### Loading Quests
```typescript
import { useQuests } from '@/features/quests/hooks';

function QuestScreen() {
  const { quests, loading, error, refresh } = useQuests({
    center: playerLocation,
    radius: 5000
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <QuestList quests={quests} onRefresh={refresh} />;
}
```

### Tracking Quest Progress
```typescript
import { useQuestProgress } from '@/features/quests/hooks';

function ActiveQuestTracker({ questId }) {
  const { progress, objectives, complete } = useQuestProgress(questId);

  return (
    <View>
      <Text>Progress: {progress.completed}/{progress.total}</Text>
      {objectives.map(obj => (
        <ObjectiveStatus key={obj.id} objective={obj} />
      ))}
      {progress.isComplete && (
        <Button onPress={complete}>Claim Rewards</Button>
      )}
    </View>
  );
}
```

### Creating Custom Quests (Admin Panel)
```typescript
import { QuestGenerator } from '@/features/quests/content';

const quest = {
  name: 'Explore the Park',
  description: 'Visit all landmarks in Central Park',
  level: 5,
  rarity: 'rare',
  objectives: [
    { type: 'location', lat: 51.5074, lng: -0.1278, radius: 50 },
    { type: 'fitness', activity: 'walking', distance: 1000 }
  ],
  rewards: {
    xp: 100,
    gold: 50,
    items: ['common_sword', 'health_potion']
  },
  restrictions: {
    minLevel: 5,
    classes: ['warrior', 'ranger']
  }
};

await QuestGenerator.createQuest(quest);
// Quest appears in mobile app instantly via Firebase real-time listener!
```

## Quest Types

| Type | Description | Example Objectives |
|------|-------------|-------------------|
| **Exploration** | Visit locations | Go to 3 landmarks |
| **Combat** | Defeat enemies | Defeat 5 goblins |
| **Fitness** | Physical activity | Walk 5km |
| **Collection** | Gather items | Collect 10 herbs |
| **Delivery** | Transport items | Deliver package to NPC |
| **Story** | Narrative quest | Complete quest chain |
| **Boss** | Defeat boss enemy | Defeat Dragon Lord |
| **Event** | Timed world event | Participate in raid |

## Firebase Integration

### Collections
- `/activeQuests/{questId}` - Available quests (real-time)
- `/questProgress/{userId}/{questId}` - Player progress
- `/completedQuests/{userId}/{questId}` - Completed quests

### Real-time Updates
```typescript
// Admin creates quest → Firestore /activeQuests/
// Mobile app listens → onSnapshot()
// Quest appears on map automatically!
```

## AI Editing Guide

### To change quest rewards:
Edit: `progression/QuestRewards.ts` (~150 lines)

### To add new objective type:
1. Create: `objectives/NewObjectiveType.ts` (~100 lines)
2. Edit: `objectives/index.ts` (add export)
3. Edit: `progression/QuestProgress.ts` (add handler)

### To modify quest generation:
Edit: `content/QuestGenerator.ts` (~300 lines)

### To change quest UI:
Edit: `display/QuestCard.tsx` (~200 lines)

## Dependencies
- `firebase/firestore` - Quest data storage
- `geofire-common` - Location-based queries
- `@rov/types` - Shared type definitions
- `features/map` - Map integration
- `features/fitness` - Fitness tracking
- `features/battle` - Battle integration

## Related Features
- **Map** (`features/map/`) - Quest markers on map
- **Battle** (`features/battle/`) - Battle objectives
- **Fitness** (`features/fitness/`) - Fitness objectives
- **Character** (`features/character/`) - Level/class restrictions
- **Inventory** (`features/inventory/`) - Quest rewards

## Testing
```bash
# Run quest tests
pnpm test features/quests/

# Test quest generation
pnpm test features/quests/content/QuestGenerator.test.ts

# Test quest progression
pnpm test features/quests/progression/QuestProgress.test.ts
```

## Known Issues
- None currently

## Future Enhancements
- [ ] Quest chains (sequential quests)
- [ ] Daily/weekly quest rotation
- [ ] Guild quests (cooperative)
- [ ] PvP quests (competitive)
- [ ] Seasonal events

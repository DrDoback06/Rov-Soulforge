# Realm of Valor - Comprehensive Quest System Implementation

## 📋 Overview

This document details the complete quest system implementation for Realm of Valor, featuring proximity-based activation, procedural generation, fitness integration, battle systems, and Diablo-style loot.

---

## ✅ Completed Features

### 1. Enhanced Quest Types (`types/quest-enhanced.ts`)

**Quest Visibility Types:**
- `static` - Global quests at landmarks (all players see)
- `local` - Procedurally generated around player location (~3 per area)
- `dynamic` - Personal quests unique to each player

**Quest Objective Types:**
- `travel` - Reach a location
- `battle` - Defeat enemies
- `collect` - Gather items
- `interact` - Talk to NPCs
- `fitness` - Complete workout challenges
- `defend` - Hold a position for time
- `summit` - Reach mountaintop/trail completion

**Quest Difficulty:** easy, medium, hard, epic, legendary

**New Quest Properties:**
- `activationRadius` - Distance to trigger quest popup (meters)
- `acceptRadius` - Distance required to accept quest
- `timeLimit` - Seconds to complete after accepting
- `coopBonusPerPlayer` - % bonus per additional player (default 25%)
- `bossPhases` - Number of phases for boss battles
- `rotation` - daily/weekly/monthly/quarterly/yearly
- `xpPenaltyOnFail` - XP lost on failure

### 2. Quest Proximity Detection (`hooks/useQuestProximity.ts`)

**Features:**
- Real-time player location monitoring
- Automatic detection when entering quest radius
- Triggers quest activation popup
- Tracks nearby quests by distance
- Enter/exit callbacks

**Usage:**
```typescript
const {
  nearbyQuests,
  closestQuest,
  questsByDistance,
  isWithinActivationRadius,
  isWithinAcceptRadius
} = useQuestProximity({
  playerLocation,
  quests: staticQuests,
  onQuestEntered: (quest) => showActivationModal(quest),
  onQuestExited: (quest) => console.log('Left quest area')
});
```

### 3. Quest Activation Modal (`components/QuestActivationModal.tsx`)

**Features:**
- Beautiful animated popup when entering quest radius
- Shows full quest details (objectives, rewards, lore)
- Visibility badges (static/local/dynamic)
- Difficulty indicators with color coding
- Distance display to quest
- Accept button only enabled when within accept radius
- Co-op bonus display for multi-player quests
- Legendary quest highlighting

**Accept Flow:**
1. Player enters `activationRadius` → Modal appears
2. Player reviews objectives and rewards
3. Player must be within `acceptRadius` to accept
4. Accept button triggers quest start

### 4. Enemy Pool System (`utils/enemyPool.ts`)

**Enemy Types:**
- Goblins, Orcs, Trolls, Dragons, Undead, Beasts, Elementals, Demons

**Enemy Pool by Difficulty:**
- **Easy**: Goblin Scout, Forest Wolf, Skeleton Warrior
- **Medium**: Orc Warrior, Fire Elemental, Dark Knight
- **Hard**: Troll Berserker, Shadow Demon, Ice Golem
- **Epic**: Ancient Dragon, Lich Lord
- **Legendary**: Demon Lord Azrathus, Primordial Titan

**Features:**
- `getEnemiesForQuest(difficulty, count)` - Get random enemies
- `spawnEnemiesNearQuest(lat, lng, enemies, spreadRadius)` - Spawn enemies in circular pattern around quest (default 50m radius)
- `getBossEnemy(difficulty, phases)` - Multi-phase boss generation

**Enemy Stats:**
Each enemy has:
- Level, HP, Attack, Defense, Speed
- Icon, Color, Rarity
- Abilities (for higher tiers)
- Loot table (XP, gold, card drop chance, card rarity)

**Boss Phases:**
- Each phase increases HP, attack, defense
- Rewards scale with phases
- Card drop chance increases per phase

### 5. Quest Objective Tracker (`utils/questObjectiveTracker.ts`)

**Core Functions:**

**Initialize Progress:**
```typescript
initializeQuestProgress(db, userId, quest, teammates)
```
- Creates `questProgress` document in Firestore
- Initializes all objectives with current: 0, completed: false
- Calculates co-op bonus from teammates
- Returns progress ID

**Update Objective:**
```typescript
updateObjectiveProgress(db, progressId, objectiveId, increment)
```
- Increments objective progress
- Marks completed when target reached
- Checks if all objectives completed (sequential)
- Auto-completes quest when done

**Track Battle:**
```typescript
trackBattleObjective(db, progressId, objectiveId, enemyId)
```
- Marks specific enemy as defeated
- Updates objective progress
- Works with spawned enemies array

**Track Fitness:**
```typescript
trackFitnessObjective(db, progressId, objectiveId, progress, isTracked)
```
- Tracked mode: 100% credit
- Untracked mode: 50% credit
- Updates progress from fitness device

**Track Defend:**
```typescript
trackDefendObjective(db, progressId, objectiveId, secondsHeld)
```
- Updates time held at position
- Completes when duration met

**Complete/Fail/Abandon:**
```typescript
completeQuest(db, progressId)
failQuest(db, progressId, reason)
abandonQuest(db, progressId)
```

### 6. Fitness WOD System (`components/FitnessWODModal.tsx`)

**Workout of the Day (WOD) Modal Features:**
- Parses exercise list from objective description
- Timer with countdown for time-limited challenges
- Fitness tracker toggle (tracked vs untracked)
- Manual completion checkboxes for untracked mode
- Leaderboard notification (top 10% get bonuses)
- 100% rewards with tracker, 50% without

**Supported Exercises:**
- Push-ups, Sit-ups, Squats, Burpees
- Running (with distance)
- Circuit training

**Time Limits:**
- Visual timer progress bar
- Auto-stops when time expires
- Displays elapsed/total time

**Tracker Integration:**
- Detects if fitness device connected
- Auto-completes when tracker confirms
- Manual completion fallback

### 7. Reward Distribution System (`utils/questRewards.ts`)

**Diablo-Style Features:**

**Unidentified Items:**
- Items drop unidentified
- Must be identified for a gold cost
- Random stats generated on identification
- Rarity affects stat ranges

**Magic Find System:**
- Base magic find from quest
- +10% MF per additional co-op player
- Chance to upgrade item rarity

**Co-op Bonuses:**
- +25% gold/XP per additional player (default)
- Configurable per quest
- Magic find stacking

**Functions:**

**Calculate Rewards:**
```typescript
calculateRewards(baseRewards, teamSize, coopBonusPerPlayer)
```
- Applies team size multiplier
- Adds magic find bonuses
- Returns final reward values

**Distribute Rewards:**
```typescript
distributeQuestRewards(db, userId, rewards, teamSize, coopBonus)
```
- Updates user gold/XP
- Rolls for item drops
- Generates unidentified items
- Checks inventory capacity
- Returns overflow items if inventory full

**Item Identification:**
```typescript
identifyItem(db, userId, cardId)
```
- Deducts gold cost
- Generates random stats based on rarity
- Updates inventory
- Returns identified item

**Rarity Tiers:**
- Normal (grey) - 1-5 stats
- Magic (blue) - 5-10 stats
- Rare (yellow) - 10-20 stats
- Epic (purple) - 20-35 stats
- Legendary (orange) - 35-50 stats
- Set (green) - Special bonuses
- Unique (red) - One-of-a-kind

**Identification Costs:**
- Normal: 10 gold
- Magic: 25 gold
- Rare: 50 gold
- Epic: 100 gold
- Legendary: 250 gold
- Set: 500 gold
- Unique: 1000 gold

### 8. Quest Completion Modal (`components/QuestCompletionModal.tsx`)

**Features:**
- Celebration animation on quest complete
- Displays all rewards (XP, gold, items)
- Inventory overflow handling
- Item selection for discard
- Send overflow to stash
- Color-coded rarity display
- Unidentified item badges

**Inventory Full Flow:**
1. Modal shows warning
2. Overflow items highlighted in red
3. Player can select items to discard
4. Or send all overflow to stash
5. Continue button proceeds

---

## 🎯 Quest Flow Architecture

### 1. Quest Discovery
```
Player moves around → useQuestProximity detects nearby quests
→ Quest enters activationRadius → QuestActivationModal appears
```

### 2. Quest Acceptance
```
Player reads quest details → Moves within acceptRadius
→ Clicks "Accept Quest" → initializeQuestProgress()
→ Quest objectives initialized → Quest begins
```

### 3. Battle Quest Flow
```
Accept quest → getEnemiesForQuest(difficulty, count)
→ spawnEnemiesNearQuest() → Enemies placed in 50m radius
→ Player navigates to each enemy → Defeats in battle
→ trackBattleObjective() marks enemy defeated
→ All enemies defeated → Objective complete
```

### 4. Fitness Quest Flow
```
Accept quest → FitnessWODModal appears
→ Player toggles tracker (tracked/untracked)
→ Starts timer (if time limit)
→ Completes exercises:
  - Tracked: Auto-detected by fitness device (100% rewards)
  - Untracked: Manual checkboxes (50% rewards)
→ trackFitnessObjective() updates progress
→ Objective complete
```

### 5. Quest Completion
```
All objectives completed → canCompleteQuest() checks
→ Player within quest radius → Clicks "Complete"
→ distributeQuestRewards() calculates final rewards
→ Applies co-op bonuses → Rolls item drops
→ Checks inventory capacity:
  - Space available: Add items
  - Inventory full: Show QuestCompletionModal with overflow
→ Player manages items → Quest marked complete
```

---

## 🗂️ Firestore Collections

### `questProgress`
```typescript
{
  id: "userId_questId",
  questId: "quest_id",
  userId: "user_id",
  status: "active" | "completed" | "failed" | "abandoned",
  objectives: [
    {
      id: "obj_1",
      type: "battle",
      description: "Defeat 10 enemies",
      target: 10,
      current: 7,
      completed: false,
      order: 1,
      metadata: {
        spawnedEnemies: [
          { id: "enemy_1", latitude: 52.1, longitude: -0.5, defeated: true },
          { id: "enemy_2", latitude: 52.1, longitude: -0.5, defeated: false }
        ]
      }
    }
  ],
  startedAt: "2025-01-01T12:00:00Z",
  completedAt: "2025-01-01T13:30:00Z",
  teammates: ["user_id_2", "user_id_3"],
  coopBonus: 50, // 2 teammates x 25%
  lastUpdated: "2025-01-01T12:30:00Z"
}
```

### `staticQuests`
```typescript
{
  id: "quest_defend_northampton",
  type: "landmark",
  difficulty: "medium",
  visibility: "static",
  title: "Defend Northampton",
  description: "...",
  location: {
    latitude: 52.2405,
    longitude: -0.9027,
    geohash: "gcv2m1",
    name: "Northampton Town Centre"
  },
  activationRadius: 100, // 100m to see quest
  acceptRadius: 50, // Must be within 50m to accept
  objectives: [...],
  rewards: {...},
  coopBonusPerPlayer: 25,
  maxPlayers: 4
}
```

---

## 🔧 Integration Points

### Map Tab Integration (TODO)

1. **Add proximity detection:**
```typescript
const { nearbyQuests } = useQuestProximity({
  playerLocation: displayLocation?.coords,
  quests: staticQuests,
  onQuestEntered: (quest) => {
    setActivationQuest(quest);
    setShowActivationModal(true);
  }
});
```

2. **Show quest activation modal:**
```typescript
<QuestActivationModal
  visible={showActivationModal}
  quest={activationQuest}
  playerDistance={getDistanceToQuest(activationQuest)}
  canAccept={isWithinAcceptRadius(activationQuest)}
  onAccept={handleAcceptQuest}
  onDismiss={() => setShowActivationModal(false)}
/>
```

3. **Handle quest acceptance:**
```typescript
async function handleAcceptQuest(quest) {
  const progressId = await initializeQuestProgress(db, user.uid, quest, teammates);

  // For battle quests, spawn enemies
  if (quest.objectives.some(obj => obj.type === 'battle')) {
    const enemies = getEnemiesForQuest(quest.difficulty, 10);
    const spawnedEnemies = spawnEnemiesNearQuest(
      quest.location.latitude,
      quest.location.longitude,
      enemies
    );

    // Update objective metadata with spawned enemies
    await updateObjectiveMetadata(db, progressId, 'battle_obj', {
      spawnedEnemies
    });
  }

  // For fitness quests, show WOD modal
  if (quest.objectives.some(obj => obj.type === 'fitness')) {
    setFitnessObjective(quest.objectives.find(obj => obj.type === 'fitness'));
    setShowFitnessModal(true);
  }
}
```

4. **Show enemy markers on map:**
```typescript
{quest.objectives
  .filter(obj => obj.type === 'battle' && obj.metadata?.spawnedEnemies)
  .flatMap(obj => obj.metadata.spawnedEnemies)
  .filter(enemy => !enemy.defeated)
  .map(enemy => (
    <Marker
      key={enemy.id}
      latitude={enemy.latitude}
      longitude={enemy.longitude}
      onPress={() => handleBattleEnemy(enemy)}
    >
      <EnemyMarker enemy={enemy} />
    </Marker>
  ))
}
```

---

## 📱 User Experience Flow

### Scenario: Player Accepts Battle Quest

1. **Discovery:** Player walking, enters 100m radius of "Defend Northampton" quest
2. **Activation:** Modal pops up showing quest details, objectives, rewards
3. **Review:** Player reads: "Defeat 10 Goblin Scouts in the area"
4. **Accept:** Player clicks "Accept Quest" (must be within 50m)
5. **Spawn:** 10 goblins spawn in 50m radius around quest location
6. **Battle:** Player sees goblin markers on map, navigates to each
7. **Combat:** Taps goblin → Battle screen opens → Defeats goblin
8. **Progress:** Objective updates: 1/10 → 2/10 → ... → 10/10
9. **Complete:** All goblins defeated → "Complete Quest" button appears
10. **Rewards:** Player clicks complete → QuestCompletionModal shows
11. **Loot:** 3 unidentified items, 500 gold, 250 XP
12. **Overflow:** Inventory full! 1 item won't fit
13. **Manage:** Player chooses to send overflow to stash
14. **Finish:** Quest marked complete, rewards distributed

### Scenario: Player Does Fitness Quest

1. **Accept:** Player accepts "Morning Workout" daily quest
2. **WOD:** FitnessWODModal appears with exercise list
3. **Tracker:** Player has Strava connected → toggles "Use Tracker"
4. **Start:** Timer begins (5 minute limit)
5. **Workout:** Player completes: 15 pushups, 20 situps, 25 squats
6. **Auto-Track:** Strava confirms completion automatically
7. **Complete:** trackFitnessObjective() gives 100% credit
8. **Rewards:** Full rewards distributed (300 XP, 150 gold)
9. **Leaderboard:** Player finished in top 10% → +50 bonus XP

---

## 🚀 Next Steps

### Remaining Tasks:

1. **Multi-Stage Boss Battles** (`components/BossPhaseModal.tsx`)
   - Phase transition UI
   - Boss phase state management
   - Phase-specific mechanics

2. **Daily/Weekly/Monthly Quest Rotation** (`utils/questRotation.ts`)
   - Auto-generate daily quests at midnight
   - Weekly rotation (Monday reset)
   - Monthly challenges
   - Seasonal events

3. **Legendary Quest Notifications** (`utils/questNotifications.ts`)
   - Push notifications when legendary quest spawns nearby
   - Notification system integration
   - Quest rarity alerts

4. **Map Tab Integration**
   - Add proximity detection to index.tsx
   - Show activation modals
   - Display enemy markers
   - Handle quest acceptance flow

5. **Battle Screen Integration**
   - Link battles to quest objectives
   - Track enemy defeats
   - Award quest progress on win
   - Handle failure penalties

---

## 🎨 UI Components Created

1. `QuestActivationModal` - Quest discovery and acceptance
2. `FitnessWODModal` - Fitness challenge interface
3. `QuestCompletionModal` - Reward distribution and inventory management

## 🔧 Utilities Created

1. `useQuestProximity` - Location-based quest detection
2. `enemyPool` - Enemy generation and spawning
3. `questObjectiveTracker` - Progress tracking and completion
4. `questRewards` - Reward calculation and distribution

## 📊 Type Definitions

Enhanced `quest-enhanced.ts` with:
- Objective metadata for all quest types
- Reward system with unidentified items
- Quest visibility types
- Co-op bonuses
- Boss phases
- Quest rotation

---

## 🎯 Key Design Decisions

1. **Sequential Objectives** - Players must complete objectives in order for better tracking
2. **50% Rewards for Untracked Fitness** - Encourages fitness device use while allowing manual play
3. **Diablo-Style Loot** - Unidentified items add excitement and gold sink
4. **Co-op Scaling** - +25% per player encourages group play
5. **Inventory Overflow** - Prevents item loss while managing capacity
6. **Proximity-Based** - All actions require physical presence for real-world engagement
7. **Enemy Spawning** - 50m spread prevents cluster, encourages exploration
8. **Boss Phases** - Multi-stage fights increase difficulty and excitement

---

## 🎮 Game Balance

### XP Penalties:
- Quest failure: Configurable per quest (e.g., -50 XP for hard quest)
- Battle defeat: -10 XP per loss

### Fitness Rewards:
- Tracked: 100% (e.g., 300 XP)
- Untracked: 50% (e.g., 150 XP)
- Top 10% leaderboard: +50 bonus XP

### Co-op Bonuses (4 players):
- Base: 100 gold, 100 XP
- With 3 teammates (+75%): 175 gold, 175 XP
- Magic find: +30% (10% per teammate)

### Item Drop Rates:
- Normal quest: 10-20% card drop
- Hard quest: 30-40% card drop
- Boss quest: 50-75% card drop
- Legendary boss: 80-100% card drop

---

This system provides a comprehensive, engaging quest experience that combines real-world exploration, fitness challenges, Diablo-style loot, and cooperative multiplayer - all while maintaining balance and player agency!

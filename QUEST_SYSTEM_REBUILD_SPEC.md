# 🎯 Quest System Rebuild - Complete Specification

**Date**: October 8, 2025  
**Status**: In Development  
**Priority**: CRITICAL

---

## 🎨 VISUAL ARCHITECTURE

### Quest Panel Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Map (60% width)              │ Quest Panel (40% width)     │
│                              │ ┌─────────────────────────┐ │
│  [Player Location]           │ │ 🎯 QUEST MANAGEMENT    │ │
│                              │ │ ─────────────────────── │ │
│  [Quest Markers]             │ │ Filters: [All▼] [Sort▼]│ │
│                              │ │ ─────────────────────── │ │
│  [Routes to Active Quests]   │ │                         │ │
│                              │ │ 📍 ACTIVE QUESTS (3/10) │ │
│                              │ │ ┌─────────────────────┐ │ │
│                              │ │ │☰ Quest 1 [Navigate]  │ │ │
│                              │ │ │☰ Quest 2 [Abandon]   │ │ │
│                              │ │ │☰ Quest 3 [Abandon]   │ │ │
│                              │ │ └─────────────────────┘ │ │
│                              │ │ [🧭 Navigate All]       │ │
│                              │ │                         │ │
│                              │ │ 📜 MAIN QUESTS         │ │
│                              │ │ [Quest Card]           │ │
│                              │ │ [Quest Card]           │ │
│                              │ │                         │ │
│                              │ │ 🌍 WORLD QUESTS        │ │
│                              │ │ [Quest Card]           │ │
│                              │ │ [Quest Card]           │ │
│                              │ │                         │ │
│                              │ │ 📋 SIDE QUESTS         │ │
│                              │ │ [Quest Card]           │ │
│                              │ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Navigation HUD (Active)
```
┌─────────────────────────────────────────────┐
│ 🎯 Goblin Slayer         [✕]                │
│ ───────────────────────────────────────     │
│ 📍 125m • ⏱️ 2 min                          │
│ ⚔️ Defeat 7/10 Goblins                     │
│ ██████████░░░░░░░░░░ 70%                   │
│ 💰 500g • ⭐ 800 XP • 🎁 Iron Sword         │
│ Next: Dragon's Lair (2.3km)                │
└─────────────────────────────────────────────┘
```

---

## 📊 DATA SCHEMAS

### Quest Document (Firestore)
```typescript
interface EnhancedQuest {
  id: string;
  
  // Basic Info
  title: string;
  description: string;
  icon: string; // emoji or icon name
  type: 'main' | 'world' | 'side' | 'player_created';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';
  
  // Location
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
    name: string;
  };
  activationRadius: number; // meters (100m default, 500m for dynamic, null for static/global)
  acceptRadius: number; // meters (50m default)
  
  // Visibility
  visibility: 'global' | 'local' | 'hidden';
  discoveryMethod?: 'exploration' | 'chain' | 'level_unlock';
  
  // Requirements
  levelRequirement?: number;
  prerequisiteQuests?: string[]; // quest IDs
  
  // Objectives
  objectives: QuestObjective[];
  
  // Rewards
  rewards: {
    gold: number;
    xp: number;
    items?: ItemReward[];
    guaranteedItems?: ItemReward[];
    lootTable?: LootTableRef;
  };
  bonusRewards?: {
    speedBonus?: { timeLimit: number; multiplier: number }; // Complete in X seconds = Y% bonus
    perfectBonus?: { multiplier: number }; // No deaths/mistakes = X% bonus
  };
  
  // Timing
  timeLimit?: number; // seconds (null = no limit)
  expiresAt?: string; // ISO date (for dynamic/daily quests)
  
  // Multiplayer
  coopEnabled: boolean;
  minPlayers?: number;
  maxPlayers?: number;
  sharedProgress: boolean;
  
  // Leaderboard
  leaderboardEnabled: boolean;
  
  // Player-Created Quests
  createdBy?: string; // user ID
  creatorReward?: ItemInstance; // locked item until quest completed/expired
  creationCost?: number; // gold paid to create
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  completionCount: number;
  averageCompletionTime?: number;
}

interface QuestObjective {
  id: string;
  type: 'battle' | 'travel' | 'collect' | 'interact' | 'fitness';
  description: string;
  target: number;
  current: number;
  completed: boolean;
  
  // Type-specific data
  battleData?: {
    enemyTypes: string[];
    enemyCount: number;
    spawnPattern: 'circle' | 'wave' | 'poi' | 'random';
    spawnRadius: number;
  };
  travelData?: {
    destination: { latitude: number; longitude: number };
    arrivalRadius: number;
  };
  collectData?: {
    itemId: string;
    locations?: { latitude: number; longitude: number }[];
  };
  fitnessData?: {
    workoutType: string;
    duration?: number;
    distance?: number;
    requiresTracking: boolean;
  };
}
```

### Quest Progress (Firestore - per user)
```typescript
interface QuestProgress {
  id: string;
  userId: string;
  questId: string;
  
  // Status
  status: 'active' | 'in_active_list' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
  activeListPosition?: number; // 0-9 for multi-stop routing
  
  // Progress
  objectives: QuestObjective[]; // with current values
  startedAt: string;
  pausedAt?: string; // when moved to Active list (pauses timer)
  completedAt?: string;
  
  // Spawned content
  spawnedEnemies?: Array<{
    id: string;
    type: string;
    variant?: string;
    level: number;
    location: { latitude: number; longitude: number };
    defeated: boolean;
    defeatedAt?: string;
  }>;
  
  // Stats
  completionTime?: number; // seconds
  deaths?: number;
  damageDealt?: number;
  
  // Notes
  notes?: Array<{
    id: string;
    text: string;
    visibility: 'private' | 'party' | 'public';
    createdAt: string;
  }>;
  
  // Party
  partyId?: string;
  isLeader?: boolean;
}
```

### Party System (Firestore)
```typescript
interface Party {
  id: string;
  leaderId: string;
  memberIds: string[]; // max 4 including leader
  
  // Active routing
  activeQuestIds: string[]; // ordered list for multi-stop routing
  routeOptimized: boolean; // true if using algorithm, false if manual order
  currentQuestIndex: number; // which quest in route is active
  navigating: boolean;
  
  // Settings
  lootDistribution: 'equal' | 'proximity' | 'contribution';
  
  createdAt: string;
  updatedAt: string;
}
```

---

## 🎮 USER FLOWS

### Flow 1: Discovering and Accepting a Quest
```
1. Player walks within activation radius (or quest is global)
2. Quest marker appears on map with pulsing animation
3. Player taps marker OR gets auto-popup (for legendary)
4. Quest detail modal shows:
   - Full description
   - Objectives list
   - Rewards preview
   - Distance to quest
   - Accept button (enabled if within accept radius, disabled if not)
5. Player walks within accept radius
6. Accept button becomes enabled
7. Player taps Accept
8. Quest added to "World Quests" or "Side Quests" section
9. Notification: "Quest Accepted: {title}"
```

### Flow 2: Adding Quests to Active and Routing
```
1. Player opens Quest Panel (swipe from right)
2. Map shifts left and zooms out slightly
3. Player scrolls to desired quest in World Quests
4. Taps "Add to Active" button
5. Quest moves to "Active Quests" section at top (position 1-10)
6. Route line appears on map from player → quest location
7. Player drags quest card to reorder within Active Quests
8. Route updates automatically to show new order
9. Player toggles "Optimize Route" switch
10. Route re-calculates shortest path (traveling salesman)
11. Quest order updates to match optimized route
12. Player taps "Navigate All" button at bottom of Active section
13. Navigation starts to first quest in list
14. Quest Panel auto-closes
15. Navigation HUD appears at top
```

### Flow 3: Multi-Stop Navigation
```
1. Navigation HUD shows current quest details + progress
2. Player moves toward first quest, map updates real-time
3. "Next: {quest 2 name} (distance)" shown at bottom of HUD
4. Player reaches Quest 1 location
5. Objectives begin (e.g., enemies spawn)
6. Player completes all objectives
7. Completion modal shows rewards
8. Player taps "Claim Rewards"
9. Rewards added to stash automatically
10. Navigation auto-switches to Quest 2
11. HUD updates to show Quest 2 details
12. Route line updates to Quest 2
13. Repeat until all Active quests completed
```

### Flow 4: Creating Player Quest
```
1. Player (level 10+) has max 3 player-created quests
2. Opens inventory, selects item to offer as reward
3. Taps "Create Quest" button
4. Quest creation wizard opens:
   - Set title and description
   - Choose icon
   - Set difficulty (determines cost: Easy=100g, Medium=250g, Hard=500g)
   - Define objectives (battle/travel/collect)
   - Set location (tap map or use current location)
   - Set time limit (optional)
   - Choose leaderboard enabled (yes/no)
5. System calculates bonus rewards (system adds XP + gold based on difficulty)
6. Player pays creation cost (gold)
7. Item locks in player's inventory
8. Quest publishes to world
9. Other players can discover and attempt
10. First player to complete gets the item + bonus rewards
11. If no one completes in 7 days, quest expires and item returns to creator
```

---

## ⚙️ TECHNICAL IMPLEMENTATION

### Component Structure
```
QuestPanel/
├── QuestPanelContainer.tsx (main sliding panel)
├── ActiveQuestsSection.tsx (drag-and-drop multi-stop)
├── QuestSection.tsx (Main/World/Side sections)
├── QuestCard.tsx (individual quest display)
├── QuestCardActions.tsx (Accept/Navigate/Abandon buttons)
├── QuestFilters.tsx (filter and sort controls)
├── RouteOptimizationToggle.tsx
└── NavigateAllButton.tsx

NavigationHUD/
├── NavigationHUD.tsx (compact quest progress display)
└── NextQuestPreview.tsx

Modals/
├── QuestDetailModal.tsx (full quest details)
├── QuestCompletionModal.tsx (rewards claim)
├── QuestCreationWizard.tsx (player quest creation)
└── QuestAbandonModal.tsx (confirmation)

Hooks/
├── useQuestPanel.ts (panel state management)
├── useActiveQuests.ts (active list + routing)
├── useRouteOptimization.ts (traveling salesman algorithm)
├── useQuestNavigation.ts (navigation state + ETA calculation)
├── useQuestNotes.ts (notes CRUD)
└── usePartyQuests.ts (party synchronization)

Utils/
├── questRouting.ts (route calculation, optimization)
├── questFiltering.ts (filter/sort logic)
├── questValidation.ts (creation validation)
└── enemySpawning.ts (enemy generation + variants)
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Core Quest Panel (Day 1)
- [ ] QuestPanelContainer with slide-in animation
- [ ] Map viewport adjustment (shift left + zoom)
- [ ] Quest sections (Main/World/Side/Active)
- [ ] Basic QuestCard component
- [ ] Quest filters (distance/difficulty/type)

### Phase 2: Active Quests & Routing (Day 2)
- [ ] Drag-and-drop within Active section
- [ ] Route calculation and display
- [ ] Route optimization toggle (traveling salesman)
- [ ] Navigate All button
- [ ] Multi-stop navigation logic

### Phase 3: Navigation HUD (Day 3)
- [ ] Compact HUD component
- [ ] Real-time distance/ETA updates
- [ ] Progress bar for objectives
- [ ] Next quest preview
- [ ] Cancel navigation button

### Phase 4: Quest Actions & Completion (Day 4)
- [ ] Accept quest flow
- [ ] Abandon quest with confirmation
- [ ] Quest completion detection
- [ ] Rewards modal with animations
- [ ] Auto-advance to next quest

### Phase 5: Party System (Day 5)
- [ ] Party creation/join
- [ ] Leader controls for routing
- [ ] Member suggestions system
- [ ] Shared progress tracking
- [ ] Reward distribution

### Phase 6: Player Quest Creation (Day 6)
- [ ] Quest creation wizard UI
- [ ] Level/count validation
- [ ] Item locking system
- [ ] Quest publishing
- [ ] Expiration handling

### Phase 7: Polish & Testing (Day 7)
- [ ] Quest notes system
- [ ] Hidden quest discovery animations
- [ ] Legendary quest announcements
- [ ] Voice narration integration
- [ ] Full end-to-end testing

---

## 📝 NOTES

- All animations use `react-native-reanimated` for 60fps
- Route optimization uses greedy nearest-neighbor algorithm (O(n²))
- Quest visibility calculated server-side to prevent cheating
- Leaderboards updated via Cloud Functions on quest completion
- Party state synced via Firestore real-time listeners
- Voice narration: pre-recorded for main quests, AI TTS for player-created

---

**Status**: Specification Complete ✅  
**Next**: Begin Phase 1 implementation

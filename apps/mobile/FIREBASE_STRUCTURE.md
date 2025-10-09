# Firebase Structure - Organized & Scalable

## 🎯 Recommended Structure

### **Current Structure (Messy - What you have now):**
```
Root
├── activeQuests
├── cards
├── characters
├── inventories
├── questProgress
├── stashes
├── staticQuests
├── users
└── ... (many more at root level)
```

**Problems:**
- ❌ Everything at root level
- ❌ Hard to query efficiently
- ❌ No clear data ownership
- ❌ Difficult to secure with rules
- ❌ Hard to backup specific user data

---

### **New Structure (Organized):**

```
Root
│
├── users/                          # User profiles and settings
│   └── {userId}/
│       ├── profile/
│       │   ├── displayName: string
│       │   ├── email: string
│       │   ├── level: number
│       │   ├── xp: number
│       │   ├── gold: number
│       │   ├── createdAt: timestamp
│       │   └── lastLogin: timestamp
│       │
│       ├── stats/
│       │   ├── health: number
│       │   ├── experience: number
│       │   ├── questsCompleted: number
│       │   ├── battlesWon: number
│       │   └── distanceTraveled: number
│       │
│       ├── inventory/              # User's items
│       │   └── {itemId}/
│       │       ├── cardId: string
│       │       ├── quantity: number
│       │       ├── rarity: string
│       │       ├── identified: boolean
│       │       └── acquiredAt: timestamp
│       │
│       ├── decks/                  # User's card decks
│       │   └── {deckId}/
│       │       ├── name: string
│       │       ├── actionCards: array
│       │       ├── skillCards: array
│       │       ├── lootCards: array
│       │       └── isActive: boolean
│       │
│       ├── characters/             # User's characters
│       │   └── {characterId}/
│       │       ├── class: string
│       │       ├── level: number
│       │       ├── equippedItems: object
│       │       └── isActive: boolean
│       │
│       ├── questProgress/          # User's active quests
│       │   └── {progressId}/
│       │       ├── questId: string
│       │       ├── status: string
│       │       ├── objectives: array
│       │       ├── startedAt: timestamp
│       │       └── teammates: array
│       │
│       ├── stash/                  # User's stash storage
│       │   └── {itemId}/
│       │       └── ... (same as inventory)
│       │
│       ├── achievements/           # User achievements
│       │   └── {achievementId}/
│       │       ├── unlockedAt: timestamp
│       │       └── progress: number
│       │
│       └── settings/               # User preferences
│           ├── notifications: boolean
│           ├── soundEnabled: boolean
│           └── stravaConnected: boolean
│
├── quests/                         # Global quest definitions
│   ├── static/                     # Static quests (POIs, landmarks)
│   │   └── {questId}/
│   │       ├── type: string
│   │       ├── difficulty: string
│   │       ├── title: string
│   │       ├── description: string
│   │       ├── location: geopoint
│   │       ├── geohash: string
│   │       ├── objectives: array
│   │       ├── rewards: object
│   │       ├── activationRadius: number
│   │       ├── acceptRadius: number
│   │       └── completionCount: number
│   │
│   ├── dynamic/                    # Procedurally generated quests
│   │   └── {questId}/
│   │       ├── expiresAt: timestamp
│   │       └── ... (same fields as static)
│   │
│   └── worldEvents/                # Limited-time global events
│       └── {eventId}/
│           ├── name: string
│           ├── startTime: timestamp
│           ├── endTime: timestamp
│           ├── region: object
│           └── questIds: array
│
├── battles/                        # Active and completed battles
│   └── {battleId}/
│       ├── mode: string           # 'pvp' | 'pve' | 'guild'
│       ├── status: string         # 'active' | 'completed'
│       ├── playerIds: array
│       ├── currentPlayerId: string
│       ├── players: array
│       ├── stack: array
│       ├── winner: string
│       ├── createdAt: timestamp
│       └── completedAt: timestamp
│
├── guilds/                         # Guild system
│   └── {guildId}/
│       ├── name: string
│       ├── members: array
│       ├── level: number
│       └── guildHall: object
│
├── leaderboards/                   # Global leaderboards
│   ├── pvp/
│   │   └── {userId}: { rank, elo, wins, losses }
│   ├── quests/
│   │   └── {userId}: { rank, completed, xp }
│   └── fitness/
│       └── {userId}: { rank, distance, workouts }
│
├── gameData/                       # Static game data
│   ├── cards/                      # Card definitions
│   │   └── {cardId}/
│   │       ├── name: string
│   │       ├── type: string
│   │       ├── manaCost: number
│   │       ├── effects: array
│   │       └── rarity: string
│   │
│   ├── enemies/                    # Enemy definitions
│   │   └── {enemyId}/
│   │       ├── name: string
│   │       ├── level: number
│   │       ├── hp: number
│   │       ├── abilities: array
│   │       └── loot: object
│   │
│   └── items/                      # Item definitions
│       └── {itemId}/
│           ├── name: string
│           ├── type: string
│           └── stats: object
│
└── system/                         # System configuration
    ├── config/
    │   ├── questSpawnRate: number
    │   ├── maxQuestsPerRegion: number
    │   └── dailyResetTime: string
    │
    └── maintenance/
        ├── isActive: boolean
        └── message: string
```

---

## 🔑 Key Improvements

### **1. User-Centric Data**
All user data under `/users/{userId}/` subcollections:
- ✅ Easy to query all data for one user
- ✅ Clear ownership and permissions
- ✅ Simple to backup/export user data
- ✅ GDPR compliance (delete all user data easily)

### **2. Quest Organization**
Quests organized by type:
- `/quests/static/` - POI-based, permanent quests
- `/quests/dynamic/` - Procedurally generated, temporary
- `/quests/worldEvents/` - Limited-time events

### **3. Efficient Querying**
- Geohash for location-based queries
- Timestamps for time-based filtering
- Status fields for filtering active/completed

### **4. Security Rules**
Clear data ownership makes rules simple:
```javascript
// Users can only read/write their own data
match /users/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}

// Everyone can read quest definitions
match /quests/{type}/{questId} {
  allow read: if true;
  allow write: if false; // Only server can write
}
```

---

## 🔄 Migration Strategy

### **Option 1: Clean Slate (Recommended for Testing)**
Use the `freshStart.ts` script to:
1. Delete all old data
2. Create new organized structure
3. Seed with test data

### **Option 2: Migrate Existing Data**
Use the migration script below to:
1. Read from old structure
2. Transform data
3. Write to new structure
4. Verify migration
5. Delete old collections

---

## 📊 Collection Details

### **users/{userId}/inventory**
```typescript
{
  itemId: "unique_id",
  cardId: "fire_blast_1",
  quantity: 3,
  rarity: "rare",
  identified: true,
  stats: {
    damage: 25,
    manaCost: 3
  },
  acquiredAt: Timestamp,
  source: "quest_reward" | "shop" | "battle_loot"
}
```

### **users/{userId}/questProgress**
```typescript
{
  questId: "market_defense_001",
  status: "in_progress" | "completed" | "failed",
  objectives: [
    {
      id: "obj_1",
      type: "battle",
      current: 7,
      target: 10,
      completed: false,
      metadata: {
        spawnedEnemies: [...]
      }
    }
  ],
  startedAt: Timestamp,
  completedAt: Timestamp | null,
  teammates: ["userId1", "userId2"],
  rewards: {
    claimed: false,
    xp: 1000,
    gold: 500,
    items: [...]
  }
}
```

### **quests/static/{questId}**
```typescript
{
  type: "landmark",
  difficulty: "medium",
  visibility: "static",
  title: "Market Square Defense",
  description: "...",
  location: new GeoPoint(52.2405, -0.9027),
  geohash: "u10j4g",
  activationRadius: 100,
  acceptRadius: 50,
  objectives: [...],
  rewards: {...},
  requiredLevel: 1,
  recommendedLevel: 5,
  maxPlayers: 4,
  coopBonusPerPlayer: 25,
  isLegendary: false,
  isBoss: false,
  icon: "⚔️",
  color: "#ef4444",
  tags: ["combat", "beginner"],
  createdBy: "system",
  completionCount: 0,
  createdAt: Timestamp
}
```

---

## 🛡️ Security Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User data - users can only access their own
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;

      match /{subcollection}/{document=**} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth.uid == userId;
      }
    }

    // Quests - everyone can read, only server can write
    match /quests/{type}/{questId} {
      allow read: if true;
      allow write: if false;
    }

    // Battles - participants can read/write
    match /battles/{battleId} {
      allow read: if request.auth.uid in resource.data.playerIds;
      allow write: if request.auth.uid in resource.data.playerIds;
    }

    // Game data - read only for all
    match /gameData/{category}/{itemId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 📈 Query Examples

### **Get User's Active Quests**
```typescript
const questProgressRef = collection(db, `users/${userId}/questProgress`);
const q = query(questProgressRef, where('status', '==', 'in_progress'));
const snapshot = await getDocs(q);
```

### **Get Nearby Static Quests**
```typescript
const center = [52.2405, -0.9027];
const radiusInM = 10000;

const bounds = geohashQueryBounds(center, radiusInM);
const promises = bounds.map((b) => {
  const q = query(
    collection(db, 'quests/static'),
    orderBy('geohash'),
    startAt(b[0]),
    endAt(b[1])
  );
  return getDocs(q);
});

const snapshots = await Promise.all(promises);
const matchingDocs = [];

for (const snap of snapshots) {
  for (const doc of snap.docs) {
    const lat = doc.get('location').latitude;
    const lng = doc.get('location').longitude;
    const distanceInKm = distanceBetween([lat, lng], center);
    const distanceInM = distanceInKm * 1000;

    if (distanceInM <= radiusInM) {
      matchingDocs.push(doc.data());
    }
  }
}
```

### **Get User's Total Stats**
```typescript
const statsRef = doc(db, `users/${userId}/stats`);
const statsSnap = await getDoc(statsRef);
const stats = statsSnap.data();
// { health: 100, xp: 5000, questsCompleted: 25, ... }
```

---

## 🚀 Benefits of This Structure

1. **Scalability**: Easy to add new features without restructuring
2. **Performance**: Efficient queries with proper indexing
3. **Security**: Clear permission boundaries
4. **Maintenance**: Easy to backup, restore, and migrate
5. **Cost**: Reduced reads with better query patterns
6. **Development**: Clear separation of concerns

---

**Next Step:** Run the migration script to reorganize your Firebase!

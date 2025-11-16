# Realm of Valor Adventure App

A GPS-enabled fitness RPG companion app that transforms physical activity into epic quests and card battles.

---

## 🚀 QUICK START - Get the App Running

**Environment Status:** ✅ All configured and ready!

### 🎯 Easiest Way to Launch (NEW!)

We've created an interactive launcher that handles everything automatically:

**Mac/Linux:**
```bash
./launch.sh
```

**Windows:**
```cmd
launch.bat
```

**Or use Node directly:**
```bash
node launcher.js
```

The launcher will:
- ✅ Check prerequisites (Node.js, pnpm)
- ✅ Install dependencies automatically
- ✅ Set up environment files
- ✅ Launch mobile app, backend server, or both
- ✅ Provide system info and cleanup tools

### Having trouble getting the app to load?

👉 **[GET_APP_RUNNING.md](./GET_APP_RUNNING.md)** - Complete troubleshooting guide (START HERE)

Or use the quick commands:

```bash
# Test your setup
cd apps/mobile && node check-setup.js

# Start the app with debug logging
cd apps/mobile && pnpm start --clear
```

**See also:**
- [QUICK_START.txt](./QUICK_START.txt) - One-page quick reference
- [ACTION_PLAN.md](./ACTION_PLAN.md) - Step-by-step diagnostic plan
- [DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md) - Understanding debug logs
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Project status and next steps

---

## 🎮 What is Realm of Valor?

Realm of Valor combines the strategic depth of a deck-building card game with real-world GPS exploration and fitness tracking. Players create characters, explore their neighborhoods to discover quests, earn cards through physical activity, and battle other players using a unique stack-based combat system.

### Key Features

- **GPS Quest System**: Discover and complete location-based quests in the real world
- **Fitness Integration**: Connect with Apple Health, Google Fit, Strava, Garmin, and WHOOP
- **Stack-Based Combat**: Strategic card battles with instant interrupts and LIFO resolution
- **Three Deck System**: Action, Skill, and Loot decks with 300+ unique cards
- **Character Progression**: Level up, gain Renown, and customize your hero
- **Social Features**: Friend system, leaderboards, and battle invites
- **Economy System**: Earn gold through activities, purchase card packs, and trade in the Renown Shop

## 🎮 Project Structure

```
rov/
├── apps/
│   ├── web/           # Expo web target
│   ├── mobile/        # Expo native target (iOS/Android)
│   └── backend/       # NestJS API + Cloud Functions
├── packages/
│   ├── ui/            # Shared UI components
│   ├── types/         # TypeScript interfaces (✅ Complete)
│   └── logic/         # Core Rules Engine, Stack resolver
├── tools/
│   ├── importer/      # Card & rulebook importer (✅ Complete)
│   └── admin-scripts/ # Content management scripts
├── infra/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── cloud-functions/
└── docs/
    ├── spec.md
    ├── cards.json      # Generated card database
    ├── quests.json     # Generated quest database
    └── shop-items.json # Generated shop items
```

## ✅ Completed Components

### 1. Monorepo Foundation
- pnpm workspace configuration
- TypeScript + ESLint setup
- Organized package structure

### 2. Type System (`@rov/types`)
Complete TypeScript interfaces for:
- User & Character management
- Card definitions (Action, Skill, Loot, Boss, Summon, Quest, Class)
- Battle & Stack mechanics
- Quest & Adventure system
- Fitness tracking
- Shop & Economy
- Social features (Trading, Alliances)

### 3. Card Importer (`@rov/importer`)
Intelligent parser that:
- Reads all 8 source text files
- Extracts 600+ cards with effects
- Parses damage, healing, buffs, debuffs, etc.
- Identifies portable vs. non-portable cards
- Generates structured JSON output
- Provides coverage reports

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Firebase CLI
- Expo CLI

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd rov
   pnpm install
   ```

2. **Set up Firebase**
   - Create a Firebase project
   - Download `service-account.json` to root
   - Deploy Firestore rules and Cloud Functions

   See [SETUP.md](./SETUP.md) for detailed instructions

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Import card data**
   ```bash
   cd tools/importer
   pnpm import:db
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend API
   cd apps/backend
   pnpm dev

   # Terminal 2 - Mobile App
   cd apps/mobile
   pnpm start

   # Terminal 3 - Admin Dashboard
   cd apps/admin
   pnpm dev
   ```

For complete setup instructions, see [SETUP.md](./SETUP.md)

## 📋 Architecture Overview

### Frontend (React Native + Expo)
- **Universal**: Runs on iOS, Android, and Web
- **Navigation**: Expo Router with tabs (Map, Battleground, Activity, Shop, Rules)
- **UI Library**: tamagui for cross-platform components
- **Maps**: Mapbox GL for GPS adventures
- **Drag & Drop**: @dnd-kit for card interactions

### Backend (NestJS + Firebase)
- **Auth**: Firebase Authentication
- **Database**: Firestore with security rules
- **Real-time**: Firestore listeners for battles
- **Functions**: Cloud Functions for spawns, IAP validation, activity sync
- **APIs**: REST/GraphQL for battles, quests, fitness, shop, trades

### Game Rules Engine
- **Stack Resolver**: Last-In-First-Out (LIFO) effect resolution
- **Effect Registry**: Modular effect handlers (damage, heal, buff, etc.)
- **Turn Timer**: 60s base + 15s per Stack event, 120s hard cap
- **RNG**: Seeded dice rolls with audit logging

## 🎴 Card System

### Deck Types
- **Class** (12 cards): Guardian, Barbarian, Paladin, Ranger, Druid, Cleric, Necromancer, Warlock, Sorceress, Demon, Angelic, Dragon
- **Action** (100 cards): Events, challenges, global effects
- **Skill** (100 cards): Spells and abilities (Legendary, Epic, Rare, Common)
- **Loot** (100 cards): Equipment, consumables, fate cards
- **Summon** (20 cards): Allies and hindrances
- **Boss** (20 cards): Epic encounters
- **Quest** (30 cards): Objectives with rewards
- **Renown Shop** (30 cards): Powerful upgrades

### Card Portability
- **Portable**: Works in app (90%+ of cards)
- **Non-Portable**: Tabletop-only (social challenges, Soulforge Trial)

### Effect Types
The importer recognizes and parses:
- Damage (single-target and AOE)
- Healing
- Buffs/Debuffs (ATK, DEF, HP, Mana)
- Card draw
- Steal/Discard
- Renown/Gold/XP gains
- Persistent effects (Auras, Curses, Links)
- Boss spawns
- Equipment
- Custom effects (for manual mapping)

## 🗺️ GPS Adventure System

### Place Types
- Pub, Mountain, Trail, Monument, Park, Gym, Shop, Landmark, Water

### Dynamic Spawns
- Regional budgets per rarity tier
- TTLs: Common 60m, Rare 45m, Legendary 90m
- First-come-first-serve caps
- Random encounters while navigating (20% loot, 10% ambush, 10% NPC)

### Geofencing
- 50m radius (urban)
- 150m radius (trails/mountains)

## 💪 Fitness Integration

### Supported Platforms
- Apple HealthKit (iOS)
- Google Fit (Android)
- Strava (OAuth)
- Garmin (OAuth)
- WHOOP (OAuth)

### Rewards
- **XP from quests**: Common +1, Uncommon +2, Rare +3, Epic +5, Legendary +8
- **Gold from distance**: 1 Gold per 0.5 km (cap 20/day)
- **Gold from elevation**: 1 Gold per 100m (cap 10/day)
- **Temporary buffs**: HR-based challenges (e.g., 70% HRmax for 120s = +2 ATK for 10m)
- **Streaks**: 3-day +10% XP, 7-day +20% XP

### Anti-Cheat
- GPS quality checks
- Pace plausibility (3:00-15:00 min/km)
- HR spike filter (max +15 bpm per 5s)
- Step-distance sanity checks
- Cadence and movement validation

## ⚔️ Battle System

### Modes
- **1v1 Casual**: Unranked duels with full stats
- **1v1 Ranked**: ELO/MMR matchmaking with gear normalization
- **2v2 Brawls**: Team battles
- **Co-op Raids**: Up to 4 players vs. scaled bosses

### Turn Structure
1. **Action Phase**: Draw and resolve Action card
2. **Main Phase**: Play cards, attack, draw, shop
3. **End Phase**: Discard to hand limits (5 Skill, 5 Loot, 5 Action)

### The Stack
- Last-In-First-Out resolution
- Instant cards can respond to other Instants
- Logged with RNG seeds for replay/audit

### Victory Condition (In-App)
- **Last Player Standing** only
- Soulforge Trial removed from app battles
- Renown → Gold conversion on PvP win (1:5 rate)

## 💰 Economy

### Currency
- **Gold**: Soft currency for packs, shop, upgrades

### Earning Gold
- Quests (Common 5-10, Rare 25, Epic 40, Legendary 75)
- Fitness activities (distance + elevation)
- Battle rewards
- Trading (buyback at low rates)

### Shop
- **Item Packs** (10 cards): 750 Gold or £2.49
- **Adventure Packs**: 1,200 Gold or £3.99
- **Stash +10 slots**: 500 Gold or £1.49
- **Cosmetics**: 300-800 Gold
- **Respec Token**: 5,000 Gold (very rare)
- **Monthly Pass** (Adventure/WOD Mode): £9.99

### Pack Odds
- Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%
- Pity: Guaranteed ≥Rare every 3 packs
- Duplicates → Shards (Common 1, Uncommon 3, Rare 10, Epic 25, Legendary 75)
- Crafting costs: Rare 60, Epic 150, Legendary 450 shards

## 🔧 Development Status

### Phase 1: Core Systems ✅
- ✅ Type system and data models
- ✅ Game logic engine (stack resolver, effects, RNG, turns, decks)
- ✅ Firebase infrastructure (Cloud Functions, security rules)
- ✅ Mobile app structure with navigation
- ✅ Battle system with real-time updates
- ✅ Quest system with GPS geofencing
- ✅ Card importer and database population

### Phase 2: Content & Polish ✅
- ✅ Card data import (300+ cards)
- ✅ Admin dashboard for content management
- ✅ Leaderboards (Renown, Level, Gold)
- ✅ Social features (friends, invites)
- ✅ Authentication flows (login, signup, guest)
- ✅ Card collection viewer with filters
- ✅ Real-time Firebase hooks

### Phase 3: Integrations (In Progress)
- ✅ Firebase real-time listeners
- ✅ Environment configuration
- ⏳ Fitness API integrations (HealthKit, Google Fit, Strava)
- ⏳ Push notifications (Firebase Cloud Messaging)
- ⏳ In-app purchases (Apple, Google, Stripe)

### Phase 4: Launch Preparation
- ⏳ Beta testing
- ⏳ Performance optimization
- ⏳ App Store submission
- ⏳ Marketing materials

## 📝 License

Proprietary - Realm of Valor © 2025

## 🙏 Credits

- **Game Design**: Original tabletop card game
- **App Development**: Built with Claude Code
- **Tech Stack**: React Native, Expo, NestJS, Firebase, Mapbox
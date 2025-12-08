# 🎮 Realm of Valor

**A GPS-based Mobile RPG with Fitness Integration**

Turn your neighborhood into an epic fantasy adventure! Walk to discover quests, battle monsters, and level up your character in the real world.

---

## 🚀 Quick Start

**New here?** Read [`START_HERE.md`](./START_HERE.md) for complete setup guide.

```bash
# Install dependencies
pnpm install

# Start mobile app
cd apps/mobile && pnpm start

# Start admin panel (new terminal)
cd apps/admin && pnpm dev
```

---

## 📱 What Is This?

**Realm of Valor** is a mobile RPG that combines:
- 🗺️ **GPS Exploration** - Real-world locations become game locations
- ⚔️ **Turn-Based Battles** - Strategic card combat system
- 🏃 **Fitness Rewards** - Earn XP by walking and staying active
- 🎯 **Quest System** - Complete missions in your area
- 📈 **Character Progression** - Level up, gain skills, collect loot

---

## 🎯 Features

### Mobile App
- **Battle System** - Card-based combat with combos and status effects
- **Quest System** - GPS-based missions with milestone rewards
- **Character System** - 6 classes with unique progression
- **Inventory** - Smart item management with auto-stacking
- **Map** - Real-time GPS with POI discovery
- **Fitness Tracking** - Daily goals and streak bonuses

### Admin Panel
- **Quest Creator** - Visual quest editor with all objective types
- **Item Creator** - Design weapons, armor, and cards
- **Enemy Creator** - Configure monsters with AI behavior
- **Character Editor** - Modify player stats in real-time
- **NPC Creator** - Add NPCs with dialogue and quests

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[START_HERE.md](./START_HERE.md)** | **👈 Read this first!** |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Step-by-step testing instructions |
| [ENHANCEMENT_SUMMARY.md](./ENHANCEMENT_SUMMARY.md) | New features and how to use them |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | Complete technical overview |

---

## 🏗️ Architecture

```
Rov-Soulforge/
├── apps/
│   ├── mobile/          # React Native + Expo
│   │   └── features/    # 11 modular feature folders
│   └── admin/           # Next.js admin panel
├── packages/
│   ├── types/           # TypeScript definitions
│   ├── logic/           # Shared game logic
│   └── firebase/        # Firebase integration
└── docs/                # Documentation
```

**Design Philosophy:**
- 🧩 Modular - Each feature is independent
- 📝 AI-Friendly - Clear structure, <300 lines per file
- 🚀 Scalable - Easy to extend and modify
- 📱 Mobile-First - Optimized for phones

---

## 🎮 Core Gameplay Loop

1. **Open App** → See nearby quests on map
2. **Accept Quest** → Get objectives (battle, explore, collect)
3. **Walk Around** → Discover POIs, trigger battles
4. **Complete Objectives** → Earn milestone rewards
5. **Level Up** → Gain stats, unlock abilities
6. **Repeat** → New quests appear daily

---

## 🛠️ Tech Stack

**Mobile App:**
- React Native
- Expo
- TypeScript
- Firebase (Firestore, Auth, Functions)

**Admin Panel:**
- Next.js 14
- React 18
- TailwindCSS
- Firebase Admin SDK

**Tools:**
- pnpm (Package manager)
- TypeScript (Type safety)
- Git (Version control)

---

## 🎨 Key Features Explained

### Battle System
**Turn-based card combat** with strategy:
- Play attack/heal/buff cards
- Combine cards for bonus combos
- Status effects (burn, poison, shield)
- 4 difficulty levels
- AI opponent

### Quest System
**GPS-based missions** with variety:
- 6 objective types (battle, location, fitness, collection, etc.)
- Milestone rewards at 25/50/75/100% completion
- Dynamic difficulty scaling
- Real-time progress tracking

### Character Progression
**Deep leveling system:**
- Exponential XP curve
- Class-specific stat growth (6 classes)
- Skill points and stat points
- Ultimate abilities at milestones
- Equipment and inventory

### Fitness Integration
**Earn rewards by moving:**
- Daily step/distance goals
- Streak bonuses (up to 2× XP)
- Calorie tracking
- Achievement milestones
- Real-time GPS tracking

---

## 📊 Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Modular architecture refactor |
| **Phase 2** | ✅ Complete | Working battle system |
| **Phase 3** | ✅ Complete | Admin panel (all creators) |
| **Enhancements** | ✅ Complete | 18 feature enhancements |
| **Testing** | 🧪 In Progress | Ready for community testing |
| **Firebase** | ⏳ Optional | Works offline-first |

---

## 🧪 Testing

**Ready to test?** Follow these steps:

1. Read [`START_HERE.md`](./START_HERE.md)
2. Follow [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)
3. Test mobile app features
4. Test admin panel
5. Report any issues

**Requirements:**
- Node.js 18+
- pnpm
- Expo Go app on phone
- Same WiFi network

---

## 🤝 Contributing

This is a solo project currently in development. Testing feedback is welcome!

**How to help:**
1. Test the app
2. Report bugs
3. Suggest features
4. Share ideas

---

## 📄 License

Private project - Not yet licensed for public use.

---

## 🎯 Roadmap

**Now:**
- ✅ Core gameplay systems
- ✅ Admin panel
- ✅ Feature enhancements
- 🧪 Community testing

**Next:**
- 🔧 Firebase configuration
- 📱 Production builds
- 🎨 UI/UX polish
- 🌐 Multiplayer features

**Future:**
- 🏆 PvP battles
- 👥 Guilds/teams
- 🎪 Events
- 🗺️ More locations
- 📦 More content

---

## 🙏 Acknowledgments

- Built with ❤️ and ☕
- Powered by React Native & Expo
- Inspired by Pokémon GO, Diablo, and fitness apps

---

## 📞 Support

**Issues?** Check the troubleshooting section in `TESTING_GUIDE.md`

**Questions?** Read the documentation in the root folder

**Feedback?** Create an issue on GitHub

---

**Ready to play?** Start with [`START_HERE.md`](./START_HERE.md)! 🚀

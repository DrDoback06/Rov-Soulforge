# 🏰 Realm of Valor - AR Fantasy RPG

> **A location-based fantasy RPG that transforms the real world into an epic adventure**

## 🎮 Game Overview

Realm of Valor is an innovative AR fantasy RPG that combines real-world exploration with epic questing, card battles, and character progression. Players explore their surroundings to discover quests, battle monsters, collect cards, and level up their characters.

## ✨ Core Features

### 🗺️ **Quest System**
- **Static Quests**: Epic landmarks and locations across the UK
- **Local Quests**: Dynamically generated based on nearby landmarks
- **Dynamic Quests**: Player-specific quests that refresh on completion
- **Multi-Stop Navigation**: Plan and execute multi-quest routes
- **Route Optimization**: TSP algorithm for efficient quest routing

### 🎯 **Navigation & Exploration**
- **Drive Mode**: Camera follows player with tilted view
- **Real-time Navigation**: Walking routes with turn-by-turn guidance
- **Quest Discovery**: "Search This Area" feature for location-based quests
- **Viewport Loading**: Smart quest loading based on map view

### 🎴 **Card System**
- **Card Collection**: Collect and manage fantasy cards
- **Battle System**: Turn-based combat with strategic depth
- **Equipment**: Equip cards to enhance character stats
- **Stash Management**: Account-wide storage system

### 👤 **Character System**
- **Character Creation**: Create and customize your hero
- **Stats & Skills**: Strength, Dexterity, Intelligence, Vitality
- **Skill Trees**: Linear progression with free-form customization
- **Equipment Slots**: Diablo II-style inventory management

### 🏆 **Progression & Rewards**
- **Experience System**: Level up through quest completion
- **Reward Multipliers**: Bonus rewards for multi-quest sessions
- **Fitness Integration**: Strava connection for real-world activity
- **Leaderboards**: Competitive rankings for epic quests

## 🛠️ Technical Stack

### **Frontend**
- **React Native** (Expo) - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Mapbox** - Maps, navigation, and geocoding
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch interactions

### **Backend**
- **Firebase** - Authentication, Firestore, Cloud Functions
- **Firestore** - Real-time database with geospatial queries
- **Firebase Auth** - User authentication and management
- **Cloud Functions** - Server-side logic and processing

### **Architecture**
- **Monorepo** - Unified codebase with shared packages
- **TypeScript** - End-to-end type safety
- **Modular Design** - Reusable components and hooks
- **Real-time Updates** - Live quest and battle updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Firebase project
- Mapbox account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realm-of-valor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp apps/mobile/.env.example apps/mobile/.env
   # Add your Firebase and Mapbox credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Mapbox
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Strava (Optional)
EXPO_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id
```

## 🎯 Game Mechanics

### **Quest Types**
- **Static**: Permanent quests at major landmarks
- **Local**: Generated from nearby POIs (2-week lifespan)
- **Dynamic**: Player-specific quests (refreshes on completion)

### **Quest Categories**
- **Main Quests**: Epic storylines and major objectives
- **World Quests**: Global events and community challenges
- **Side Quests**: Optional content and exploration

### **Quest Management**
- **Active Quests**: Currently in progress
- **Saved Quests**: Planned for future completion
- **Hidden Quests**: Temporarily hidden from view
- **Abandoned Quests**: Left incomplete (with XP penalty)

## 🗺️ Navigation System

### **Drive Mode**
- **Camera Follow**: Tilted view that follows player movement
- **Real-time Updates**: Continuous location tracking
- **Turn-by-turn**: Walking route guidance
- **Multi-stop**: Route optimization for multiple quests

### **Quest Routing**
- **Manual Ordering**: Drag-and-drop quest arrangement
- **Auto Optimization**: TSP algorithm for efficient routing
- **Real-time Updates**: Dynamic route adjustments
- **Progress Tracking**: Visual progress indicators

## 🎴 Card System

### **Card Types**
- **Equipment**: Weapons, armor, accessories
- **Skills**: Spells, abilities, special moves
- **Companions**: Allies and summons
- **Resources**: Materials and consumables

### **Battle System**
- **Turn-based Combat**: Strategic card battles
- **Stack System**: Card combinations and synergies
- **RNG Engine**: Fair and balanced randomness
- **Real-time Updates**: Live battle progression

## 🏗️ Architecture

### **Monorepo Structure**
```
rov/
├── apps/
│   ├── mobile/          # React Native app
│   ├── backend/         # Node.js API
│   └── admin/           # Admin dashboard
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── logic/           # Game logic and utilities
│   └── firebase/        # Firebase configuration
└── tools/
    └── importer/        # Data import utilities
```

### **Key Components**
- **Quest System**: Complete quest lifecycle management
- **Navigation**: Real-time routing and guidance
- **Character System**: Stats, skills, and progression
- **Inventory**: Equipment and stash management
- **Battle System**: Turn-based combat mechanics

## 🧪 Testing

### **Development Tools**
- **Location Spoofer**: Test movement and navigation
- **Quest Seeder**: Generate test quests
- **Card Seeder**: Create test cards and items
- **Battle Simulator**: Test combat mechanics

### **Testing Checklist**
- [ ] Quest discovery and activation
- [ ] Multi-stop navigation
- [ ] Drive mode camera following
- [ ] Quest completion and rewards
- [ ] Character progression
- [ ] Inventory management
- [ ] Battle system

## 📱 Platform Support

- **iOS**: Native iOS app via Expo
- **Android**: Native Android app via Expo
- **Web**: Progressive Web App support
- **Cross-platform**: Shared codebase and logic

## 🔮 Future Features

### **Planned Enhancements**
- **AR Integration**: Augmented reality quest markers
- **Voice Narration**: AI-powered quest storytelling
- **Social Features**: Friends, trading, and parties
- **Guild System**: Team-based gameplay
- **Seasonal Events**: Limited-time content and rewards

### **Advanced Features**
- **Quest Crafting**: Player-created quests
- **Dynamic Weather**: Weather-based quest modifiers
- **Fitness Challenges**: Real-world activity integration
- **Competitive Modes**: PvP and leaderboards

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Mapbox** for mapping and navigation services
- **Firebase** for backend infrastructure
- **Expo** for React Native development platform
- **React Native** community for excellent libraries

---

**Ready to embark on your epic adventure?** 🏰⚔️

*Transform the world around you into a realm of endless possibilities!*
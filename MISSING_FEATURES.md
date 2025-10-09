# Missing Critical Features

Based on the spec, here's what's still needed:

## ❌ Not Implemented Yet

### 1. **Battleground / Combat System** (CRITICAL)
- [ ] Battle screen with Stack-based combat
- [ ] Deck visualization (face-down, click to draw)
- [ ] Hand management (fan animation)
- [ ] Drag-and-drop card playing
- [ ] Stack panel showing LIFO resolution
- [ ] Turn timer (rope) with 60s base + 15s per Stack event
- [ ] Tactile 3D dice roller with RNG seed logging
- [ ] Target selection (opponent hero, self, minions)
- [ ] Effect resolution engine
- [ ] Battle log with timestamps and seeds

### 2. **Quests System** (Partial)
- [x] Quest data model
- [x] Map markers (placeholder without Mapbox)
- [ ] Quest acceptance flow
- [ ] Quest completion verification
- [ ] Reward distribution
- [ ] Dynamic spawns with TTLs
- [ ] First-come-first-serve caps
- [ ] Regional rolling windows

### 3. **Fitness Integration** (Not Started)
- [ ] HealthKit connector (iOS)
- [ ] Google Fit connector (Android)
- [ ] Strava OAuth
- [ ] Garmin OAuth
- [ ] WHOOP OAuth
- [ ] Activity verification (GPS quality, pace, HR)
- [ ] Rewards from fitness activities
- [ ] HR-based temporary buffs
- [ ] Streak tracking

### 4. **Shop System** (Not Started)
- [ ] Shop UI with item grid
- [ ] Pack purchasing (Gold/IAP)
- [ ] Pack opening animation with odds
- [ ] Pity system
- [ ] Buyback system
- [ ] Spotlight rotation
- [ ] Monthly pass subscription
- [ ] Receipt validation

### 5. **Social Features** (Not Started)
- [ ] Friends list
- [ ] Trading system
- [ ] Presence (opt-in location sharing)
- [ ] Duel invites
- [ ] Co-op squad formation

### 6. **PvP/Co-op Modes** (Not Started)
- [ ] 1v1 Casual matchmaking
- [ ] 1v1 Ranked with normalization
- [ ] 2v2 Brawls
- [ ] Co-op boss raids (up to 4 players)
- [ ] Matchmaking service
- [ ] Spectate mode
- [ ] Replay system

### 7. **Admin Tools** (Not Started)
- [ ] POI authoring
- [ ] Quest builder
- [ ] Spawn tuning
- [ ] Pack odds configuration
- [ ] Spotlight scheduling
- [ ] Seasonal switches

### 8. **Card Importer** (Not Started)
- [ ] Parse rulebook PDF
- [ ] Parse card TXT files
- [ ] Map to CardDef schema
- [ ] Set portable flags
- [ ] Convert exertion to HR effects
- [ ] Upload to Firestore

---

## ✅ What IS Implemented

1. **Authentication** - Firebase Auth with email/guest
2. **Character Creation** - 8 classes, 4 alignments
3. **Profile Screen** - Character stats, Strava connect button
4. **Map Screen** - Location tracking, quest list overlay (no interactive map yet)
5. **Deck Screen** - Placeholder
6. **Companion Screen** - AI chat interface
7. **Firebase Integration** - Auth, Firestore configured
8. **Environment Configuration** - All API keys set

---

## 🚧 Priority Order

### Phase 1: Core Gameplay (Week 1-2)
1. **Battleground** - Most critical, enables actual gameplay
2. **Card Importer** - Need card data to play
3. **Quest Completion Flow** - From accept to reward
4. **Shop Basic** - At least pack buying and opening

### Phase 2: Adventure Features (Week 3-4)
5. **Mapbox Interactive Map** - Fix build and restore native map
6. **Dynamic Quest Spawns** - With TTLs and caps
7. **Fitness Basic** - At least one connector working
8. **Navigation** - Route polylines and ETAs

### Phase 3: Social and Economy (Week 5-6)
9. **Trading** - Between players
10. **PvP Matchmaking** - At least 1v1 casual
11. **Shop Advanced** - Spotlight, pity, buyback
12. **Fitness Advanced** - All connectors, verification

### Phase 4: Polish and Scale (Week 7-8)
13. **Admin Tools** - For content creation
14. **Co-op Raids** - Boss battles
15. **Ranked Mode** - With normalization
16. **Replays and Spectate**

---

## 🔥 Immediate Next Steps

1. **Get Mapbox secret token** and configure EAS builds
2. **Build and test APK** on phone to verify base app works
3. **Implement Battleground** - This is the heart of the game
4. **Create Card Importer** - Need data to test battles
5. **Test end-to-end flow** - Login → Character → Quest → Battle → Reward

---

## 📊 Completion Status

- Authentication & Character: **80%**
- Map & Navigation: **30%** (needs Mapbox working)
- Battleground: **0%** ⚠️ CRITICAL MISSING
- Quests: **20%** (data model only)
- Fitness: **0%**
- Shop: **0%**
- Social: **0%**
- PvP/Co-op: **0%**
- Admin Tools: **0%**

**Overall Progress: ~15%**

The app has a solid foundation but needs the core gameplay loop implemented urgently!

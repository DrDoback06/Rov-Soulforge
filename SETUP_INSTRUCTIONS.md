# Realm of Valor - Setup Instructions

## ✅ What's Implemented

### Web Version (Fully Functional)
- ✅ Interactive Mapbox GL map
- ✅ Location spoofing for testing (D-pad + presets)
- ✅ Quest markers on map
- ✅ Quest seeding tool (in-app)
- ✅ Firebase authentication
- ✅ Character creation
- ✅ Tab navigation (Map, Character, Shop, Profile)

### Components Created
- **MapView.web.tsx** - Web-optimized Mapbox map
- **LocationSpoofer.tsx** - GPS testing tool (web only)
- **QuestSeeder.tsx** - In-app quest seeding (web only)

## 🚀 Running the Web App

1. **Start the dev server:**
   ```bash
   cd apps/mobile
   pnpm start --web
   ```

2. **Open browser:**
   - Navigate to `http://localhost:8081`

3. **Sign in / Create account:**
   - Use email/password or create new account

4. **Create character:**
   - Choose class, alignment
   - Character data saved to Firebase

5. **Seed test quests:**
   - Click "Seed Quests" button in top-right
   - This creates 13 test quests across 8 locations

6. **Test location spoofing:**
   - Use D-pad to move (~100m per click)
   - OR click preset locations (London, New York, Tokyo, etc.)
   - Map updates in real-time

7. **View quests:**
   - Quest markers (⚔️) appear on map
   - Click marker or quest in bottom overlay to view details

## 🔧 Manual Setup Required

### 1. Deploy Firestore Rules
The Firestore security rules have been updated to allow quest seeding. Deploy them:

```bash
cd packages/firebase
firebase deploy --only firestore:rules
```

**IMPORTANT:** After testing, revert the rules by changing:
```javascript
// In firestore.rules, line 68
allow create, update, delete: if isAuthenticated(); // TEMPORARY

// Back to:
allow create: if false; // Cloud Function only
```

### 2. Get Mapbox Secret Token (for native builds)

Currently using PUBLIC token (pk.) for web. For EAS builds on native (iOS/Android), you need a SECRET token:

1. Go to https://account.mapbox.com/access-tokens/
2. Create a new token with `DOWNLOADS:READ` scope
3. It will start with `sk.` (secret key)
4. Update EAS secret:
   ```bash
   eas secret:delete --scope project --name MAPBOX_DOWNLOADS_TOKEN
   eas secret:create --scope project --name MAPBOX_DOWNLOADS_TOKEN --value sk.your-secret-token
   ```

### 3. Test Quest Data

The app includes 13 pre-made quests at these locations:

| Location | Coordinates | Quests |
|----------|-------------|--------|
| London, UK | 51.5074, -0.1278 | 2 |
| New York, USA | 40.7829, -73.9654 | 2 |
| Tokyo, Japan | 35.6586, 139.7454 | 2 |
| Sydney, Australia | -33.8568, 151.2153 | 2 |
| Paris, France | 48.8584, 2.2945 | 2 |
| Swiss Alps | 46.5197, 8.7266 | 1 |
| Yosemite | 37.8651, -119.5383 | 1 |
| Hawaii | 21.2793, -157.8293 | 1 |

Use the Location Spoofer to teleport to these locations and see the quests appear!

## 📱 Building for Native (Android/iOS)

### Current Status
- **Mapbox authentication issue** - Need secret token (see above)
- **EAS Build configured** - `eas.json` ready
- **Development build required** - Expo Go doesn't support custom native modules

### Build Commands

**Android APK:**
```bash
eas build --platform android --profile development
```

**iOS Simulator:**
```bash
eas build --platform ios --profile development
```

### Install Development Build

After build completes:

1. Download the build from https://expo.dev
2. **Android:** Install APK directly
3. **iOS:** Install via Xcode simulator or TestFlight

## 🐛 Troubleshooting

### Web app blank screen
- Clear metro cache: `pnpm expo start --web --clear`
- Check browser console for errors
- Verify Firebase config in `.env`

### Quest seeding fails
- Check Firestore rules are deployed
- Verify you're signed in
- Check browser console for permission errors

### Map not loading
- Verify Mapbox token in `.env`:
  ```
  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-token-here
  ```
- Check browser console for Mapbox errors

### Location spoofing not working
- Only works on web platform
- Make sure you clicked a preset or used D-pad
- Check that nearbyQuests state updates (use React DevTools)

## ⏭️ Next Steps

### Immediate
1. Deploy Firestore rules
2. Test web version with quest seeding
3. Get Mapbox secret token for native builds
4. Build and test native app

### Future Development
1. **Quest Acceptance Flow** - questProgress collection integration
2. **Quest Completion** - Rewards, XP, Gold
3. **Battleground** - Combat system (CRITICAL missing feature!)
4. **Fitness Integration** - HealthKit, Google Fit
5. **Shop System** - Card packs, items
6. **Social Features** - Friends, PvP, Co-op

## 📝 Notes

- Firestore rules currently in DEV mode for quest seeding
- Remember to secure rules after testing!
- Web version is fully functional for development/testing
- Native version requires EAS build with proper Mapbox token

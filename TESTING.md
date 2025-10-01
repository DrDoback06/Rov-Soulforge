# Testing Guide - Realm of Valor

Quick guide to test the mobile app locally.

## Prerequisites

1. **Install Dependencies**
   ```bash
   cd rov
   pnpm install
   ```

2. **Set Up Environment**
   ```bash
   cd apps/mobile
   cp .env.example .env
   ```

   Edit `.env` and add:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

## Option 1: Test with Firebase Emulators (Recommended)

This lets you test without a real Firebase project.

1. **Start Firebase Emulators**
   ```bash
   cd packages/firebase
   firebase emulators:start
   ```

2. **Update Mobile .env**
   ```env
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-project
   EXPO_PUBLIC_FIREBASE_API_KEY=demo-api-key
   ```

3. **Start Mobile App**
   ```bash
   cd apps/mobile
   pnpm start
   ```

## Option 2: Test with Real Firebase

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Create Web app and copy config

2. **Add Config to .env**
   Use the config from Firebase Console

3. **Deploy Firestore Rules**
   ```bash
   cd packages/firebase
   firebase use --add  # Select your project
   firebase deploy --only firestore:rules,firestore:indexes
   ```

4. **Start Mobile App**
   ```bash
   cd apps/mobile
   pnpm start
   ```

## Testing Flow

### 1. Test Authentication

**Sign Up**
1. Launch app → Should show Login screen
2. Tap "Create Account"
3. Enter email and password
4. Select a character class (e.g., "Warrior")
5. Select alignment (e.g., "Holy")
6. Tap "Create Account"
7. Should redirect to Map tab

**Sign In**
1. If already have an account, enter credentials
2. Tap "Log In"
3. Should redirect to Map tab

**Guest Mode**
1. From login screen, tap "Continue as Guest"
2. Creates anonymous account
3. Should redirect to Map tab

### 2. Test Map Tab

**Location Permission**
1. Map tab should request location permission
2. Grant permission
3. Should show Mapbox map centered on your location
4. Blue dot should show your current position

**Mock Quests**
- Two mock quests should appear in the overlay at bottom
- Tap a quest to open quest detail screen

### 3. Test Quests Tab

**Empty State**
- If no active quests, shows:
  - 🗺️ icon
  - "No active quests" message
  - "Explore Map" button
- Tap "Explore Map" → Should navigate to Map tab

**With Active Quests**
- Real quest progress will show when quests are started
- Each quest card shows:
  - Quest title
  - Progress bar
  - Completion percentage

### 4. Test Inventory Tab

**With Empty Inventory**
- Shows "No cards found" when inventory is empty

**With Cards** (After importing data)
- Search bar at top
- Filter buttons: All, Action, Skill, Loot
- Rarity filters: All, Common, Uncommon, Rare, Epic, Legendary
- 2-column grid of cards
- Each card shows:
  - Mana cost badge (top-left)
  - Count badge (top-right)
  - Card name and type
  - Effect text

### 5. Test Leaderboard Tab

**Empty State**
- Shows "No rankings yet" when leaderboard is empty

**With Data**
- Three leaderboard types: Renown, Level, Gold
- Top 100 players
- Rank badges: 👑 🥈 🥉
- Character avatars (first letter of class)

### 6. Test Profile Tab

**Character Display**
- Avatar with alignment-colored gradient
- Character class and level
- Alignment badge
- 4 stat boxes: HP, Mana, Gold, Renown
- Combat stats section: ATK, DEF, SPD
- Account email

**Sign Out**
- Tap "Sign Out" button
- Should return to login screen

## Common Testing Scenarios

### Test Character Creation
```
1. Sign up with new email
2. Choose class: "Mage"
3. Choose alignment: "Arcane"
4. Verify character appears in Profile tab
5. Check Firestore:
   - characters/{userId} should exist
   - inventories/{userId} should exist
```

### Test Real-time Updates
```
1. Open Profile tab
2. Manually update character in Firestore Console
3. Profile should update automatically (real-time listener)
```

### Test Navigation
```
1. Start on Map tab
2. Tap quest → Opens quest detail modal
3. Press back → Returns to Map
4. Navigate to Profile tab
5. Sign out → Returns to login
6. Sign in → Returns to Map
```

## Troubleshooting

### "Firebase not configured" Error
- Check that `.env` file exists in `apps/mobile/`
- Verify all `EXPO_PUBLIC_*` variables are set
- Restart Expo dev server: `r` in terminal

### "Location permission denied"
- On iOS Simulator: Features → Location → Custom Location
- On Android Emulator: Use toolbar to set location
- On physical device: Grant permission in Settings

### Map not showing
- Verify Mapbox token is valid
- Check that token has correct scopes
- Try different map style: `mapbox://styles/mapbox/streets-v12`

### Authentication fails
- Check Firebase Auth is enabled
- Verify Email/Password provider is enabled
- Check Firestore rules allow write access

### Cards not showing
- Run card import: `pnpm import:db` from `tools/importer`
- Check Firestore has `cards` collection
- Verify `inventories/{userId}` has cards object

## Testing on Devices

### iOS Simulator
```bash
cd apps/mobile
pnpm ios
```

### Android Emulator
```bash
cd apps/mobile
pnpm android
```

### Physical Device (Expo Go)
1. Install Expo Go from App Store / Play Store
2. Run `pnpm start`
3. Scan QR code with camera (iOS) or Expo Go (Android)

### Physical Device (Development Build)
```bash
# Build development version
eas build --profile development --platform ios
# or
eas build --profile development --platform android

# Install on device and run
pnpm start --dev-client
```

## Next Steps

Once basic testing is complete:

1. Import real card data: `pnpm import:db`
2. Deploy Cloud Functions for quest spawning
3. Test battle system with real opponents
4. Test fitness activity tracking
5. Test pack opening and card rewards

## Quick Test Checklist

- [ ] Sign up new account
- [ ] Character created in Firestore
- [ ] Login works
- [ ] Guest login works
- [ ] Map loads with user location
- [ ] Mock quests appear
- [ ] Quest detail opens
- [ ] Quests tab loads
- [ ] Inventory tab loads
- [ ] Leaderboard tab loads
- [ ] Profile shows character data
- [ ] Profile stats update in real-time
- [ ] Sign out returns to login
- [ ] Navigation between tabs works

---

**Happy Testing! 🎮⚔️🗺️**

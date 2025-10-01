# Realm of Valor - Setup Guide

Complete guide for setting up the Realm of Valor development environment.

## Prerequisites

- Node.js 20+ and pnpm 8+
- Firebase CLI: `npm install -g firebase-tools`
- Expo CLI: `npm install -g expo-cli` or `npx expo`
- iOS: Xcode 14+ (macOS only)
- Android: Android Studio with SDK 33+

## 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd rov
pnpm install
```

## 2. Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: "Realm of Valor"
3. Enable the following services:
   - Authentication (Email/Password, Anonymous)
   - Firestore Database
   - Cloud Functions
   - Cloud Storage
   - Firebase Hosting (for admin dashboard)

### 2.2 Download Service Account Key

1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `service-account.json` in the root of the monorepo
4. **IMPORTANT**: Add to `.gitignore` (already included)

### 2.3 Get Web App Config

1. Go to Project Settings → General
2. Under "Your apps", add a Web app
3. Copy the Firebase config object
4. Save for environment configuration (step 4)

### 2.4 Deploy Firebase Infrastructure

```bash
cd packages/firebase
firebase login
firebase use --add  # Select your project
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

## 3. Mapbox Setup

1. Create account at [Mapbox](https://account.mapbox.com)
2. Create a new access token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
3. Save token for environment configuration

## 4. Environment Configuration

### 4.1 Root Environment

```bash
cp .env.example .env
# Edit .env with your Firebase and Mapbox credentials
```

### 4.2 Mobile App

```bash
cd apps/mobile
cp .env.example .env
# Edit with Firebase Web config and Mapbox token
```

### 4.3 Backend API

```bash
cd apps/backend
cp .env.example .env
# Edit with Firebase Admin credentials
```

### 4.4 Admin Dashboard

```bash
cd apps/admin
cp .env.example .env.local
# Edit with Firebase credentials
```

## 5. Import Card Data

This populates Firestore with all card definitions from the game design documents.

```bash
cd tools/importer
pnpm import:db
```

Expected output:
```
🚀 Starting database import...
📖 Parsing card files...
  - Parsing Action Deck...
  - Parsing Skill Deck...
  - Parsing Loot Deck...
📦 Parsed 300+ cards total
☁️  Importing to Firestore...
✅ Imported 300+ cards total
📊 Creating metadata...
✅ Created collection metadata
📖 Parsing quest definitions...
📦 Parsed 30 quests
✅ Imported 30 quests total
📖 Importing Renown Shop cards...
✅ Imported 30 shop cards total
✨ Import complete!
```

## 6. Start Development Servers

### 6.1 Start Backend API

```bash
cd apps/backend
pnpm dev
```

Server will start at `http://localhost:3001`
Swagger docs: `http://localhost:3001/api/docs`

### 6.2 Start Mobile App

```bash
cd apps/mobile
pnpm start
```

Options:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app for physical device

### 6.3 Start Admin Dashboard

```bash
cd apps/admin
pnpm dev
```

Dashboard will start at `http://localhost:3000`

## 7. Optional: External Integrations

### 7.1 Strava Integration

1. Create app at [Strava Developers](https://developers.strava.com)
2. Set redirect URI: `exp://127.0.0.1:19000/--/auth/strava`
3. Add client ID/secret to environment files

### 7.2 In-App Purchases

**iOS (App Store)**
1. Set up App Store Connect
2. Create in-app products
3. Add shared secret to environment files

**Android (Google Play)**
1. Set up Google Play Console
2. Create in-app products
3. Download service account JSON
4. Save as `google-play-service-account.json` in root

**Web (Stripe)**
1. Create Stripe account
2. Get API keys from dashboard
3. Add to environment files
4. Set up webhook endpoint: `https://your-api.com/webhooks/stripe`

### 7.3 Push Notifications

1. Enable Firebase Cloud Messaging
2. iOS: Upload APNs certificate or key
3. Android: Automatic with Firebase
4. Add FCM server key to backend environment

## 8. Testing

### 8.1 Run Unit Tests

```bash
# Test core logic
cd packages/logic
pnpm test

# Test backend
cd apps/backend
pnpm test
```

### 8.2 Test with Emulators

```bash
cd packages/firebase
firebase emulators:start
```

Update environment files:
```env
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

## 9. Deployment

### 9.1 Deploy Backend

```bash
cd apps/backend
pnpm build
# Deploy to your hosting service (Heroku, Railway, Fly.io, etc.)
```

### 9.2 Deploy Mobile App

**iOS**
```bash
cd apps/mobile
eas build --platform ios
eas submit --platform ios
```

**Android**
```bash
cd apps/mobile
eas build --platform android
eas submit --platform android
```

### 9.3 Deploy Admin Dashboard

```bash
cd apps/admin
pnpm build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy to Vercel
vercel deploy
```

## 10. Common Issues

### Issue: Firebase Functions timeout

**Solution**: Increase timeout in `firebase.json`:
```json
{
  "functions": {
    "timeoutSeconds": 540,
    "memory": "1GB"
  }
}
```

### Issue: Expo build fails

**Solution**: Clear cache and reinstall:
```bash
rm -rf node_modules
pnpm install
expo start --clear
```

### Issue: Mapbox not showing

**Solution**: Check that:
1. Access token is correctly set in environment
2. Token has correct scopes
3. Bundle ID matches token restrictions

### Issue: Card import fails

**Solution**:
1. Verify `service-account.json` is in correct location
2. Check Firebase project ID matches
3. Ensure card data files are in `cardgamedata/` directory

## 11. Development Workflow

### Creating a New Card

1. Add card definition to appropriate deck file in `cardgamedata/`
2. Run `pnpm import:db` from `tools/importer`
3. Card is now available in the app

### Spawning a Quest

1. Open admin dashboard at `http://localhost:3000`
2. Navigate to "Spawn Quest"
3. Select location on map
4. Set quest parameters (radius, duration)
5. Click "Spawn Quest"

### Testing Battle System

1. Use admin dashboard to create test battle
2. Open mobile app
3. Navigate to battle screen
4. Play through battle actions
5. Check Firestore for state updates

## 12. Architecture Overview

```
rov/
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── logic/        # Core game engine
│   └── firebase/     # Firebase Cloud Functions
├── apps/
│   ├── mobile/       # React Native Expo app
│   ├── backend/      # NestJS REST API
│   └── admin/        # Next.js admin dashboard
└── tools/
    └── importer/     # Card data import scripts
```

## 13. Resources

- [Project Documentation](./docs/)
- [Game Design Documents](./cardgamedata/)
- [Firebase Console](https://console.firebase.google.com)
- [Expo Documentation](https://docs.expo.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)

## 14. Support

For issues or questions:
1. Check existing GitHub issues
2. Review game design documents
3. Check Firebase logs: `firebase functions:log`
4. Enable debug mode in mobile app settings

---

**Ready to start your adventure!** 🎮⚔️🗺️

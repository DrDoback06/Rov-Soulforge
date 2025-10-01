# Expo SDK 54 Migration Guide

## Overview

The Realm of Valor mobile app has been upgraded from Expo SDK 51 to SDK 54. This guide covers all breaking changes and migration steps.

---

## What Changed

### Major Version Updates

| Package | SDK 51 | SDK 54 | Changes |
|---------|--------|--------|---------|
| expo | ~51.0.0 | ~54.0.0 | Major version bump |
| expo-router | ~3.5.0 | ~4.0.0 | New routing features |
| react | 18.2.0 | 18.3.1 | Minor updates |
| react-native | 0.74.0 | 0.76.5 | New Architecture support |
| expo-location | ~17.0.0 | ~18.0.0 | Updated permissions |
| async-storage | ^1.23.0 | ^2.1.0 | Breaking API changes |
| expo-linear-gradient | ~13.0.0 | ~14.0.0 | Performance improvements |

### New Dependencies

- `expo-constants` ~17.0.0 - Required for app constants
- `expo-status-bar` ~2.0.0 - Status bar management

---

## Migration Steps

### 1. Update Dependencies

```bash
# Navigate to mobile app
cd apps/mobile

# Remove node_modules and lock file
rm -rf node_modules
rm pnpm-lock.yaml

# Install new dependencies
pnpm install
```

### 2. Update app.json

Added new required fields:

```json
{
  "expo": {
    // ... existing config
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**Action Required**: Replace `your-project-id` with your actual EAS project ID.

### 3. AsyncStorage Breaking Changes

**Before (SDK 51)**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Direct usage
await AsyncStorage.setItem('key', 'value');
```

**After (SDK 54)**:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// No changes to API, but version 2.x has improved performance
await AsyncStorage.setItem('key', 'value');
```

*Note: No code changes needed, but performance is improved.*

### 4. React Native 0.76 Changes

#### New Architecture Support

SDK 54 includes opt-in support for React Native's New Architecture:

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "newArchEnabled": true
          },
          "android": {
            "newArchEnabled": true
          }
        }
      ]
    ]
  }
}
```

**Recommendation**: Leave disabled for now until all dependencies are compatible.

### 5. Expo Router 4.0 Changes

#### Typed Routes

Expo Router 4.0 has improved TypeScript support:

```typescript
// Before
router.push('/quest/123');

// After (with type safety)
router.push({
  pathname: '/quest/[id]',
  params: { id: '123' }
});
```

*Note: Old syntax still works, but new syntax provides better type checking.*

#### Layout Props

```typescript
// Before
export default function TabLayout() {
  return <Tabs>...</Tabs>;
}

// After (with improved types)
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Better autocomplete for options
      }}
    >
      ...
    </Tabs>
  );
}
```

### 6. Location Permission Changes

Expo Location 18.0 has stricter permission handling:

```typescript
// Before
const { status } = await Location.requestForegroundPermissionsAsync();

// After (same API, but more strict)
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  // Must handle denied state explicitly
  return;
}
```

**iOS**: Update `Info.plist` descriptions to be more specific:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Realm of Valor uses your location to spawn nearby quests and adventures.</string>
```

---

## Breaking Changes by Feature

### Firebase Integration

No breaking changes, but recommended updates:

```typescript
// firebase.ts - Add error handling for SDK 54
import { initializeApp, getApps } from 'firebase/app';

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
```

### Maps (Mapbox)

No breaking changes, but update configuration:

```json
// app.json
{
  "plugins": [
    [
      "@rnmapbox/maps",
      {
        "RNMapboxMapsDownloadToken": "YOUR_TOKEN",
        "RNMapboxMapsVersion": "11.0.0" // Optional: Use latest
      }
    ]
  ]
}
```

### React Query

No breaking changes, version 5.x compatible with both SDK 51 and 54.

---

## Testing Checklist

After migration, test these critical features:

### Authentication
- [ ] Sign up creates character
- [ ] Login works
- [ ] Guest mode works
- [ ] Sign out returns to login

### Navigation
- [ ] All 6 tabs load
- [ ] Modal navigation works (battles, quests)
- [ ] Back navigation works
- [ ] Deep linking works (test with `npx uri-scheme open realmofvalor://quest/123`)

### Real-time Features
- [ ] Character stats update in real-time
- [ ] Quest progress syncs
- [ ] Battle state updates
- [ ] Inventory updates

### Location Features
- [ ] GPS permission requested
- [ ] Map loads user location
- [ ] Quest distance calculated
- [ ] Geofence validation works

### Firebase
- [ ] Firestore reads work
- [ ] Firestore writes work
- [ ] Cloud Functions callable
- [ ] Real-time listeners active

---

## Common Issues & Solutions

### Issue: "Cannot find module 'expo-constants'"

**Solution**:
```bash
pnpm add expo-constants@~17.0.0
```

### Issue: "Undefined is not an object (evaluating 'AsyncStorage.setItem')"

**Solution**:
```bash
pnpm add @react-native-async-storage/async-storage@^2.1.0
npx expo install
```

### Issue: "expo-router" module not found

**Solution**:
```bash
# Clear cache
rm -rf node_modules
rm -rf .expo
pnpm install
npx expo start -c
```

### Issue: iOS build fails with "Multiple commands produce"

**Solution**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo prebuild --clean
```

### Issue: Android build fails with Gradle error

**Solution**:
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

---

## Performance Improvements

SDK 54 includes several performance improvements:

### Faster Cold Starts
- React Native 0.76 has 20% faster cold start times
- AsyncStorage 2.x has improved I/O performance

### Better Memory Management
- Improved garbage collection in React Native
- Reduced memory footprint for Firestore listeners

### Optimized Builds
- Smaller bundle sizes with Metro bundler improvements
- Better tree-shaking for unused code

---

## New Features Available

### Expo Router 4.0

#### Search Params
```typescript
// Use search params in URLs
router.push('/quest/123?highlight=true');

// Access in component
const { id, highlight } = useLocalSearchParams<{ id: string; highlight: string }>();
```

#### Shared Routes
```typescript
// Create shared routes between stacks
<Stack.Screen
  name="quest/[id]"
  options={{
    presentation: 'modal',
    sheetGrabberVisible: true // New in SDK 54
  }}
/>
```

### React Native 0.76

#### Improved Hermes Engine
- Better JavaScript performance
- Smaller bundle sizes
- Faster startup time

#### Better TypeScript Support
- Improved type inference
- Better autocomplete in VSCode

---

## Deployment

### EAS Build

Update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### Build Commands

```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Rollback Plan

If you encounter critical issues:

### Revert to SDK 51

1. Restore package.json:
```bash
git checkout HEAD -- apps/mobile/package.json
```

2. Restore app.json:
```bash
git checkout HEAD -- apps/mobile/app.json
```

3. Reinstall:
```bash
cd apps/mobile
rm -rf node_modules
pnpm install
```

---

## Additional Resources

- [Expo SDK 54 Release Notes](https://blog.expo.dev/expo-sdk-54-is-now-available-6e73e3f14b86)
- [React Native 0.76 Changelog](https://reactnative.dev/blog/2024/12/18/release-0.76)
- [Expo Router 4.0 Docs](https://docs.expo.dev/router/introduction/)

---

## Support

If you encounter issues:

1. Check [TESTING.md](./TESTING.md) for test scenarios
2. Review Firebase logs: `firebase functions:log`
3. Check Expo dev tools: Press `m` in terminal
4. File an issue with reproduction steps

---

**Migration Status**: ✅ Complete
**Recommended**: Test thoroughly before deploying to production

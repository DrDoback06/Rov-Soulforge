# Web Compatibility Fixes

**Date**: October 19, 2025  
**Status**: ✅ Complete

---

## Problem

The app was crashing on web with:
```
Cannot read properties of undefined (reading '__expo_module_name__')
```

**Root Cause**: `expo-location` and `expo-haptics` are native modules that don't work properly on web. They were trying to access Expo module internals that don't exist in the browser.

---

## Solution: Platform-Specific Wrappers

Created web-compatible wrappers that use browser APIs:

### 1. Location Service (`lib/location.ts` + `lib/location.web.ts`)

**Native (iOS/Android)**: Uses `expo-location`
**Web**: Uses browser's `Geolocation API`

**Features**:
- ✅ `requestForegroundPermissionsAsync()` - Requests location permission
- ✅ `getCurrentPositionAsync()` - Gets current position
- ✅ `watchPositionAsync()` - Watches position changes
- ✅ Compatible `LocationObject` interface
- ✅ Accuracy levels

### 2. Haptics Service (`lib/haptics.ts` + `lib/haptics.web.ts`)

**Native (iOS/Android)**: Uses `expo-haptics`
**Web**: Uses browser's `Vibration API` (where available)

**Features**:
- ✅ `impactAsync()` - Haptic impact feedback
- ✅ `notificationAsync()` - Notification feedback
- ✅ `selectionAsync()` - Selection feedback
- ✅ Graceful degradation (no-op if unavailable)

---

## Files Modified

### Created:
1. `lib/location.ts` - Native location exports
2. `lib/location.web.ts` - Web location implementation
3. `lib/haptics.ts` - Native haptics exports
4. `lib/haptics.web.ts` - Web haptics implementation

### Updated (Import Changes):
1. `app/(tabs)/index.tsx` - Map screen
2. `app/quest/[id].tsx` - Quest detail screen
3. `app/shop/pack-opening.tsx` - Pack opening
4. `app/companion/index.tsx` - Companion screen
5. `components/DiceRoller.tsx` - Dice roller

**Changed from**:
```typescript
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
```

**Changed to**:
```typescript
import * as Location from '@/lib/location';
import * as Haptics from '@/lib/haptics';
```

---

## How It Works

Metro's platform-specific extensions automatically choose the right file:

- **Web**: Loads `*.web.ts` files
- **Native**: Loads `*.ts` files (which re-export from expo modules)

This pattern allows the same import statement to work across all platforms!

---

## Browser API Compatibility

### Geolocation API
- ✅ Chrome, Firefox, Edge, Safari
- ✅ Requires HTTPS (or localhost)
- ✅ User permission prompt

### Vibration API
- ✅ Chrome, Edge (Android)
- ⚠️ Limited support on iOS Safari
- ✅ Graceful degradation

---

## Testing

After applying these fixes:
1. ✅ App loads on web without `__expo_module_name__` error
2. ✅ Location permission requests work
3. ✅ Map shows user location
4. ✅ Haptic feedback works (where supported)
5. ✅ Native builds still work normally

---

## Additional Benefits

- **No conditional Platform.OS checks** needed in components
- **Type-safe** with matching interfaces
- **Automatic** platform selection by Metro bundler
- **Easy to extend** for other Expo modules

---

## Pattern for Future Modules

If other Expo native modules cause web issues, use the same pattern:

1. Create `lib/module-name.ts` (exports from expo module)
2. Create `lib/module-name.web.ts` (browser implementation)
3. Update imports to use `@/lib/module-name`

---

## Summary

**Problem**: Native Expo modules crashed on web  
**Solution**: Platform-specific wrappers using browser APIs  
**Result**: ✅ App now works on web, native, and everything in between!


# 🔧 Realm of Valor - Troubleshooting Guide

## Issue: App Doesn't Load / Black Screen

### Step 1: Check Console Output

When you run `pnpm start`, you should see console logs. Look for:

```
🔥 Firebase Config Check:
- API Key exists: true
- Project ID: realmofvalorapp
- App ID exists: true
✅ Firebase app initialized successfully
📱 App starting...
✅ App ready
```

If you see `❌` or errors, proceed to Step 2.

---

### Step 2: Verify .env File Exists

Check that this file exists:
```
f:\Soulforge 09-2025\rov\apps\mobile\.env
```

**If file is missing:**
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
# File should already be there, but if not, check .env.example
ls .env
```

---

### Step 3: Verify .env Content

Open `f:\Soulforge 09-2025\rov\apps\mobile\.env` and verify it contains:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAJkDwPMbIUeij-6hoHys_jFW0RKS4JTtE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=realmofvalorapp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=realmofvalorapp
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=realmofvalorapp.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=711522983056
EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID=1:711522983056:android:22313b3019915041094c15
EXPO_PUBLIC_FIREBASE_APP_ID_IOS=1:711522983056:ios:2114a74420c67263094c15
EXPO_PUBLIC_FIREBASE_APP_ID_WEB=1:711522983056:web:6689f594c40a1205094c15
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZHJkb2JhY2swNiIsImEiOiJjbWc2eXVpbGowZ3VrMmlzZHR5Y2tmbXQ1In0.PznVbW_JjKO2GbEk6xDUNA
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**All values should be present** (no undefined or empty values).

---

### Step 4: Clear Metro Cache

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"

# Clear Expo cache
expo start --clear

# Or manually:
rm -rf .expo
rm -rf node_modules/.cache
```

---

### Step 5: Reinstall Dependencies

```bash
cd "f:\Soulforge 09-2025\rov"

# Remove all node_modules
rm -rf node_modules
rm -rf apps/mobile/node_modules
rm -rf apps/backend/node_modules

# Reinstall
pnpm install
```

---

### Step 6: Check Package Versions

Verify these key versions in `apps/mobile/package.json`:

```json
{
  "expo": "~54.0.0",
  "expo-router": "~4.0.0",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "firebase": "^10.12.0"
}
```

If versions don't match, update:
```bash
cd apps/mobile
pnpm update
```

---

### Step 7: Check Firebase Auth is Enabled

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project "realmofvalorapp"
3. Go to Authentication → Sign-in method
4. Verify these are **ENABLED**:
   - ✅ Email/Password
   - ✅ Anonymous

If not enabled, enable them.

---

### Step 8: Test Backend Connection

Make sure backend is running:

```bash
cd "f:\Soulforge 09-2025\rov\apps\backend"
pnpm run dev
```

You should see:
```
🚀 Realm of Valor API running on http://localhost:3000
```

Test it:
```bash
curl http://localhost:3000
# Should return some response (not error)
```

---

### Step 9: Check React Native Setup

**Windows:**
```bash
# Check if Android SDK is installed
adb version

# If not installed, install Android Studio
# https://developer.android.com/studio
```

**macOS (iOS):**
```bash
# Check Xcode
xcode-select --install

# Check CocoaPods
pod --version
# If not installed: sudo gem install cocoapods
```

---

### Step 10: Run with More Verbose Output

```bash
cd apps/mobile

# Start with debug logs
EXPO_DEBUG=true expo start

# Watch the console for specific errors
```

---

## Common Errors & Solutions

### Error: "Firebase configuration missing"

**Cause:** .env file not loaded properly

**Solution:**
1. Check .env file exists in `apps/mobile/`
2. Restart Metro bundler: `expo start --clear`
3. Verify no trailing spaces in .env values

---

### Error: "auth/invalid-api-key"

**Cause:** Wrong Firebase API key

**Solution:**
1. Go to Firebase Console → Project Settings
2. Copy the Web API key
3. Update `EXPO_PUBLIC_FIREBASE_API_KEY` in .env
4. Restart app

---

### Error: "Cannot find module '@/lib/firebase-context'"

**Cause:** TypeScript path alias not resolved

**Solution:**
1. Check `apps/mobile/tsconfig.json` has:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. Restart TypeScript server in your editor

---

### Error: "Invariant Violation: Native module cannot be null"

**Cause:** Native dependencies not linked

**Solution:**
```bash
cd apps/mobile

# For Expo:
expo prebuild --clean

# Then run again:
expo start
```

---

### Error: Black screen, no errors

**Cause:** JavaScript error silently failing

**Solution:**
1. Open React Native Debugger
2. Press `j` in terminal to open debugger
3. Check console for errors
4. Look for unhandled promise rejections

---

## Debug Checklist

Run through this checklist:

- [ ] `.env` file exists in `apps/mobile/`
- [ ] All `EXPO_PUBLIC_*` variables are set
- [ ] Firebase Auth is enabled in console
- [ ] Metro bundler started successfully
- [ ] No red errors in terminal
- [ ] Backend is running on port 3000
- [ ] Node version is 18+ (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Android/iOS simulator is running
- [ ] Internet connection is active

---

## Still Not Working?

### Get Detailed Logs

**Terminal 1 - Mobile App:**
```bash
cd apps/mobile
expo start --clear 2>&1 | tee app-log.txt
```

**Terminal 2 - Backend:**
```bash
cd apps/backend
pnpm run dev 2>&1 | tee backend-log.txt
```

Run the app, reproduce the issue, then check:
- `app-log.txt` for mobile errors
- `backend-log.txt` for API errors

### Check These Log Messages

Look for these in console:

✅ **Good signs:**
```
🔥 Firebase Config Check:
- API Key exists: true
✅ Firebase app initialized successfully
📱 App starting...
✅ App ready
```

❌ **Bad signs:**
```
❌ Firebase configuration is incomplete!
Error: Firebase configuration missing
auth/invalid-api-key
Cannot find module
```

---

## Quick Reset (Nuclear Option)

If nothing else works:

```bash
cd "f:\Soulforge 09-2025\rov"

# 1. Delete everything
rm -rf node_modules
rm -rf apps/mobile/node_modules
rm -rf apps/mobile/.expo
rm -rf apps/backend/node_modules

# 2. Reinstall
pnpm install

# 3. Clear Expo cache
cd apps/mobile
expo start --clear
```

---

## Contact Points

If you're still stuck, provide these details:

1. **Error messages** from console
2. **Screenshot** of terminal output
3. **Node version**: `node --version`
4. **pnpm version**: `pnpm --version`
5. **Expo version**: `expo --version`
6. **Platform**: Windows/macOS/Linux
7. **Device**: iOS/Android/Web

---

## Next Steps After Fix

Once app loads:

1. ✅ You should see "Loading..." spinner
2. ✅ Then see login screen
3. ✅ Click "Create Account" or "Continue as Guest"
4. ✅ Create character (choose class)
5. ✅ See main map screen

If you reach the map screen, **the app is working!** 🎉

---

**Most common fix:** Restart Metro bundler with `expo start --clear`

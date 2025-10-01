# Realm of Valor - Action Plan to Get App Running

**User reported: "nothing actually loads when we start our app"**

Follow these steps **in order** to diagnose and fix the issue.

---

## Step 1: Run the Diagnostic Script

Open a terminal and run:

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node check-setup.js
```

**What to expect:**
- ✅ Green checkmarks = everything is configured correctly
- ❌ Red X marks = something is missing or misconfigured

**If you see any red X marks:**
- **Missing .env file**: Create it by copying the example below
- **Missing environment variables**: Add them to the .env file
- **Missing node_modules**: Run `pnpm install` from the mobile directory
- **Missing key files**: The files might have been deleted - let me know which ones

---

## Step 2: Verify .env File Exists and is Complete

Check that `f:\Soulforge 09-2025\rov\apps\mobile\.env` exists.

**Expected contents:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAJkDwPMbIUeij-6hoHys_jFW0RKS4JTtE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=realmofvalorapp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=realmofvalorapp
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=realmofvalorapp.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=711522983056
EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID=1:711522983056:android:22313b3019915041094c15
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZHJkb2JhY2swNiIsImEiOiJjbWc2eXVpbGowZ3VrMmlzZHR5Y2tmbXQ1In0.PznVbW_JjKO2GbEk6xDUNA
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**If file is missing**: Create it with the contents above.

---

## Step 3: Install Dependencies (if needed)

If check-setup.js reported missing node_modules:

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm install
```

Wait for installation to complete (may take 2-5 minutes).

---

## Step 4: Clear Metro Bundler Cache

Metro bundler caches environment variables and sometimes doesn't pick up changes:

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
npx expo start --clear
```

**What this does:**
- `--clear` flag deletes Metro bundler cache
- Forces Metro to re-read .env file
- Rebuilds JavaScript bundle from scratch

---

## Step 5: Watch the Console Output

After running `expo start --clear`, **carefully read the console output**.

### LOOK FOR THESE CRITICAL LOGS:

#### ✅ **SUCCESS - You should see:**
```
🔥 Firebase Config Check:
- API Key exists: true
- Project ID: realmofvalorapp
- App ID exists: true
✅ Firebase app initialized successfully
📱 App starting...
✅ App ready
```

#### ❌ **FAILURE - If you see:**
```
❌ Firebase configuration is incomplete!
Make sure .env file exists in apps/mobile/ with all EXPO_PUBLIC_FIREBASE_* variables
```
**Fix:** Your .env file is not being read. Jump to "Step 7: Environment Variable Issues"

#### ❌ **FAILURE - If you see:**
```
- API Key exists: false
- Project ID: undefined
```
**Fix:** Environment variables are undefined. Jump to "Step 7: Environment Variable Issues"

---

## Step 6: Try Loading the App

Once Metro bundler is running:

### Option A: iOS Simulator
Press `i` in the terminal

### Option B: Android Emulator
1. Start Android emulator first
2. Press `a` in the terminal

### Option C: Physical Device
Scan the QR code with Expo Go app

---

## Step 7: Environment Variable Issues (If logs show undefined values)

If Firebase config logs show `false` or `undefined`:

### 7.1 Verify .env file location
The file MUST be at: `rov/apps/mobile/.env` (NOT in root, NOT in rov/)

### 7.2 Stop Metro bundler
Press `Ctrl+C` to stop the dev server

### 7.3 Clear more caches
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
rm -rf .expo
rm -rf node_modules/.cache
```

### 7.4 Restart with cleared cache
```bash
npx expo start --clear
```

### 7.5 Check for .env syntax errors
Open `.env` file and ensure:
- No spaces around `=` signs
- No quotes around values
- No trailing spaces
- File saved in UTF-8 encoding

---

## Step 8: App Shows White/Black Screen

If app opens but shows blank screen:

### Check React Native error overlay
- Red error screen = JavaScript error (read the error message)
- Yellow warning screen = Non-fatal warning (app should still work)

### Check Metro bundler console
Look for error messages in the terminal where you ran `expo start`

### Check device logs

**iOS Simulator:**
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "Expo"'
```

**Android Emulator:**
```bash
adb logcat *:E
```

---

## Step 9: Common Specific Errors and Fixes

### Error: "Unable to resolve module 'firebase/app'"
**Fix:**
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm install firebase
```

### Error: "Unable to resolve module '@react-native-async-storage/async-storage'"
**Fix:**
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm install @react-native-async-storage/async-storage
```

### Error: "Unable to resolve module 'expo-router'"
**Fix:**
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm install expo-router
```

### Error: "Network request failed"
**Cause:** Backend API not running
**Fix:**
```bash
# Open a NEW terminal window
cd "f:\Soulforge 09-2025\rov\apps\backend"
pnpm install
pnpm dev
```

---

## Step 10: Still Not Working? Collect Debug Info

If none of the above worked, collect this information:

### 10.1 Check-setup results
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node check-setup.js > debug-output.txt
```

### 10.2 Metro bundler output
Copy the entire output from `expo start --clear`

### 10.3 Package versions
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
npx expo-doctor
```

### 10.4 Node and pnpm versions
```bash
node --version
pnpm --version
```

---

## Quick Reference: Error → Solution

| What You See | What To Do |
|-------------|-----------|
| ❌ .env file NOT FOUND | Create `rov/apps/mobile/.env` with Firebase credentials |
| ❌ node_modules NOT FOUND | Run `pnpm install` in mobile directory |
| API Key exists: false | Stop Metro, clear cache, restart with `--clear` |
| Firebase initialization error | Check .env file has correct Firebase credentials |
| White/blank screen | Check Metro console for JavaScript errors |
| "Unable to resolve module" | Install the missing package with `pnpm install <package>` |
| Network request failed | Start backend API: `cd rov/apps/backend && pnpm dev` |

---

## Expected Working State

When everything is working correctly, you should see:

1. **In Metro console:**
   - Firebase config logs showing valid values
   - "Firebase app initialized successfully"
   - "App ready"
   - No red error messages

2. **On device/simulator:**
   - Splash screen with "⚔️ Realm of Valor"
   - Loading spinner
   - Then either:
     - Login screen (if not logged in)
     - Character creation (if logged in but no character)
     - Main app tabs (if logged in with character)

---

## What to Report Back

After following these steps, let me know:

1. **Which step failed?** (Step 1, 2, 3, etc.)
2. **What error messages did you see?** (copy/paste from console)
3. **What did check-setup.js report?** (all green or any red?)
4. **What do you see on the device/simulator?** (blank, error, specific screen)

This will help me pinpoint the exact issue and provide a targeted fix.

---

**Start with Step 1 now! 👇**
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node check-setup.js
```

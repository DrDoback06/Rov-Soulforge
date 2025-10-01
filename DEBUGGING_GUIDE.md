# Debugging Guide - App Loading Issues

This guide explains how to diagnose why the app might show a blank screen.

---

## Enhanced Debug Logging Added

I've added extensive console logging throughout the app initialization flow. When you run the app, you should see these logs **in order**:

### 1. Firebase Initialization (from `lib/firebase.ts`)
```
🔥 Firebase Config Check:
- API Key exists: true
- Project ID: realmofvalorapp
- App ID exists: true
✅ Firebase app initialized successfully
```

**If you don't see this:** Firebase configuration is failing. Check that .env file is being read.

### 2. Root Layout Starting (from `app/_layout.tsx`)
```
📱 App starting...
```

**If you don't see this:** React Native isn't rendering at all. Check Metro bundler for JavaScript errors.

### 3. Firebase Provider Setup (from `lib/firebase-context.tsx`)
```
🔐 Firebase Provider - Setting up auth listener...
🔐 Auth state changed:
  - User: null
  - Loading set to false
```

**If you don't see this:** FirebaseProvider isn't mounting. Check that it's included in `_layout.tsx`.

### 4. Root Layout Ready (from `app/_layout.tsx`)
```
✅ App ready
```

**If you don't see this:** App is stuck in loading state. Check that the 500ms timer is completing.

### 5. Index Screen Routing Logic (from `app/index.tsx`)
```
🔍 Index Screen - Routing Logic:
  - authLoading: false
  - characterLoading: false
  - user exists: false
  - character exists: false
  → Navigating to /auth/login (no user)
```

**If you don't see this:** Index screen isn't rendering. Check expo-router configuration.

---

## Log Sequence for Different States

### Fresh Install (No User)
```
🔥 Firebase Config Check: [success logs]
✅ Firebase app initialized successfully
📱 App starting...
🔐 Firebase Provider - Setting up auth listener...
🔐 Auth state changed: User: null
✅ App ready
🔍 Index Screen - Routing Logic:
  - authLoading: false
  - characterLoading: false
  - user exists: false
  - character exists: false
  → Navigating to /auth/login (no user)
```
**Expected:** Login screen should appear

### Logged In, No Character
```
[Firebase and app initialization logs...]
🔐 Auth state changed:
  - User: abc123 (user@example.com)
🔍 Index Screen - Routing Logic:
  - authLoading: false
  - characterLoading: false
  - user exists: true
  - character exists: false
  → Navigating to /character/create (user but no character)
```
**Expected:** Character creation screen should appear

### Logged In With Character
```
[Firebase and app initialization logs...]
🔐 Auth state changed:
  - User: abc123 (user@example.com)
🔍 Index Screen - Routing Logic:
  - authLoading: false
  - characterLoading: false
  - user exists: true
  - character exists: true
  → Navigating to /(tabs) (user with character)
```
**Expected:** Main app tabs should appear

---

## Common Issues and What Logs You'll See

### Issue 1: Metro Cache Preventing .env from Loading

**Symptoms:**
```
🔥 Firebase Config Check:
- API Key exists: false
- Project ID: undefined
❌ Firebase configuration is incomplete!
```

**Solution:**
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

---

### Issue 2: App Stuck at "Loading..." Spinner

**Logs show:**
```
📱 App starting...
[Nothing else appears]
```

**Cause:** _layout.tsx loading timer not completing

**Solution:** Check if there's a JavaScript error preventing the timer from running. Look for red error overlay on device/simulator.

---

### Issue 3: Firebase Auth Listener Never Fires

**Logs show:**
```
🔥 Firebase Config Check: [success]
🔐 Firebase Provider - Setting up auth listener...
[Auth state changed never appears]
```

**Cause:** Firebase SDK might not be properly initialized or network issue

**Solution:**
1. Check internet connection
2. Check that firebase package is installed: `pnpm install firebase`
3. Try restarting Metro bundler

---

### Issue 4: Index Screen Routing Loop

**Logs show:**
```
🔍 Index Screen - Routing Logic:
  - authLoading: true
  - characterLoading: true
  ⏳ Still loading, waiting...
[Repeats forever]
```

**Cause:** Auth or character loading never completes

**Solution:** Check Firebase auth listener is working. Try signing out and back in.

---

### Issue 5: Route Navigation Not Working

**Logs show:**
```
🔍 Index Screen - Routing Logic:
  → Navigating to /auth/login (no user)
[Screen stays blank, login screen doesn't appear]
```

**Cause:** Expo Router file routing issue

**Solution:**
1. Verify `app/auth/login.tsx` exists
2. Check expo-router is installed: `pnpm install expo-router`
3. Restart Metro bundler

---

## How to Capture Debug Output

### Method 1: Metro Console (Easiest)
Just look at the terminal where you ran `pnpm start`. All console.log statements appear there.

### Method 2: React Native Debugger
1. Install React Native Debugger: https://github.com/jhen0409/react-native-debugger
2. Open it before starting app
3. In Expo app, shake device and select "Debug Remote JS"

### Method 3: Device/Simulator Logs

**iOS Simulator:**
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "Expo"' --level debug
```

**Android Emulator:**
```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

---

## Complete Debug Checklist

Run through this checklist when debugging:

- [ ] **Step 1:** Run `node check-setup.js` - all green?
- [ ] **Step 2:** Start with clear cache: `pnpm start --clear`
- [ ] **Step 3:** Watch Metro console for errors (red text)
- [ ] **Step 4:** Look for Firebase config logs - do you see "🔥 Firebase Config Check"?
- [ ] **Step 5:** Check if config values are true or false/undefined
- [ ] **Step 6:** Look for "📱 App starting..." log
- [ ] **Step 7:** Look for "🔐 Firebase Provider" logs
- [ ] **Step 8:** Look for "✅ App ready" log
- [ ] **Step 9:** Look for "🔍 Index Screen" logs
- [ ] **Step 10:** Check what route it's trying to navigate to

---

## What to Report

If you've followed all steps and it's still not working, provide:

1. **Full Metro console output** (from `pnpm start --clear` to when issue occurs)
2. **Which logs DO appear** (e.g., "I see Firebase config logs but not app starting")
3. **Which logs DON'T appear** (e.g., "Never see Index Screen routing logic")
4. **What you see on screen** (blank white, blank black, error overlay, splash screen frozen)
5. **Check-setup.js results** (copy/paste the output)

---

## Quick Test Commands

### Test 1: Verify Environment
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node check-setup.js
```

### Test 2: Start with Maximum Logging
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
npx expo start --clear
```

### Test 3: Check if Firebase Can Connect
Create a test file to verify Firebase outside of app:
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node -e "const app = require('firebase/app'); console.log('Firebase SDK loaded:', !!app);"
```

---

## Expected Timeline

From app start to login screen should take **2-5 seconds**:

- **0s:** Metro bundler loads JavaScript bundle
- **0.5s:** Firebase initializes
- **1s:** FirebaseProvider sets up auth listener
- **1.5s:** Auth state determined (logged in or not)
- **2s:** Index screen decides routing
- **2.5s:** Target screen (login/character/tabs) appears

**If it takes longer than 10 seconds**, something is stuck. Check the logs to see which step hasn't completed.

---

## Advanced: Enable Firebase Debug Mode

If Firebase seems to be the issue, enable Firebase debug logging:

Add to `lib/firebase.ts` after imports:
```typescript
import { setLogLevel } from 'firebase/app';
setLogLevel('debug');
```

This will output detailed Firebase SDK logs.

---

## Still Stuck?

Report back with:
1. Output from `node check-setup.js`
2. Full Metro console output (first 100 lines)
3. Screenshot of what's on screen
4. List of which debug logs you DO see vs DON'T see

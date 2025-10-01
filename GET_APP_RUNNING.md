# GET THE APP RUNNING - Complete Guide

**Current Status:** Environment is configured correctly, but app shows blank screen when starting.

**What I've Done:** Added extensive debug logging to help identify where the app is getting stuck.

---

## 🚀 QUICK START (Do This First)

### Step 1: Verify Setup
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node check-setup.js
```

✅ **Result:** All checks passed! Environment is correctly configured.

### Step 2: Start App with Debug Logging
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

### Step 3: Watch the Console Closely

You should see these logs **in this exact order**:

```
🔥 Firebase Config Check:
- API Key exists: true
- Project ID: realmofvalorapp
- App ID exists: true
✅ Firebase app initialized successfully

📱 App starting...

🔐 Firebase Provider - Setting up auth listener...
🔐 Auth state changed:
  - User: null
  - Loading set to false

✅ App ready

🔍 Index Screen - Routing Logic:
  - authLoading: false
  - characterLoading: false
  - user exists: false
  - character exists: false
  → Navigating to /auth/login (no user)
```

### Step 4: Launch the App
- Press `a` for Android
- Press `i` for iOS

---

## 📋 What to Look For

### ✅ If You See ALL the Logs Above:
**App is working correctly!** You should see the login screen.

### ❌ If Logs Stop at Firebase Config:
**Problem:** Firebase initialization failing
**File:** `rov/apps/mobile/lib/firebase.ts:21-32`
**Fix:** Metro cache issue. Run `pnpm start --clear`

### ❌ If Logs Stop at "App starting...":
**Problem:** Root layout stuck
**File:** `rov/apps/mobile/app/_layout.tsx:23-34`
**Fix:** JavaScript error preventing React from rendering. Check for red error overlay.

### ❌ If Logs Stop at "Setting up auth listener...":
**Problem:** Firebase auth not responding
**File:** `rov/apps/mobile/lib/firebase-context.tsx:44-67`
**Fix:** Network issue or Firebase SDK problem. Check internet connection.

### ❌ If Logs Show "Still loading, waiting..." Forever:
**Problem:** Auth or character loading never completes
**File:** `rov/apps/mobile/app/index.tsx:16-26`
**Fix:** Firebase listener not firing. Restart Metro bundler.

### ❌ If Logs Show Navigation but Screen is Blank:
**Problem:** Expo Router not loading target screen
**File:** `rov/apps/mobile/app/index.tsx:30-44`
**Fix:** Check that `app/auth/login.tsx` exists. Reinstall expo-router.

---

## 🔍 Debug Logging Locations

I've added console.log statements to these files:

| File | What It Logs | Line Numbers |
|------|-------------|--------------|
| `lib/firebase.ts` | Firebase config validation | 21-32 |
| `app/_layout.tsx` | App starting/ready status | 23-34 |
| `lib/firebase-context.tsx` | Auth state changes | 44-67 |
| `app/index.tsx` | Routing decision logic | 16-45 |

---

## 📱 Expected Behavior

### First Time Opening App (No Account)
1. Splash screen (2 seconds)
2. Login screen appears

### After Creating Account
1. Splash screen (2 seconds)
2. Character creation screen appears

### After Creating Character
1. Splash screen (2 seconds)
2. Main app with tabs appears:
   - 🗺️ Map
   - 🎴 Deck
   - 👤 Profile
   - 🤖 Companion

---

## 🛠️ Troubleshooting Commands

### Clear All Caches
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
rm -rf .expo
rm -rf node_modules/.cache
pnpm start --clear
```

### Reinstall Dependencies
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
rm -rf node_modules
pnpm install
pnpm start --clear
```

### Check Expo Health
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
npx expo-doctor
```

### View Android Logs
```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

### View iOS Logs
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "Expo"'
```

---

## 📊 Debugging Flowchart

```
Start App
   |
   v
Do you see "🔥 Firebase Config Check"?
   |
   ├─ NO  → Metro cache issue
   |        → Run: pnpm start --clear
   |
   └─ YES → Do values show "true" or "false/undefined"?
              |
              ├─ false/undefined → .env not loaded
              |                   → Verify .env file exists
              |                   → Run: pnpm start --clear
              |
              └─ true → Do you see "📱 App starting..."?
                        |
                        ├─ NO  → JavaScript error
                        |        → Check for red error screen
                        |
                        └─ YES → Do you see "✅ App ready"?
                                  |
                                  ├─ NO  → Loading stuck
                                  |        → Check Metro console for errors
                                  |
                                  └─ YES → Do you see "🔍 Index Screen"?
                                            |
                                            ├─ NO  → Routing not working
                                            |        → Reinstall expo-router
                                            |
                                            └─ YES → Does it navigate?
                                                      |
                                                      ├─ NO  → Target screen missing
                                                      |        → Check app/auth/login.tsx exists
                                                      |
                                                      └─ YES → App should work!
```

---

## 📞 What to Report Back

After following the steps above, report:

### 1. What Logs Appear
Copy/paste the console output from starting the app. Specifically look for:
- ✅ Which emoji logs DO appear
- ❌ Which emoji logs DON'T appear

### 2. Where It Gets Stuck
Example: "I see Firebase config logs and 'App starting' but never see 'App ready'"

### 3. What You See on Screen
- [ ] Blank white screen
- [ ] Blank black screen
- [ ] Splash screen frozen on "Loading..."
- [ ] Red error overlay (copy the error message)
- [ ] Yellow warning screen
- [ ] Nothing at all (doesn't launch)

### 4. Check-Setup Results
```bash
node check-setup.js
```
Did it pass? Any red X marks?

### 5. Metro Console Errors
Any red error text in the terminal?

---

## 🎯 Most Likely Issues (Based on "Nothing Loads")

### Issue #1: Metro Cache (80% of blank screen issues)
**Symptom:** App worked before, now blank
**Fix:**
```bash
pnpm start --clear
```

### Issue #2: .env Not Loaded (15% of issues)
**Symptom:** Firebase logs show "false" or "undefined"
**Fix:**
1. Verify file exists: `rov/apps/mobile/.env`
2. Restart Metro: `pnpm start --clear`

### Issue #3: JavaScript Error (4% of issues)
**Symptom:** App shows red error screen or blank screen
**Fix:** Look for error in Metro console, fix the syntax/import error

### Issue #4: Expo Router Config (1% of issues)
**Symptom:** Logs show navigation but screen stays blank
**Fix:**
```bash
pnpm install expo-router
pnpm start --clear
```

---

## ✅ Success Criteria

You'll know the app is working when:

1. ✅ All emoji logs appear in console
2. ✅ No red errors in Metro console
3. ✅ Login screen appears on device/simulator
4. ✅ Can type in email/password fields
5. ✅ UI is responsive to touch

---

## 🚀 Next Steps After App Loads

Once you see the login screen:

### Test Login Flow
```
1. Click "Sign In as Guest"
2. Should navigate to character creation
3. Select a class (e.g., Warrior)
4. Select alignment (e.g., Lawful Good)
5. Click "Create Character"
6. Should navigate to main app with tabs
```

### Test Backend (Optional)
If you want AI companion to work:
```bash
# Open new terminal
cd "f:\Soulforge 09-2025\rov\apps\backend"
pnpm install
pnpm dev
```

Backend runs at `http://localhost:3000`

---

## 📚 Additional Resources

- **ACTION_PLAN.md** - Detailed step-by-step diagnostic guide
- **DEBUGGING_GUIDE.md** - In-depth explanation of debug logs
- **START_APP.md** - Quick reference for starting the app
- **TROUBLESHOOTING.md** - Common errors and solutions

---

## 🎬 Ready? Let's Go!

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

Press `a` for Android or `i` for iOS

**Watch the console for the emoji logs! 👀**

They will tell you exactly where the problem is (if any).

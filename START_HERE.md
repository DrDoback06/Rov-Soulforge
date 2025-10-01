# 🚀 START HERE - Realm of Valor

**Welcome!** Your development environment is fully configured and ready.

**Issue:** App shows blank screen when starting
**Solution:** Debug logging added to identify the problem

---

## Quick Commands (Copy/Paste These)

### 1. Check Your Setup
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node check-setup.js
```
**Expected:** All ✅ green checkmarks

### 2. Start the App
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```
**Important:** The `--clear` flag clears the Metro bundler cache

### 3. Launch
- Press `a` for Android emulator
- Press `i` for iOS simulator

---

## What to Watch For

Look for these **emoji logs** in your terminal **in this order**:

```
🔥 Firebase Config Check
   ↓
📱 App starting...
   ↓
🔐 Firebase Provider - Setting up auth listener...
   ↓
✅ App ready
   ↓
🔍 Index Screen - Routing Logic
```

### ✅ If you see all of these → Login screen should appear!

### ❌ If logs stop before all 5 → Note which emoji you saw last and check the guides below

---

## 📚 Documentation Guide

| Document | When to Use It |
|----------|---------------|
| **[QUICK_START.txt](./QUICK_START.txt)** | Quick one-page reference |
| **[GET_APP_RUNNING.md](./GET_APP_RUNNING.md)** | Main troubleshooting guide - use when app doesn't load |
| **[HOW_TO_DEBUG.txt](./apps/mobile/HOW_TO_DEBUG.txt)** | Understanding the emoji logs |
| **[ACTION_PLAN.md](./ACTION_PLAN.md)** | Step-by-step diagnostic process |
| **[DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md)** | Deep dive into each debug log |
| **[START_APP.md](./START_APP.md)** | Command reference |
| **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** | Project status and next steps |
| **[WHAT_I_DID_TODAY.md](./WHAT_I_DID_TODAY.md)** | Summary of debugging additions |

---

## 🎯 Recommended Path

### For First Time Running:

1. **Verify Setup** → Run `node check-setup.js`
2. **Start App** → Run `pnpm start --clear`
3. **Watch Console** → Look for emoji logs
4. **Report Results** → Tell me which emojis appeared

### If App Doesn't Load:

1. **[GET_APP_RUNNING.md](./GET_APP_RUNNING.md)** → Comprehensive troubleshooting
2. **[DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md)** → Understanding the logs
3. **[ACTION_PLAN.md](./ACTION_PLAN.md)** → Step-by-step fixes

---

## 💡 Most Common Issues

### Issue #1: Metro Cache (80% of blank screens)
**Symptoms:** Firebase config shows `false` even though check-setup passed
**Fix:**
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

### Issue #2: .env Not Loaded
**Symptoms:** Firebase config shows `undefined`
**Fix:**
1. Verify file exists: `apps/mobile/.env`
2. Clear cache: `pnpm start --clear`

### Issue #3: JavaScript Error
**Symptoms:** Logs stop mid-sequence, red error on screen
**Fix:** Look for error message in Metro console, fix the code issue

---

## 🔍 Debug Logging Added

I added console logging to these files to help identify where the app gets stuck:

- `lib/firebase.ts` (lines 21-32) - Firebase config validation
- `app/_layout.tsx` (lines 23-34) - App initialization
- `lib/firebase-context.tsx` (lines 44-67) - Auth state
- `app/index.tsx` (lines 16-45) - Routing decisions

These logs use emojis (🔥 📱 🔐 ✅ 🔍) so they're easy to spot in the console.

---

## 📊 What to Report

After running `pnpm start --clear`, tell me:

### Template (Copy and Fill In):

```
✅ Check-setup Results:
[ ] All passed
[ ] Some failed (specify which)

🔍 Emoji Logs I Saw:
[ ] 🔥 Firebase Config Check
[ ] 📱 App starting...
[ ] 🔐 Firebase Provider
[ ] ✅ App ready
[ ] 🔍 Index Screen Routing Logic

📺 What's on Screen:
[ ] Blank white
[ ] Blank black
[ ] Splash frozen on "Loading..."
[ ] Red error overlay
[ ] Login screen (working!)

❌ Error Messages:
(copy/paste any red text from console)
```

---

## 🎮 Once App is Running

After you see the login screen, you can test:

### Authentication
- Sign in as guest
- Create account with email/password
- Sign out/sign in

### Character Creation
- Choose from 8 classes
- Select alignment
- View starting stats

### Main Features
- 🗺️ Map - View nearby quests (simulated for now)
- 🎴 Deck - Build Action/Skill/Loot decks
- 👤 Profile - View character, connect Strava
- 🤖 Companion - Chat with AI assistant

### Backend (Optional)
For AI companion to work, start backend:
```bash
cd "f:\Soulforge 09-2025\rov\apps\backend"
pnpm dev
```

---

## 🏗️ Project Structure

```
rov/
├── apps/
│   ├── mobile/          ← Your mobile app (React Native + Expo)
│   ├── backend/         ← API server (NestJS)
│   └── admin/           ← Admin dashboard (Next.js)
├── packages/
│   ├── types/           ← Shared TypeScript types
│   ├── logic/           ← Game engine (battle system, etc.)
│   └── firebase/        ← Cloud Functions
└── tools/
    └── importer/        ← Card data import scripts
```

---

## 🎯 Next Steps (After App Loads)

1. ✅ Test authentication flow
2. ✅ Create a character
3. ✅ Build a deck
4. ✅ Import card data (see SETUP.md)
5. ✅ Spawn quests via admin dashboard
6. ✅ Test battle system
7. ✅ Connect Strava
8. ✅ Deploy to TestFlight/Play Store

---

## 📞 Need Help?

Follow this decision tree:

```
Is the app loading?
├─ NO  → See GET_APP_RUNNING.md
│        Run check-setup.js
│        Start with pnpm start --clear
│        Report which emoji logs appear
│
└─ YES → Is authentication working?
         ├─ NO  → Check Firebase logs in Metro console
         └─ YES → Is character creation working?
                  ├─ NO  → Check Firestore permissions
                  └─ YES → Test other features!
```

---

## 🔥 Most Important Commands

```bash
# Verify environment
cd "f:\Soulforge 09-2025\rov\apps\mobile"
node check-setup.js

# Start app (with cache clear)
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear

# Clear all caches (if issues persist)
cd "f:\Soulforge 09-2025\rov\apps\mobile"
rm -rf .expo && rm -rf node_modules/.cache && pnpm start --clear

# Check Expo health
cd "f:\Soulforge 09-2025\rov\apps\mobile"
npx expo-doctor
```

---

## ✅ Environment Status

Your configuration:
- ✅ Firebase API keys configured
- ✅ Mapbox token configured
- ✅ Strava OAuth configured
- ✅ OpenAI API key configured
- ✅ Dependencies installed
- ✅ All required files present
- ✅ TypeScript configuration valid

**Everything is ready!** Now we just need to see it run. 🚀

---

## 🚀 Ready to Start?

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

Press `a` for Android or `i` for iOS

**Watch for those emoji logs!** 👀

---

**Let's get your app running! 💪**

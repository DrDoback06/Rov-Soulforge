# 🚨 CRITICAL: Setup Required to Run the App

## Issue Identified
The app won't run because the `.env` files are missing. This is the **#1 blocker** preventing the app from starting.

---

## Quick Fix (Do This Now)

### Step 1: Create Mobile App .env File

Open PowerShell and run:

```powershell
cd "f:\Soulforge 09-2025\rov\apps\mobile"
Copy-Item .env.example .env
```

**Or manually create** `rov/apps/mobile/.env` with this content:

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
EXPO_PUBLIC_STRAVA_CLIENT_ID=
EXPO_PUBLIC_STRAVA_CLIENT_SECRET=
```

### Step 2: Create Backend .env File (Optional for now)

```powershell
cd "f:\Soulforge 09-2025\rov\apps\backend"
Copy-Item .env.example .env
```

Or create `rov/apps/backend/.env`:

```env
FIREBASE_PROJECT_ID=realmofvalorapp
GOOGLE_APPLICATION_CREDENTIALS=../../packages/firebase/service-account.json
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/strava/callback
OPENAI_API_KEY=
PORT=3000
NODE_ENV=development
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZHJkb2JhY2swNiIsImEiOiJjbWc2eXVpbGowZ3VrMmlzZHR5Y2tmbXQ1In0.PznVbW_JjKO2GbEk6xDUNA
```

### Step 3: Start the App

```powershell
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

Then press `w` for web or `a` for Android emulator.

---

## Other Critical Issues Found

### 🔴 Priority 1 - Blocking Issues

1. **Missing .env files** ← YOU ARE HERE
   - Mobile app `.env` missing
   - Backend `.env` missing
   - **Status**: Templates created, user must copy them

2. **Firestore Security Rules Too Permissive**
   - Location: `rov/packages/firebase/firestore.rules`
   - Issue: Temporary write permissions on `cards` collection
   - **Fix needed**: Remove test permissions before production

### 🟡 Priority 2 - Functional Issues

3. **Dual Battle Pathways**
   - Battle logic exists in both NestJS backend AND client/Firestore functions
   - **Risk**: Race conditions, inconsistent state
   - **Fix needed**: Choose one authoritative source (recommend Firebase Functions)

4. **IAP Verification Stubbed**
   - Functions: `verifyIAPPurchase` in `packages/firebase/functions/src/shop.ts`
   - **Risk**: Fraud - anyone can claim purchases without paying
   - **Fix needed**: Implement Apple/Google/Stripe server-side validation

5. **Leaderboard Uses Mock Data**
   - Location: `app/(tabs)/leaderboard.tsx`
   - **Fix needed**: Create Firebase callable function to aggregate real data

6. **Route Display Not Implemented**
   - Quest navigation shows ETA but no route polyline on map
   - **Fix needed**: Add Mapbox directions API call and render polyline

### 🟢 Priority 3 - Missing Features

7. **Rules Tab Missing**
   - No searchable rulebook/card glossary UI
   - Content exists in importer outputs
   - **Fix needed**: Create new tab with search functionality

8. **Presence/Trading Not Implemented**
   - Social features stubbed in types but no UI/backend
   - **Fix needed**: Implement NestJS endpoints and mobile UI

9. **Spectate/Replays Not Implemented**
   - Battle log exists but no replay viewer
   - **Fix needed**: Create replay storage and playback UI

---

## Testing Checklist (After .env Setup)

- [ ] App starts without Firebase errors
- [ ] Can create guest account
- [ ] Can create character
- [ ] Map tab loads with location permission
- [ ] Can see quest markers on map
- [ ] Can accept quest
- [ ] Profile tab shows character stats
- [ ] Deck tab loads card collection

---

## Known Working Features

✅ Authentication (Email/Password, Anonymous)  
✅ Character creation (8 classes, 4 alignments)  
✅ Map with quest markers  
✅ Quest list and filtering  
✅ Quest acceptance and tracking  
✅ Battle UI (deck, hand, stack panel)  
✅ Deck builder  
✅ Inventory management  
✅ Stash storage  
✅ AI Companion chat (requires backend + OpenAI key)  
✅ Strava connection UI (requires credentials)  
✅ Card importer tool  
✅ Admin dashboard for quest spawning  

---

## Next Steps After Getting App Running

1. **Test end-to-end quest flow**
   - Accept quest → Navigate → Complete → Receive rewards

2. **Test battle system**
   - Needs 2 players or AI opponent implementation

3. **Secure Firestore rules**
   - Remove temporary write access
   - Add admin role checks

4. **Consolidate battle system**
   - Choose Firebase Functions as source of truth
   - Remove duplicate logic from NestJS

5. **Implement IAP verification**
   - Apple receipt validation
   - Google Play receipt validation
   - Stripe webhook handlers

6. **Add missing UI features**
   - Rules tab
   - Route polylines
   - Real leaderboards

---

## Questions for You

1. **Do you have Strava credentials?** (Optional for fitness tracking)
   - Client ID and Secret from Strava API dashboard

2. **Do you have OpenAI API key?** (Optional for AI companion)
   - Get from https://platform.openai.com/api-keys

3. **Which battle system do you prefer?**
   - Option A: Firebase Functions (realtime, better for mobile)
   - Option B: NestJS backend (more control, easier to debug)

4. **Are you planning to monetize with IAP?**
   - If yes, we need to implement receipt validation ASAP
   - If no, we can disable shop purchases temporarily

---

## Get Help

If app still doesn't start after creating .env files:

1. Check console output and paste here
2. Look for red error messages
3. Try: `pnpm install` then `pnpm start --clear`
4. Check that Firebase project `realmofvalorapp` is active in console

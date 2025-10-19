# Current Issues - Realm of Valor

**Last Updated:** October 9, 2025

---

## 🚨 Critical Issues (Blocking Core Gameplay)

### 0. Firebase Project Not Configured
**Status:** 🚨 CRITICAL  
**Description:** Firebase project is not configured, Cloud Functions cannot be deployed  
**Files:** Missing `.firebaserc` file  
**Impact:** Battle system, shop, and other Cloud Functions will not work  
**Action Required:** Configure Firebase project and deploy functions

### 1. Shop White Screen
**Status:** ✅ FIXED  
**Description:** Shop screen loads with white screen, requires refresh to work  
**Files:** `rov/apps/mobile/app/shop/index.tsx`  
**Root Cause:** Character loading state not properly handled  
**Impact:** Users cannot purchase cards/packs  
**Fix Applied:** Added proper loading states and error handling

### 2. Battle System Not Functional
**Status:** ✅ FIXED  
**Description:** Battle UI exists but no actual battle logic implemented  
**Files:** `rov/apps/mobile/app/battle/[id].tsx`, `rov/apps/mobile/hooks/useBattle.ts`  
**Impact:** Core gameplay loop broken - no combat possible  
**Fix Applied:** Implemented complete battle system with Cloud Functions, LIFO stack resolution, and AI opponents

### 3. Inventory/Stash Drag-Drop Incomplete
**Status:** ✅ FIXED  
**Description:** Cards can be dragged but don't persist moves to Firestore  
**Files:** `rov/apps/mobile/app/(tabs)/inventory.tsx`, `rov/apps/mobile/app/(tabs)/stash.tsx`  
**Impact:** Card management broken  
**Fix Applied:** Implemented complete drag-drop with Firestore persistence  

---

## 🟡 Medium Priority Issues

### 4. Cards Not Integrated with Game
**Status:** ✅ FIXED  
**Description:** Cards are display-only, no stat bonuses, no upgrades, no battle usage  
**Files:** All card-related files  
**Impact:** Cards are just pretty UI, no gameplay value  
**Fix Applied:** Implemented card stats integration, upgrade system, and battle usage

### 5. Strava Integration Missing
**Status:** ✅ FIXED  
**Description:** Previous Strava implementation was deleted by mistake  
**Files:** Need to recreate `lib/strava-auth.ts`, `hooks/useFitnessTracker.ts`  
**Impact:** No fitness tracking rewards  
**Fix Applied:** Restored StravaConnection component and useFitnessTracker hook

### 6. Shop Not Using StandardCard
**Status:** ✅ FIXED  
**Description:** Shop uses old card display, not the beautiful StandardCard component  
**Files:** `rov/apps/mobile/app/shop/index.tsx`  
**Impact:** Inconsistent UI  
**Fix Applied:** Updated shop to use StandardCard component and new GameCard schema  

---

## 🟢 Low Priority Issues

### 7. Quest Cards Not Implemented
**Status:** ✅ FIXED  
**Description:** No way to place quest cards on map  
**Files:** Need to create quest card system  
**Impact:** Missing feature, not blocking  
**Fix Applied:** Implemented QuestCardPlacement component and quest card acquisition in shop  

### 8. No Trading System
**Status:** Low  
**Description:** Players cannot trade cards  
**Files:** Need to create trading system  
**Impact:** Missing social feature  

### 9. No Rules Tab
**Status:** Low  
**Description:** No in-app card lookup or rulebook  
**Files:** Need to create rules tab  
**Impact:** Missing convenience feature  

---

## 🔧 Technical Debt

### 10. Multiple Battle Implementations
**Description:** Three different battle systems exist (NestJS, Firebase Functions, Client Utils)  
**Files:** `rov/apps/backend/src/battles/`, `rov/packages/firebase/functions/src/battle.ts`, `rov/apps/mobile/utils/battleEngine.ts`  
**Impact:** Confusion, potential race conditions  

### 11. IAP Receipt Verification Stubbed
**Description:** Shop always returns true for purchases  
**Files:** `rov/packages/firebase/functions/src/shop.ts`  
**Impact:** Security risk, revenue loss  

### 12. Leaderboards Using Mock Data
**Description:** Leaderboard shows hardcoded data  
**Files:** `rov/apps/mobile/app/(tabs)/leaderboard.tsx`  
**Impact:** Not functional  

---

## 📋 Fix Priority Order

1. **Fix Shop White Screen** - Blocking purchases
2. **Complete Inventory/Stash Drag-Drop** - Core card management
3. **Build Battle System** - Core gameplay loop
4. **Integrate Cards with Game** - Make cards functional
5. **Re-implement Strava** - Fitness rewards
6. **Add Quest Cards** - New feature
7. **Create Trading System** - Social feature
8. **Add Rules Tab** - Convenience feature

---

## 🧪 Testing Checklist

### Core Functionality
- [ ] Shop loads without white screen
- [ ] Cards can be moved between inventory and stash
- [ ] Cards affect hero stats when equipped
- [ ] Cards can be upgraded
- [ ] Battle system works (PvP and PvE)
- [ ] Quest cards can be placed on map
- [ ] Strava integration works

### Edge Cases
- [ ] What happens when inventory is full?
- [ ] What happens when stash is full?
- [ ] What happens when battle disconnects?
- [ ] What happens when quest card expires?
- [ ] What happens when Strava token expires?

---

## 📞 Reporting New Issues

When reporting new issues, please include:
1. **What you were doing** (step-by-step)
2. **What happened** (actual behavior)
3. **What you expected** (expected behavior)
4. **Console errors** (if any)
5. **Device/platform** (iOS/Android/Web)
6. **Screenshots** (if applicable)

---

**Note:** This file should be updated as issues are fixed and new issues are discovered.

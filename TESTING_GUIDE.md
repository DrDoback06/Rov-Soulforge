# 🧪 Realm of Valor - Complete Testing Guide

**For Beginners** | **Last Updated:** December 8, 2025

This guide will walk you through testing your Realm of Valor app from start to finish. No prior experience required!

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Installing Dependencies](#installing-dependencies)
4. [Running the Mobile App](#running-the-mobile-app)
5. [Running the Admin Panel](#running-the-admin-panel)
6. [Testing Features](#testing-features)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need Installed

Before starting, make sure you have these installed on your computer:

#### 1. Node.js (v18 or higher)
```bash
# Check if installed:
node --version

# Should show v18.x.x or higher
# If not installed, download from: https://nodejs.org/
```

#### 2. pnpm (Package Manager)
```bash
# Check if installed:
pnpm --version

# Install if needed:
npm install -g pnpm
```

#### 3. Git
```bash
# Check if installed:
git --version

# If not installed, download from: https://git-scm.com/
```

#### 4. Expo CLI (for mobile app)
```bash
# Install globally:
npm install -g expo-cli

# Or use:
npx expo
```

#### 5. Expo Go App (on your phone)
- **iOS:** Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android:** Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Repository Setup

### Step 1: Navigate to Project Directory

Open your terminal and go to the project folder:

```bash
cd /home/user/Rov-Soulforge
```

**Note:** Replace `/home/user/Rov-Soulforge` with your actual project path.

### Step 2: Check Current Branch

```bash
git branch

# You should see:
# * claude/refactor-modular-architecture-01SVqUWLSew4d1yZtWMgnBzZ
```

### Step 3: Pull Latest Changes

```bash
git pull origin claude/refactor-modular-architecture-01SVqUWLSew4d1yZtWMgnBzZ
```

---

## Installing Dependencies

### Step 1: Install All Project Dependencies

From the root directory, run:

```bash
pnpm install
```

This will install all dependencies for:
- Mobile app
- Admin panel
- Type packages
- Logic packages

**Expected Output:**
```
Progress: resolved XXX, reused XXX, downloaded XXX, added XXX
Done in XXs
```

### Step 2: Verify Installation

Check that node_modules were created:

```bash
ls node_modules/
ls apps/mobile/node_modules/
ls apps/admin/node_modules/
```

You should see folders in each location.

---

## Running the Mobile App

### Step 1: Navigate to Mobile App

```bash
cd apps/mobile
```

### Step 2: Start Expo Development Server

```bash
pnpm start
```

**Alternative commands:**
```bash
# Use Expo directly:
npx expo start

# Clear cache if needed:
npx expo start -c
```

### Step 3: Open on Your Phone

You'll see output like this:

```
Metro waiting on exp://192.168.1.100:8081

› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

**To test on your phone:**

1. **iOS:**
   - Open Camera app
   - Point at QR code
   - Tap notification to open in Expo Go

2. **Android:**
   - Open Expo Go app
   - Tap "Scan QR Code"
   - Point at QR code

### Step 4: Wait for App to Load

First launch may take 1-2 minutes. You'll see:
```
Building JavaScript bundle...
Running application...
```

### Step 5: Verify App Loads

You should see the Realm of Valor home screen!

---

## Running the Admin Panel

The admin panel is a web app for creating game content.

### Step 1: Open New Terminal

Keep the mobile app running, open a **new terminal window**.

### Step 2: Navigate to Admin Folder

```bash
cd /home/user/Rov-Soulforge/apps/admin
```

### Step 3: Start Development Server

```bash
pnpm dev
```

**Expected Output:**
```
ready - started server on 0.0.0.0:3001
event - compiled successfully
```

### Step 4: Open in Browser

Open your web browser and go to:
```
http://localhost:3001
```

You should see the Admin Dashboard!

---

## Testing Features

### Mobile App Features

#### 1. Test Battle System

**Location:** Battle feature module
**How to test:**

1. In mobile app, navigate to battles section
2. Tap "Start Battle"
3. You should see:
   - Player HP and Mana bars
   - Opponent HP and Mana bars
   - Your hand of cards
   - Turn indicator

4. **Test Card Playing:**
   - Tap an Attack card (red)
   - Should deal damage to opponent
   - Your mana decreases
   - Battle log updates

5. **Test Turn System:**
   - Tap "End Turn"
   - Opponent automatically plays cards
   - Your turn starts again
   - Mana restored to 3

6. **Test Win Condition:**
   - Keep playing until opponent HP reaches 0
   - Should see "Victory!" message
   - onBattleEnd callback triggers

**Expected Behavior:**
- ✅ Cards are playable
- ✅ Mana costs work
- ✅ Damage applies correctly
- ✅ AI opponent plays cards
- ✅ Battle ends when HP reaches 0

#### 2. Test Quest System

**How to test:**

1. Open quest list
2. Find a quest near you
3. Tap "Accept Quest"
4. View objectives list
5. Try to complete an objective

**Expected Behavior:**
- ✅ Quests appear on map
- ✅ Quest details load
- ✅ Objectives are trackable
- ✅ Progress updates

#### 3. Test Map Features

**How to test:**

1. Grant location permissions
2. Map should center on your location
3. Pan around the map
4. Look for quest markers

**Expected Behavior:**
- ✅ Map loads correctly
- ✅ Player location shows
- ✅ Can pan and zoom
- ✅ Markers visible

### Admin Panel Features

#### 1. Test Quest Creator

**URL:** `http://localhost:3001/quests/create`

**How to test:**

1. Fill out quest form:
   - Name: "Test Quest"
   - Description: "This is a test"
   - Level: 1
   - Rarity: Common

2. Add objective:
   - Type: Battle
   - Enemy: Goblin
   - Count: 3

3. Set rewards:
   - XP: 100
   - Gold: 50

4. Click "Save Quest"

**Expected Behavior:**
- ✅ Form validates input
- ✅ Save button shows success
- ✅ Quest ID generated
- ✅ Data saved to Firebase (if configured)

#### 2. Test Item Creator

**URL:** `http://localhost:3001/items/create`

**How to test:**

1. Fill out item form:
   - Name: "Test Sword"
   - Type: Weapon
   - Rarity: Rare
   - ATK: 25

2. Add effect:
   - Type: Damage
   - Value: 10

3. Click "Save Item"

**Expected Behavior:**
- ✅ Stats editor works
- ✅ Effects can be added/removed
- ✅ Preview shows JSON
- ✅ Save succeeds

#### 3. Test Enemy Creator

**URL:** `http://localhost:3001/enemies/create`

**How to test:**

1. Fill out enemy form:
   - Name: "Test Goblin"
   - Type: Melee
   - HP: 50
   - ATK: 10

2. Set AI behavior:
   - Aggression: 70
   - Intelligence: 30

3. Add loot:
   - Item: gold_coin
   - Drop %: 100

4. Click "Save Enemy"

**Expected Behavior:**
- ✅ All fields editable
- ✅ Sliders work
- ✅ Loot table updates
- ✅ Save succeeds

#### 4. Test Character Editor

**URL:** `http://localhost:3001/characters/edit`

**How to test:**

1. Enter search term (any text for now)
2. Click "Search"
3. Mock character should load
4. Edit stats (try changing ATK)
5. Click "Save Changes"

**Expected Behavior:**
- ✅ Search works
- ✅ Character data loads
- ✅ Stats are editable
- ✅ Save shows success message

---

## Troubleshooting

### Common Issues

#### Issue: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
```

#### Issue: "Expo command not found"

**Solution:**
```bash
# Use npx instead:
npx expo start

# Or install globally:
npm install -g expo-cli
```

#### Issue: Mobile app won't connect

**Solutions:**

1. **Check same WiFi network:**
   - Phone and computer must be on same network
   - Disable VPN if active

2. **Try tunnel mode:**
   ```bash
   npx expo start --tunnel
   ```

3. **Check firewall:**
   - Allow port 8081
   - Allow Expo in firewall settings

#### Issue: "Metro bundler error"

**Solution:**
```bash
# Clear cache and restart:
npx expo start -c
```

#### Issue: TypeScript errors

**Solution:**
```bash
# Run type check:
pnpm --filter @rov/mobile run type-check

# If errors persist, check tsconfig.json is correct
```

#### Issue: Module not found errors

**Solution:**
```bash
# Reinstall dependencies:
rm -rf node_modules
rm -rf apps/mobile/node_modules
rm -rf apps/admin/node_modules
pnpm install
```

#### Issue: Admin panel won't start

**Solutions:**

1. **Check port 3001 is free:**
   ```bash
   # Kill process on port 3001:
   lsof -ti:3001 | xargs kill -9
   ```

2. **Try different port:**
   ```bash
   pnpm dev -- --port 3002
   ```

#### Issue: Firebase errors

**Expected for now:**
- Firebase is not configured yet
- Admin panel will show "Firebase not configured" errors
- Mobile app works offline-first (no Firebase needed initially)

**To configure Firebase later:**
1. Create Firebase project at https://console.firebase.google.com
2. Copy config to `.env` files
3. Enable Firestore database
4. Set up authentication

---

## Testing Checklist

Use this checklist to verify everything works:

### Mobile App
- [ ] App starts without errors
- [ ] Map loads and shows location
- [ ] Can navigate between screens
- [ ] Battle system works
  - [ ] Can play cards
  - [ ] Mana system works
  - [ ] AI opponent plays
  - [ ] Battle ends correctly
- [ ] Quest list loads
- [ ] Character screen shows stats
- [ ] Inventory screen loads

### Admin Panel
- [ ] Dashboard loads at localhost:3001
- [ ] Quest creator form works
  - [ ] Can add objectives
  - [ ] Can set rewards
  - [ ] Save button works
- [ ] Item creator works
  - [ ] Stats editor functional
  - [ ] Effects can be added
- [ ] Enemy creator works
  - [ ] AI sliders work
  - [ ] Loot table works
- [ ] Character editor works
  - [ ] Search works
  - [ ] Stats editable

### Enhancements (New Features)
- [ ] Battle status effects (check BattleEnhancements.ts)
- [ ] Battle combos (play 2+ attacks)
- [ ] Quest milestones (check progress tracker)
- [ ] Character leveling (XP calculations)
- [ ] Inventory filtering
- [ ] POI discovery
- [ ] Fitness goals

---

## Next Steps After Testing

### 1. Report Issues

If you find bugs, create an issue with:
- What you did
- What you expected
- What actually happened
- Screenshots if possible

### 2. Configure Firebase (Optional)

To enable real-time sync:

1. Create Firebase project
2. Enable Firestore
3. Add Firebase config to:
   - `apps/mobile/.env`
   - `apps/admin/.env.local`
4. Deploy Firebase functions

### 3. Add Content

Use admin panel to create:
- Quests
- Items
- Enemies
- NPCs

### 4. Test on Real Devices

- iOS device
- Android device
- Different screen sizes
- Different network conditions

---

## Quick Reference Commands

```bash
# Start mobile app
cd apps/mobile && pnpm start

# Start admin panel
cd apps/admin && pnpm dev

# Run type checking
pnpm --filter @rov/mobile run type-check
pnpm --filter @rov/admin run type-check

# Clear caches
npx expo start -c
rm -rf node_modules && pnpm install

# View logs
npx expo start # Mobile logs show in terminal

# Build for production (later)
cd apps/mobile && eas build --platform all
cd apps/admin && pnpm build
```

---

## Need Help?

- Check error messages carefully
- Read console output
- Try clearing cache
- Restart development servers
- Check network connection

---

## Summary

**Testing flow:**
1. Install dependencies (`pnpm install`)
2. Start mobile app (`cd apps/mobile && pnpm start`)
3. Open in Expo Go on your phone
4. Start admin panel (`cd apps/admin && pnpm dev`)
5. Open browser to localhost:3001
6. Test features using this guide
7. Report any issues you find

**You're testing:**
- ✅ Mobile app (React Native + Expo)
- ✅ Admin panel (Next.js web app)
- ✅ Battle system
- ✅ Quest system
- ✅ All enhancements

**Good luck! 🎮**

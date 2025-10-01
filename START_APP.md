# Start Realm of Valor - Quick Commands

## ✅ Diagnostic Passed!

All checks passed - your environment is correctly configured.

---

## To Start the App

### 1. Open Terminal in Mobile Directory

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
```

### 2. Start with Clear Cache (RECOMMENDED FIRST TIME)

```bash
pnpm start --clear
```

Or using npx:
```bash
npx expo start --clear
```

### 3. Wait for Metro Bundler to Start

You'll see:
```
Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with your device
› Press a │ open Android
› Press i │ open iOS simulator
```

### 4. Watch for These Critical Logs

**LOOK FOR:**
```
🔥 Firebase Config Check:
- API Key exists: true
- Project ID: realmofvalorapp
- App ID exists: true
✅ Firebase app initialized successfully
📱 App starting...
✅ App ready
```

**If you see these logs, Firebase is working! ✅**

---

## Launch Options

### Option A: Android Emulator
1. Make sure Android emulator is running first
2. Press `a` in the Metro terminal

### Option B: iOS Simulator (Mac only)
Press `i` in the Metro terminal

### Option C: Physical Device with Expo Go
1. Install Expo Go from App Store / Play Store
2. Scan the QR code shown in terminal

---

## If App Still Shows Blank Screen

Even though diagnostic passed, if you see a blank screen:

### Check Metro Console
Look in the terminal where you ran `pnpm start` for error messages

### Common Issue: Metro Cache Not Cleared
Stop the server (Ctrl+C) and restart with:
```bash
pnpm start --clear
```

### Check Device Console Logs

**Android:**
```bash
adb logcat | grep -i "expo\|react\|firebase"
```

**iOS:**
```bash
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "Expo"' --level debug
```

---

## Backend API (Optional - Only Needed for AI Companion)

If you want to use the AI companion feature, start the backend in a **separate terminal**:

```bash
cd "f:\Soulforge 09-2025\rov\apps\backend"
pnpm install  # First time only
pnpm dev
```

Backend will start at `http://localhost:3000`

---

## Troubleshooting Commands

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

### Check Expo Doctor
```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
npx expo-doctor
```

---

## What You Should See

### 1. Splash Screen (2-3 seconds)
- ⚔️ Realm of Valor logo
- "Loading..." spinner

### 2. Then One of These:

#### If Not Logged In:
- **Login screen** with email/password fields

#### If Logged In But No Character:
- **Character creation screen** with class selection

#### If Logged In With Character:
- **Main app** with bottom tabs:
  - 🗺️ Map
  - 🎴 Deck
  - 👤 Profile
  - 🤖 Companion

---

## What to Report if Still Not Working

1. **Copy the Metro console output** (first 50 lines after starting)
2. **Screenshot of what you see on device/simulator**
3. **Any error messages** (red text in console)
4. **What did you see?**
   - Blank white screen?
   - Blank black screen?
   - Error overlay (red screen)?
   - Splash screen that never finishes?

---

## 🚀 Start Now!

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

Then press `a` for Android or `i` for iOS!

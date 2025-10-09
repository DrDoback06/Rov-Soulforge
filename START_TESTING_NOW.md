# 🚀 START TESTING NOW - Quick Guide

## The Problem
Your app won't start because **`.env` files are missing**. This is the only thing blocking you.

---

## The Solution (5 minutes)

### Step 1: Create Mobile App .env File

**Option A - PowerShell (Recommended)**:
```powershell
cd "f:\Soulforge 09-2025\rov\apps\mobile"

# Create .env file with Firebase credentials
@"
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
"@ | Out-File -FilePath .env -Encoding utf8
```

**Option B - Manual**:
1. Open Notepad
2. Copy the text above (starting with `EXPO_PUBLIC_FIREBASE_API_KEY=...`)
3. Save as `f:\Soulforge 09-2025\rov\apps\mobile\.env`
4. Make sure it's named `.env` not `.env.txt`

---

### Step 2: Start the App

```powershell
cd "f:\Soulforge 09-2025\rov\apps\mobile"
pnpm start --clear
```

**Wait for**:
```
🔥 Firebase Config Check:
- API Key exists: true
- Project ID: realmofvalorapp
✅ Firebase app initialized successfully
📱 App starting...
✅ App ready
```

---

### Step 3: Launch in Browser

Press `w` in the terminal to open in web browser.

**You should see**:
- Login screen with "Sign In as Guest" button
- No errors in console

---

## ✅ Success Checklist

After the app starts, test these:

1. **Authentication**
   - [ ] Click "Sign In as Guest"
   - [ ] Should navigate to character creation

2. **Character Creation**
   - [ ] See 8 class cards (Warrior, Mage, etc.)
   - [ ] Select one
   - [ ] Choose alignment (Holy/Chaos/Arcane/Neutral)
   - [ ] Click "Create Character"
   - [ ] Should navigate to main app

3. **Map Tab**
   - [ ] See map with your location (or spoofed location on web)
   - [ ] "Generate Quests" button visible
   - [ ] Click to spawn test quests
   - [ ] Quest markers appear on map

4. **Quest Acceptance**
   - [ ] Click quest marker
   - [ ] See quest details in popup
   - [ ] Click "Accept Quest"
   - [ ] See ✅ checkmark on quest

5. **Quests Tab**
   - [ ] Switch to Quests tab
   - [ ] See accepted quest in list
   - [ ] Click "Show on Map" - snaps back to map

6. **Profile Tab**
   - [ ] See character name and class
   - [ ] See HP, Mana, XP counters
   - [ ] See "Connect Strava" button

---

## 🐛 If Something Breaks

### Firebase Errors
```
❌ Firebase configuration is incomplete
```
**Fix**: Double-check `.env` file exists and has all variables

---

### Metro Bundler Errors
```
Unable to resolve module...
```
**Fix**: 
```powershell
cd "f:\Soulforge 09-2025\rov"
pnpm install
cd apps/mobile
pnpm start --clear
```

---

### Blank Screen
**Check browser console** (F12) for errors. Look for:
- Red error messages
- Firebase connection issues
- Missing module errors

---

## 📋 What to Report Back

Please tell me:

1. **Did the app start?** (Yes/No)
2. **Which console logs appeared?** (Copy/paste the emoji logs)
3. **Did login work?** (Yes/No/Error)
4. **Did character creation work?** (Yes/No/Error)
5. **Can you see the map?** (Yes/No)
6. **Can you generate and accept quests?** (Yes/No)
7. **Any error messages?** (Copy/paste if any)

---

## 📚 Full Documentation

- **Detailed bug list**: `rov/BUG_FIXES_AND_ROADMAP.md`
- **Critical issues**: `rov/CRITICAL_SETUP_INSTRUCTIONS.md`
- **Original spec**: `OG instructions.txt`
- **Recent fixes**: `rov/FIXES_COMPLETED_03-10-2025.md`

---

## 💡 Pro Tips

1. **Use web for testing**: Faster than Android emulator
2. **Open browser console**: Press F12 to see logs
3. **Location spoofing**: Web app has built-in location faker
4. **Generate quests**: Use "Generate Quests" button to spawn nearby
5. **Admin dashboard**: `cd rov/apps/admin && pnpm dev` for quest spawning

---

## 🎯 Next Steps After It Works

Once you confirm the app runs:

1. I'll help you:
   - Seed real quest data
   - Test battle system
   - Set up backend API (optional)
   - Configure Strava (if you want fitness tracking)
   - Deploy to TestFlight/Play Store

2. Priority fixes:
   - Consolidate battle system (remove duplication)
   - Implement IAP verification (if monetizing)
   - Lock down Firestore security rules
   - Add route display on map

---

## ❓ Quick Questions

1. **Do you have Strava credentials?** (Optional)
   - Get from: https://www.strava.com/settings/api
   
2. **Do you have OpenAI API key?** (Optional for AI companion)
   - Get from: https://platform.openai.com/api-keys

3. **Are you testing on**:
   - [ ] Web browser
   - [ ] Android phone/emulator
   - [ ] iPhone/simulator

---

**Ready? Run Step 1 now and report back!** 🚀

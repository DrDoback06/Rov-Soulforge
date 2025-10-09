# ✅ Quick Test Checklist - 5 Minute Verification

## Before You Start
1. Hard refresh your browser: `Ctrl+Shift+R`
2. Wait 30 seconds for Firebase rules to propagate
3. Open DevTools Console (F12) to see logs

---

## Test #1: Map Loads Without Errors (30 seconds)
- [ ] Navigate to Map tab
- [ ] Console shows: "📍 Loaded X static quests"
- [ ] Console shows: "📍 Found X existing local quests"
- [ ] Console shows: "📍 Found X existing dynamic quests"
- [ ] **NO** "Missing or insufficient permissions" errors
- [ ] **NO** continuous "🗺️ Route fetched" spam (infinite loop)

**If this works**: ✅ Quest permissions are fixed!

---

## Test #2: Quest Markers Appear (30 seconds)
- [ ] Wait for your location to load (blue dot on map)
- [ ] Quest markers appear (colored circles with icons)
- [ ] Click a quest marker
- [ ] Quest details modal appears
- [ ] Click "Make Active" button
- [ ] Quest added to active list (check Quest Panel icon on right)

**If this works**: ✅ Quest system is functional!

---

## Test #3: Navigation Works (1 minute)
- [ ] Click any quest marker
- [ ] Click "Navigate" button in modal
- [ ] Map switches to **drive mode** (tilted, zoomed in)
- [ ] Floating quest details appear at top
- [ ] Route line draws from your location to quest
- [ ] Console shows ONE "🗺️ Route fetched" message (not continuous)
- [ ] Click "End Navigation" button
- [ ] Map returns to normal view

**If this works**: ✅ Infinite loop is fixed, navigation works!

---

## Test #4: Character Creation (1 minute)
*Skip if you already have a character*

- [ ] Log out
- [ ] Create new test account
- [ ] Go through character creation
- [ ] Select class and alignment
- [ ] Click "Create Character"
- [ ] Character saves successfully
- [ ] **NO** "Missing or insufficient permissions" error
- [ ] Redirects to map screen

**If this works**: ✅ Character creation permissions are fixed!

---

## Test #5: Quest Panel (1 minute)
- [ ] Click the 📋 button on the right side of screen
- [ ] Quest Panel slides in from right (40% width)
- [ ] See sections: "Active Quests", "Main Quests", "Side Quests", "Events"
- [ ] Active quests show with drag handles
- [ ] Filter buttons work (All, Main, Side, Events)
- [ ] Search bar filters quests by name
- [ ] Click "Navigate All" button (if you have active quests)
- [ ] Multi-stop navigation starts

**If this works**: ✅ Quest Panel is fully functional!

---

## 🎉 All Tests Pass?

If all 5 tests work, **you're good to go!** The critical bugs are fixed:
- ✅ No infinite loop
- ✅ No permission errors
- ✅ Quests load and display
- ✅ Navigation works with drive mode
- ✅ Character creation works

---

## 🚨 If Any Test Fails

### Provide me with:
1. **Which test failed** (1, 2, 3, 4, or 5)
2. **Console logs** (F12 → Console → copy all errors)
3. **Screenshot** of what you see
4. **Exact error message**

### Common Issues:
- **"Still seeing infinite loop"**: Clear browser cache with `Ctrl+Shift+R`
- **"No quests loading"**: Check if you're logged in and have internet connection
- **"Permission errors"**: Wait 60 seconds for Firebase rules to propagate
- **"White screen"**: Check `.env` file has correct Mapbox token

---

## Expected Console Output (Success)

When everything works, you should see:
```
🗺️ MapView initializing with token: pk.eyJ1dG...
📍 No static quests found, seeding UK landmarks...
📍 Loaded 15 static quests
📍 Found 0 existing local quests within 8000m
📍 Found 0 existing dynamic quests for user
✅ Location loaded: { latitude: XX.XXXX, longitude: XX.XXXX }
```

**NOT** this:
```
Error loading quests: FirebaseError: Missing or insufficient permissions
Maximum update depth exceeded
🗺️ Route fetched: ... (repeating continuously)
```

---

**Ready?** Do the tests and let me know! 🚀


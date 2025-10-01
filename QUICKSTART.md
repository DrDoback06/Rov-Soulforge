# 🚀 Quick Start Guide

Get Realm of Valor running in **5 minutes**!

## Prerequisites

- Node.js 18+ and pnpm installed
- Firebase project already configured ✅ (credentials in `.env` files)
- Mapbox access token configured ✅

## Step 1: Install Dependencies

```bash
cd f:\Soulforge 09-2025\rov
pnpm install
```

⏱️ *Takes 2-3 minutes*

## Step 2: Start Backend API

```bash
cd apps/backend
pnpm run dev
```

✅ Backend running on **http://localhost:3000**

## Step 3: Start Mobile App

Open a new terminal:

```bash
cd apps/mobile
pnpm start
```

Then press:
- **`a`** for Android emulator
- **`i`** for iOS simulator
- **`w`** for web browser
- Scan QR code with Expo Go app

✅ Mobile app is running!

## Step 4: Test the App

1. **Sign Up** → Create account (or continue as guest)
2. **Create Character** → Choose class (e.g., Warrior) and alignment
3. **View Map** → See your location (grants permission if needed)
4. **Explore** → Move around to find quests (simulated for now)

## 🎮 What Can You Do?

| Feature | Status | How to Test |
|---------|--------|-------------|
| Authentication | ✅ Working | Sign up with email/password |
| Character Creation | ✅ Working | Choose from 8 classes |
| Map View | ✅ Working | See your GPS location |
| Quest System | ⚠️ Needs data | Spawn quests via admin dashboard |
| Battle System | ✅ Working | Challenge another player |
| Deck Builder | ✅ Working | Build decks from inventory |
| Shop | ✅ Working | Buy cards with gold |
| AI Companion | ✅ Working | Chat with Valoris |
| Leaderboard | ✅ Working | View rankings |
| Strava | ⚠️ Optional | Connect Strava account |

## 🛠️ Optional: Start Admin Dashboard

```bash
cd apps/admin
pnpm run dev
```

Visit **http://localhost:3000** to:
- Spawn test quests
- View player stats
- Manage game data

## 🐛 Troubleshooting

### "Cannot connect to Metro"
```bash
cd apps/mobile
expo start --clear
```

### "Firebase error"
Check that `.env` files are present:
- `apps/mobile/.env`
- `apps/backend/.env`
- `packages/firebase/service-account.json`

### "No quests visible"
Use admin dashboard to spawn test quests at your location.

### "Mapbox not showing"
Verify `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` in `apps/mobile/.env`

## 📚 Next Steps

- **Full Setup**: See [SETUP.md](./SETUP.md) for detailed configuration
- **Project Status**: See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for features
- **README**: See [README.md](./README.md) for architecture overview

## 🎯 Quick Test Scenarios

### Test 1: Create Your First Character
1. Launch app → Click "Create Account"
2. Enter email/password
3. Choose **Warrior** class
4. Choose **Holy** alignment
5. Click "Begin Adventure"
✅ You should see the main map screen

### Test 2: Chat with AI Companion
1. Tap **Companion** tab (🤖 icon)
2. Type "How do I complete quests?"
3. Get response from Valoris
✅ AI should explain quest system

### Test 3: Build a Deck
1. Tap **Cards** tab (🎴 icon)
2. View your starting cards
3. Tap "Deck Builder"
4. Add cards to Action deck (need 30)
5. Save deck
✅ Deck saved successfully

## 🏁 You're Ready!

The app is now running locally. All core features are functional and ready to test.

---

**Need help?** Check the full [SETUP.md](./SETUP.md) guide.

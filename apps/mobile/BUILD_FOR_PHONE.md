# Build Development Build for Your Phone

Your app uses **custom native modules** (@rnmapbox/maps) which require a development build instead of Expo Go.

## Prerequisites

✅ EAS CLI installed globally
✅ EAS configuration created (eas.json)
✅ App.json configured with Android package

## Step-by-Step Instructions

### 1. Login to Expo

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
eas login
```

**If you don't have an Expo account:**
- Create one at https://expo.dev/signup (it's free!)
- Or create during login by following the prompts

### 2. Initialize EAS Build

```bash
eas build:configure
```

This will:
- Link your project to Expo
- Create a project ID
- Update app.json with the project ID

### 3. Start the Build

```bash
eas build --profile development --platform android
```

**What happens:**
- Uploads your code to Expo's build servers
- Builds a custom APK with all native modules (Mapbox, etc.)
- Takes 10-15 minutes
- Shows build progress in terminal
- Gives you a download link when done

**Build profile options:**
- `development` - For testing with Metro bundler (hot reload works!)
- `preview` - For testing without Metro (standalone testing)
- `production` - For publishing to Play Store

### 4. Download and Install

When build completes:

1. **Click the download link** in the terminal output
2. **Open the link on your Android phone**
3. **Download the APK file**
4. **Install it** (you may need to enable "Install from unknown sources" in Settings)

### 5. Connect to Metro Bundler

Once the app is installed:

1. **Start Metro bundler** on your computer:
   ```bash
   cd "f:\Soulforge 09-2025\rov\apps\mobile"
   pnpm start
   ```

2. **Make sure your phone and computer are on the same WiFi network**

3. **Open the development build app** on your phone

4. **Shake your phone** to open the developer menu

5. **Tap "Scan QR Code"**

6. **Scan the QR code** shown in your terminal

The app will connect to Metro and load! Any code changes you make will hot-reload on your phone.

---

## Troubleshooting

### Build fails with "Project not found"

Run:
```bash
eas init
```

This creates a new project in your Expo account.

### Build fails with missing credentials

EAS will prompt you to generate Android keystore automatically. Choose "Yes" when asked.

### APK won't install on phone

1. Go to Settings → Security
2. Enable "Install from unknown sources" or "Install unknown apps"
3. Try installing again

### App installed but won't connect to Metro

1. Check that phone and computer are on **same WiFi**
2. Check that Metro is running (`pnpm start`)
3. Try entering the Metro URL manually:
   - Shake phone → "Enter URL manually"
   - Enter: `exp://YOUR_COMPUTER_IP:8081`
   - Find your IP with: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Mapbox not working

Make sure the Mapbox token in app.json is correct:
```json
"RNMapboxMapsDownloadToken": "pk.eyJ1IjoiZHJkb2JhY2swNiIsImEiOiJjbWc2eXVpbGowZ3VrMmlzZHR5Y2tmbXQ1In0.PznVbW_JjKO2GbEk6xDUNA"
```

---

## Alternative: Build Locally (Advanced)

If you don't want to use EAS Cloud Build, you can build locally:

### Prerequisites
- Android Studio installed
- Android SDK configured
- Java JDK installed

### Build Command
```bash
eas build --profile development --platform android --local
```

This builds on your computer instead of Expo's servers (faster but requires Android dev tools).

---

## Commands Reference

| Command | What It Does |
|---------|-------------|
| `eas login` | Login to your Expo account |
| `eas whoami` | Check which account you're logged in as |
| `eas build:configure` | Set up EAS Build for your project |
| `eas build:list` | See all your previous builds |
| `eas build --profile development --platform android` | Build development APK |
| `eas build --profile preview --platform android` | Build preview APK |
| `eas build --profile production --platform android` | Build production AAB for Play Store |
| `eas submit -p android` | Submit to Google Play Store |

---

## Next Steps After Installing

Once your development build is installed and connected:

1. ✅ Login as guest or create account
2. ✅ Create a character
3. ✅ Explore the map (Mapbox will work on native!)
4. ✅ Test all features
5. ✅ Make code changes and see them hot-reload

The development build is like Expo Go but with your custom native modules included!

---

## Cost

**EAS Build is FREE for:**
- Unlimited builds for personal/hobby projects
- Cloud building (no local setup needed)
- Development and preview builds

**Paid plans available for:**
- Team collaboration
- Faster build queues
- Production deployments

For development, the free tier is perfect!

---

## Ready to Build?

```bash
cd "f:\Soulforge 09-2025\rov\apps\mobile"
eas login
eas build --profile development --platform android
```

Then wait 10-15 minutes and you'll have a custom APK with Mapbox working! 🚀

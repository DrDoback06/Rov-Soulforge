# How to Get Firebase Web App Credentials

## Quick Steps:

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/realmofvalorapp/settings/general

2. **Scroll down to "Your apps"**

3. **Look for the Web app (</> icon)**
   - If you see a web app, click the gear icon → "App settings"
   - If no web app exists, click "Add app" → Web (</>) → Register app

4. **Copy the Firebase SDK configuration**

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...", // Copy this
  authDomain: "realmofvalorapp.firebaseapp.com",
  projectId: "realmofvalorapp",
  storageBucket: "realmofvalorapp.firebasestorage.app",
  messagingSenderId: "123456789", // Copy this
  appId: "1:123456789:web:abcdef", // Copy this
  measurementId: "G-XXXXXXXXXX" // Copy this
};
```

5. **Update the .env file:**

Open `rov/apps/mobile/.env` and replace:
- `EXPO_PUBLIC_FIREBASE_API_KEY` with your `apiKey`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` with your `messagingSenderId`
- `EXPO_PUBLIC_FIREBASE_APP_ID` with your `appId`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` with your `measurementId`

6. **Restart Expo:**
```bash
# Stop current server (Ctrl+C)
cd "F:\Soulforge 09-2025\rov\apps\mobile"
npx expo start --clear
```

---

## If You Don't Have Firebase Access:

The Firebase credentials are sensitive and should not be in GitHub (they're in .gitignore).

You need to either:
1. Get the credentials from the Firebase project owner
2. Create your own Firebase project for testing
3. Use the existing service account to generate web credentials

---

## Alternative: Use Firebase CLI

If you have Firebase CLI access:

```bash
firebase apps:sdkconfig WEB
```

This will output the configuration you need.

---

## Current Firebase Project:
- **Project ID:** realmofvalorapp
- **Auth Domain:** realmofvalorapp.firebaseapp.com
- **Storage Bucket:** realmofvalorapp.firebasestorage.app

Just need the API Key, Sender ID, App ID, and Measurement ID!


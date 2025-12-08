# Firebase Setup Guide

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project created** at [console.firebase.google.com](https://console.firebase.google.com)

## Initial Setup

### 1. Create `.firebaserc`

Copy the example and fill in your project ID:
```bash
cd packages/firebase
cp .firebaserc.example .firebaserc
```

Edit `.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Configure Mobile App

Create `.env` file in `apps/mobile/`:
```bash
cd ../../apps/mobile
cp .env.example .env
```

Fill in Firebase configuration from your Firebase project settings:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Where to find these values:**
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Click on your web app (or add one)
4. Copy the config values

### 4. Deploy Firestore Rules & Indexes

```bash
cd packages/firebase
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:createBattle,functions:playCard
```

## Local Development

### Run Firebase Emulators

```bash
cd packages/firebase
firebase emulators:start
```

This starts:
- **Firestore Emulator** (port 8080)
- **Functions Emulator** (port 5001)
- **Auth Emulator** (port 9099)
- **Emulator UI** (port 4000)

### Connect Mobile App to Emulators

Update `apps/mobile/lib/firebase.ts`:
```typescript
import { connectFunctionsEmulator } from 'firebase/functions';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## Firebase Configuration Files

### `firebase.json`
Main Firebase configuration for:
- Functions deployment
- Firestore rules
- Emulator settings

### `firestore.rules`
Security rules for Firestore database

### `firestore.indexes.json`
Composite indexes for complex queries

### `.firebaserc`
Project aliases (development, staging, production)

## Common Commands

### Deploy Everything
```bash
firebase deploy
```

### Deploy Functions Only
```bash
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:createBattle
```

### View Logs
```bash
firebase functions:log
```

### Delete Function
```bash
firebase functions:delete functionName
```

## Troubleshooting

### "Firebase project not found"
- Check `.firebaserc` has correct project ID
- Run `firebase use --add` to select project

### "Permission denied" errors
- Check `firestore.rules` for security rules
- Use Firebase Auth in your app

### "Function not found"
- Ensure function is exported in `functions/src/index.ts`
- Deploy functions: `firebase deploy --only functions`

### Emulator connection issues
- Check emulators are running: `firebase emulators:start`
- Verify emulator URLs match in your app code
- Check firewall/antivirus isn't blocking ports

## Environment Variables

Firebase Functions can use environment config:

```bash
# Set config
firebase functions:config:set stripe.key="your_stripe_key"

# Get config
firebase functions:config:get

# Use in functions
const stripeKey = functions.config().stripe.key;
```

## Security Best Practices

1. **Never commit `.firebaserc` with real project IDs to public repos**
2. **Keep `.env` files out of version control** (add to `.gitignore`)
3. **Use Firebase Auth** for all authenticated operations
4. **Write strict Firestore rules** - default deny, explicit allow
5. **Validate all inputs** in Cloud Functions
6. **Use HTTPS-only** for production

## Support

- **Firebase Docs:** https://firebase.google.com/docs
- **Firebase Console:** https://console.firebase.google.com
- **Cloud Functions:** https://firebase.google.com/docs/functions
- **Firestore:** https://firebase.google.com/docs/firestore

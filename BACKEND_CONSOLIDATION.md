# Backend Consolidation - Migration Guide

## Summary
The NestJS backend (`apps/backend/`) has been **archived** because:
1. Mobile app uses Firebase Cloud Functions directly (not the NestJS API)
2. Admin dashboard uses Firebase Cloud Functions directly
3. All functionality is duplicated between backend and Firebase Functions
4. Maintaining two implementations creates confusion and bugs

## What Was in the Backend

The NestJS backend had these modules:

```
apps/backend/src/
├── activity/          - Fitness activity tracking
├── ai/                - AI opponent logic
├── battle/            - Battle system API
├── character/         - Character CRUD operations
├── firebase/          - Firebase Admin SDK wrapper
├── quest/             - Quest system API
├── shop/              - Shop/economy API
└── strava/            - Strava OAuth integration
```

## What Replaced It

All functionality now lives in **Firebase Cloud Functions**:

```
packages/firebase/functions/src/
├── activity.ts        - Fitness tracking (✅ complete)
├── battle.ts          - Battle system (✅ complete)
├── quests.ts          - Quest system (✅ complete)
├── shop.ts            - Shop/economy (✅ complete)
├── social.ts          - Trading/friends (✅ complete)
├── leaderboard.ts     - Rankings (✅ complete)
└── admin.ts           - Admin operations (✅ complete)
```

## Migration Steps

### 1. Remove Backend References

**Updated files:**
- `package.json` - Removed `"backend": "pnpm --filter backend dev"` script
- `.env.example` - Removed `EXPO_PUBLIC_API_URL` (not used)

### 2. Verify Firebase Functions

All Firebase Functions are deployed and operational:
```bash
cd packages/firebase
firebase deploy --only functions
```

### 3. Mobile App Configuration

The mobile app already uses Firebase Functions exclusively:
```typescript
// apps/mobile/lib/firebase.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app);
const createBattle = httpsCallable(functions, 'createBattle');
// etc...
```

## Benefits of Consolidation

✅ **Single source of truth** - No duplicate logic
✅ **Easier maintenance** - One codebase to update
✅ **Better performance** - Firebase Functions are globally distributed
✅ **Simpler deployment** - One deployment target
✅ **Less confusion** - Clear where functionality lives

## If You Need the Backend

The backend code is preserved in `apps/backend.ARCHIVED/` if you ever need to reference it.

To restore it:
```bash
mv apps/backend.ARCHIVED apps/backend
# Add backend script back to package.json
```

## What to Do Instead

### Running the API locally:
```bash
# Use Firebase Emulators instead of NestJS backend
cd packages/firebase
firebase emulators:start
```

### Adding new API endpoints:
Edit `packages/firebase/functions/src/` instead of `apps/backend/src/`

### Testing API changes:
```bash
# Deploy to Firebase
cd packages/firebase
firebase deploy --only functions:functionName
```

## Questions?

Refer to:
- Firebase Functions docs: `packages/firebase/functions/README.md`
- Mobile app Firebase setup: `apps/mobile/lib/firebase.ts`
- Cloud Functions code: `packages/firebase/functions/src/`

---

**Migration completed:** Phase 1 - December 8, 2024

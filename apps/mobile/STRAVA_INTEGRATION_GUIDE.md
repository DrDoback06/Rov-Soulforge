# Strava Integration Guide

## Overview

The Strava integration allows players to earn full rewards (100%) on fitness quests by connecting their Strava account. Without Strava, players can still complete fitness quests manually for 50% rewards.

---

## 🎯 Features

### Implemented
- ✅ OAuth 2.0 authentication with PKCE
- ✅ Automatic token refresh
- ✅ Recent activities display
- ✅ Workout verification for quest completion
- ✅ Reward multiplier system (100% vs 50%)
- ✅ Manual workout submission
- ✅ Athlete profile display
- ✅ Connection status tracking

### Reward System
- **With Strava** (Tracked): 100% quest rewards
- **Without Strava** (Manual): 50% quest rewards

---

## 📋 Setup Instructions

### 1. Create Strava API Application

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Click "Create App"
3. Fill in application details:
   - **Application Name**: Realm of Valor
   - **Category**: Training
   - **Club**: (optional)
   - **Website**: Your app URL
   - **Authorization Callback Domain**: `rov://strava-callback` (for mobile)
   - **Upload Icon**: (optional)

4. After creation, note your:
   - **Client ID**
   - **Client Secret**

### 2. Configure Environment Variables

Add to your `.env` file:

```env
EXPO_PUBLIC_STRAVA_CLIENT_ID=your_client_id_here
EXPO_PUBLIC_STRAVA_CLIENT_SECRET=your_client_secret_here
EXPO_PUBLIC_STRAVA_REDIRECT_URI=rov://strava-callback
```

### 3. Configure App Scheme

In `app.json`, ensure you have:

```json
{
  "expo": {
    "scheme": "rov",
    "plugins": [
      "expo-router"
    ]
  }
}
```

### 4. Test OAuth Flow

1. Build and run the app
2. Navigate to Profile tab
3. Find "Fitness Tracker" section
4. Click "Connect Strava"
5. Browser opens with Strava authorization
6. Click "Authorize"
7. Redirected back to app
8. Connection status shows "Connected ✓"

---

## 🏗️ Architecture

### Files Created

#### **lib/strava-auth.ts**
Core Strava integration with OAuth and API calls.

**Functions:**
- `authenticateWithStrava()` - Starts OAuth flow
- `refreshStravaToken()` - Refreshes expired tokens
- `getStravaAthlete()` - Get athlete profile
- `getStravaActivities()` - Get recent activities
- `getStravaActivity()` - Get specific activity by ID
- `createStravaActivity()` - Create manual activity
- `isStravaTokenExpired()` - Check token expiry
- `disconnectStrava()` - Revoke access

#### **hooks/useFitnessTracker.ts**
React hook for managing fitness tracker state.

**Features:**
- Auto-loads saved tokens from AsyncStorage
- Auto-refreshes expired tokens
- Provides connection status
- Workout verification
- Reward multiplier calculation

**API:**
```typescript
const {
  state,              // Connection state
  isLoading,          // Loading indicator
  isConnected,        // Boolean connection status
  provider,           // 'strava' | 'manual' | null
  connectStrava,      // Connect function
  disconnectFitnessTracker,  // Disconnect function
  getRecentWorkouts,  // Get recent activities
  verifyWorkoutCompleted,    // Verify quest workout
  submitManualWorkout,       // Submit untracked workout
  getRewardMultiplier        // Get reward % (1.0 or 0.5)
} = useFitnessTracker();
```

#### **components/StravaConnection.tsx**
UI component for managing Strava connection.

**Features:**
- Connect/disconnect buttons
- Athlete profile display
- Recent activities list
- Connection status indicator
- Benefits explanation

---

## 🎮 Quest Integration

### Fitness Quest Flow

#### **With Strava Connected (100% Rewards)**

1. Player accepts fitness quest
2. `FitnessWODModal` opens
3. "Use Fitness Tracker" toggle enabled
4. Player starts timer and completes workout
5. Workout logged to Strava app
6. On quest completion, `verifyWorkoutCompleted()` called
7. Checks Strava for matching activity in time window
8. If found: 100% rewards distributed
9. Quest objective marked complete

#### **Without Strava (50% Rewards)**

1. Player accepts fitness quest
2. `FitnessWODModal` opens
3. "Use Fitness Tracker" toggle disabled (grayed out)
4. Manual checkboxes displayed for each exercise
5. Player completes workout and checks boxes
6. On completion: 50% rewards distributed
7. Quest objective marked complete

### Workout Verification

```typescript
const { verified, activity } = await verifyWorkoutCompleted(
  'run',              // Workout type
  600,                // Min duration (10 minutes)
  startTime,          // Quest start time
  endTime             // Current time
);

if (verified) {
  // Give 100% rewards
  distributeRewards(baseRewards, 1.0);
} else {
  // Give 50% rewards (manual)
  distributeRewards(baseRewards, 0.5);
}
```

### Supported Workout Types

| Quest Type | Strava Activity Types |
|-----------|----------------------|
| run       | Run, VirtualRun, TrailRun |
| hike      | Hike, Walk |
| circuit   | Workout, CrossFit, HIIT |
| pushups   | Workout, WeightTraining |
| situps    | Workout, WeightTraining |
| squats    | Workout, WeightTraining |

---

## 🔐 Security

### Token Storage
- Tokens stored in AsyncStorage (encrypted on device)
- Never transmitted to Firebase or backend
- Auto-deleted on disconnect
- Tokens auto-refresh before expiry

### OAuth PKCE Flow
- Uses Proof Key for Code Exchange (PKCE)
- Prevents authorization code interception
- No client secret in mobile app (stored in env only)

### Permissions Requested
- `activity:read_all` - Read past and future activities
- `activity:write` - Create activities
- `profile:read_all` - Read athlete profile

---

## 📱 User Interface

### Profile Tab Integration

Add `StravaConnection` component to Profile tab:

```typescript
import { StravaConnection } from '@/components/StravaConnection';

export default function ProfileScreen() {
  return (
    <ScrollView>
      {/* Other profile content */}

      <StravaConnection />

      {/* More content */}
    </ScrollView>
  );
}
```

### Quest Integration

Update `FitnessWODModal` usage:

```typescript
import { useFitnessTracker } from '@/hooks/useFitnessTracker';

function QuestScreen() {
  const { isConnected } = useFitnessTracker();

  return (
    <FitnessWODModal
      visible={showWOD}
      objective={fitnessObjective}
      isTrackerConnected={isConnected}
      onComplete={(completed, isTracked) => {
        const multiplier = isTracked ? 1.0 : 0.5;
        distributeRewards(baseRewards, multiplier);
      }}
      onDismiss={() => setShowWOD(false)}
    />
  );
}
```

---

## 🧪 Testing

### Test Scenarios

#### 1. **Connect Strava**
- [ ] Click "Connect Strava" button
- [ ] Browser opens Strava authorization page
- [ ] Login to Strava (if not already)
- [ ] Click "Authorize"
- [ ] Redirected back to app
- [ ] Connection status shows "Connected ✓"
- [ ] Athlete name displayed
- [ ] Recent activities loaded

#### 2. **Complete Fitness Quest (Tracked)**
- [ ] Accept fitness quest
- [ ] WOD modal opens
- [ ] "Use Fitness Tracker" toggle enabled
- [ ] Start timer
- [ ] Complete actual workout (log to Strava app)
- [ ] Click "Complete" in game
- [ ] Verify workout found in Strava
- [ ] Receive 100% rewards
- [ ] Quest marked complete

#### 3. **Complete Fitness Quest (Manual)**
- [ ] Disconnect Strava (or don't connect)
- [ ] Accept fitness quest
- [ ] WOD modal opens
- [ ] "Use Fitness Tracker" toggle disabled
- [ ] Manual checkboxes shown
- [ ] Complete workout
- [ ] Check all exercise boxes
- [ ] Click "Complete"
- [ ] Receive 50% rewards
- [ ] Quest marked complete

#### 4. **Token Refresh**
- [ ] Connect Strava
- [ ] Wait for token to expire (or manually set expiry in past)
- [ ] Reload app
- [ ] Token automatically refreshed
- [ ] Connection maintained

#### 5. **Disconnect**
- [ ] Click "Disconnect" button
- [ ] Confirm disconnect
- [ ] Connection status shows "Not Connected"
- [ ] Recent activities cleared
- [ ] Athlete info cleared
- [ ] Tokens removed from storage

---

## 🐛 Troubleshooting

### Issue: "Failed to authenticate"
**Solutions:**
- Check Strava API credentials in `.env`
- Verify redirect URI matches Strava app settings
- Ensure app scheme is configured in `app.json`

### Issue: "Token expired"
**Solutions:**
- Tokens refresh automatically
- If refresh fails, disconnect and reconnect
- Check refresh token is valid

### Issue: "Workout not verified"
**Solutions:**
- Ensure workout logged to Strava before quest completion
- Check time window (workout must be between quest start and completion)
- Verify workout type matches quest requirements
- Check workout duration meets minimum

### Issue: "Recent activities not loading"
**Solutions:**
- Check network connection
- Verify Strava API is not rate-limited
- Ensure access token has `activity:read_all` scope

---

## 📊 Rate Limits

Strava API rate limits:
- **15-minute limit**: 100 requests per 15 minutes
- **Daily limit**: 1,000 requests per day

**Best Practices:**
- Cache recent activities (refresh every 5-10 minutes max)
- Only verify workout on quest completion (not continuously)
- Batch activity requests when possible

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Apple Health integration (iOS)
- [ ] Google Fit integration (Android)
- [ ] Real-time activity streaming
- [ ] Live workout tracking in-app
- [ ] Fitness leaderboards
- [ ] Weekly fitness challenges
- [ ] Achievement badges for milestones
- [ ] Social features (share workouts with guild)

### Advanced Features
- [ ] Heart rate zones for quest difficulty
- [ ] GPS route tracking for collection quests
- [ ] Integration with smart watches
- [ ] Offline workout sync
- [ ] Custom workout creation
- [ ] Training plans with quest integration

---

## 📚 Resources

- [Strava API Documentation](https://developers.strava.com/docs/)
- [OAuth 2.0 Guide](https://developers.strava.com/docs/authentication/)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)

---

**Last Updated**: 2025-10-04
**Version**: 1.0.0
**Status**: ✅ Complete and Ready for Testing

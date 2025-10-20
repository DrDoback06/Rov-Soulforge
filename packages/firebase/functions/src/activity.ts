import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { ActivityEvent, ActivitySource, Character } from '@rov/types';

const db = admin.firestore();

/**
 * Submit activity event
 * HTTPS Callable function
 */
export const submitActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { activity } = data;
  if (!activity) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing activity data');
  }

  const { source, kind, start, end, distanceM, steps, avgHr, elevGainM, proofs } = activity;

  // Validate input
  if (!source || !kind || !start || !end) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Validate activity (anti-cheat)
    const validation = validateActivity({
      source,
      kind,
      start,
      end,
      distanceM,
      steps,
      avgHr,
      elevGainM,
      proofs
    });

    if (!validation.valid) {
      throw new functions.https.HttpsError('invalid-argument', validation.reason || 'Invalid activity');
    }

    // Create activity event
    const activityRef = db.collection('activityEvents').doc();

    const activityEvent: ActivityEvent = {
      id: activityRef.id,
      uid: context.auth.uid,
      source: source as ActivitySource,
      kind,
      start,
      end,
      distanceM,
      steps,
      avgHr,
      elevGainM,
      proofs
    };

    await activityRef.set({
      ...activityEvent,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Calculate user streak
    const userActivities = await db.collection('activityEvents')
      .where('uid', '==', context.auth.uid)
      .orderBy('start', 'desc')
      .limit(30)
      .get();

    const activityDates = userActivities.docs.map(doc => doc.data().start);
    const streak = calculateActivityStreak(activityDates);

    // Get daily activity count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + (24 * 60 * 60 * 1000);

    const todayActivities = await db.collection('activityEvents')
      .where('uid', '==', context.auth.uid)
      .where('start', '>=', todayStart)
      .where('start', '<', todayEnd)
      .get();

    const dailyCount = todayActivities.size;

    // Calculate fitness rewards
    const rewards = calculateFitnessRewards(activityEvent, streak, dailyCount);

    // Apply rewards to character
    const characterRef = db.collection('characters').doc(context.auth.uid);
    const characterSnap = await characterRef.get();

    if (characterSnap.exists()) {
      const updates: any = {
        'counters.xp': admin.firestore.FieldValue.increment(rewards.xp),
        gold: admin.firestore.FieldValue.increment(rewards.gold)
      };

      if (rewards.renown > 0) {
        updates['counters.renown'] = admin.firestore.FieldValue.increment(rewards.renown);
      }

      await characterRef.update(updates);

      // Store temporary buffs
      if (rewards.temporaryBuffs && rewards.temporaryBuffs.length > 0) {
        const buffsRef = db.collection('characters').doc(context.auth.uid).collection('activeBuffs');
        
        const buffPromises = rewards.temporaryBuffs.map(buff => 
          buffsRef.add({
            ...buff,
            source: 'fitness_activity',
            activityId: activityRef.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        );

        await Promise.all(buffPromises);
      }
    }

    // Check for quest progress that requires this activity
    await checkActivityQuests(context.auth.uid, activityEvent);

    return {
      success: true,
      activityId: activityRef.id,
      validated: true,
      rewards: {
        gold: rewards.gold,
        xp: rewards.xp,
        renown: rewards.renown,
        temporaryBuffs: rewards.temporaryBuffs,
        streakBonus: rewards.streakBonus
      }
    };
  } catch (error) {
    console.error('Error submitting activity:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to submit activity');
  }
});

/**
 * Calculate fitness rewards (imported logic)
 */
function calculateFitnessRewards(
  activity: ActivityEvent,
  userStreak: number = 0,
  dailyActivityCount: number = 0
): any {
  const reward: any = {
    gold: 0,
    xp: 0,
    renown: 0,
    temporaryBuffs: []
  };

  // Distance rewards: 1 Gold per 0.5km (max 20/day)
  if (activity.distanceM) {
    const distanceKm = activity.distanceM / 1000;
    const distanceGold = Math.floor(distanceKm / 0.5);
    const dailyDistanceCap = 20;
    
    reward.gold += Math.min(distanceGold, dailyDistanceCap - Math.min(dailyActivityCount * 5, dailyDistanceCap));
  }

  // Elevation rewards: 1 Gold per 100m (max 10/day)
  if (activity.elevGainM) {
    const elevGold = Math.floor(activity.elevGainM / 100);
    const dailyElevCap = 10;
    
    reward.gold += Math.min(elevGold, dailyElevCap);
  }

  // Activity type XP bonuses
  const xpByActivityType: any = {
    'run': 30,
    'hike': 25,
    'bike': 20,
    'walk': 15,
    'hr-session': 10
  };

  reward.xp = xpByActivityType[activity.kind] || 10;

  // Duration bonus XP (5 XP per 10 minutes)
  const durationMinutes = (activity.end - activity.start) / (1000 * 60);
  reward.xp += Math.floor(durationMinutes / 10) * 5;

  // Streak bonuses
  if (userStreak >= 30) {
    reward.streakBonus = { days: userStreak, multiplier: 1.5 };
    reward.xp = Math.floor(reward.xp * 1.5);
  } else if (userStreak >= 7) {
    reward.streakBonus = { days: userStreak, multiplier: 1.2 };
    reward.xp = Math.floor(reward.xp * 1.2);
  } else if (userStreak >= 3) {
    reward.streakBonus = { days: userStreak, multiplier: 1.1 };
    reward.xp = Math.floor(reward.xp * 1.1);
  }

  // Heart rate based temporary buffs
  if (activity.avgHr && activity.avgHr > 0) {
    const now = Date.now();
    const estimatedMaxHr = 180;
    const hrPercent = (activity.avgHr / estimatedMaxHr) * 100;

    // High intensity = Attack buff
    if (hrPercent >= 70 && durationMinutes >= 2) {
      const buffDuration = 10 * 60 * 1000; // 10 minutes
      const buffAmount = Math.min(5, Math.floor(durationMinutes / 10));
      
      reward.temporaryBuffs.push({
        stat: 'atk',
        amount: buffAmount,
        durationMs: buffDuration,
        expiresAt: now + buffDuration
      });
    }
  }

  return reward;
}

/**
 * Calculate activity streak
 */
function calculateActivityStreak(activityDates: number[]): number {
  if (activityDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  let streak = 0;
  let currentDate = todayTimestamp;
  
  for (const activityTimestamp of activityDates) {
    const activityDate = new Date(activityTimestamp);
    activityDate.setHours(0, 0, 0, 0);
    const activityDateTimestamp = activityDate.getTime();
    
    if (activityDateTimestamp === currentDate || activityDateTimestamp === currentDate - (1000 * 60 * 60 * 24)) {
      streak++;
      currentDate = activityDateTimestamp - (1000 * 60 * 60 * 24);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Validate activity for anti-cheat
 */
function validateActivity(activity: Partial<ActivityEvent>): { valid: boolean; reason?: string } {
  const { start, end, distanceM, avgHr, proofs } = activity;

  if (!start || !end) {
    return { valid: false, reason: 'Missing timestamps' };
  }

  // Check duration
  const durationMs = end - start;
  const durationMin = durationMs / 1000 / 60;

  if (durationMin < 1) {
    return { valid: false, reason: 'Activity too short' };
  }

  if (durationMin > 720) {
    // Max 12 hours
    return { valid: false, reason: 'Activity too long' };
  }

  // Check distance vs duration (pace validation)
  if (distanceM && distanceM > 0) {
    const paceMinPerKm = durationMin / (distanceM / 1000);

    // Running: 3-12 min/km, Walking: 8-20 min/km
    if (paceMinPerKm < 2 || paceMinPerKm > 25) {
      return { valid: false, reason: 'Unrealistic pace' };
    }
  }

  // Check heart rate
  if (avgHr) {
    if (avgHr < 40 || avgHr > 220) {
      return { valid: false, reason: 'Invalid heart rate' };
    }
  }

  // Check proofs if available
  if (proofs) {
    if (proofs.gpsQuality === 'poor' || !proofs.paceOK) {
      return { valid: false, reason: 'Poor GPS or unrealistic pace' };
    }
  }

  return { valid: true };
}

/**
 * Check if activity contributes to any active quests
 */
async function checkActivityQuests(uid: string, activity: ActivityEvent): Promise<void> {
  // Get active fitness quests
  const activeQuests = await db.collection('questProgress')
    .where('uid', '==', uid)
    .where('status', '==', 'active')
    .get();

  if (activeQuests.empty) {
    return;
  }

  const updates: Promise<any>[] = [];

  activeQuests.docs.forEach(doc => {
    const progress = doc.data();

    // Check if quest requires this activity type
    // This would check against quest requirements (fitness challenges)
    const contributed = checkActivityContribution(progress, activity);

    if (contributed) {
      // Update quest progress
      updates.push(
        doc.ref.update({
          progress: {
            ...progress.progress,
            activities: admin.firestore.FieldValue.arrayUnion(activity.id)
          }
        })
      );

      // Check if quest is now complete
      // This would validate all requirements
      // For now, simplified logic
      const isComplete = checkQuestComplete(progress, activity);

      if (isComplete) {
        updates.push(
          doc.ref.update({
            status: 'ready'
          })
        );
      }
    }
  });

  await Promise.all(updates);
}

/**
 * Check if activity contributes to quest
 */
function checkActivityContribution(progress: any, activity: ActivityEvent): boolean {
  // Simplified logic - in full implementation, check against quest requirements
  return true;
}

/**
 * Check if quest requirements are complete
 */
function checkQuestComplete(progress: any, activity: ActivityEvent): boolean {
  // Simplified logic - in full implementation, validate all requirements
  return false;
}

/**
 * Sync activity from third-party service
 * HTTPS Callable function
 */
export const syncThirdPartyActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { source, accessToken } = data;

  if (!source || !accessToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing source or accessToken');
  }

  try {
    // Fetch activities from third-party API
    // This would use the accessToken to call Strava/Garmin/WHOOP APIs
    const activities = await fetchThirdPartyActivities(source, accessToken);

    // Import each activity
    const imports = activities.map(async (activity: any) => {
      // Check if already imported
      const existing = await db.collection('activityEvents')
        .where('uid', '==', context.auth!.uid)
        .where('source', '==', source)
        .where('start', '==', activity.start)
        .get();

      if (!existing.empty) {
        return { skipped: true, reason: 'Already imported' };
      }

      // Import activity
      const result = await submitActivity.run(
        {
          ...activity,
          source
        },
        {
          auth: context.auth!,
          rawRequest: {} as any
        }
      );

      return result;
    });

    const results = await Promise.all(imports);

    return {
      imported: results.filter(r => !r.skipped).length,
      skipped: results.filter(r => r.skipped).length
    };
  } catch (error) {
    console.error('Error syncing third-party activity:', error);
    throw new functions.https.HttpsError('internal', 'Failed to sync activities');
  }
});

/**
 * Fetch activities from third-party service
 */
async function fetchThirdPartyActivities(
  source: ActivitySource,
  accessToken: string
): Promise<any[]> {
  // In full implementation, call third-party APIs
  // Strava: https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities
  // Garmin: https://developer.garmin.com/connect-iq/api-docs/
  // WHOOP: https://developer.whoop.com/api

  return [];
}

/**
 * Clean up old activity events (keep last 90 days)
 * Scheduled function (runs daily)
 */
export const cleanupOldActivities = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days

    const oldActivities = await db.collection('activityEvents')
      .where('start', '<', cutoff)
      .limit(500)
      .get();

    if (oldActivities.empty) {
      return;
    }

    console.log(`Cleaning up ${oldActivities.size} old activities`);

    const batch = db.batch();
    oldActivities.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  });
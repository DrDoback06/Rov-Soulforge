import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as geofireCommon from 'geofire-common';
import type { Quest, QuestProgress, Character } from '@rov/types';

const db = admin.firestore();

/**
 * Regional spawn budget configuration
 */
interface RegionBudget {
  region: string;
  maxActiveQuests: number;
  spawnRatePerHour: number;
  rarityWeights: Record<string, number>;
}

const REGION_BUDGETS: RegionBudget[] = [
  {
    region: 'us-west',
    maxActiveQuests: 100,
    spawnRatePerHour: 20,
    rarityWeights: { Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 }
  },
  {
    region: 'us-east',
    maxActiveQuests: 100,
    spawnRatePerHour: 20,
    rarityWeights: { Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 }
  },
  {
    region: 'eu-west',
    maxActiveQuests: 80,
    spawnRatePerHour: 15,
    rarityWeights: { Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 }
  }
];

/**
 * Spawn dynamic quests
 * Scheduled function (runs every 15 minutes)
 */
export const spawnQuests = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    console.log('Starting quest spawn cycle');

    for (const regionBudget of REGION_BUDGETS) {
      try {
        await spawnQuestsForRegion(regionBudget);
      } catch (error) {
        console.error(`Error spawning quests for ${regionBudget.region}:`, error);
      }
    }

    console.log('Quest spawn cycle complete');
  });

/**
 * Spawn quests for a specific region
 */
async function spawnQuestsForRegion(budget: RegionBudget): Promise<void> {
  // Count active quests in region
  const activeQuests = await db.collection('activeQuests')
    .where('region', '==', budget.region)
    .where('expireAt', '>', Date.now())
    .get();

  const currentCount = activeQuests.size;

  if (currentCount >= budget.maxActiveQuests) {
    console.log(`Region ${budget.region} at capacity (${currentCount}/${budget.maxActiveQuests})`);
    return;
  }

  // Calculate how many to spawn (15min = 0.25 hours)
  const spawnCount = Math.floor(budget.spawnRatePerHour * 0.25);
  const toSpawn = Math.min(spawnCount, budget.maxActiveQuests - currentCount);

  console.log(`Spawning ${toSpawn} quests for region ${budget.region}`);

  // Load quest templates
  const questTemplates = await loadQuestTemplates();

  for (let i = 0; i < toSpawn; i++) {
    const quest = selectRandomQuest(questTemplates, budget.rarityWeights);
    if (quest) {
      await spawnQuest(quest, budget.region);
    }
  }
}

/**
 * Load quest templates from database
 */
async function loadQuestTemplates(): Promise<Quest[]> {
  // In full implementation, load from imported quest data
  // For now, return placeholder
  return [];
}

/**
 * Select a random quest based on rarity weights
 */
function selectRandomQuest(
  quests: Quest[],
  weights: Record<string, number>
): Quest | null {
  if (quests.length === 0) return null;

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const roll = Math.random() * totalWeight;

  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll <= cumulative) {
      const filtered = quests.filter(q => q.rarity === rarity);
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)];
      }
    }
  }

  return quests[Math.floor(Math.random() * quests.length)];
}

/**
 * Spawn a single quest at a random location
 */
async function spawnQuest(quest: Quest, region: string): Promise<void> {
  // Generate random location within region bounds
  const location = generateRandomLocation(region);

  // Calculate expiration time
  const expireAt = Date.now() + (quest.timerSec * 1000);

  // Create quest instance
  const questRef = db.collection('activeQuests').doc();

  await questRef.set({
    id: questRef.id,
    questId: quest.id,
    title: quest.title,
    description: quest.description,
    type: quest.type,
    rarity: quest.rarity,
    region,
    location: {
      lat: location.lat,
      lng: location.lng,
      geohash: geofireCommon.geohashForLocation([location.lat, location.lng]),
      radiusM: quest.spawnRules?.geofenceM || 100
    },
    requirements: quest.requirements,
    rewards: quest.rewards,
    timerSec: quest.timerSec,
    expireAt,
    activeParticipants: [],
    completionCount: 0,
    maxCompletions: quest.maxCompletions || -1,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Spawned quest ${quest.id} at (${location.lat}, ${location.lng})`);
}

/**
 * Generate random location within region
 */
function generateRandomLocation(region: string): { lat: number; lng: number } {
  // Simplified region bounds
  const bounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
    'us-west': { minLat: 32, maxLat: 48, minLng: -125, maxLng: -110 },
    'us-east': { minLat: 25, maxLat: 47, minLng: -85, maxLng: -67 },
    'eu-west': { minLat: 48, maxLat: 60, minLng: -10, maxLng: 10 }
  };

  const bound = bounds[region] || bounds['us-west'];

  return {
    lat: bound.minLat + Math.random() * (bound.maxLat - bound.minLat),
    lng: bound.minLng + Math.random() * (bound.maxLng - bound.minLng)
  };
}

/**
 * Clean up expired quests
 * Scheduled function (runs every 5 minutes)
 */
export const cleanupExpiredQuests = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = Date.now();

    const expiredQuests = await db.collection('activeQuests')
      .where('expireAt', '<=', now)
      .limit(100)
      .get();

    if (expiredQuests.empty) {
      return;
    }

    console.log(`Cleaning up ${expiredQuests.size} expired quests`);

    const batch = db.batch();
    expiredQuests.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  });

/**
 * Start a quest
 * HTTPS Callable function
 */
export const startQuest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { questId, location } = data;

  if (!questId || !location) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing questId or location');
  }

  try {
    // Load quest
    const questDoc = await db.collection('activeQuests').doc(questId).get();

    if (!questDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Quest not found or expired');
    }

    const quest = questDoc.data();

    // Verify user is within geofence
    const distance = geofireCommon.distanceBetween(
      [location.lat, location.lng],
      [quest.location.lat, quest.location.lng]
    );

    const distanceM = distance * 1000; // Convert km to m

    if (distanceM > quest.location.radiusM) {
      throw new functions.https.HttpsError('failed-precondition', 'Not within quest area');
    }

    // Check if user already has active progress for this quest
    const existingProgress = await db.collection('questProgress')
      .where('uid', '==', context.auth.uid)
      .where('questId', '==', questId)
      .where('status', 'in', ['active', 'ready'])
      .get();

    if (!existingProgress.empty) {
      throw new functions.https.HttpsError('already-exists', 'Quest already in progress');
    }

    // Create quest progress
    const progressRef = db.collection('questProgress').doc();

    await progressRef.set({
      id: progressRef.id,
      uid: context.auth.uid,
      questId,
      status: 'active',
      progress: {},
      startedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add user to active participants
    await questDoc.ref.update({
      activeParticipants: admin.firestore.FieldValue.arrayUnion(context.auth.uid)
    });

    return {
      progressId: progressRef.id,
      quest
    };
  } catch (error) {
    console.error('Error starting quest:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to start quest');
  }
});

/**
 * Complete a quest
 * HTTPS Callable function
 */
export const completeQuest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { progressId } = data;

  if (!progressId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing progressId');
  }

  try {
    return await db.runTransaction(async (transaction) => {
      const progressRef = db.collection('questProgress').doc(progressId);
      const progressDoc = await transaction.get(progressRef);

      if (!progressDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Quest progress not found');
      }

      const progress = progressDoc.data() as QuestProgress;

      // Verify ownership
      if (progress.uid !== context.auth!.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not your quest');
      }

      // Verify quest is ready to complete
      if (progress.status !== 'ready') {
        throw new functions.https.HttpsError('failed-precondition', 'Quest requirements not met');
      }

      // Load quest
      const questDoc = await transaction.get(db.collection('activeQuests').doc(progress.questId));

      if (!questDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Quest expired');
      }

      const quest = questDoc.data();

      // Load character
      const charSnapshot = await transaction.get(
        db.collection('characters')
          .where('uid', '==', context.auth!.uid)
          .limit(1)
      );

      if (charSnapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'Character not found');
      }

      const charDoc = charSnapshot.docs[0];
      const char = charDoc.data() as Character;

      // Grant rewards
      const rewards = quest.rewards || [];

      let goldReward = 0;
      let xpReward = 0;
      let renownReward = 0;

      rewards.forEach((reward: any) => {
        if (reward.type === 'gold') goldReward += reward.amount;
        if (reward.type === 'xp') xpReward += reward.amount;
        if (reward.type === 'renown') renownReward += reward.amount;
      });

      // Update character
      transaction.update(charDoc.ref, {
        gold: char.gold + goldReward,
        'counters.xp': char.counters.xp + xpReward,
        'counters.renown': char.counters.renown + renownReward
      });

      // Mark progress as completed
      transaction.update(progressRef, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update quest completion count
      transaction.update(questDoc.ref, {
        completionCount: admin.firestore.FieldValue.increment(1),
        activeParticipants: admin.firestore.FieldValue.arrayRemove(context.auth!.uid)
      });

      return {
        rewards: {
          gold: goldReward,
          xp: xpReward,
          renown: renownReward
        }
      };
    });
  } catch (error) {
    console.error('Error completing quest:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to complete quest');
  }
});

/**
 * Query nearby quests
 * HTTPS Callable function
 */
export const getNearbyQuests = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { lat, lng, radiusKm } = data;

  if (lat === undefined || lng === undefined || !radiusKm) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing location or radius');
  }

  try {
    // Calculate geohash bounds
    const center = [lat, lng];
    const radiusM = radiusKm * 1000;

    const bounds = geofireCommon.geohashQueryBounds(center, radiusM);

    // Query all geohash ranges
    const promises = bounds.map(bound => {
      return db.collection('activeQuests')
        .where('location.geohash', '>=', bound[0])
        .where('location.geohash', '<=', bound[1])
        .where('expireAt', '>', Date.now())
        .get();
    });

    const snapshots = await Promise.all(promises);

    // Flatten results and filter by actual distance
    const quests: any[] = [];

    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        const quest = doc.data();

        const distance = geofireCommon.distanceBetween(
          center,
          [quest.location.lat, quest.location.lng]
        );

        if (distance <= radiusKm) {
          quests.push({
            ...quest,
            distanceKm: distance
          });
        }
      });
    });

    // Sort by distance
    quests.sort((a, b) => a.distanceKm - b.distanceKm);

    return { quests };
  } catch (error) {
    console.error('Error querying nearby quests:', error);
    throw new functions.https.HttpsError('internal', 'Failed to query quests');
  }
});
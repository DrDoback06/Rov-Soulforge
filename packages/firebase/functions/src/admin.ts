import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { Quest, CardDef } from '@rov/types';

const db = admin.firestore();

/**
 * Admin middleware - verify admin claims
 */
function requireAdmin(context: functions.https.CallableContext): void {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
}

/**
 * Import card data
 * HTTPS Callable function (Admin only)
 */
export const importCards = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const { cards } = data;

  if (!cards || !Array.isArray(cards)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid cards array');
  }

  try {
    const batch = db.batch();
    const cardsRef = db.collection('cards');

    cards.forEach((card: CardDef) => {
      const cardRef = cardsRef.doc(card.id);
      batch.set(cardRef, card);
    });

    await batch.commit();

    return {
      success: true,
      imported: cards.length
    };
  } catch (error) {
    console.error('Error importing cards:', error);
    throw new functions.https.HttpsError('internal', 'Failed to import cards');
  }
});

/**
 * Import quest data
 * HTTPS Callable function (Admin only)
 */
export const importQuests = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const { quests } = data;

  if (!quests || !Array.isArray(quests)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid quests array');
  }

  try {
    const batch = db.batch();
    const questsRef = db.collection('questTemplates');

    quests.forEach((quest: Quest) => {
      const questRef = questsRef.doc(quest.id);
      batch.set(questRef, quest);
    });

    await batch.commit();

    return {
      success: true,
      imported: quests.length
    };
  } catch (error) {
    console.error('Error importing quests:', error);
    throw new functions.https.HttpsError('internal', 'Failed to import quests');
  }
});

/**
 * Manually spawn a quest
 * HTTPS Callable function (Admin only)
 */
export const spawnQuestManual = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const { questId, location, region } = data;

  if (!questId || !location || !region) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Load quest template
    const questDoc = await db.collection('questTemplates').doc(questId).get();

    if (!questDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Quest template not found');
    }

    const quest = questDoc.data() as Quest;

    // Import geohash calculation
    const geofireCommon = require('geofire-common');

    // Create active quest
    const activeQuestRef = db.collection('activeQuests').doc();

    await activeQuestRef.set({
      id: activeQuestRef.id,
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
      expireAt: Date.now() + (quest.timerSec * 1000),
      activeParticipants: [],
      completionCount: 0,
      maxCompletions: quest.maxCompletions || -1,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      questId: activeQuestRef.id
    };
  } catch (error) {
    console.error('Error spawning quest:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to spawn quest');
  }
});

/**
 * Grant gold to user
 * HTTPS Callable function (Admin only)
 */
export const grantGold = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const { uid, amount } = data;

  if (!uid || !amount) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing uid or amount');
  }

  try {
    const charSnapshot = await db.collection('characters')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (charSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Character not found');
    }

    await charSnapshot.docs[0].ref.update({
      gold: admin.firestore.FieldValue.increment(amount)
    });

    return {
      success: true,
      granted: amount
    };
  } catch (error) {
    console.error('Error granting gold:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to grant gold');
  }
});

/**
 * Set admin claim
 * HTTPS Callable function (requires existing admin)
 */
export const setAdminClaim = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const { uid, isAdmin } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing uid');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });

    return {
      success: true,
      uid,
      admin: isAdmin
    };
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set admin claim');
  }
});

/**
 * Update game config
 * HTTPS Callable function (Admin only)
 */
export const updateGameConfig = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const { configKey, value } = data;

  if (!configKey) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing configKey');
  }

  try {
    await db.collection('config').doc(configKey).set(
      { value, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    return {
      success: true,
      configKey,
      value
    };
  } catch (error) {
    console.error('Error updating config:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update config');
  }
});

/**
 * Get analytics data
 * HTTPS Callable function (Admin only)
 */
export const getAnalytics = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  try {
    // Get various stats
    const [
      userCount,
      characterCount,
      activeBattles,
      activeQuests,
      todaysPurchases
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('characters').count().get(),
      db.collection('battles').where('state', '==', 'active').count().get(),
      db.collection('activeQuests').count().get(),
      db.collection('purchases')
        .where('verifiedAt', '>=', admin.firestore.Timestamp.fromMillis(Date.now() - 86400000))
        .count()
        .get()
    ]);

    return {
      users: userCount.data().count,
      characters: characterCount.data().count,
      activeBattles: activeBattles.data().count,
      activeQuests: activeQuests.data().count,
      todaysPurchases: todaysPurchases.data().count
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get analytics');
  }
});
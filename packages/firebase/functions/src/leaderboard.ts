import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { Character } from '@rov/types';

const db = admin.firestore();

/**
 * Leaderboard types
 */
export type LeaderboardType = 'renown' | 'level' | 'gold' | 'battles' | 'quests';

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  uid: string;
  characterId: string;
  characterName: string;
  score: number;
  rank: number;
  updatedAt: number;
}

/**
 * Update leaderboards when character changes
 * Triggered on character document updates
 */
export const updateLeaderboards = functions.firestore
  .document('characters/{characterId}')
  .onWrite(async (change, context) => {
    const characterId = context.params.characterId;

    // Check if document was deleted
    if (!change.after.exists) {
      // Remove from all leaderboards
      await removeFromLeaderboards(characterId);
      return;
    }

    const character = change.after.data() as Character;

    // Update each leaderboard type
    await Promise.all([
      updateLeaderboard('renown', character),
      updateLeaderboard('level', character),
      updateLeaderboard('gold', character)
    ]);
  });

/**
 * Update a specific leaderboard
 */
async function updateLeaderboard(
  type: LeaderboardType,
  character: Character
): Promise<void> {
  const leaderboardRef = db.collection('leaderboards').doc(`${type}_${character.id}`);

  let score = 0;

  switch (type) {
    case 'renown':
      score = character.counters.renown;
      break;
    case 'level':
      score = character.level;
      break;
    case 'gold':
      score = character.gold;
      break;
  }

  await leaderboardRef.set({
    uid: character.uid,
    characterId: character.id,
    characterName: character.classId || 'Adventurer',
    type,
    score,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Remove character from all leaderboards
 */
async function removeFromLeaderboards(characterId: string): Promise<void> {
  const types: LeaderboardType[] = ['renown', 'level', 'gold', 'battles', 'quests'];

  const deletes = types.map(type =>
    db.collection('leaderboards').doc(`${type}_${characterId}`).delete()
  );

  await Promise.all(deletes);
}

/**
 * Get leaderboard rankings
 * HTTPS Callable function
 */
export const getLeaderboard = functions.https.onCall(async (data, context) => {
  const { type, limit = 100, offset = 0 } = data;

  if (!['renown', 'level', 'gold', 'battles', 'quests'].includes(type)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid leaderboard type');
  }

  try {
    const snapshot = await db.collection('leaderboards')
      .where('type', '==', type)
      .orderBy('score', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const entries: LeaderboardEntry[] = [];
    let rank = offset + 1;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      entries.push({
        uid: data.uid,
        characterId: data.characterId,
        characterName: data.characterName,
        score: data.score,
        rank: rank++,
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      });
    });

    return { entries, type };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get leaderboard');
  }
});

/**
 * Get player rank on leaderboard
 * HTTPS Callable function
 */
export const getPlayerRank = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { type } = data;

  if (!['renown', 'level', 'gold', 'battles', 'quests'].includes(type)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid leaderboard type');
  }

  try {
    // Get player's character
    const charSnapshot = await db.collection('characters')
      .where('uid', '==', context.auth.uid)
      .limit(1)
      .get();

    if (charSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Character not found');
    }

    const char = charSnapshot.docs[0].data() as Character;
    const characterId = char.id;

    // Get player's score
    const leaderboardDoc = await db.collection('leaderboards')
      .doc(`${type}_${characterId}`)
      .get();

    if (!leaderboardDoc.exists) {
      return { rank: null, score: 0, total: 0 };
    }

    const playerScore = leaderboardDoc.data()?.score || 0;

    // Count how many players have higher scores
    const higherScores = await db.collection('leaderboards')
      .where('type', '==', type)
      .where('score', '>', playerScore)
      .count()
      .get();

    const rank = higherScores.data().count + 1;

    // Get total players on leaderboard
    const total = await db.collection('leaderboards')
      .where('type', '==', type)
      .count()
      .get();

    return {
      rank,
      score: playerScore,
      total: total.data().count,
      characterName: char.classId || 'Adventurer'
    };
  } catch (error) {
    console.error('Error getting player rank:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get rank');
  }
});

/**
 * Get nearby players on leaderboard (within +/- 10 ranks)
 * HTTPS Callable function
 */
export const getNearbyRanks = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { type } = data;

  try {
    // Get player's rank
    const rankData = await getPlayerRank.run({ type }, {
      auth: context.auth,
      rawRequest: {} as any
    });

    if (!rankData.rank) {
      return { entries: [], playerRank: null };
    }

    const playerRank = rankData.rank;
    const offset = Math.max(0, playerRank - 10);

    // Get surrounding players
    const snapshot = await db.collection('leaderboards')
      .where('type', '==', type)
      .orderBy('score', 'desc')
      .limit(20)
      .offset(offset)
      .get();

    const entries: LeaderboardEntry[] = [];
    let rank = offset + 1;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      entries.push({
        uid: data.uid,
        characterId: data.characterId,
        characterName: data.characterName,
        score: data.score,
        rank: rank++,
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      });
    });

    return {
      entries,
      playerRank,
      playerUid: context.auth.uid
    };
  } catch (error) {
    console.error('Error getting nearby ranks:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get nearby ranks');
  }
});

/**
 * Reset seasonal leaderboards
 * HTTPS Callable function (Admin only)
 */
export const resetLeaderboards = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { type } = data;

  try {
    if (type) {
      // Reset specific leaderboard
      const snapshot = await db.collection('leaderboards')
        .where('type', '==', type)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return { success: true, deleted: snapshot.size, type };
    } else {
      // Reset all leaderboards
      const snapshot = await db.collection('leaderboards').get();

      const batches: any[] = [];
      let batch = db.batch();
      let count = 0;

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;

        // Firestore batch limit is 500
        if (count === 500) {
          batches.push(batch.commit());
          batch = db.batch();
          count = 0;
        }
      });

      if (count > 0) {
        batches.push(batch.commit());
      }

      await Promise.all(batches);

      return { success: true, deleted: snapshot.size, type: 'all' };
    }
  } catch (error) {
    console.error('Error resetting leaderboards:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reset leaderboards');
  }
});
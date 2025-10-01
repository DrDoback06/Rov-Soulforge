import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { Battle, Character, BattleMode } from '@rov/types';
import { BattleManager } from '@rov/logic';

const db = admin.firestore();

/**
 * Create a new battle
 * HTTPS Callable function
 */
export const createBattle = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { participants, mode, ranked, bossId } = data;

  // Validate input
  if (!participants || !Array.isArray(participants) || participants.length < 2) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid participants');
  }

  if (!mode || !['pvp', 'coop', 'ranked'].includes(mode)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid battle mode');
  }

  // Verify caller is a participant
  if (!participants.includes(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Caller must be a participant');
  }

  try {
    // Load character data for all participants
    const charDocs = await Promise.all(
      participants.map(uid =>
        db.collection('characters')
          .where('uid', '==', uid)
          .limit(1)
          .get()
      )
    );

    const characters = new Map<string, Character>();
    charDocs.forEach(snapshot => {
      if (!snapshot.empty) {
        const char = snapshot.docs[0].data() as Character;
        characters.set(char.id, char);
      }
    });

    // Verify all participants have characters
    if (characters.size !== participants.length) {
      throw new functions.https.HttpsError('failed-precondition', 'All participants must have characters');
    }

    // Create battle ID
    const battleRef = db.collection('battles').doc();
    const battleId = battleRef.id;

    // Initialize battle manager
    const battleManager = new BattleManager(
      battleId,
      participants,
      characters,
      { mode: mode as BattleMode, ranked, bossId }
    );

    const battleState = battleManager.getState();

    // Save to Firestore
    await battleRef.set({
      ...battleState,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      battleId,
      turnOrder: battleState.turnOrder,
      currentTurn: battleState.currentTurn
    };
  } catch (error) {
    console.error('Error creating battle:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create battle');
  }
});

/**
 * Execute a battle action
 * HTTPS Callable function
 */
export const executeBattleAction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { battleId, action } = data;

  if (!battleId || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing battleId or action');
  }

  try {
    // Use transaction to ensure consistency
    const result = await db.runTransaction(async (transaction) => {
      const battleRef = db.collection('battles').doc(battleId);
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Battle not found');
      }

      const battle = battleDoc.data() as Battle;

      // Verify caller is a participant
      if (!battle.participants.includes(context.auth!.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Not a participant');
      }

      // Verify action is from the caller's character
      if (action.charId !== context.auth!.uid && action.type !== 'playInstant') {
        throw new functions.https.HttpsError('permission-denied', 'Invalid character');
      }

      // Load all characters
      const charDocs = await Promise.all(
        battle.participants.map(uid =>
          transaction.get(
            db.collection('characters')
              .where('uid', '==', uid)
              .limit(1)
          )
        )
      );

      const characters = new Map<string, Character>();
      charDocs.forEach(snapshot => {
        if (!snapshot.empty) {
          const char = snapshot.docs[0].data() as Character;
          characters.set(char.id, char);
        }
      });

      // Reconstruct battle manager
      const battleManager = new BattleManager(
        battleId,
        battle.participants,
        characters,
        { mode: battle.mode }
      );

      // Execute action
      const actionResult = battleManager.executeAction(action);

      if (!actionResult.success) {
        throw new functions.https.HttpsError('failed-precondition', actionResult.error || 'Action failed');
      }

      // Get updated state
      const updatedBattle = battleManager.getState();
      const updatedCharacters = battleManager.getAllCharacters();

      // Save updated battle state
      transaction.update(battleRef, {
        ...updatedBattle,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update character states
      updatedCharacters.forEach((char, charId) => {
        const charRef = db.collection('characters').doc(charId);
        transaction.update(charRef, {
          counters: char.counters,
          stats: char.stats,
          lives: char.lives
        });
      });

      return {
        success: true,
        battle: updatedBattle
      };
    });

    return result;
  } catch (error) {
    console.error('Error executing battle action:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to execute action');
  }
});

/**
 * Auto-pass turn on timeout
 * Scheduled function (runs every 5 seconds)
 */
export const checkBattleTimeouts = functions.pubsub
  .schedule('every 5 seconds')
  .onRun(async (context) => {
    const now = Date.now();

    // Query active battles with expired turns
    const expiredBattles = await db.collection('battles')
      .where('state', '==', 'active')
      .where('timers.turnEnd', '<=', now)
      .limit(10)
      .get();

    const updates = expiredBattles.docs.map(async (doc) => {
      const battle = doc.data() as Battle;

      try {
        // Load characters
        const charDocs = await Promise.all(
          battle.participants.map(uid =>
            db.collection('characters')
              .where('uid', '==', uid)
              .limit(1)
              .get()
          )
        );

        const characters = new Map<string, Character>();
        charDocs.forEach(snapshot => {
          if (!snapshot.empty) {
            const char = snapshot.docs[0].data() as Character;
            characters.set(char.id, char);
          }
        });

        // Reconstruct battle manager
        const battleManager = new BattleManager(
          doc.id,
          battle.participants,
          characters,
          { mode: battle.mode }
        );

        // Auto-pass turn
        battleManager.executeAction({
          type: 'passTurn',
          charId: battle.currentTurn!
        });

        const updatedBattle = battleManager.getState();

        // Update battle
        await doc.ref.update({
          ...updatedBattle,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Auto-passed turn for battle ${doc.id}`);
      } catch (error) {
        console.error(`Error auto-passing turn for battle ${doc.id}:`, error);
      }
    });

    await Promise.all(updates);
  });

/**
 * Grant battle rewards
 * Triggered when battle completes
 */
export const onBattleComplete = functions.firestore
  .document('battles/{battleId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Battle;
    const after = change.after.data() as Battle;

    // Check if battle just completed
    if (before.state === 'active' && after.state === 'completed') {
      console.log(`Battle ${context.params.battleId} completed`);

      // Find winner (last player standing)
      const charDocs = await Promise.all(
        after.participants.map(uid =>
          db.collection('characters')
            .where('uid', '==', uid)
            .limit(1)
            .get()
        )
      );

      const aliveChars = charDocs
        .flatMap(snapshot => snapshot.empty ? [] : [snapshot.docs[0]])
        .filter(doc => {
          const char = doc.data() as Character;
          return char.counters.hp > 0 && char.lives > 0;
        });

      if (aliveChars.length === 1) {
        const winnerDoc = aliveChars[0];
        const winner = winnerDoc.data() as Character;

        // Calculate rewards based on mode
        const rewards = calculateBattleRewards(after.mode, true);

        // Grant rewards
        await winnerDoc.ref.update({
          gold: admin.firestore.FieldValue.increment(rewards.gold),
          'counters.xp': admin.firestore.FieldValue.increment(rewards.xp),
          'counters.renown': admin.firestore.FieldValue.increment(rewards.renown)
        });

        console.log(`Granted rewards to winner ${winner.uid}: ${JSON.stringify(rewards)}`);

        // Grant participation rewards to losers
        const loserDocs = charDocs
          .flatMap(snapshot => snapshot.empty ? [] : [snapshot.docs[0]])
          .filter(doc => doc.id !== winnerDoc.id);

        const participationRewards = calculateBattleRewards(after.mode, false);

        await Promise.all(
          loserDocs.map(doc =>
            doc.ref.update({
              gold: admin.firestore.FieldValue.increment(participationRewards.gold),
              'counters.xp': admin.firestore.FieldValue.increment(participationRewards.xp)
            })
          )
        );

        console.log(`Granted participation rewards to ${loserDocs.length} players`);
      }
    }
  });

/**
 * Calculate battle rewards
 */
function calculateBattleRewards(
  mode: BattleMode,
  winner: boolean
): { gold: number; xp: number; renown: number } {
  const baseRewards = {
    pvp: { gold: 50, xp: 100, renown: 10 },
    ranked: { gold: 100, xp: 200, renown: 25 },
    coop: { gold: 75, xp: 150, renown: 15 }
  };

  const base = baseRewards[mode] || baseRewards.pvp;

  if (winner) {
    return {
      gold: base.gold * 2,
      xp: base.xp * 2,
      renown: base.renown
    };
  } else {
    return {
      gold: Math.floor(base.gold * 0.5),
      xp: Math.floor(base.xp * 0.5),
      renown: 0
    };
  }
}
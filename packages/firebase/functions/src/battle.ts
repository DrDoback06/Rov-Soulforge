import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { 
  Battle, 
  Character, 
  BattleMode, 
  CreateBattleRequest, 
  CreateBattleResponse,
  PlayCardRequest,
  PlayCardResponse,
  PassTurnRequest,
  PassTurnResponse,
  GetBattleRequest,
  GetBattleResponse,
  BattlePlayerState,
  BattleAIState,
  GameCard
} from '@rov/types';
import { BattleManager } from '@rov/logic';

const db = admin.firestore();

/**
 * Create a new battle
 * HTTPS Callable function
 */
export const createBattle = functions.https.onCall(async (data: CreateBattleRequest, context): Promise<CreateBattleResponse> => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { mode, participants, settings, aiOpponent } = data;

  // Validate input
  if (!participants || !Array.isArray(participants) || participants.length < 1) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid participants');
  }

  if (!mode || !['PvP', 'NPC', 'Boss', 'Coop'].includes(mode)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid battle mode');
  }

  // For PvP, need at least 2 participants
  if (mode === 'PvP' && participants.length < 2) {
    throw new functions.https.HttpsError('invalid-argument', 'PvP requires at least 2 participants');
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

    // Initialize player states
    const playerStates: Record<string, BattlePlayerState> = {};
    const turnOrder: string[] = [];

    for (const [charId, char] of characters) {
      // Load player's deck from inventory
      const inventoryRef = db.collection('inventories').doc(char.uid);
      const inventorySnap = await inventoryRef.get();
      const inventory = inventorySnap.exists ? inventorySnap.data() : { cards: [] };
      
      // Get deck cards (simplified - just take first 20 cards)
      const deckCards = (inventory?.cards || []).slice(0, 20);
      const deckCardIds = deckCards.map((card: GameCard) => card.id);
      
      // Shuffle deck
      const shuffledDeck = [...deckCardIds].sort(() => Math.random() - 0.5);
      
      // Draw initial hand (5 cards)
      const hand = shuffledDeck.slice(0, 5);
      const remainingDeck = shuffledDeck.slice(5);

      playerStates[charId] = {
        characterId: charId,
        userId: char.uid,
        hp: char.stats.hp,
        maxHp: char.stats.hp,
        mana: char.stats.mana,
        maxMana: char.stats.mana,
        lives: char.lives,
        maxLives: char.lives,
        hand,
        deck: remainingDeck,
        discard: [],
        buffs: [],
        debuffs: [],
        isActive: true,
        hasPassed: false
      };
      
      turnOrder.push(charId);
    }

    // Create AI opponent if specified
    let aiOpponentState: BattleAIState | undefined;
    if (aiOpponent) {
      const aiDeck = generateAIDeck(aiOpponent.difficulty);
      const shuffledAIDeck = [...aiDeck].sort(() => Math.random() - 0.5);
      const aiHand = shuffledAIDeck.slice(0, 5);
      const aiRemainingDeck = shuffledAIDeck.slice(5);

      aiOpponentState = {
        aiId: aiOpponent.aiId,
        name: `AI ${aiOpponent.difficulty}`,
        difficulty: aiOpponent.difficulty,
        hp: getAIStats(aiOpponent.difficulty).hp,
        maxHp: getAIStats(aiOpponent.difficulty).hp,
        mana: getAIStats(aiOpponent.difficulty).mana,
        maxMana: getAIStats(aiOpponent.difficulty).mana,
        lives: getAIStats(aiOpponent.difficulty).lives,
        maxLives: getAIStats(aiOpponent.difficulty).lives,
        deck: aiDeck,
        hand: aiHand,
        discard: [],
        behavior: getAIBehavior(aiOpponent.difficulty),
        isActive: true
      };
      
      turnOrder.push(aiOpponent.aiId);
    }

    // Create battle object
    const battle: Battle = {
      id: battleId,
      mode,
      participants,
      state: 'waiting',
      turnOrder,
      currentTurn: turnOrder[0],
      stack: [],
      log: [],
      timers: {
        ropeMs: settings?.timeLimitMs || 30000, // 30 seconds default
        maxMs: settings?.timeLimitMs || 30000,
        turnStart: Date.now()
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      battleSettings: {
        maxTurns: settings?.maxTurns || 50,
        timeLimitMs: settings?.timeLimitMs || 30000,
        allowSpectators: settings?.allowSpectators || false
      },
      playerStates,
      aiOpponent: aiOpponentState
    };

    // Save to Firestore
    await battleRef.set(battle);

    return {
      success: true,
      battleId,
      error: undefined
    };
  } catch (error) {
    console.error('Error creating battle:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create battle'
    };
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
 * Auto-pass turn on timeout and handle AI turns
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
        // Check if current turn is AI
        if (battle.aiOpponent && battle.currentTurn === battle.aiOpponent.aiId) {
          await handleAITurn(doc.id, battle);
        } else {
          // Auto-pass turn for human players
          await autoPassTurn(doc.id, battle);
        }
      } catch (error) {
        console.error(`Error handling turn for battle ${doc.id}:`, error);
      }
    });

    await Promise.all(updates);
  });

/**
 * Handle AI turn decision making
 */
async function handleAITurn(battleId: string, battle: Battle) {
  if (!battle.aiOpponent) return;

  const ai = battle.aiOpponent;
  const playerStates = battle.playerStates;
  
  // Get AI behavior
  const behavior = ai.behavior;
  
  // Simple AI decision making
  const shouldPlayCard = Math.random() < behavior.cardPlay;
  const shouldAttack = Math.random() < behavior.aggression;
  
  if (shouldPlayCard && ai.hand.length > 0) {
    // Play a random card from hand
    const randomCardIndex = Math.floor(Math.random() * ai.hand.length);
    const cardId = ai.hand[randomCardIndex];
    
    // Get targets based on behavior
    const targets = getAITargets(behavior.targetPriority, playerStates);
    
    // Play the card
    await playCard({
      battleId,
      playerId: ai.aiId,
      cardId,
      targets
    });
  } else if (shouldAttack) {
    // AI attacks with basic attack
    const targets = getAITargets(behavior.targetPriority, playerStates);
    
    // Create a basic attack effect
    const attackEffect = {
      type: 'damage',
      amount: 10 + Math.floor(Math.random() * 10) // 10-20 damage
    };
    
    // Add to stack
    const stackItem = {
      id: `ai_attack_${Date.now()}`,
      sourceCharId: ai.aiId,
      effect: attackEffect,
      targetIds: targets,
      timestamp: Date.now()
    };
    
    const updatedStack = [...battle.stack, stackItem];
    
    // Process stack resolution
    const { resolvedStack, updatedPlayerStates, battleLog } = await resolveStack(
      updatedStack, 
      playerStates, 
      ai
    );
    
    // Update battle
    await db.collection('battles').doc(battleId).update({
      stack: resolvedStack,
      playerStates: updatedPlayerStates,
      log: [...battle.log, ...battleLog],
      updatedAt: Date.now()
    });
  } else {
    // AI passes turn
    await passTurn({
      battleId,
      playerId: ai.aiId
    });
  }
}

/**
 * Get AI targets based on behavior
 */
function getAITargets(
  targetPriority: 'weakest' | 'strongest' | 'random' | 'balanced',
  playerStates: Record<string, BattlePlayerState>
): string[] {
  const targets = Object.keys(playerStates);
  
  if (targets.length === 0) return [];
  
  switch (targetPriority) {
    case 'weakest':
      return [targets.reduce((weakest, current) => 
        (playerStates[current].hp < playerStates[weakest].hp) ? current : weakest
      )];
    
    case 'strongest':
      return [targets.reduce((strongest, current) => 
        (playerStates[current].hp > playerStates[strongest].hp) ? current : strongest
      )];
    
    case 'random':
      return [targets[Math.floor(Math.random() * targets.length)]];
    
    case 'balanced':
    default:
      return targets;
  }
}

/**
 * Auto-pass turn for human players
 */
async function autoPassTurn(battleId: string, battle: Battle) {
  // Get current turn index
  const currentIndex = battle.turnOrder.indexOf(battle.currentTurn!);
  const nextIndex = (currentIndex + 1) % battle.turnOrder.length;
  const nextPlayer = battle.turnOrder[nextIndex];

  // Update battle state
  const updatedBattle: Battle = {
    ...battle,
    currentTurn: nextPlayer,
    playerStates: {
      ...battle.playerStates,
      [battle.currentTurn!]: {
        ...battle.playerStates[battle.currentTurn!],
        hasPassed: true,
        lastAction: Date.now()
      }
    },
    updatedAt: Date.now()
  };

  await db.collection('battles').doc(battleId).update(updatedBattle);
  console.log(`Auto-passed turn for battle ${battleId}`);
}

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
 * Play a card in battle
 * HTTPS Callable function
 */
export const playCard = functions.https.onCall(async (data: PlayCardRequest, context): Promise<PlayCardResponse> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { battleId, playerId, cardId, targets } = data;

  if (!battleId || !playerId || !cardId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const battleRef = db.collection('battles').doc(battleId);
    const battleDoc = await battleRef.get();

    if (!battleDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Battle not found');
    }

    const battle = battleDoc.data() as Battle;

    // Verify player is in battle
    if (!battle.participants.includes(playerId)) {
      throw new functions.https.HttpsError('permission-denied', 'Player not in battle');
    }

    // Verify it's player's turn
    if (battle.currentTurn !== playerId) {
      throw new functions.https.HttpsError('failed-precondition', 'Not your turn');
    }

    // Get player state
    const playerState = battle.playerStates[playerId];
    if (!playerState) {
      throw new functions.https.HttpsError('failed-precondition', 'Player state not found');
    }

    // Verify card is in hand
    if (!playerState.hand.includes(cardId)) {
      throw new functions.https.HttpsError('failed-precondition', 'Card not in hand');
    }

    // Get card data to determine effects
    const cardData = await getCardData(cardId);
    if (!cardData) {
      throw new functions.https.HttpsError('failed-precondition', 'Card data not found');
    }

    // Create stack item for the card effect
    const stackItem = {
      id: `stack_${Date.now()}_${Math.random()}`,
      sourceCharId: playerId,
      cardId: cardId,
      effect: cardData.skillEffect || { type: 'damage', amount: 10 },
      targetIds: targets,
      timestamp: Date.now()
    };

    // Add to stack (LIFO - Last In, First Out)
    const updatedStack = [...battle.stack, stackItem];

    // Move card from hand to discard
    const updatedHand = playerState.hand.filter(id => id !== cardId);
    const updatedDiscard = [...playerState.discard, cardId];

    // Process stack resolution
    const { resolvedStack, updatedPlayerStates, battleLog } = await resolveStack(updatedStack, battle.playerStates, battle.aiOpponent);

    // Update battle state
    const updatedBattle: Battle = {
      ...battle,
      stack: resolvedStack,
      playerStates: {
        ...battle.playerStates,
        [playerId]: {
          ...playerState,
          hand: updatedHand,
          discard: updatedDiscard,
          lastAction: Date.now()
        },
        ...updatedPlayerStates
      },
      log: [...battle.log, ...battleLog],
      updatedAt: Date.now()
    };

    await battleRef.update(updatedBattle);

    return {
      success: true,
      battleState: updatedBattle,
      error: undefined
    };
  } catch (error) {
    console.error('Error playing card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to play card'
    };
  }
});

/**
 * Pass turn in battle
 * HTTPS Callable function
 */
export const passTurn = functions.https.onCall(async (data: PassTurnRequest, context): Promise<PassTurnResponse> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { battleId, playerId } = data;

  if (!battleId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const battleRef = db.collection('battles').doc(battleId);
    const battleDoc = await battleRef.get();

    if (!battleDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Battle not found');
    }

    const battle = battleDoc.data() as Battle;

    // Verify player is in battle
    if (!battle.participants.includes(playerId)) {
      throw new functions.https.HttpsError('permission-denied', 'Player not in battle');
    }

    // Verify it's player's turn
    if (battle.currentTurn !== playerId) {
      throw new functions.https.HttpsError('failed-precondition', 'Not your turn');
    }

    // Get current turn index
    const currentIndex = battle.turnOrder.indexOf(playerId);
    const nextIndex = (currentIndex + 1) % battle.turnOrder.length;
    const nextPlayer = battle.turnOrder[nextIndex];

    // Update battle state
    const updatedBattle: Battle = {
      ...battle,
      currentTurn: nextPlayer,
      playerStates: {
        ...battle.playerStates,
        [playerId]: {
          ...battle.playerStates[playerId],
          hasPassed: true,
          lastAction: Date.now()
        }
      },
      updatedAt: Date.now()
    };

    await battleRef.update(updatedBattle);

    return {
      success: true,
      battleState: updatedBattle,
      error: undefined
    };
  } catch (error) {
    console.error('Error passing turn:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pass turn'
    };
  }
});

/**
 * Get battle state
 * HTTPS Callable function
 */
export const getBattle = functions.https.onCall(async (data: GetBattleRequest, context): Promise<GetBattleResponse> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { battleId, playerId } = data;

  if (!battleId || !playerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const battleRef = db.collection('battles').doc(battleId);
    const battleDoc = await battleRef.get();

    if (!battleDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Battle not found');
    }

    const battle = battleDoc.data() as Battle;

    // Verify player is in battle
    if (!battle.participants.includes(playerId)) {
      throw new functions.https.HttpsError('permission-denied', 'Player not in battle');
    }

    return {
      success: true,
      battle,
      error: undefined
    };
  } catch (error) {
    console.error('Error getting battle:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get battle'
    };
  }
});

/**
 * Generate AI deck based on difficulty
 */
function generateAIDeck(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Boss'): string[] {
  const deckSizes = {
    Easy: 15,
    Medium: 20,
    Hard: 25,
    Boss: 30
  };

  const deckSize = deckSizes[difficulty];
  const deck: string[] = [];

  // Generate mock card IDs (in real implementation, these would be actual card templates)
  for (let i = 0; i < deckSize; i++) {
    deck.push(`ai_card_${difficulty.toLowerCase()}_${i}`);
  }

  return deck;
}

/**
 * Get AI stats based on difficulty
 */
function getAIStats(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Boss') {
  const stats = {
    Easy: { hp: 50, mana: 20, lives: 1 },
    Medium: { hp: 75, mana: 30, lives: 1 },
    Hard: { hp: 100, mana: 40, lives: 2 },
    Boss: { hp: 150, mana: 60, lives: 3 }
  };

  return stats[difficulty];
}

/**
 * Get AI behavior based on difficulty
 */
function getAIBehavior(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Boss') {
  const behaviors = {
    Easy: { aggression: 0.3, defense: 0.7, cardPlay: 0.4, targetPriority: 'random' as const },
    Medium: { aggression: 0.5, defense: 0.5, cardPlay: 0.6, targetPriority: 'balanced' as const },
    Hard: { aggression: 0.7, defense: 0.3, cardPlay: 0.8, targetPriority: 'weakest' as const },
    Boss: { aggression: 0.9, defense: 0.1, cardPlay: 0.9, targetPriority: 'strongest' as const }
  };

  return behaviors[difficulty];
}

/**
 * Get card data from Firestore
 */
async function getCardData(cardId: string): Promise<GameCard | null> {
  try {
    // First try to find in inventories
    const inventoryQuery = await db.collection('inventories')
      .where('cards', 'array-contains', { id: cardId })
      .limit(1)
      .get();

    if (!inventoryQuery.empty) {
      const inventory = inventoryQuery.docs[0].data();
      const card = inventory.cards.find((c: GameCard) => c.id === cardId);
      if (card) return card;
    }

    // If not found in inventories, return mock data for now
    return {
      id: cardId,
      name: 'Mock Card',
      type: 'Skill',
      rarity: 'Common',
      image: '',
      description: 'Mock card for testing',
      cost: 1,
      usableInApp: true,
      statBonuses: {},
      skillEffect: { type: 'damage', amount: 10 },
      level: 1,
      count: 1,
      location: 'hand'
    };
  } catch (error) {
    console.error('Error getting card data:', error);
    return null;
  }
}

/**
 * Resolve the battle stack using LIFO (Last In, First Out) order
 */
async function resolveStack(
  stack: any[],
  playerStates: Record<string, BattlePlayerState>,
  aiOpponent?: BattleAIState
): Promise<{
  resolvedStack: any[];
  updatedPlayerStates: Record<string, BattlePlayerState>;
  battleLog: any[];
}> {
  const resolvedStack: any[] = [];
  const updatedPlayerStates = { ...playerStates };
  const battleLog: any[] = [];

  // Process stack in LIFO order (reverse order)
  const stackToProcess = [...stack].reverse();

  for (const stackItem of stackToProcess) {
    try {
      const result = await resolveStackItem(stackItem, updatedPlayerStates, aiOpponent);
      
      if (result.success) {
        resolvedStack.push({
          ...stackItem,
          resolved: true,
          resolvedAt: Date.now()
        });
        
        // Update player states with any changes
        Object.assign(updatedPlayerStates, result.updatedPlayerStates);
        
        // Add to battle log
        battleLog.push({
          id: `log_${Date.now()}_${Math.random()}`,
          t: Date.now(),
          msg: result.logMessage || `Resolved ${stackItem.effect.type} effect`,
          seed: result.seed
        });
      } else {
        // If resolution failed, keep the item in the stack
        resolvedStack.push(stackItem);
      }
    } catch (error) {
      console.error('Error resolving stack item:', error);
      // Keep the item in the stack if there was an error
      resolvedStack.push(stackItem);
    }
  }

  return {
    resolvedStack: resolvedStack.reverse(), // Reverse back to maintain order
    updatedPlayerStates,
    battleLog
  };
}

/**
 * Resolve a single stack item
 */
async function resolveStackItem(
  stackItem: any,
  playerStates: Record<string, BattlePlayerState>,
  aiOpponent?: BattleAIState
): Promise<{
  success: boolean;
  updatedPlayerStates: Record<string, BattlePlayerState>;
  logMessage?: string;
  seed?: string;
}> {
  const { effect, sourceCharId, targetIds } = stackItem;
  const updatedPlayerStates = { ...playerStates };

  try {
    switch (effect.type) {
      case 'damage':
        return await resolveDamageEffect(effect, sourceCharId, targetIds, updatedPlayerStates, aiOpponent);
      
      case 'heal':
        return await resolveHealEffect(effect, sourceCharId, targetIds, updatedPlayerStates, aiOpponent);
      
      case 'buff':
        return await resolveBuffEffect(effect, sourceCharId, targetIds, updatedPlayerStates, aiOpponent);
      
      case 'debuff':
        return await resolveDebuffEffect(effect, sourceCharId, targetIds, updatedPlayerStates, aiOpponent);
      
      case 'draw':
        return await resolveDrawEffect(effect, sourceCharId, updatedPlayerStates);
      
      default:
        return {
          success: false,
          updatedPlayerStates,
          logMessage: `Unknown effect type: ${effect.type}`
        };
    }
  } catch (error) {
    console.error('Error resolving stack item:', error);
    return {
      success: false,
      updatedPlayerStates,
      logMessage: `Error resolving effect: ${error}`
    };
  }
}

/**
 * Resolve damage effect
 */
async function resolveDamageEffect(
  effect: any,
  sourceCharId: string,
  targetIds: string[] | undefined,
  playerStates: Record<string, BattlePlayerState>,
  aiOpponent?: BattleAIState
): Promise<{
  success: boolean;
  updatedPlayerStates: Record<string, BattlePlayerState>;
  logMessage: string;
  seed?: string;
}> {
  const damage = effect.amount || 10;
  const targets = targetIds || Object.keys(playerStates);
  
  for (const targetId of targets) {
    if (playerStates[targetId]) {
      const newHp = Math.max(0, playerStates[targetId].hp - damage);
      playerStates[targetId] = {
        ...playerStates[targetId],
        hp: newHp
      };
    }
  }

  return {
    success: true,
    updatedPlayerStates: playerStates,
    logMessage: `Dealt ${damage} damage to ${targets.length} target(s)`
  };
}

/**
 * Resolve heal effect
 */
async function resolveHealEffect(
  effect: any,
  sourceCharId: string,
  targetIds: string[] | undefined,
  playerStates: Record<string, BattlePlayerState>,
  aiOpponent?: BattleAIState
): Promise<{
  success: boolean;
  updatedPlayerStates: Record<string, BattlePlayerState>;
  logMessage: string;
  seed?: string;
}> {
  const heal = effect.amount || 10;
  const targets = targetIds || [sourceCharId];
  
  for (const targetId of targets) {
    if (playerStates[targetId]) {
      const newHp = Math.min(playerStates[targetId].maxHp, playerStates[targetId].hp + heal);
      playerStates[targetId] = {
        ...playerStates[targetId],
        hp: newHp
      };
    }
  }

  return {
    success: true,
    updatedPlayerStates: playerStates,
    logMessage: `Healed ${heal} HP to ${targets.length} target(s)`
  };
}

/**
 * Resolve buff effect
 */
async function resolveBuffEffect(
  effect: any,
  sourceCharId: string,
  targetIds: string[] | undefined,
  playerStates: Record<string, BattlePlayerState>,
  aiOpponent?: BattleAIState
): Promise<{
  success: boolean;
  updatedPlayerStates: Record<string, BattlePlayerState>;
  logMessage: string;
  seed?: string;
}> {
  const buff = {
    id: `buff_${Date.now()}_${Math.random()}`,
    name: effect.name || 'Buff',
    stat: effect.stat || 'atk',
    amount: effect.amount || 5,
    duration: effect.duration || 3,
    source: sourceCharId
  };

  const targets = targetIds || [sourceCharId];
  
  for (const targetId of targets) {
    if (playerStates[targetId]) {
      playerStates[targetId] = {
        ...playerStates[targetId],
        buffs: [...playerStates[targetId].buffs, buff]
      };
    }
  }

  return {
    success: true,
    updatedPlayerStates: playerStates,
    logMessage: `Applied ${buff.name} buff to ${targets.length} target(s)`
  };
}

/**
 * Resolve debuff effect
 */
async function resolveDebuffEffect(
  effect: any,
  sourceCharId: string,
  targetIds: string[] | undefined,
  playerStates: Record<string, BattlePlayerState>,
  aiOpponent?: BattleAIState
): Promise<{
  success: boolean;
  updatedPlayerStates: Record<string, BattlePlayerState>;
  logMessage: string;
  seed?: string;
}> {
  const debuff = {
    id: `debuff_${Date.now()}_${Math.random()}`,
    name: effect.name || 'Debuff',
    stat: effect.stat || 'atk',
    amount: effect.amount || 5,
    duration: effect.duration || 3,
    source: sourceCharId
  };

  const targets = targetIds || Object.keys(playerStates).filter(id => id !== sourceCharId);
  
  for (const targetId of targets) {
    if (playerStates[targetId]) {
      playerStates[targetId] = {
        ...playerStates[targetId],
        debuffs: [...playerStates[targetId].debuffs, debuff]
      };
    }
  }

  return {
    success: true,
    updatedPlayerStates: playerStates,
    logMessage: `Applied ${debuff.name} debuff to ${targets.length} target(s)`
  };
}

/**
 * Resolve draw effect
 */
async function resolveDrawEffect(
  effect: any,
  sourceCharId: string,
  playerStates: Record<string, BattlePlayerState>
): Promise<{
  success: boolean;
  updatedPlayerStates: Record<string, BattlePlayerState>;
  logMessage: string;
  seed?: string;
}> {
  const drawAmount = effect.amount || 1;
  const sourcePlayer = playerStates[sourceCharId];
  
  if (!sourcePlayer) {
    return {
      success: false,
      updatedPlayerStates: playerStates,
      logMessage: 'Source player not found'
    };
  }

  // Draw cards from deck
  const drawnCards = sourcePlayer.deck.slice(0, drawAmount);
  const remainingDeck = sourcePlayer.deck.slice(drawAmount);
  
  playerStates[sourceCharId] = {
    ...sourcePlayer,
    hand: [...sourcePlayer.hand, ...drawnCards],
    deck: remainingDeck
  };

  return {
    success: true,
    updatedPlayerStates: playerStates,
    logMessage: `Drew ${drawnCards.length} card(s)`
  };
}

/**
 * Calculate battle rewards
 */
function calculateBattleRewards(
  mode: BattleMode,
  winner: boolean
): { gold: number; xp: number; renown: number } {
  const baseRewards = {
    PvP: { gold: 50, xp: 100, renown: 10 },
    Boss: { gold: 100, xp: 200, renown: 25 },
    Coop: { gold: 75, xp: 150, renown: 15 },
    NPC: { gold: 25, xp: 50, renown: 5 }
  };

  const base = baseRewards[mode] || baseRewards.NPC;

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
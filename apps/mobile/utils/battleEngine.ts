/**
 * Battle Engine - Stack-based Combat Resolution
 *
 * Implements LIFO (Last-In-First-Out) stack resolution
 * Handles card effects, dice rolling, targeting, and state updates
 */

import type { Firestore } from 'firebase/firestore';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import type {
  Battle,
  BattlePlayer,
  StackEntry,
  PlayCardAction,
  BattleLogEntry,
  DiceRoll,
  TemporaryEffect,
  BattleReward
} from '@/types/battleground';
import type { EffectDef } from '@rov/types';
import { generateRNGSeed, rollDiceWithSeed } from './rngEngine';

// ============================================================================
// Stack Management
// ============================================================================

/**
 * Add a card effect to the stack
 */
export async function addToStack(
  db: Firestore,
  battleId: string,
  action: PlayCardAction
): Promise<{ success: boolean; error?: string }> {
  try {
    const battleRef = doc(db, 'battles', battleId);
    const battleSnap = await getDoc(battleRef);

    if (!battleSnap.exists()) {
      return { success: false, error: 'Battle not found' };
    }

    const battle = battleSnap.data() as Battle;

    // Find player
    const player = battle.players.find(p => p.userId === action.playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Find card in hand
    const card = player.hand[action.cardIndex];
    if (!card) {
      return { success: false, error: 'Card not in hand' };
    }

    // Check mana cost
    if (card.manaCost && player.mana < card.manaCost) {
      return { success: false, error: 'Not enough mana' };
    }

    // Create stack entries for each effect
    const stackEntries: StackEntry[] = [];
    const rngSeed = generateRNGSeed();

    for (const effect of card.effects || []) {
      const stackEntry: StackEntry = {
        id: `${battleId}_${Date.now()}_${Math.random()}`,
        playerId: action.playerId,
        cardId: card.id,
        cardName: card.name,
        effect,
        targets: action.targets,
        canCounter: isCounterable(effect),
        addedAt: Date.now()
      };

      // If effect involves dice, roll them now
      if (needsDiceRoll(effect)) {
        stackEntry.diceRolls = rollDiceForEffect(effect, rngSeed);
      }

      stackEntries.push(stackEntry);
    }

    // Battle log entry
    const logEntry: BattleLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      turnNumber: battle.turnNumber,
      type: 'card_played',
      playerId: action.playerId,
      playerName: player.username,
      message: `${player.username} played ${card.name}`,
      cardPlayed: {
        cardId: card.id,
        cardName: card.name
      },
      rngSeed
    };

    // Update battle
    await updateDoc(battleRef, {
      stack: arrayUnion(...stackEntries),
      battleLog: arrayUnion(logEntry),
      [`players.${battle.players.indexOf(player)}.mana`]: increment(-(card.manaCost || 0)),
      [`players.${battle.players.indexOf(player)}.hand`]: player.hand.filter((_, i) => i !== action.cardIndex),
      [`players.${battle.players.indexOf(player)}.hasPlayedCard`]: true,
      turnTimeLimit: 60 + (battle.stack.length + stackEntries.length) * 15
    });

    return { success: true };

  } catch (error) {
    console.error('Error adding to stack:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Resolve the stack (LIFO - last in, first out)
 */
export async function resolveStack(
  db: Firestore,
  battleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const battleRef = doc(db, 'battles', battleId);
    const battleSnap = await getDoc(battleRef);

    if (!battleSnap.exists()) {
      return { success: false, error: 'Battle not found' };
    }

    const battle = battleSnap.data() as Battle;

    if (battle.stack.length === 0) {
      return { success: true }; // Nothing to resolve
    }

    // Pop last entry from stack (LIFO)
    const stackEntry = battle.stack[battle.stack.length - 1];
    const newStack = battle.stack.slice(0, -1);

    console.log(`🎴 Resolving: ${stackEntry.cardName}`);

    // Resolve the effect
    const resolutionResult = await resolveEffect(
      db,
      battleId,
      battle,
      stackEntry
    );

    if (!resolutionResult.success) {
      return resolutionResult;
    }

    // Log resolution
    const logEntry: BattleLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      turnNumber: battle.turnNumber,
      type: 'stack_resolved',
      playerId: stackEntry.playerId,
      playerName: battle.players.find(p => p.userId === stackEntry.playerId)?.username || 'Unknown',
      message: resolutionResult.message || `${stackEntry.cardName} resolved`,
      diceRolls: stackEntry.diceRolls
    };

    // Update battle with new stack and log
    await updateDoc(battleRef, {
      stack: newStack,
      battleLog: arrayUnion(logEntry),
      turnTimeLimit: 60 + newStack.length * 15
    });

    // Continue resolving if stack still has entries
    if (newStack.length > 0) {
      return await resolveStack(db, battleId);
    }

    return { success: true };

  } catch (error) {
    console.error('Error resolving stack:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Resolve a specific effect
 */
async function resolveEffect(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const { effect, playerId, targets } = stackEntry;

  const player = battle.players.find(p => p.userId === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  switch (effect.type) {
    case 'damage':
      return await resolveDamage(db, battleId, battle, stackEntry);

    case 'heal':
      return await resolveHeal(db, battleId, battle, stackEntry);

    case 'draw':
      return await resolveDraw(db, battleId, battle, stackEntry);

    case 'buff':
      return await resolveBuff(db, battleId, battle, stackEntry);

    case 'debuff':
      return await resolveDebuff(db, battleId, battle, stackEntry);

    case 'instantCancel':
      return await resolveInstantCancel(db, battleId, battle, stackEntry);

    case 'gainRenown':
    case 'gainGold':
    case 'gainXP':
    case 'gainTempMana':
    case 'gainTempHP':
      return await resolveResourceGain(db, battleId, battle, stackEntry);

    case 'discardRandom':
      return await resolveDiscardRandom(db, battleId, battle, stackEntry);

    case 'destroyPersistent':
      return await resolveDestroyPersistent(db, battleId, battle, stackEntry);

    default:
      console.warn('Unhandled effect type:', effect.type);
      return { success: true, message: `${stackEntry.cardName} effect applied` };
  }
}

// ============================================================================
// Effect Implementations
// ============================================================================

async function resolveDamage(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const effect = stackEntry.effect as Extract<EffectDef, { type: 'damage' }>;
  const player = battle.players.find(p => p.userId === stackEntry.playerId)!;

  let baseDamage = effect.amount;

  // Apply scaling
  if (effect.scaling) {
    const statValue = player[effect.scaling.stat];
    baseDamage += Math.floor(statValue * effect.scaling.factor);
  }

  // Apply dice rolls
  if (stackEntry.diceRolls && stackEntry.diceRolls.length > 0) {
    const diceTotal = stackEntry.diceRolls.reduce((sum, roll) => sum + roll.result, 0);
    baseDamage += diceTotal;
  }

  // Find targets and apply damage
  const targets = resolveTargets(battle, stackEntry);
  const battleRef = doc(db, 'battles', battleId);
  const updates: Record<string, any> = {};
  const logEntries: BattleLogEntry[] = [];

  for (const target of targets) {
    const targetIndex = battle.players.findIndex(p => p.userId === target.userId);
    if (targetIndex === -1) continue;

    // Calculate actual damage (after defense)
    const actualDamage = Math.max(1, baseDamage - Math.floor(target.def * 0.1));

    // Apply damage
    const newHp = Math.max(0, target.hp - actualDamage);
    updates[`players.${targetIndex}.hp`] = newHp;

    logEntries.push({
      id: `log_${Date.now()}_${targetIndex}`,
      timestamp: Date.now(),
      turnNumber: battle.turnNumber,
      type: 'damage_dealt',
      playerId: stackEntry.playerId,
      playerName: player.username,
      message: `${target.username} took ${actualDamage} damage`,
      damage: {
        amount: actualDamage,
        targetId: target.userId,
        targetName: target.username
      }
    });

    // Check if target died
    if (newHp <= 0) {
      updates[`players.${targetIndex}.lives`] = Math.max(0, target.lives - 1);

      if (target.lives - 1 <= 0) {
        logEntries.push({
          id: `log_${Date.now()}_death_${targetIndex}`,
          timestamp: Date.now(),
          turnNumber: battle.turnNumber,
          type: 'player_died',
          playerId: target.userId,
          playerName: target.username,
          message: `${target.username} was defeated!`
        });
      } else {
        // Respawn with full HP
        updates[`players.${targetIndex}.hp`] = target.maxHp;
      }
    }
  }

  // Apply all updates
  if (Object.keys(updates).length > 0) {
    await updateDoc(battleRef, {
      ...updates,
      battleLog: arrayUnion(...logEntries)
    });
  }

  return {
    success: true,
    message: `${stackEntry.cardName} dealt ${baseDamage} damage`
  };
}

async function resolveHeal(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const effect = stackEntry.effect as Extract<EffectDef, { type: 'heal' }>;
  const player = battle.players.find(p => p.userId === stackEntry.playerId)!;

  let healAmount = effect.amount;

  // Apply scaling
  if (effect.scaling) {
    const statValue = player[effect.scaling.stat];
    healAmount += Math.floor(statValue * effect.scaling.factor);
  }

  // Apply dice rolls
  if (stackEntry.diceRolls && stackEntry.diceRolls.length > 0) {
    const diceTotal = stackEntry.diceRolls.reduce((sum, roll) => sum + roll.result, 0);
    healAmount += diceTotal;
  }

  const targets = resolveTargets(battle, stackEntry);
  const battleRef = doc(db, 'battles', battleId);
  const updates: Record<string, any> = {};
  const logEntries: BattleLogEntry[] = [];

  for (const target of targets) {
    const targetIndex = battle.players.findIndex(p => p.userId === target.userId);
    if (targetIndex === -1) continue;

    const newHp = Math.min(target.maxHp, target.hp + healAmount);
    updates[`players.${targetIndex}.hp`] = newHp;

    logEntries.push({
      id: `log_${Date.now()}_${targetIndex}`,
      timestamp: Date.now(),
      turnNumber: battle.turnNumber,
      type: 'healing_done',
      playerId: stackEntry.playerId,
      playerName: player.username,
      message: `${target.username} healed for ${healAmount} HP`,
      heal: {
        amount: healAmount,
        targetId: target.userId,
        targetName: target.username
      }
    });
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(battleRef, {
      ...updates,
      battleLog: arrayUnion(...logEntries)
    });
  }

  return {
    success: true,
    message: `${stackEntry.cardName} healed for ${healAmount}`
  };
}

async function resolveDraw(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const effect = stackEntry.effect as Extract<EffectDef, { type: 'draw' }>;
  const playerIndex = battle.players.findIndex(p => p.userId === stackEntry.playerId);

  if (playerIndex === -1) {
    return { success: false, error: 'Player not found' };
  }

  const player = battle.players[playerIndex];
  const deckKey = `${effect.deck.toLowerCase()}Deck` as 'actionDeck' | 'skillDeck' | 'lootDeck';
  const deck = player[deckKey];

  if (deck.length === 0) {
    return { success: true, message: 'Deck is empty' };
  }

  // Draw cards
  const cardsToDraw = Math.min(effect.amount, deck.length);
  const drawnCards = deck.slice(0, cardsToDraw);
  const newDeck = deck.slice(cardsToDraw);
  const newHand = [...player.hand, ...drawnCards];

  const battleRef = doc(db, 'battles', battleId);
  await updateDoc(battleRef, {
    [`players.${playerIndex}.${deckKey}`]: newDeck,
    [`players.${playerIndex}.hand`]: newHand,
    battleLog: arrayUnion({
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      turnNumber: battle.turnNumber,
      type: 'card_drawn',
      playerId: stackEntry.playerId,
      playerName: player.username,
      message: `${player.username} drew ${cardsToDraw} card(s) from ${effect.deck} deck`
    })
  });

  return {
    success: true,
    message: `Drew ${cardsToDraw} card(s)`
  };
}

async function resolveBuff(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const effect = stackEntry.effect as Extract<EffectDef, { type: 'buff' }>;
  const targets = resolveTargets(battle, stackEntry);
  const battleRef = doc(db, 'battles', battleId);

  for (const target of targets) {
    const targetIndex = battle.players.findIndex(p => p.userId === target.userId);
    if (targetIndex === -1) continue;

    const buff: TemporaryEffect = {
      id: `buff_${Date.now()}`,
      cardId: stackEntry.cardId,
      type: 'buff',
      stat: effect.stat,
      amount: effect.amount,
      duration: effect.duration || 'battle',
      turnsRemaining: effect.duration === 'temp' ? 1 : undefined
    };

    await updateDoc(battleRef, {
      [`players.${targetIndex}.buffs`]: arrayUnion(buff),
      [`players.${targetIndex}.${effect.stat}`]: increment(effect.amount),
      battleLog: arrayUnion({
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        turnNumber: battle.turnNumber,
        type: 'buff_applied',
        playerId: stackEntry.playerId,
        playerName: target.username,
        message: `${target.username} gained +${effect.amount} ${effect.stat}`
      })
    });
  }

  return { success: true, message: `Applied buff: +${effect.amount} ${effect.stat}` };
}

async function resolveDebuff(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const effect = stackEntry.effect as Extract<EffectDef, { type: 'debuff' }>;
  const targets = resolveTargets(battle, stackEntry);
  const battleRef = doc(db, 'battles', battleId);

  for (const target of targets) {
    const targetIndex = battle.players.findIndex(p => p.userId === target.userId);
    if (targetIndex === -1) continue;

    const debuff: TemporaryEffect = {
      id: `debuff_${Date.now()}`,
      cardId: stackEntry.cardId,
      type: 'debuff',
      stat: effect.stat,
      amount: effect.amount,
      duration: effect.duration || 'battle',
      turnsRemaining: effect.duration === 'temp' ? 1 : undefined
    };

    await updateDoc(battleRef, {
      [`players.${targetIndex}.debuffs`]: arrayUnion(debuff),
      [`players.${targetIndex}.${effect.stat}`]: increment(-effect.amount),
      battleLog: arrayUnion({
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        turnNumber: battle.turnNumber,
        type: 'debuff_applied',
        playerId: stackEntry.playerId,
        playerName: target.username,
        message: `${target.username} lost ${effect.amount} ${effect.stat}`
      })
    });
  }

  return { success: true, message: `Applied debuff: -${effect.amount} ${effect.stat}` };
}

async function resolveInstantCancel(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (battle.stack.length < 2) {
    return { success: true, message: 'Nothing to cancel' };
  }

  // Remove the top stack entry (the one before this instant cancel)
  const canceledEntry = battle.stack[battle.stack.length - 2];
  const newStack = [
    ...battle.stack.slice(0, -2),
    battle.stack[battle.stack.length - 1]
  ];

  const battleRef = doc(db, 'battles', battleId);
  await updateDoc(battleRef, {
    stack: newStack,
    battleLog: arrayUnion({
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      turnNumber: battle.turnNumber,
      type: 'stack_countered',
      playerId: stackEntry.playerId,
      playerName: battle.players.find(p => p.userId === stackEntry.playerId)?.username || 'Unknown',
      message: `Countered ${canceledEntry.cardName}!`
    })
  });

  return { success: true, message: `Countered ${canceledEntry.cardName}` };
}

async function resolveResourceGain(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const effect = stackEntry.effect as any;
  const playerIndex = battle.players.findIndex(p => p.userId === stackEntry.playerId);

  if (playerIndex === -1) {
    return { success: false, error: 'Player not found' };
  }

  const battleRef = doc(db, 'battles', battleId);
  const updates: Record<string, any> = {};

  switch (effect.type) {
    case 'gainTempMana':
      updates[`players.${playerIndex}.mana`] = increment(effect.amount);
      break;
    case 'gainTempHP':
      updates[`players.${playerIndex}.hp`] = increment(effect.amount);
      break;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(battleRef, updates);
  }

  return { success: true, message: `Gained ${effect.amount} ${effect.type.replace('gain', '').replace('Temp', '')}` };
}

async function resolveDiscardRandom(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  const effect = stackEntry.effect as Extract<EffectDef, { type: 'discardRandom' }>;
  const targets = effect.who === 'self'
    ? [battle.players.find(p => p.userId === stackEntry.playerId)!]
    : battle.players.filter(p => p.userId !== stackEntry.playerId);

  const battleRef = doc(db, 'battles', battleId);

  for (const target of targets) {
    const targetIndex = battle.players.findIndex(p => p.userId === target.userId);
    if (targetIndex === -1 || target.hand.length === 0) continue;

    const toDiscard = Math.min(effect.amount, target.hand.length);
    const discardedCards = [];

    for (let i = 0; i < toDiscard; i++) {
      const randomIndex = Math.floor(Math.random() * target.hand.length);
      discardedCards.push(target.hand[randomIndex]);
      target.hand.splice(randomIndex, 1);
    }

    await updateDoc(battleRef, {
      [`players.${targetIndex}.hand`]: target.hand,
      battleLog: arrayUnion({
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        turnNumber: battle.turnNumber,
        type: 'card_played',
        playerId: stackEntry.playerId,
        playerName: target.username,
        message: `${target.username} discarded ${toDiscard} card(s)`
      })
    });
  }

  return { success: true, message: `Discarded ${effect.amount} card(s)` };
}

async function resolveDestroyPersistent(
  db: Firestore,
  battleId: string,
  battle: Battle,
  stackEntry: StackEntry
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Implementation for destroying battlefield persistent effects
  return { success: true, message: 'Persistent effect destroyed' };
}

// ============================================================================
// Helper Functions
// ============================================================================

function resolveTargets(battle: Battle, stackEntry: StackEntry): BattlePlayer[] {
  const targets: BattlePlayer[] = [];

  for (const target of stackEntry.targets) {
    switch (target.type) {
      case 'self':
        const self = battle.players.find(p => p.userId === stackEntry.playerId);
        if (self) targets.push(self);
        break;

      case 'player':
      case 'opponent':
        if (target.targetId) {
          const player = battle.players.find(p => p.userId === target.targetId);
          if (player) targets.push(player);
        }
        break;

      case 'all_opponents':
        targets.push(...battle.players.filter(p => p.userId !== stackEntry.playerId));
        break;

      case 'all_allies':
        // In co-op raids, allies are teammates
        targets.push(...battle.players.filter(p =>
          p.userId !== stackEntry.playerId && p.role.startsWith('ally')
        ));
        break;

      case 'random_opponent':
        const opponents = battle.players.filter(p => p.userId !== stackEntry.playerId);
        if (opponents.length > 0) {
          targets.push(opponents[Math.floor(Math.random() * opponents.length)]);
        }
        break;
    }
  }

  return targets;
}

function isCounterable(effect: EffectDef): boolean {
  // Instant effects cannot be countered
  return effect.type !== 'instantCancel';
}

function needsDiceRoll(effect: EffectDef): boolean {
  // Damage and heal effects can have dice variance
  return effect.type === 'damage' || effect.type === 'heal';
}

function rollDiceForEffect(effect: EffectDef, rngSeed: string): DiceRoll[] {
  // Roll 1d6 for damage/heal variance
  const diceType = 'd6';
  const result = rollDiceWithSeed(diceType, rngSeed);

  return [{
    id: `dice_${Date.now()}`,
    diceType,
    result,
    rngSeed
  }];
}

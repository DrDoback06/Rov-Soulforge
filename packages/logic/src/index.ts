/**
 * @rov/logic - Core game rules engine
 *
 * Exports all battle logic, effect systems, RNG, and game mechanics.
 */

// Battle Management
export {
  BattleManager,
  type BattleConfig,
  type BattleAction
} from './battle';

// Stack Resolution
export {
  pushToStack,
  popFromStack,
  resolveStack,
  resolveStackItem,
  canResolveStack,
  type StackContext,
  type ResolveResult,
  type ExecutedEffect
} from './stack';

// Effect System
export {
  effectRegistry,
  registerEffect,
  executeRegisteredEffect,
  executeEffectBatch,
  canExecuteEffect,
  getEffectDescription,
  type EffectHandler,
  type EffectContext,
  type EffectResult
} from './effects';

// Turn Management
export {
  TurnManager,
  initializeTurnState,
  startNextTurn,
  addStackBonus,
  getRemainingTime,
  shouldShowRope,
  isTurnExpired,
  getTurnProgress,
  determineTurnOrder,
  getNextPlayer,
  handleTurnTimeout,
  DEFAULT_TURN_CONFIG,
  type TurnConfig,
  type TurnState
} from './turn-manager';

// RNG System
export {
  SeededRNG,
  BattleRNG,
  generateSeed,
  rollDiceWithAnimation,
  verifyRoll,
  rollWeightedLoot,
  type RNGSeed,
  type DiceRoll,
  type RNGLog,
  type DiceRollAnimation
} from './rng';

// Deck Management
export {
  initializePlayerDecks,
  drawCards,
  playCardFromHand,
  discardCard,
  discardHand,
  addCardToHand,
  canDrawFromDeck,
  getRemainingCards,
  reshuffleDeck,
  mulligan,
  getCardFromHand,
  hasCardInHand,
  getHandSize,
  type DeckState,
  type DiscardState,
  type HandState,
  type PlayerDeckState
} from './deck-manager';
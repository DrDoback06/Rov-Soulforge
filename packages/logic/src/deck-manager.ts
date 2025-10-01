import type { CardDef, DeckType, Character } from '@rov/types';
import { BattleRNG } from './rng';

/**
 * Deck Manager
 *
 * Manages card decks for battles:
 * - Three deck types: Action, Skill, Loot
 * - Shuffling with seeded RNG
 * - Drawing cards
 * - Discard pile management
 * - Hand management
 */

export interface DeckState {
  action: CardDef[];
  skill: CardDef[];
  loot: CardDef[];
}

export interface DiscardState {
  action: CardDef[];
  skill: CardDef[];
  loot: CardDef[];
}

export interface HandState {
  cards: CardDef[];
  maxSize: number;
}

export interface PlayerDeckState {
  decks: DeckState;
  discards: DiscardState;
  hand: HandState;
  deckSizes: {
    action: number;
    skill: number;
    loot: number;
  };
}

/**
 * Initialize player decks for battle
 */
export function initializePlayerDecks(
  character: Character,
  availableCards: CardDef[],
  rng: BattleRNG
): PlayerDeckState {
  // Filter cards by deck type
  const actionCards = availableCards.filter(c => c.deck === 'Action');
  const skillCards = availableCards.filter(c => c.deck === 'Skill');
  const lootCards = availableCards.filter(c => c.deck === 'Loot');

  // Shuffle each deck
  const shuffledAction = rng.shuffle(actionCards);
  const shuffledSkill = rng.shuffle(skillCards);
  const shuffledLoot = rng.shuffle(lootCards);

  return {
    decks: {
      action: shuffledAction,
      skill: shuffledSkill,
      loot: shuffledLoot
    },
    discards: {
      action: [],
      skill: [],
      loot: []
    },
    hand: {
      cards: [],
      maxSize: 7 // Default hand size
    },
    deckSizes: {
      action: shuffledAction.length,
      skill: shuffledSkill.length,
      loot: shuffledLoot.length
    }
  };
}

/**
 * Draw cards from a specific deck
 */
export function drawCards(
  deckState: PlayerDeckState,
  deckType: DeckType,
  count: number,
  rng: BattleRNG
): {
  drawnCards: CardDef[];
  updatedState: PlayerDeckState;
} {
  const drawnCards: CardDef[] = [];
  const newState = { ...deckState };

  // Get the appropriate deck
  let deck: CardDef[];
  let discard: CardDef[];

  switch (deckType) {
    case 'Action':
      deck = [...newState.decks.action];
      discard = [...newState.discards.action];
      break;
    case 'Skill':
      deck = [...newState.decks.skill];
      discard = [...newState.discards.skill];
      break;
    case 'Loot':
      deck = [...newState.decks.loot];
      discard = [...newState.discards.loot];
      break;
    default:
      return { drawnCards, updatedState: deckState };
  }

  for (let i = 0; i < count; i++) {
    // Check if deck is empty
    if (deck.length === 0) {
      // Reshuffle discard pile into deck
      if (discard.length > 0) {
        deck = rng.shuffle(discard);
        discard = [];
      } else {
        // No cards left
        break;
      }
    }

    // Check hand size limit
    if (newState.hand.cards.length >= newState.hand.maxSize) {
      break;
    }

    // Draw card
    const card = deck.pop();
    if (card) {
      drawnCards.push(card);
      newState.hand.cards.push(card);
    }
  }

  // Update deck state
  switch (deckType) {
    case 'Action':
      newState.decks.action = deck;
      newState.discards.action = discard;
      break;
    case 'Skill':
      newState.decks.skill = deck;
      newState.discards.skill = discard;
      break;
    case 'Loot':
      newState.decks.loot = deck;
      newState.discards.loot = discard;
      break;
  }

  return { drawnCards, updatedState: newState };
}

/**
 * Play a card from hand
 */
export function playCardFromHand(
  deckState: PlayerDeckState,
  cardId: string
): {
  card: CardDef | null;
  updatedState: PlayerDeckState;
} {
  const newState = { ...deckState };
  const cardIndex = newState.hand.cards.findIndex(c => c.id === cardId);

  if (cardIndex === -1) {
    return { card: null, updatedState: deckState };
  }

  const card = newState.hand.cards[cardIndex];
  newState.hand.cards.splice(cardIndex, 1);

  return { card, updatedState: newState };
}

/**
 * Discard a card
 */
export function discardCard(
  deckState: PlayerDeckState,
  card: CardDef
): PlayerDeckState {
  const newState = { ...deckState };

  switch (card.deck) {
    case 'Action':
      newState.discards.action.push(card);
      break;
    case 'Skill':
      newState.discards.skill.push(card);
      break;
    case 'Loot':
      newState.discards.loot.push(card);
      break;
  }

  return newState;
}

/**
 * Discard entire hand
 */
export function discardHand(deckState: PlayerDeckState): PlayerDeckState {
  const newState = { ...deckState };

  newState.hand.cards.forEach(card => {
    switch (card.deck) {
      case 'Action':
        newState.discards.action.push(card);
        break;
      case 'Skill':
        newState.discards.skill.push(card);
        break;
      case 'Loot':
        newState.discards.loot.push(card);
        break;
    }
  });

  newState.hand.cards = [];

  return newState;
}

/**
 * Add card to hand (from effects like "draw" or "steal")
 */
export function addCardToHand(
  deckState: PlayerDeckState,
  card: CardDef
): PlayerDeckState {
  const newState = { ...deckState };

  if (newState.hand.cards.length < newState.hand.maxSize) {
    newState.hand.cards.push(card);
  } else {
    // Hand full, discard immediately
    return discardCard(newState, card);
  }

  return newState;
}

/**
 * Check if player can draw from deck
 */
export function canDrawFromDeck(
  deckState: PlayerDeckState,
  deckType: DeckType
): boolean {
  let deckSize = 0;
  let discardSize = 0;

  switch (deckType) {
    case 'Action':
      deckSize = deckState.decks.action.length;
      discardSize = deckState.discards.action.length;
      break;
    case 'Skill':
      deckSize = deckState.decks.skill.length;
      discardSize = deckState.discards.skill.length;
      break;
    case 'Loot':
      deckSize = deckState.decks.loot.length;
      discardSize = deckState.discards.loot.length;
      break;
  }

  return deckSize > 0 || discardSize > 0;
}

/**
 * Get remaining cards in deck (including discard)
 */
export function getRemainingCards(
  deckState: PlayerDeckState,
  deckType: DeckType
): number {
  switch (deckType) {
    case 'Action':
      return deckState.decks.action.length + deckState.discards.action.length;
    case 'Skill':
      return deckState.decks.skill.length + deckState.discards.skill.length;
    case 'Loot':
      return deckState.decks.loot.length + deckState.discards.loot.length;
    default:
      return 0;
  }
}

/**
 * Shuffle discard pile back into deck
 */
export function reshuffleDeck(
  deckState: PlayerDeckState,
  deckType: DeckType,
  rng: BattleRNG
): PlayerDeckState {
  const newState = { ...deckState };

  switch (deckType) {
    case 'Action':
      newState.decks.action = rng.shuffle([
        ...newState.decks.action,
        ...newState.discards.action
      ]);
      newState.discards.action = [];
      break;
    case 'Skill':
      newState.decks.skill = rng.shuffle([
        ...newState.decks.skill,
        ...newState.discards.skill
      ]);
      newState.discards.skill = [];
      break;
    case 'Loot':
      newState.decks.loot = rng.shuffle([
        ...newState.decks.loot,
        ...newState.discards.loot
      ]);
      newState.discards.loot = [];
      break;
  }

  return newState;
}

/**
 * Mulligan - redraw starting hand
 */
export function mulligan(
  deckState: PlayerDeckState,
  rng: BattleRNG
): PlayerDeckState {
  // Discard current hand
  let newState = discardHand(deckState);

  // Draw new hand (1 from each deck, then fill to 7)
  const actionDraw = drawCards(newState, 'Action', 1, rng);
  newState = actionDraw.updatedState;

  const skillDraw = drawCards(newState, 'Skill', 1, rng);
  newState = skillDraw.updatedState;

  const lootDraw = drawCards(newState, 'Loot', 1, rng);
  newState = lootDraw.updatedState;

  // Fill remaining slots with Action cards
  const remaining = newState.hand.maxSize - newState.hand.cards.length;
  if (remaining > 0) {
    const finalDraw = drawCards(newState, 'Action', remaining, rng);
    newState = finalDraw.updatedState;
  }

  return newState;
}

/**
 * Get card by ID from hand
 */
export function getCardFromHand(
  deckState: PlayerDeckState,
  cardId: string
): CardDef | null {
  return deckState.hand.cards.find(c => c.id === cardId) || null;
}

/**
 * Check if player has card in hand
 */
export function hasCardInHand(
  deckState: PlayerDeckState,
  cardId: string
): boolean {
  return deckState.hand.cards.some(c => c.id === cardId);
}

/**
 * Get hand size
 */
export function getHandSize(deckState: PlayerDeckState): number {
  return deckState.hand.cards.length;
}
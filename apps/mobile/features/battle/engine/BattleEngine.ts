/**
 * Battle Engine - Enhanced Implementation
 *
 * Working battle system with status effects, combos, and difficulty scaling.
 */

import type { Character } from '@rov/types';
import {
  applyStatusEffects,
  checkCombo,
  calculateDamage,
  getDifficultySettings,
  type StatusEffect,
  type CardCombo
} from './BattleEnhancements';

// Enhanced battle state with status effects and combos
export interface SimpleBattleState {
  id: string;
  player: {
    characterId: string;
    name: string;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    hand: SimpleCard[];
    deck: SimpleCard[];
    discard: SimpleCard[];
    statusEffects: StatusEffect[];
    shield: number;
    recentCards: string[]; // For combo tracking
  };
  opponent: {
    name: string;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    hand: SimpleCard[];
    deck: SimpleCard[];
    discard: SimpleCard[];
    statusEffects: StatusEffect[];
    shield: number;
  };
  currentTurn: 'player' | 'opponent';
  turnNumber: number;
  battleLog: string[];
  winner: 'player' | 'opponent' | null;
  status: 'active' | 'ended';
  difficulty: 'easy' | 'normal' | 'hard' | 'boss';
  rewards: {
    xp: number;
    gold: number;
  };
  lastCombo: CardCombo | null;
}

export interface SimpleCard {
  id: string;
  name: string;
  manaCost: number;
  type: 'attack' | 'heal' | 'buff';
  value: number; // damage for attack, heal amount for heal, buff amount for buff
  description: string;
}

/**
 * Enhanced Battle Engine
 *
 * Keeps track of battle state and executes actions with status effects, combos, and difficulty
 */
export class SimpleBattleEngine {
  private state: SimpleBattleState;
  private difficulty: 'easy' | 'normal' | 'hard' | 'boss';

  constructor(
    playerCharacter: Character,
    opponentName: string = 'Goblin',
    difficulty: 'easy' | 'normal' | 'hard' | 'boss' = 'normal'
  ) {
    this.difficulty = difficulty;
    this.state = this.initializeBattle(playerCharacter, opponentName);
  }

  /**
   * Initialize a new battle with difficulty scaling
   */
  private initializeBattle(playerCharacter: Character, opponentName: string): SimpleBattleState {
    // Get difficulty settings
    const difficultySettings = getDifficultySettings(this.difficulty);

    // Create simple starter deck for player
    const playerDeck = this.createStarterDeck();

    // Create simple enemy deck (scaled by difficulty)
    const opponentDeck = this.createEnemyDeck(difficultySettings.enemyDeckSize);

    // Draw starting hands
    const playerHand = playerDeck.splice(0, 4);
    const opponentHand = opponentDeck.splice(0, 4);

    // Calculate enemy HP based on difficulty
    const baseEnemyHp = 15;
    const enemyMaxHp = Math.floor(baseEnemyHp * difficultySettings.enemyHpMultiplier);

    return {
      id: `battle_${Date.now()}`,
      player: {
        characterId: playerCharacter.id,
        name: playerCharacter.classId || 'Player',
        hp: playerCharacter.counters.hp,
        maxHp: playerCharacter.stats.maxHp || 20,
        mana: difficultySettings.startingMana,
        maxMana: difficultySettings.startingMana,
        hand: playerHand,
        deck: playerDeck,
        discard: [],
        statusEffects: [],
        shield: 0,
        recentCards: []
      },
      opponent: {
        name: opponentName,
        hp: enemyMaxHp,
        maxHp: enemyMaxHp,
        mana: 3,
        maxMana: 3,
        hand: opponentHand,
        deck: opponentDeck,
        discard: [],
        statusEffects: [],
        shield: 0
      },
      currentTurn: 'player',
      turnNumber: 1,
      battleLog: [`Battle started! (${this.difficulty.toUpperCase()} difficulty)`],
      winner: null,
      status: 'active',
      difficulty: this.difficulty,
      rewards: {
        xp: difficultySettings.xpReward,
        gold: difficultySettings.goldReward
      },
      lastCombo: null
    };
  }

  /**
   * Create a simple starter deck
   */
  private createStarterDeck(): SimpleCard[] {
    return [
      { id: 'strike_1', name: 'Strike', manaCost: 1, type: 'attack', value: 3, description: 'Deal 3 damage' },
      { id: 'strike_2', name: 'Strike', manaCost: 1, type: 'attack', value: 3, description: 'Deal 3 damage' },
      { id: 'strike_3', name: 'Strike', manaCost: 1, type: 'attack', value: 3, description: 'Deal 3 damage' },
      { id: 'heavy_blow', name: 'Heavy Blow', manaCost: 2, type: 'attack', value: 6, description: 'Deal 6 damage' },
      { id: 'defend', name: 'Defend', manaCost: 1, type: 'heal', value: 2, description: 'Heal 2 HP' },
      { id: 'power_up', name: 'Power Up', manaCost: 2, type: 'buff', value: 2, description: '+2 to next attack' },
    ];
  }

  /**
   * Create a simple enemy deck (scaled by difficulty)
   */
  private createEnemyDeck(deckSize: number = 6): SimpleCard[] {
    const baseCards: SimpleCard[] = [
      { id: 'claw_1', name: 'Claw', manaCost: 1, type: 'attack', value: 2, description: 'Deal 2 damage' },
      { id: 'claw_2', name: 'Claw', manaCost: 1, type: 'attack', value: 2, description: 'Deal 2 damage' },
      { id: 'bite', name: 'Bite', manaCost: 2, type: 'attack', value: 5, description: 'Deal 5 damage' },
      { id: 'regenerate', name: 'Regenerate', manaCost: 2, type: 'heal', value: 3, description: 'Heal 3 HP' },
    ];

    // Add more cards based on difficulty
    while (baseCards.length < deckSize) {
      const index = baseCards.length;
      baseCards.push({
        id: `extra_card_${index}`,
        name: 'Strike',
        manaCost: 1,
        type: 'attack',
        value: 3,
        description: 'Deal 3 damage'
      });
    }

    return baseCards.slice(0, deckSize);
  }

  /**
   * Get current battle state
   */
  getState(): SimpleBattleState {
    return { ...this.state };
  }

  /**
   * Play a card with combo detection
   */
  playCard(cardId: string): { success: boolean; message: string } {
    if (this.state.status !== 'active') {
      return { success: false, message: 'Battle is over' };
    }

    if (this.state.currentTurn !== 'player') {
      return { success: false, message: 'Not your turn' };
    }

    // Find card in hand
    const cardIndex = this.state.player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, message: 'Card not in hand' };
    }

    const card = this.state.player.hand[cardIndex];

    // Check mana cost
    if (card.manaCost > this.state.player.mana) {
      return { success: false, message: 'Not enough mana' };
    }

    // Remove card from hand and pay mana
    this.state.player.hand.splice(cardIndex, 1);
    this.state.player.mana -= card.manaCost;
    this.state.player.discard.push(card);

    // Track card for combo detection
    this.state.player.recentCards.push(card.type);
    if (this.state.player.recentCards.length > 3) {
      this.state.player.recentCards.shift(); // Keep only last 3 cards
    }

    // Execute card effect
    this.executeCardEffect(card, 'player');

    // Check for combos
    const combo = checkCombo(this.state.player.recentCards);
    if (combo) {
      this.state.lastCombo = combo;
      this.state.battleLog.push(`⚡ COMBO! ${combo.name} (+${combo.bonusDamage} damage)`);

      // Apply combo bonus damage
      const { damageToHp, remainingShield } = calculateDamage(
        combo.bonusDamage,
        this.state.opponent.shield
      );
      this.state.opponent.hp -= damageToHp;
      this.state.opponent.shield = remainingShield;

      // Apply combo bonus effect if any
      if (combo.bonusEffect) {
        this.state.opponent.statusEffects.push(combo.bonusEffect);
        this.state.battleLog.push(`Applied ${combo.bonusEffect.type} effect!`);
      }
    } else {
      this.state.lastCombo = null;
    }

    // Add to log
    this.state.battleLog.push(`You played ${card.name}`);

    // Check win condition
    this.checkWinCondition();

    return { success: true, message: `Played ${card.name}` };
  }

  /**
   * Execute card effect with shields and difficulty scaling
   */
  private executeCardEffect(card: SimpleCard, caster: 'player' | 'opponent'): void {
    const target = caster === 'player' ? this.state.opponent : this.state.player;
    const self = caster === 'player' ? this.state.player : this.state.opponent;
    const difficultySettings = getDifficultySettings(this.difficulty);

    switch (card.type) {
      case 'attack': {
        // Apply difficulty multiplier to opponent damage
        let damage = card.value;
        if (caster === 'opponent') {
          damage = Math.floor(damage * difficultySettings.enemyDamageMultiplier);
        }

        // Calculate damage with shield absorption
        const { damageToHp, remainingShield } = calculateDamage(damage, target.shield);

        target.hp -= damageToHp;
        target.hp = Math.max(0, target.hp);
        target.shield = remainingShield;

        if (target.shield > 0 && damage > damageToHp) {
          this.state.battleLog.push(
            `${caster === 'player' ? 'You' : 'Enemy'} dealt ${damage} damage! (${
              damage - damageToHp
            } blocked by shield)`
          );
        } else {
          this.state.battleLog.push(`${caster === 'player' ? 'You' : 'Enemy'} dealt ${damageToHp} damage!`);
        }
        break;
      }

      case 'heal': {
        self.hp += card.value;
        self.hp = Math.min(self.hp, self.maxHp);
        this.state.battleLog.push(`${caster === 'player' ? 'You' : 'Enemy'} healed ${card.value} HP!`);
        break;
      }

      case 'buff': {
        // Buff grants shield
        self.shield += card.value;
        this.state.battleLog.push(`${caster === 'player' ? 'You' : 'Enemy'} gained ${card.value} shield!`);
        break;
      }
    }
  }

  /**
   * End turn with status effect application
   */
  endTurn(): void {
    if (this.state.currentTurn === 'player') {
      this.state.battleLog.push('You ended your turn');

      // Reset recent cards for combo tracking
      this.state.player.recentCards = [];

      this.state.currentTurn = 'opponent';

      // Start opponent turn
      this.executeOpponentTurn();
    }
  }

  /**
   * AI turn with status effect processing
   */
  private executeOpponentTurn(): void {
    this.state.battleLog.push(`${this.state.opponent.name}'s turn`);

    // Apply status effects at start of opponent's turn
    const opponentEffects = applyStatusEffects(
      this.state.opponent,
      this.state.battleLog,
      this.state.opponent.name
    );
    this.state.opponent.hp = opponentEffects.hp;
    this.state.opponent.shield = opponentEffects.shield;
    this.state.opponent.statusEffects = opponentEffects.statusEffects;

    // Check if opponent died from status effects
    this.checkWinCondition();
    if (this.state.status === 'ended') return;

    // Refill mana
    this.state.opponent.mana = this.state.opponent.maxMana;

    // Draw a card if deck has cards
    if (this.state.opponent.deck.length > 0) {
      const drawnCard = this.state.opponent.deck.pop()!;
      this.state.opponent.hand.push(drawnCard);
    }

    // Simple AI: Play first affordable card
    for (let i = 0; i < this.state.opponent.hand.length; i++) {
      const card = this.state.opponent.hand[i];

      if (card.manaCost <= this.state.opponent.mana) {
        // Remove from hand
        this.state.opponent.hand.splice(i, 1);
        this.state.opponent.mana -= card.manaCost;
        this.state.opponent.discard.push(card);

        // Execute effect
        this.executeCardEffect(card, 'opponent');
        this.state.battleLog.push(`${this.state.opponent.name} played ${card.name}`);

        break; // Play only one card per turn for simplicity
      }
    }

    // Check win condition
    this.checkWinCondition();

    // End opponent turn
    if (this.state.status === 'active') {
      this.state.turnNumber++;
      this.state.currentTurn = 'player';

      // Apply status effects at start of player's turn
      const playerEffects = applyStatusEffects(this.state.player, this.state.battleLog, 'You');
      this.state.player.hp = playerEffects.hp;
      this.state.player.shield = playerEffects.shield;
      this.state.player.statusEffects = playerEffects.statusEffects;

      // Check if player died from status effects
      this.checkWinCondition();
      if (this.state.status === 'ended') return;

      // Refill player mana
      this.state.player.mana = this.state.player.maxMana;

      // Draw a card for player
      if (this.state.player.deck.length > 0) {
        const drawnCard = this.state.player.deck.pop()!;
        this.state.player.hand.push(drawnCard);
        this.state.battleLog.push('You drew a card');
      }

      this.state.battleLog.push('Your turn');
    }
  }

  /**
   * Check win/loss conditions
   */
  private checkWinCondition(): void {
    if (this.state.player.hp <= 0) {
      this.state.winner = 'opponent';
      this.state.status = 'ended';
      this.state.battleLog.push('You lost!');
    } else if (this.state.opponent.hp <= 0) {
      this.state.winner = 'player';
      this.state.status = 'ended';
      this.state.battleLog.push('You won!');
    }
  }

  /**
   * Check if battle is over
   */
  isOver(): boolean {
    return this.state.status === 'ended';
  }

  /**
   * Get winner
   */
  getWinner(): 'player' | 'opponent' | null {
    return this.state.winner;
  }
}

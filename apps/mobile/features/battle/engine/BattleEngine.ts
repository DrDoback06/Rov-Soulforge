/**
 * Battle Engine - Simplified Working Implementation
 *
 * This is a SIMPLE, WORKING battle system built from scratch.
 * Focus: Get battles actually working in the app.
 */

import type { Character } from '@rov/types';

// Simple battle state (not using complex BattleManager yet)
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
  };
  currentTurn: 'player' | 'opponent';
  turnNumber: number;
  battleLog: string[];
  winner: 'player' | 'opponent' | null;
  status: 'active' | 'ended';
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
 * Simple Battle Engine
 *
 * Keeps track of battle state and executes actions
 */
export class SimpleBattleEngine {
  private state: SimpleBattleState;

  constructor(playerCharacter: Character, opponentName: string = 'Goblin') {
    this.state = this.initializeBattle(playerCharacter, opponentName);
  }

  /**
   * Initialize a new battle
   */
  private initializeBattle(playerCharacter: Character, opponentName: string): SimpleBattleState {
    // Create simple starter deck for player
    const playerDeck = this.createStarterDeck();

    // Create simple enemy deck
    const opponentDeck = this.createEnemyDeck();

    // Draw starting hands
    const playerHand = playerDeck.splice(0, 4);
    const opponentHand = opponentDeck.splice(0, 4);

    return {
      id: `battle_${Date.now()}`,
      player: {
        characterId: playerCharacter.id,
        name: playerCharacter.classId || 'Player',
        hp: playerCharacter.counters.hp,
        maxHp: playerCharacter.stats.maxHp || 20,
        mana: 3,
        maxMana: 3,
        hand: playerHand,
        deck: playerDeck,
        discard: []
      },
      opponent: {
        name: opponentName,
        hp: 15,
        maxHp: 15,
        mana: 3,
        maxMana: 3,
        hand: opponentHand,
        deck: opponentDeck,
        discard: []
      },
      currentTurn: 'player',
      turnNumber: 1,
      battleLog: ['Battle started!'],
      winner: null,
      status: 'active'
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
   * Create a simple enemy deck
   */
  private createEnemyDeck(): SimpleCard[] {
    return [
      { id: 'claw_1', name: 'Claw', manaCost: 1, type: 'attack', value: 2, description: 'Deal 2 damage' },
      { id: 'claw_2', name: 'Claw', manaCost: 1, type: 'attack', value: 2, description: 'Deal 2 damage' },
      { id: 'bite', name: 'Bite', manaCost: 2, type: 'attack', value: 5, description: 'Deal 5 damage' },
      { id: 'regenerate', name: 'Regenerate', manaCost: 2, type: 'heal', value: 3, description: 'Heal 3 HP' },
    ];
  }

  /**
   * Get current battle state
   */
  getState(): SimpleBattleState {
    return { ...this.state };
  }

  /**
   * Play a card
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

    // Execute card effect
    this.executeCardEffect(card, 'player');

    // Add to log
    this.state.battleLog.push(`You played ${card.name}`);

    // Check win condition
    this.checkWinCondition();

    return { success: true, message: `Played ${card.name}` };
  }

  /**
   * Execute card effect
   */
  private executeCardEffect(card: SimpleCard, caster: 'player' | 'opponent'): void {
    const target = caster === 'player' ? this.state.opponent : this.state.player;
    const self = caster === 'player' ? this.state.player : this.state.opponent;

    switch (card.type) {
      case 'attack':
        target.hp -= card.value;
        target.hp = Math.max(0, target.hp);
        this.state.battleLog.push(`${caster === 'player' ? 'You' : target.name} dealt ${card.value} damage!`);
        break;

      case 'heal':
        self.hp += card.value;
        self.hp = Math.min(self.hp, self.maxHp);
        this.state.battleLog.push(`${caster === 'player' ? 'You' : self.name} healed ${card.value} HP!`);
        break;

      case 'buff':
        // Simple buff: next attack deals more damage (not fully implemented yet)
        this.state.battleLog.push(`${caster === 'player' ? 'You' : self.name} got stronger!`);
        break;
    }
  }

  /**
   * End turn (player passes)
   */
  endTurn(): void {
    if (this.state.currentTurn === 'player') {
      this.state.battleLog.push('You ended your turn');
      this.state.currentTurn = 'opponent';

      // Start opponent turn
      this.executeOpponentTurn();
    }
  }

  /**
   * Simple AI: Opponent plays a card
   */
  private executeOpponentTurn(): void {
    this.state.battleLog.push(`${this.state.opponent.name}'s turn`);

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

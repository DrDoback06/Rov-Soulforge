import type { Battle, BattleState, BattleMode, Character, StackItem, BattleLogEntry } from '@rov/types';
import { TurnManager, DEFAULT_TURN_CONFIG, determineTurnOrder } from './turn-manager';
import { BattleRNG, generateSeed } from './rng';
import { resolveStack, pushToStack } from './stack';
import { executeRegisteredEffect, EffectContext } from './effects';

/**
 * Battle State Manager
 *
 * Manages the complete state of a battle, including:
 * - Turn order and timing
 * - The Stack (instant card resolution)
 * - Player actions and card plays
 * - Win/loss conditions
 * - Battle log
 */

export interface BattleConfig {
  mode: BattleMode;
  ranked?: boolean;
  coopRaid?: boolean;
  bossId?: string;
}

export type BattleAction =
  | { type: 'playCard'; charId: string; cardId: string; cardName: string; targets?: string[] }
  | { type: 'playInstant'; charId: string; cardId: string; cardName: string; targets?: string[] }
  | { type: 'activateSkill'; charId: string; skillId: string; targets?: string[] }
  | { type: 'useItem'; charId: string; itemId: string; targets?: string[] }
  | { type: 'passTurn'; charId: string }
  | { type: 'surrender'; charId: string };

export class BattleManager {
  private battle: Battle;
  private characters: Map<string, Character>;
  private turnManager: TurnManager;
  private rng: BattleRNG;
  private config: BattleConfig;

  constructor(
    battleId: string,
    participants: string[],
    characters: Map<string, Character>,
    config: BattleConfig,
    seed?: string
  ) {
    this.characters = characters;
    this.config = config;

    // Initialize RNG
    const battleSeed = seed || generateSeed('battle', battleId, ...participants);
    this.rng = new BattleRNG(battleId, battleSeed);

    // Determine turn order based on SPD stat
    const turnOrder = determineTurnOrder(
      participants,
      new Map(Array.from(characters.entries()).map(([id, char]) => [id, { spd: char.stats.spd }])),
      () => this.rng.random()
    );

    // Initialize battle state
    this.battle = {
      id: battleId,
      mode: config.mode,
      participants,
      state: 'active',
      turnOrder,
      currentTurn: turnOrder[0],
      stack: [],
      log: [],
      timers: {
        ropeMs: DEFAULT_TURN_CONFIG.ropeThresholdMs,
        maxMs: DEFAULT_TURN_CONFIG.baseTurnMs,
        turnStart: Date.now()
      },
      normalization: config.ranked ? { ranked: true } : undefined,
      bossState: config.bossId ? this.initializeBossState(config.bossId) : undefined
    };

    // Initialize turn manager
    this.turnManager = new TurnManager(turnOrder[0], turnOrder);

    // Set up turn callbacks
    this.setupTurnCallbacks();
  }

  /**
   * Initialize boss state for co-op raid
   */
  private initializeBossState(bossId: string) {
    // In full implementation, load boss from card database
    return {
      bossId,
      hp: 1000,
      maxHp: 1000,
      counters: {}
    };
  }

  /**
   * Set up turn manager callbacks
   */
  private setupTurnCallbacks(): void {
    this.turnManager.onTurnStart((player, turnNumber) => {
      this.logEvent({
        timestamp: Date.now(),
        type: 'turn',
        charId: player,
        message: `Turn ${turnNumber} - ${player}'s turn`
      });

      // Auto-draw at start of turn
      this.drawCards(player, 1);
    });

    this.turnManager.onRopeAppear((player, remainingMs) => {
      this.logEvent({
        timestamp: Date.now(),
        type: 'turn',
        charId: player,
        message: `Rope appears - ${Math.ceil(remainingMs / 1000)}s remaining`
      });
    });

    this.turnManager.onTurnTimeout((player) => {
      this.logEvent({
        timestamp: Date.now(),
        type: 'turn',
        charId: player,
        message: `${player} timed out - turn auto-passed`
      });
    });
  }

  /**
   * Execute a battle action
   */
  executeAction(action: BattleAction): { success: boolean; error?: string } {
    // Validate action
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    switch (action.type) {
      case 'playCard':
        return this.handlePlayCard(action);
      case 'playInstant':
        return this.handlePlayInstant(action);
      case 'activateSkill':
        return this.handleActivateSkill(action);
      case 'useItem':
        return this.handleUseItem(action);
      case 'passTurn':
        return this.handlePassTurn(action);
      case 'surrender':
        return this.handleSurrender(action);
      default:
        return { success: false, error: 'Unknown action type' };
    }
  }

  /**
   * Validate an action
   */
  private validateAction(action: BattleAction): { valid: boolean; error?: string } {
    // Check if it's the player's turn
    if (action.type !== 'playInstant' && action.charId !== this.battle.currentTurn) {
      return { valid: false, error: 'Not your turn' };
    }

    // Check if battle is active
    if (this.battle.state !== 'active') {
      return { valid: false, error: 'Battle is not active' };
    }

    return { valid: true };
  }

  /**
   * Handle playing a card
   */
  private handlePlayCard(action: BattleAction & { type: 'playCard' }): { success: boolean; error?: string } {
    const char = this.characters.get(action.charId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    // In full implementation: check mana cost, remove from hand, apply effects
    this.logEvent({
      timestamp: Date.now(),
      type: 'card',
      charId: action.charId,
      message: `${action.charId} played ${action.cardName}`
    });

    return { success: true };
  }

  /**
   * Handle playing an instant card (goes on stack)
   */
  private handlePlayInstant(action: BattleAction & { type: 'playInstant' }): { success: boolean; error?: string } {
    const char = this.characters.get(action.charId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    // Add to stack
    const stackItem: StackItem = {
      cardId: action.cardId,
      cardName: action.cardName,
      playedBy: action.charId,
      effects: [], // Load from card database
      cancelled: false
    };

    this.battle.stack = pushToStack(this.battle.stack, stackItem);

    // Add time bonus for stack event
    this.turnManager.onStackEvent();

    this.logEvent({
      timestamp: Date.now(),
      type: 'card',
      charId: action.charId,
      message: `${action.charId} played instant: ${action.cardName}`
    });

    return { success: true };
  }

  /**
   * Handle activating a skill
   */
  private handleActivateSkill(action: BattleAction & { type: 'activateSkill' }): { success: boolean; error?: string } {
    const char = this.characters.get(action.charId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    // In full implementation: check if skill is available, apply effects
    this.logEvent({
      timestamp: Date.now(),
      type: 'skill',
      charId: action.charId,
      message: `${action.charId} activated skill: ${action.skillId}`
    });

    return { success: true };
  }

  /**
   * Handle using an item
   */
  private handleUseItem(action: BattleAction & { type: 'useItem' }): { success: boolean; error?: string } {
    const char = this.characters.get(action.charId);
    if (!char) {
      return { success: false, error: 'Character not found' };
    }

    // In full implementation: check if item exists in inventory, apply effects
    this.logEvent({
      timestamp: Date.now(),
      type: 'item',
      charId: action.charId,
      message: `${action.charId} used item: ${action.itemId}`
    });

    return { success: true };
  }

  /**
   * Handle passing turn
   */
  private handlePassTurn(action: BattleAction & { type: 'passTurn' }): { success: boolean; error?: string } {
    // Resolve stack if any items on it
    if (this.battle.stack.length > 0) {
      this.resolveCurrentStack();
    }

    this.turnManager.passTurn();

    return { success: true };
  }

  /**
   * Handle surrender
   */
  private handleSurrender(action: BattleAction & { type: 'surrender' }): { success: boolean; error?: string } {
    this.logEvent({
      timestamp: Date.now(),
      type: 'surrender',
      charId: action.charId,
      message: `${action.charId} surrendered`
    });

    // Remove player from active players
    this.turnManager.removePlayer(action.charId);

    // Check for battle end
    this.checkWinCondition();

    return { success: true };
  }

  /**
   * Resolve the current stack
   */
  private resolveCurrentStack(): void {
    const context = {
      battle: this.battle.state,
      characters: this.characters,
      rng: () => this.rng.random()
    };

    const results = resolveStack(this.battle.stack, context);

    // Log results
    results.forEach(result => {
      result.log.forEach(logMsg => {
        this.logEvent({
          timestamp: Date.now(),
          type: 'stack',
          message: logMsg
        });
      });
    });

    // Clear stack
    this.battle.stack = [];

    // Check for deaths and win condition
    this.checkWinCondition();
  }

  /**
   * Draw cards for a character
   */
  private drawCards(charId: string, count: number): void {
    // In full implementation: interact with deck manager
    this.logEvent({
      timestamp: Date.now(),
      type: 'draw',
      charId,
      message: `${charId} drew ${count} card(s)`
    });
  }

  /**
   * Check win condition (Last Player Standing)
   */
  private checkWinCondition(): void {
    const aliveCharacters = Array.from(this.characters.values()).filter(
      char => char.counters.hp > 0 && char.lives > 0
    );

    if (aliveCharacters.length === 1) {
      const winner = aliveCharacters[0];
      this.battle.state = 'completed';

      this.logEvent({
        timestamp: Date.now(),
        type: 'victory',
        charId: winner.id,
        message: `${winner.id} wins!`
      });
    } else if (aliveCharacters.length === 0) {
      this.battle.state = 'completed';

      this.logEvent({
        timestamp: Date.now(),
        type: 'draw',
        message: 'Battle ended in a draw'
      });
    }
  }

  /**
   * Log an event to battle log
   */
  private logEvent(entry: BattleLogEntry): void {
    this.battle.log.push(entry);
  }

  /**
   * Tick the battle (called regularly to update timers)
   */
  tick(): void {
    if (this.battle.state !== 'active') return;

    this.turnManager.tick();
  }

  /**
   * Get current battle state
   */
  getState(): Battle {
    return { ...this.battle };
  }

  /**
   * Get character state
   */
  getCharacter(charId: string): Character | undefined {
    return this.characters.get(charId);
  }

  /**
   * Get all characters
   */
  getAllCharacters(): Map<string, Character> {
    return new Map(this.characters);
  }

  /**
   * Get RNG log for audit
   */
  getRNGLog() {
    return this.rng.exportLog();
  }

  /**
   * Export battle for persistence
   */
  export(): {
    battle: Battle;
    characters: Character[];
    rngLog: ReturnType<BattleRNG['exportLog']>;
  } {
    return {
      battle: this.battle,
      characters: Array.from(this.characters.values()),
      rngLog: this.rng.exportLog()
    };
  }
}
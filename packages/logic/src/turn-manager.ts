import type { BattleState } from '@rov/types';

/**
 * Turn Manager
 *
 * Manages turn order, turn timers, and the rope system.
 * - Base turn timer: 60 seconds
 * - +15 seconds per stack event (instants played)
 * - Rope appears at 15 seconds remaining
 */

export interface TurnConfig {
  baseTurnMs: number;
  ropeThresholdMs: number;
  stackBonusMs: number;
}

export const DEFAULT_TURN_CONFIG: TurnConfig = {
  baseTurnMs: 60000, // 60 seconds
  ropeThresholdMs: 15000, // 15 seconds
  stackBonusMs: 15000 // 15 seconds per stack event
};

export interface TurnState {
  currentPlayer: string;
  turnNumber: number;
  turnStartMs: number;
  turnEndMs: number;
  stackEventsThisTurn: number;
  ropeVisible: boolean;
}

/**
 * Initialize turn state for a new battle
 */
export function initializeTurnState(
  firstPlayer: string,
  config: TurnConfig = DEFAULT_TURN_CONFIG
): TurnState {
  const now = Date.now();

  return {
    currentPlayer: firstPlayer,
    turnNumber: 1,
    turnStartMs: now,
    turnEndMs: now + config.baseTurnMs,
    stackEventsThisTurn: 0,
    ropeVisible: false
  };
}

/**
 * Start a new turn for the next player
 */
export function startNextTurn(
  currentState: TurnState,
  nextPlayer: string,
  config: TurnConfig = DEFAULT_TURN_CONFIG
): TurnState {
  const now = Date.now();

  return {
    currentPlayer: nextPlayer,
    turnNumber: currentState.turnNumber + 1,
    turnStartMs: now,
    turnEndMs: now + config.baseTurnMs,
    stackEventsThisTurn: 0,
    ropeVisible: false
  };
}

/**
 * Add time to current turn due to stack event (instant played)
 */
export function addStackBonus(
  currentState: TurnState,
  config: TurnConfig = DEFAULT_TURN_CONFIG
): TurnState {
  return {
    ...currentState,
    turnEndMs: currentState.turnEndMs + config.stackBonusMs,
    stackEventsThisTurn: currentState.stackEventsThisTurn + 1
  };
}

/**
 * Get remaining time in milliseconds
 */
export function getRemainingTime(
  turnState: TurnState,
  now: number = Date.now()
): number {
  return Math.max(0, turnState.turnEndMs - now);
}

/**
 * Check if rope should be visible
 */
export function shouldShowRope(
  turnState: TurnState,
  config: TurnConfig = DEFAULT_TURN_CONFIG,
  now: number = Date.now()
): boolean {
  const remaining = getRemainingTime(turnState, now);
  return remaining <= config.ropeThresholdMs;
}

/**
 * Check if turn has expired
 */
export function isTurnExpired(
  turnState: TurnState,
  now: number = Date.now()
): boolean {
  return now >= turnState.turnEndMs;
}

/**
 * Get turn progress as percentage (0-100)
 */
export function getTurnProgress(
  turnState: TurnState,
  now: number = Date.now()
): number {
  const totalDuration = turnState.turnEndMs - turnState.turnStartMs;
  const elapsed = now - turnState.turnStartMs;

  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}

/**
 * Determine turn order for a battle
 */
export function determineTurnOrder(
  participants: string[],
  characterStats: Map<string, { spd: number }>,
  rng: () => number
): string[] {
  // Sort by SPD stat (descending)
  const sorted = [...participants].sort((a, b) => {
    const spdA = characterStats.get(a)?.spd || 0;
    const spdB = characterStats.get(b)?.spd || 0;

    if (spdA !== spdB) {
      return spdB - spdA; // Higher SPD goes first
    }

    // Tie-breaker: random
    return rng() - 0.5;
  });

  return sorted;
}

/**
 * Get next player in turn order
 */
export function getNextPlayer(
  currentPlayer: string,
  turnOrder: string[],
  activePlayers: Set<string>
): string | null {
  const currentIndex = turnOrder.indexOf(currentPlayer);

  if (currentIndex === -1) {
    return null;
  }

  // Find next active player
  for (let i = 1; i <= turnOrder.length; i++) {
    const nextIndex = (currentIndex + i) % turnOrder.length;
    const nextPlayer = turnOrder[nextIndex];

    if (activePlayers.has(nextPlayer)) {
      return nextPlayer;
    }
  }

  return null;
}

/**
 * Auto-pass turn when timer expires
 */
export function handleTurnTimeout(
  turnState: TurnState,
  turnOrder: string[],
  activePlayers: Set<string>,
  config: TurnConfig = DEFAULT_TURN_CONFIG
): TurnState | null {
  if (!isTurnExpired(turnState)) {
    return null;
  }

  const nextPlayer = getNextPlayer(
    turnState.currentPlayer,
    turnOrder,
    activePlayers
  );

  if (!nextPlayer) {
    return null;
  }

  return startNextTurn(turnState, nextPlayer, config);
}

/**
 * Turn Manager - wraps turn state and provides high-level operations
 */
export class TurnManager {
  private state: TurnState;
  private config: TurnConfig;
  private turnOrder: string[];
  private activePlayers: Set<string>;
  private callbacks: {
    onTurnStart?: (player: string, turnNumber: number) => void;
    onRopeAppear?: (player: string, remainingMs: number) => void;
    onTurnTimeout?: (player: string) => void;
  };

  constructor(
    firstPlayer: string,
    turnOrder: string[],
    config: TurnConfig = DEFAULT_TURN_CONFIG
  ) {
    this.state = initializeTurnState(firstPlayer, config);
    this.config = config;
    this.turnOrder = turnOrder;
    this.activePlayers = new Set(turnOrder);
    this.callbacks = {};
  }

  // Getters
  getCurrentPlayer(): string {
    return this.state.currentPlayer;
  }

  getTurnNumber(): number {
    return this.state.turnNumber;
  }

  getRemainingTime(): number {
    return getRemainingTime(this.state);
  }

  isRopeVisible(): boolean {
    return shouldShowRope(this.state, this.config);
  }

  getTurnProgress(): number {
    return getTurnProgress(this.state);
  }

  // Actions
  onStackEvent(): void {
    this.state = addStackBonus(this.state, this.config);
  }

  passTurn(): boolean {
    const nextPlayer = getNextPlayer(
      this.state.currentPlayer,
      this.turnOrder,
      this.activePlayers
    );

    if (!nextPlayer) {
      return false;
    }

    this.state = startNextTurn(this.state, nextPlayer, this.config);

    if (this.callbacks.onTurnStart) {
      this.callbacks.onTurnStart(nextPlayer, this.state.turnNumber);
    }

    return true;
  }

  removePlayer(playerId: string): void {
    this.activePlayers.delete(playerId);
  }

  // Timer tick - call this regularly to check for rope/timeout
  tick(): void {
    const now = Date.now();

    // Check for rope appearance
    if (!this.state.ropeVisible && shouldShowRope(this.state, this.config, now)) {
      this.state.ropeVisible = true;

      if (this.callbacks.onRopeAppear) {
        this.callbacks.onRopeAppear(
          this.state.currentPlayer,
          getRemainingTime(this.state, now)
        );
      }
    }

    // Check for turn timeout
    if (isTurnExpired(this.state, now)) {
      if (this.callbacks.onTurnTimeout) {
        this.callbacks.onTurnTimeout(this.state.currentPlayer);
      }

      this.passTurn();
    }
  }

  // Callbacks
  onTurnStart(callback: (player: string, turnNumber: number) => void): void {
    this.callbacks.onTurnStart = callback;
  }

  onRopeAppear(callback: (player: string, remainingMs: number) => void): void {
    this.callbacks.onRopeAppear = callback;
  }

  onTurnTimeout(callback: (player: string) => void): void {
    this.callbacks.onTurnTimeout = callback;
  }

  // Export state for persistence
  exportState(): TurnState {
    return { ...this.state };
  }

  // Import state from persistence
  importState(state: TurnState): void {
    this.state = state;
  }
}
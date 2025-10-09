/**
 * RNG Engine - Deterministic Random Number Generation
 *
 * Generates cryptographically secure seeds and provides
 * deterministic dice rolling for battle fairness and replay ability
 */

import { randomBytes } from 'expo-crypto';

// ============================================================================
// Seed Generation
// ============================================================================

/**
 * Generate a secure RNG seed
 */
export function generateRNGSeed(): string {
  const bytes = randomBytes(16);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a battle seed from player IDs and timestamp
 */
export function generateBattleSeed(playerIds: string[], timestamp: number): string {
  const combined = [...playerIds].sort().join('_') + '_' + timestamp.toString();
  return hashString(combined);
}

// ============================================================================
// Dice Rolling
// ============================================================================

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

/**
 * Roll a dice with deterministic seed
 */
export function rollDiceWithSeed(diceType: DiceType, seed: string): number {
  const maxValue = getDiceMaxValue(diceType);
  const seedNumber = seedToNumber(seed);

  // Use seeded pseudo-random
  const random = seededRandom(seedNumber);
  return Math.floor(random * maxValue) + 1;
}

/**
 * Roll multiple dice
 */
export function rollMultipleDice(
  diceType: DiceType,
  count: number,
  seed: string
): number[] {
  const results: number[] = [];

  for (let i = 0; i < count; i++) {
    // Create unique seed for each roll
    const rollSeed = `${seed}_${i}`;
    results.push(rollDiceWithSeed(diceType, rollSeed));
  }

  return results;
}

/**
 * Roll with advantage (roll twice, take higher)
 */
export function rollWithAdvantage(diceType: DiceType, seed: string): {
  result: number;
  rolls: [number, number];
} {
  const roll1 = rollDiceWithSeed(diceType, `${seed}_adv1`);
  const roll2 = rollDiceWithSeed(diceType, `${seed}_adv2`);

  return {
    result: Math.max(roll1, roll2),
    rolls: [roll1, roll2]
  };
}

/**
 * Roll with disadvantage (roll twice, take lower)
 */
export function rollWithDisadvantage(diceType: DiceType, seed: string): {
  result: number;
  rolls: [number, number];
} {
  const roll1 = rollDiceWithSeed(diceType, `${seed}_dis1`);
  const roll2 = rollDiceWithSeed(diceType, `${seed}_dis2`);

  return {
    result: Math.min(roll1, roll2),
    rolls: [roll1, roll2]
  };
}

// ============================================================================
// Probability Calculations
// ============================================================================

/**
 * Calculate average damage/heal from dice
 */
export function calculateAverageDiceRoll(diceType: DiceType, count: number = 1): number {
  const maxValue = getDiceMaxValue(diceType);
  const average = (1 + maxValue) / 2;
  return average * count;
}

/**
 * Calculate probability of rolling at least X
 */
export function calculateProbability(
  diceType: DiceType,
  threshold: number
): number {
  const maxValue = getDiceMaxValue(diceType);

  if (threshold < 1) return 1.0;
  if (threshold > maxValue) return 0.0;

  return (maxValue - threshold + 1) / maxValue;
}

/**
 * Calculate expected damage with scaling
 */
export function calculateExpectedDamage(
  baseDamage: number,
  diceType: DiceType,
  diceCount: number,
  statScaling?: { stat: number; factor: number }
): number {
  let total = baseDamage;

  // Add dice average
  total += calculateAverageDiceRoll(diceType, diceCount);

  // Add stat scaling
  if (statScaling) {
    total += Math.floor(statScaling.stat * statScaling.factor);
  }

  return Math.floor(total);
}

// ============================================================================
// Card Draw Simulation
// ============================================================================

/**
 * Shuffle a deck deterministically
 */
export function shuffleDeck<T>(deck: T[], seed: string): T[] {
  const shuffled = [...deck];
  const seedNumber = seedToNumber(seed);

  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const random = seededRandom(seedNumber + i);
    const j = Math.floor(random * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Draw random cards from deck
 */
export function drawRandomCards<T>(
  deck: T[],
  count: number,
  seed: string
): {
  drawn: T[];
  remaining: T[];
} {
  const shuffled = shuffleDeck(deck, seed);
  const drawn = shuffled.slice(0, count);
  const remaining = shuffled.slice(count);

  return { drawn, remaining };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDiceMaxValue(diceType: DiceType): number {
  switch (diceType) {
    case 'd4': return 4;
    case 'd6': return 6;
    case 'd8': return 8;
    case 'd10': return 10;
    case 'd12': return 12;
    case 'd20': return 20;
    case 'd100': return 100;
    default: return 6;
  }
}

function seedToNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded pseudo-random number generator (Linear Congruential Generator)
 * Returns a number between 0 and 1
 */
function seededRandom(seed: number): number {
  // LCG parameters (from Numerical Recipes)
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  const next = (a * seed + c) % m;
  return next / m;
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).padStart(16, '0');
}

// ============================================================================
// Battle Validation
// ============================================================================

/**
 * Validate a dice roll result
 */
export function validateDiceRoll(
  diceType: DiceType,
  result: number,
  seed: string
): boolean {
  const expectedResult = rollDiceWithSeed(diceType, seed);
  return result === expectedResult;
}

/**
 * Validate an entire battle replay
 */
export interface BattleReplayValidation {
  valid: boolean;
  invalidRolls?: Array<{
    turnNumber: number;
    expected: number;
    actual: number;
    seed: string;
  }>;
}

export function validateBattleReplay(
  battleLog: Array<{
    turnNumber: number;
    diceRolls?: Array<{
      diceType: DiceType;
      result: number;
      rngSeed: string;
    }>;
  }>
): BattleReplayValidation {
  const invalidRolls: BattleReplayValidation['invalidRolls'] = [];

  for (const entry of battleLog) {
    if (!entry.diceRolls) continue;

    for (const roll of entry.diceRolls) {
      const isValid = validateDiceRoll(roll.diceType, roll.result, roll.rngSeed);

      if (!isValid) {
        const expected = rollDiceWithSeed(roll.diceType, roll.rngSeed);
        invalidRolls.push({
          turnNumber: entry.turnNumber,
          expected,
          actual: roll.result,
          seed: roll.rngSeed
        });
      }
    }
  }

  return {
    valid: invalidRolls.length === 0,
    invalidRolls: invalidRolls.length > 0 ? invalidRolls : undefined
  };
}

// ============================================================================
// Dice Animation Data
// ============================================================================

export interface DiceAnimationFrame {
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  timestamp: number;
}

/**
 * Generate dice roll animation frames
 */
export function generateDiceAnimation(
  finalResult: number,
  duration: number = 1000 // ms
): DiceAnimationFrame[] {
  const frames: DiceAnimationFrame[] = [];
  const frameCount = 60; // 60 FPS
  const frameInterval = duration / frameCount;

  for (let i = 0; i < frameCount; i++) {
    const t = i / frameCount; // 0 to 1
    const easing = easeOutCubic(t);

    // Rotation decreases as we approach final result
    const rotationSpeed = (1 - easing) * 720; // degrees

    frames.push({
      rotation: {
        x: rotationSpeed * Math.sin(t * Math.PI * 4),
        y: rotationSpeed * Math.cos(t * Math.PI * 3),
        z: rotationSpeed * Math.sin(t * Math.PI * 5)
      },
      position: {
        x: Math.sin(t * Math.PI * 2) * (1 - easing) * 50,
        y: -Math.abs(Math.sin(t * Math.PI)) * (1 - easing) * 100,
        z: 0
      },
      timestamp: i * frameInterval
    });
  }

  return frames;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

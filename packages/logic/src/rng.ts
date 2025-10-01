/**
 * RNG (Random Number Generator) System
 *
 * Provides seeded random number generation for deterministic gameplay.
 * All dice rolls and random events are logged with their seeds for audit purposes.
 */

export interface RNGSeed {
  value: string;
  timestamp: number;
  source: 'battle' | 'dice' | 'loot' | 'spawn' | 'quest';
}

export interface DiceRoll {
  id: string;
  seed: string;
  sides: number;
  result: number;
  timestamp: number;
  context?: string;
}

export interface RNGLog {
  battleId?: string;
  rolls: DiceRoll[];
  seeds: RNGSeed[];
}

/**
 * Seeded Random Number Generator using Mulberry32 algorithm
 * Fast, simple, and produces good quality randomness
 */
export class SeededRNG {
  private state: number;
  private readonly initialSeed: string;
  private log: DiceRoll[] = [];

  constructor(seed: string) {
    this.initialSeed = seed;
    this.state = this.hashSeed(seed);
  }

  /**
   * Hash a string seed into a 32-bit number
   */
  private hashSeed(seed: string): number {
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  /**
   * Generate next random number [0, 1)
   */
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  /**
   * Generate random integer [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Roll a dice with specified sides
   */
  rollDice(sides: number, context?: string): DiceRoll {
    const result = this.nextInt(1, sides);
    const roll: DiceRoll = {
      id: generateRollId(),
      seed: this.initialSeed,
      sides,
      result,
      timestamp: Date.now(),
      context
    };

    this.log.push(roll);

    return roll;
  }

  /**
   * Roll multiple dice and sum results
   */
  rollMultipleDice(count: number, sides: number, context?: string): {
    rolls: DiceRoll[];
    total: number;
  } {
    const rolls: DiceRoll[] = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
      const roll = this.rollDice(sides, context ? `${context} (${i + 1}/${count})` : undefined);
      rolls.push(roll);
      total += roll.result;
    }

    return { rolls, total };
  }

  /**
   * Get roll history
   */
  getLog(): DiceRoll[] {
    return [...this.log];
  }

  /**
   * Clear roll history
   */
  clearLog(): void {
    this.log = [];
  }

  /**
   * Reset RNG to initial seed
   */
  reset(): void {
    this.state = this.hashSeed(this.initialSeed);
    this.log = [];
  }

  /**
   * Get initial seed
   */
  getSeed(): string {
    return this.initialSeed;
  }
}

/**
 * Generate a unique seed from multiple inputs
 */
export function generateSeed(
  ...inputs: (string | number | undefined)[]
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);

  const parts = [
    timestamp.toString(36),
    random,
    ...inputs.filter(i => i !== undefined).map(i => String(i))
  ];

  return parts.join('-');
}

/**
 * Generate a unique roll ID
 */
function generateRollId(): string {
  return `roll_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Battle RNG Manager - manages RNG for a battle
 */
export class BattleRNG {
  private rng: SeededRNG;
  private battleId: string;
  private seedLog: RNGSeed[] = [];

  constructor(battleId: string, seed?: string) {
    this.battleId = battleId;

    const battleSeed = seed || generateSeed('battle', battleId);
    this.rng = new SeededRNG(battleSeed);

    this.logSeed({
      value: battleSeed,
      timestamp: Date.now(),
      source: 'battle'
    });
  }

  /**
   * Roll dice
   */
  rollDice(sides: number, context?: string): DiceRoll {
    return this.rng.rollDice(sides, context);
  }

  /**
   * Roll multiple dice
   */
  rollMultipleDice(count: number, sides: number, context?: string) {
    return this.rng.rollMultipleDice(count, sides, context);
  }

  /**
   * Get random number [0, 1)
   */
  random(): number {
    return this.rng.next();
  }

  /**
   * Get random integer [min, max]
   */
  randomInt(min: number, max: number): number {
    return this.rng.nextInt(min, max);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const index = this.randomInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Log a seed
   */
  private logSeed(seed: RNGSeed): void {
    this.seedLog.push(seed);
  }

  /**
   * Export full RNG log for audit
   */
  exportLog(): RNGLog {
    return {
      battleId: this.battleId,
      rolls: this.rng.getLog(),
      seeds: [...this.seedLog]
    };
  }

  /**
   * Get battle seed
   */
  getSeed(): string {
    return this.rng.getSeed();
  }
}

/**
 * Dice roller with 3D physics simulation metadata
 */
export interface DiceRollAnimation {
  roll: DiceRoll;
  physics: {
    initialVelocity: { x: number; y: number; z: number };
    initialRotation: { x: number; y: number; z: number };
    torque: { x: number; y: number; z: number };
  };
}

/**
 * Generate dice roll with physics animation data
 */
export function rollDiceWithAnimation(
  rng: BattleRNG,
  sides: number,
  context?: string
): DiceRollAnimation {
  const roll = rng.rollDice(sides, context);

  // Generate physics parameters from the same RNG
  // This ensures animations are deterministic and can be replayed
  const physics = {
    initialVelocity: {
      x: rng.random() * 10 - 5,
      y: rng.random() * 15 + 5,
      z: rng.random() * 10 - 5
    },
    initialRotation: {
      x: rng.random() * Math.PI * 2,
      y: rng.random() * Math.PI * 2,
      z: rng.random() * Math.PI * 2
    },
    torque: {
      x: rng.random() * 20 - 10,
      y: rng.random() * 20 - 10,
      z: rng.random() * 20 - 10
    }
  };

  return { roll, physics };
}

/**
 * Verify a roll matches expected result (for anti-cheat)
 */
export function verifyRoll(
  seed: string,
  sides: number,
  expectedResult: number,
  rollIndex: number = 0
): boolean {
  const testRng = new SeededRNG(seed);

  // Advance to the correct roll
  for (let i = 0; i < rollIndex; i++) {
    testRng.next();
  }

  const result = testRng.rollDice(sides);
  return result.result === expectedResult;
}

/**
 * Generate loot drop using weighted probabilities
 */
export function rollWeightedLoot<T>(
  rng: BattleRNG,
  items: Array<{ item: T; weight: number }>
): T | undefined {
  if (items.length === 0) return undefined;

  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  const roll = rng.random() * totalWeight;

  let cumulative = 0;
  for (const { item, weight } of items) {
    cumulative += weight;
    if (roll <= cumulative) {
      return item;
    }
  }

  return items[items.length - 1].item;
}
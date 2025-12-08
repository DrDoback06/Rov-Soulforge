/**
 * Battle Enhancements
 *
 * Additional battle system features for more depth and strategy
 */

import type { SimpleBattleState, SimpleCard } from './BattleEngine';

// Enhancement 1: Status Effects
export type StatusEffect = {
  type: 'burn' | 'poison' | 'shield' | 'strength' | 'weakness';
  value: number;
  duration: number; // turns remaining
  appliedBy: 'player' | 'opponent';
};

export interface EnhancedBattleState extends SimpleBattleState {
  player: SimpleBattleState['player'] & {
    statusEffects: StatusEffect[];
    comboCounter: number;
    shield: number;
  };
  opponent: SimpleBattleState['opponent'] & {
    statusEffects: StatusEffect[];
    shield: number;
  };
  difficulty: 'easy' | 'normal' | 'hard' | 'boss';
  rewards: {
    xp: number;
    gold: number;
    items: string[];
  };
}

// Enhancement 2: Card Combos
export interface CardCombo {
  cards: string[]; // Card types in sequence
  bonusDamage: number;
  bonusEffect?: StatusEffect;
  name: string;
  description: string;
}

export const CARD_COMBOS: CardCombo[] = [
  {
    cards: ['attack', 'attack'],
    bonusDamage: 3,
    name: 'Double Strike',
    description: 'Play 2 attack cards in a row for +3 bonus damage'
  },
  {
    cards: ['buff', 'attack'],
    bonusDamage: 5,
    name: 'Power Strike',
    description: 'Buff followed by attack deals +5 bonus damage'
  },
  {
    cards: ['attack', 'attack', 'attack'],
    bonusDamage: 10,
    bonusEffect: {
      type: 'burn',
      value: 3,
      duration: 2,
      appliedBy: 'player'
    },
    name: 'Triple Assault',
    description: 'Play 3 attacks in a row for +10 damage and apply burn'
  }
];

// Enhancement 3: Difficulty Scaling
export interface DifficultySettings {
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  enemyDeckSize: number;
  startingMana: number;
  xpReward: number;
  goldReward: number;
}

export const DIFFICULTY_SETTINGS: Record<'easy' | 'normal' | 'hard' | 'boss', DifficultySettings> = {
  easy: {
    enemyHpMultiplier: 0.75,
    enemyDamageMultiplier: 0.8,
    enemyDeckSize: 4,
    startingMana: 4,
    xpReward: 50,
    goldReward: 25
  },
  normal: {
    enemyHpMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemyDeckSize: 6,
    startingMana: 3,
    xpReward: 100,
    goldReward: 50
  },
  hard: {
    enemyHpMultiplier: 1.5,
    enemyDamageMultiplier: 1.3,
    enemyDeckSize: 8,
    startingMana: 3,
    xpReward: 200,
    goldReward: 100
  },
  boss: {
    enemyHpMultiplier: 2.5,
    enemyDamageMultiplier: 1.5,
    enemyDeckSize: 10,
    startingMana: 3,
    xpReward: 500,
    goldReward: 250
  }
};

/**
 * Apply status effects at start of turn
 */
export function applyStatusEffects(
  entity: { hp: number; statusEffects: StatusEffect[]; shield: number },
  battleLog: string[],
  entityName: string
): { hp: number; shield: number; statusEffects: StatusEffect[] } {
  let { hp, shield, statusEffects } = entity;

  statusEffects = statusEffects.filter(effect => {
    if (effect.duration <= 0) return false;

    switch (effect.type) {
      case 'burn':
        hp = Math.max(0, hp - effect.value);
        battleLog.push(`🔥 ${entityName} takes ${effect.value} burn damage!`);
        break;
      case 'poison':
        hp = Math.max(0, hp - effect.value);
        battleLog.push(`☠️ ${entityName} takes ${effect.value} poison damage!`);
        break;
      case 'shield':
        shield += effect.value;
        battleLog.push(`🛡️ ${entityName} gains ${effect.value} shield!`);
        break;
    }

    effect.duration--;
    return effect.duration > 0;
  });

  return { hp, shield, statusEffects };
}

/**
 * Check if cards form a combo
 */
export function checkCombo(recentCards: string[]): CardCombo | null {
  for (const combo of CARD_COMBOS) {
    if (recentCards.length < combo.cards.length) continue;

    const lastCards = recentCards.slice(-combo.cards.length);
    if (JSON.stringify(lastCards) === JSON.stringify(combo.cards)) {
      return combo;
    }
  }
  return null;
}

/**
 * Calculate damage with shield absorption
 */
export function calculateDamage(
  damage: number,
  shield: number
): { damageToHp: number; remainingShield: number } {
  if (shield >= damage) {
    return { damageToHp: 0, remainingShield: shield - damage };
  } else {
    return { damageToHp: damage - shield, remainingShield: 0 };
  }
}

/**
 * Get difficulty settings for enemy
 */
export function getDifficultySettings(difficulty: 'easy' | 'normal' | 'hard' | 'boss'): DifficultySettings {
  return DIFFICULTY_SETTINGS[difficulty];
}

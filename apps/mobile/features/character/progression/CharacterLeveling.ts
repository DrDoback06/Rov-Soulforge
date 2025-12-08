/**
 * Character Leveling System
 *
 * Handles XP, leveling, skill points, and stat progression
 */

export interface LevelUpRewards {
  level: number;
  skillPoints: number;
  statPoints: number;
  unlockedAbilities: string[];
  rewards: {
    gold?: number;
    items?: string[];
  };
}

export interface CharacterStats {
  atk: number;
  def: number;
  spd: number;
  maxHp: number;
  maxMana: number;
}

/**
 * Calculate XP required for next level
 * Uses exponential formula: baseXP * (level ^ 1.5)
 */
export function getXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.5));
}

/**
 * Calculate total XP required to reach a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Get current level from total XP
 */
export function getLevelFromXP(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
} {
  let level = 1;
  let xpForCurrentLevel = 0;

  while (xpForCurrentLevel + getXPForLevel(level) <= totalXP) {
    xpForCurrentLevel += getXPForLevel(level);
    level++;
  }

  const currentLevelXP = totalXP - xpForCurrentLevel;
  const nextLevelXP = getXPForLevel(level);
  const progress = (currentLevelXP / nextLevelXP) * 100;

  return {
    level,
    currentLevelXP,
    nextLevelXP,
    progress
  };
}

/**
 * Get rewards for leveling up
 */
export function getLevelUpRewards(newLevel: number): LevelUpRewards {
  const rewards: LevelUpRewards = {
    level: newLevel,
    skillPoints: 1,
    statPoints: 3,
    unlockedAbilities: [],
    rewards: {}
  };

  // Every 5 levels: bonus skill point
  if (newLevel % 5 === 0) {
    rewards.skillPoints += 1;
    rewards.rewards.gold = 100 * newLevel;
  }

  // Every 10 levels: unlock special ability
  if (newLevel % 10 === 0) {
    rewards.unlockedAbilities.push(`ability_tier_${Math.floor(newLevel / 10)}`);
    rewards.rewards.items = ['skill_tome_rare'];
  }

  // Milestone levels
  if (newLevel === 20) {
    rewards.unlockedAbilities.push('ultimate_ability_1');
  }
  if (newLevel === 50) {
    rewards.unlockedAbilities.push('ultimate_ability_2');
  }
  if (newLevel === 100) {
    rewards.unlockedAbilities.push('ultimate_ability_3');
    rewards.rewards.items = ['legendary_weapon_chest'];
  }

  return rewards;
}

/**
 * Calculate stat increases per level based on class
 */
export function getStatGrowth(
  classId: string,
  currentLevel: number
): CharacterStats {
  const baseGrowth: Record<string, CharacterStats> = {
    warrior: {
      atk: 3,
      def: 2,
      spd: 1,
      maxHp: 15,
      maxMana: 3
    },
    mage: {
      atk: 1,
      def: 1,
      spd: 2,
      maxHp: 8,
      maxMana: 8
    },
    ranger: {
      atk: 2,
      def: 1,
      spd: 3,
      maxHp: 10,
      maxMana: 5
    },
    cleric: {
      atk: 1,
      def: 2,
      spd: 1,
      maxHp: 12,
      maxMana: 6
    },
    rogue: {
      atk: 2,
      def: 1,
      spd: 4,
      maxHp: 9,
      maxMana: 4
    },
    paladin: {
      atk: 2,
      def: 3,
      spd: 1,
      maxHp: 14,
      maxMana: 4
    }
  };

  const growth = baseGrowth[classId] || baseGrowth.warrior;

  // Scale growth slightly with level (diminishing returns)
  const levelScaling = 1 + (currentLevel * 0.02);

  return {
    atk: Math.floor(growth.atk * levelScaling),
    def: Math.floor(growth.def * levelScaling),
    spd: Math.floor(growth.spd * levelScaling),
    maxHp: Math.floor(growth.maxHp * levelScaling),
    maxMana: Math.floor(growth.maxMana * levelScaling)
  };
}

/**
 * Apply stat points to character
 */
export function applyStatPoint(
  currentStats: CharacterStats,
  stat: keyof CharacterStats,
  points: number = 1
): CharacterStats {
  return {
    ...currentStats,
    [stat]: currentStats[stat] + points
  };
}

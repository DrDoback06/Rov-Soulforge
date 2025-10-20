import type { Rarity } from '@rov/types';
import { getXPRequiredForLevel, getLevelUpStatIncreases, checkLevelUp } from './statCalculator';

/**
 * Character Progression System
 * 
 * Handles XP calculation, level-ups, and character advancement
 */

/**
 * Calculate XP reward based on quest rarity
 */
export function getQuestXPReward(rarity: Rarity): number {
  const xpByRarity: Record<Rarity, number> = {
    'Common': 50,
    'Uncommon': 100,
    'Rare': 150,
    'Epic': 300,
    'Legendary': 500
  };

  return xpByRarity[rarity];
}

/**
 * Calculate gold reward based on quest rarity
 */
export function getQuestGoldReward(rarity: Rarity): number {
  const goldByRarity: Record<Rarity, number> = {
    'Common': 25,
    'Uncommon': 50,
    'Rare': 100,
    'Epic': 250,
    'Legendary': 500
  };

  return goldByRarity[rarity];
}

/**
 * Apply XP to character and check for level-ups
 * Returns level-up information if character leveled up
 */
export function applyXP(
  currentLevel: number,
  currentXP: number,
  xpToAdd: number
): {
  newXP: number;
  levelUps: Array<{
    oldLevel: number;
    newLevel: number;
    statIncreases: {
      atk?: number;
      def?: number;
      spd?: number;
      maxHp: number;
      maxMana: number;
    };
  }>;
} {
  let xp = currentXP + xpToAdd;
  let level = currentLevel;
  const levelUps: Array<{
    oldLevel: number;
    newLevel: number;
    statIncreases: any;
  }> = [];

  // Check for multiple level-ups
  while (true) {
    const levelCheck = checkLevelUp(level, xp);
    
    if (!levelCheck.shouldLevelUp) {
      break;
    }

    // Level up!
    const oldLevel = level;
    level = levelCheck.newLevel;
    xp -= levelCheck.xpRequired; // Carry over excess XP

    levelUps.push({
      oldLevel,
      newLevel: level,
      statIncreases: {} // Will be filled by caller with class-specific bonuses
    });
  }

  return {
    newXP: xp,
    levelUps
  };
}

/**
 * Calculate total stat increases for a character after level-ups
 */
export function calculateStatIncreases(
  classId: string,
  levelUps: Array<{ oldLevel: number; newLevel: number }>
): {
  atk: number;
  def: number;
  spd: number;
  maxHp: number;
  maxMana: number;
} {
  const totals = {
    atk: 0,
    def: 0,
    spd: 0,
    maxHp: 0,
    maxMana: 0
  };

  levelUps.forEach(levelUp => {
    const increases = getLevelUpStatIncreases(classId, levelUp.newLevel);
    
    if (increases.atk) totals.atk += increases.atk;
    if (increases.def) totals.def += increases.def;
    if (increases.spd) totals.spd += increases.spd;
    totals.maxHp += increases.maxHp;
    totals.maxMana += increases.maxMana;
  });

  return totals;
}

/**
 * Get next level progress as percentage
 */
export function getLevelProgress(currentLevel: number, currentXP: number): number {
  const xpRequired = getXPRequiredForLevel(currentLevel + 1);
  return Math.min(100, (currentXP / xpRequired) * 100);
}

/**
 * Format XP display with commas
 */
export function formatXP(xp: number): string {
  return xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate renown gain based on quest rarity and completion quality
 */
export function getQuestRenownReward(
  rarity: Rarity,
  completionTime?: number, // seconds
  expectedTime?: number // seconds
): number {
  const baseRenown: Record<Rarity, number> = {
    'Common': 5,
    'Uncommon': 10,
    'Rare': 20,
    'Epic': 50,
    'Legendary': 100
  };

  let renown = baseRenown[rarity];

  // Bonus renown for fast completion
  if (completionTime && expectedTime) {
    const ratio = completionTime / expectedTime;
    
    if (ratio < 0.5) {
      // Completed in less than half expected time
      renown = Math.floor(renown * 1.5);
    } else if (ratio < 0.75) {
      // Completed in less than 3/4 expected time
      renown = Math.floor(renown * 1.25);
    }
  }

  return renown;
}

/**
 * Achievement tracking for character progression milestones
 */
export interface ProgressionAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (character: any) => boolean;
}

export const PROGRESSION_ACHIEVEMENTS: ProgressionAchievement[] = [
  {
    id: 'first_level_up',
    title: 'Growing Stronger',
    description: 'Reach level 2',
    icon: '⬆️',
    condition: (char) => char.level >= 2
  },
  {
    id: 'level_10',
    title: 'Adventurer',
    description: 'Reach level 10',
    icon: '🌟',
    condition: (char) => char.level >= 10
  },
  {
    id: 'level_25',
    title: 'Veteran',
    description: 'Reach level 25',
    icon: '⚔️',
    condition: (char) => char.level >= 25
  },
  {
    id: 'level_50',
    title: 'Master',
    description: 'Reach level 50',
    icon: '👑',
    condition: (char) => char.level >= 50
  },
  {
    id: 'gold_hoarder',
    title: 'Gold Hoarder',
    description: 'Accumulate 10,000 gold',
    icon: '💰',
    condition: (char) => char.gold >= 10000
  },
  {
    id: 'renowned',
    title: 'Renowned Hero',
    description: 'Earn 1,000 renown',
    icon: '🏆',
    condition: (char) => char.counters.renown >= 1000
  },
  {
    id: 'quest_master',
    title: 'Quest Master',
    description: 'Complete 100 quests',
    icon: '📜',
    condition: (char) => char.stats?.questsCompleted >= 100
  }
];

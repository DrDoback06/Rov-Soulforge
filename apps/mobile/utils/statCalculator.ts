import type { Character, GameCard, ComputedStats } from '@rov/types';

/**
 * Stat Calculator
 * 
 * Calculates character stats by combining:
 * 1. Base stats from character class/level
 * 2. Equipment bonuses from equipped cards
 * 3. Temporary buffs from fitness activities
 * 4. Level scaling multipliers
 */

/**
 * Calculate all character stats including equipment and buffs
 */
export function calculateCharacterStats(
  character: Character,
  equippedCards: Map<string, GameCard>,
  temporaryBuffs?: Array<{
    stat: 'atk' | 'def' | 'maxHp' | 'maxMana';
    amount: number;
    expiresAt: number;
  }>
): ComputedStats {
  // Base stats from character
  const baseStats = {
    atk: character.stats.atk,
    def: character.stats.def,
    spd: character.stats.spd,
    maxHp: character.stats.maxHp || 100,
    maxMana: character.stats.maxMana || 50
  };

  // Calculate equipment bonuses
  const equipmentBonuses = calculateEquipmentBonuses(character, equippedCards);

  // Calculate active buffs (filter expired ones)
  const now = Date.now();
  const activeBuffs = temporaryBuffs?.filter(buff => buff.expiresAt > now) || [];
  const buffTotals = {
    atk: activeBuffs.filter(b => b.stat === 'atk').reduce((sum, b) => sum + b.amount, 0),
    def: activeBuffs.filter(b => b.stat === 'def').reduce((sum, b) => sum + b.amount, 0),
    maxHp: activeBuffs.filter(b => b.stat === 'maxHp').reduce((sum, b) => sum + b.amount, 0),
    maxMana: activeBuffs.filter(b => b.stat === 'maxMana').reduce((sum, b) => sum + b.amount, 0),
    expiresAt: activeBuffs.length > 0 ? Math.max(...activeBuffs.map(b => b.expiresAt)) : undefined
  };

  // Calculate final totals
  const total = {
    atk: Math.floor(baseStats.atk + (equipmentBonuses.attack || 0) + (equipmentBonuses.strength || 0) * 0.5 + buffTotals.atk),
    def: Math.floor(baseStats.def + (equipmentBonuses.defense || 0) + (equipmentBonuses.vitality || 0) * 0.3 + buffTotals.def),
    spd: Math.floor(baseStats.spd + (equipmentBonuses.dexterity || 0) * 0.2),
    maxHp: Math.floor(baseStats.maxHp + (equipmentBonuses.hp || 0) + (equipmentBonuses.vitality || 0) * 2 + buffTotals.maxHp),
    maxMana: Math.floor(baseStats.maxMana + (equipmentBonuses.mana || 0) + (equipmentBonuses.intelligence || 0) * 1.5 + buffTotals.maxMana)
  };

  return {
    base: baseStats,
    equipment: equipmentBonuses,
    buffs: buffTotals,
    total
  };
}

/**
 * Calculate bonuses from all equipped items
 */
function calculateEquipmentBonuses(
  character: Character,
  equippedCards: Map<string, GameCard>
): {
  atk: number;
  def: number;
  spd: number;
  hp: number;
  mana: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
} {
  const totals = {
    atk: 0,
    def: 0,
    spd: 0,
    hp: 0,
    mana: 0,
    strength: 0,
    dexterity: 0,
    intelligence: 0,
    vitality: 0,
    attack: 0,
    defense: 0
  };

  // Iterate through all equipped slots
  Object.values(character.equipped).forEach(cardId => {
    if (!cardId) return;
    
    const card = equippedCards.get(cardId);
    if (!card || !card.statBonuses) return;

    // Add bonuses with level scaling
    const levelMultiplier = calculateLevelMultiplier(card.level);
    
    if (card.statBonuses.strength) {
      totals.strength += Math.floor(card.statBonuses.strength * levelMultiplier);
    }
    if (card.statBonuses.dexterity) {
      totals.dexterity += Math.floor(card.statBonuses.dexterity * levelMultiplier);
    }
    if (card.statBonuses.intelligence) {
      totals.intelligence += Math.floor(card.statBonuses.intelligence * levelMultiplier);
    }
    if (card.statBonuses.vitality) {
      totals.vitality += Math.floor(card.statBonuses.vitality * levelMultiplier);
    }
    if (card.statBonuses.hp) {
      totals.hp += Math.floor(card.statBonuses.hp * levelMultiplier);
    }
    if (card.statBonuses.mana) {
      totals.mana += Math.floor(card.statBonuses.mana * levelMultiplier);
    }
    if (card.statBonuses.attack) {
      totals.attack += Math.floor(card.statBonuses.attack * levelMultiplier);
    }
    if (card.statBonuses.defense) {
      totals.defense += Math.floor(card.statBonuses.defense * levelMultiplier);
    }
  });

  return totals;
}

/**
 * Calculate level scaling multiplier for card bonuses
 * Level 1: 1.0x
 * Level 5: 1.4x
 * Level 10: 2.0x
 */
function calculateLevelMultiplier(level: number): number {
  if (level <= 1) return 1.0;
  if (level >= 10) return 2.0;
  
  // Linear interpolation between 1.0 and 2.0 for levels 1-10
  return 1.0 + ((level - 1) / 9) * 1.0;
}

/**
 * Apply level-up stat increases based on character class
 */
export function getLevelUpStatIncreases(classId: string, currentLevel: number): {
  atk?: number;
  def?: number;
  spd?: number;
  maxHp: number;
  maxMana: number;
} {
  const baseIncrease = {
    maxHp: 2,
    maxMana: 1
  };

  // Class-specific primary stat increases
  const classBonuses: Record<string, { atk?: number; def?: number; spd?: number }> = {
    'Warrior': { atk: 1, def: 1 },
    'Mage': { atk: 0, maxMana: 2 }, // Extra mana instead
    'Rogue': { atk: 1, spd: 1 },
    'Paladin': { def: 1, maxHp: 1 }, // Extra HP instead
    'Ranger': { atk: 1, spd: 0 },
    'Necromancer': { atk: 0, maxMana: 2 },
    'Bard': { spd: 1 },
    'Druid': { def: 1 }
  };

  const bonus = classBonuses[classId] || { atk: 1 };

  return {
    ...baseIncrease,
    ...bonus
  };
}

/**
 * Calculate XP required for next level
 * Exponential curve: 100, 250, 500, 1000, 2000, 4000...
 */
export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  
  // Exponential growth after level 3
  return Math.floor(500 * Math.pow(2, level - 3));
}

/**
 * Check if character should level up and return new level
 */
export function checkLevelUp(currentLevel: number, currentXP: number): {
  shouldLevelUp: boolean;
  newLevel: number;
  xpRequired: number;
} {
  const xpRequired = getXPRequiredForLevel(currentLevel + 1);
  
  if (currentXP >= xpRequired) {
    return {
      shouldLevelUp: true,
      newLevel: currentLevel + 1,
      xpRequired
    };
  }
  
  return {
    shouldLevelUp: false,
    newLevel: currentLevel,
    xpRequired
  };
}

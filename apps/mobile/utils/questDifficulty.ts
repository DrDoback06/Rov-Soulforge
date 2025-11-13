/**
 * Quest Difficulty Utilities
 *
 * Provides color coding and difficulty calculation based on player level
 */

export type DifficultyLevel = 'trivial' | 'easy' | 'moderate' | 'challenging' | 'hard' | 'epic' | 'legendary';

export interface DifficultyColors {
  gradient: [string, string];
  text: string;
  border: string;
}

/**
 * Get difficulty level based on quest level and player level
 */
export function getRelativeDifficulty(
  questLevel: number,
  playerLevel: number,
  questDifficulty?: string
): DifficultyLevel {
  // Epic and Legendary quests always retain their difficulty
  if (questDifficulty) {
    const lower = questDifficulty.toLowerCase();
    if (lower === 'epic') return 'epic';
    if (lower === 'legendary') return 'legendary';
  }

  const levelDiff = questLevel - playerLevel;

  if (levelDiff <= -3) return 'trivial';
  if (levelDiff <= -1) return 'easy';
  if (levelDiff === 0) return 'moderate';
  if (levelDiff <= 2) return 'challenging';
  return 'hard';
}

/**
 * Get color scheme for difficulty level
 */
export function getDifficultyColors(difficulty: DifficultyLevel): DifficultyColors {
  const colorSchemes: Record<DifficultyLevel, DifficultyColors> = {
    trivial: {
      gradient: ['#78909C', '#546E7A'],
      text: '#B0BEC5',
      border: '#546E7A'
    },
    easy: {
      gradient: ['#4CAF50', '#2E7D32'],
      text: '#4CAF50',
      border: '#2E7D32'
    },
    moderate: {
      gradient: ['#FFC107', '#F57C00'],
      text: '#FFC107',
      border: '#F57C00'
    },
    challenging: {
      gradient: ['#FF9800', '#E65100'],
      text: '#FF9800',
      border: '#E65100'
    },
    hard: {
      gradient: ['#F44336', '#C62828'],
      text: '#F44336',
      border: '#C62828'
    },
    epic: {
      gradient: ['#9C27B0', '#6A1B9A'],
      text: '#CE93D8',
      border: '#6A1B9A'
    },
    legendary: {
      gradient: ['#FFD700', '#FFA000'],
      text: '#FFD700',
      border: '#FF8F00'
    }
  };

  return colorSchemes[difficulty];
}

/**
 * Get difficulty display name
 */
export function getDifficultyDisplayName(difficulty: DifficultyLevel): string {
  const names: Record<DifficultyLevel, string> = {
    trivial: 'Trivial',
    easy: 'Easy',
    moderate: 'Moderate',
    challenging: 'Challenging',
    hard: 'Hard',
    epic: 'EPIC',
    legendary: 'LEGENDARY'
  };

  return names[difficulty];
}

/**
 * Get recommended player level range for quest
 */
export function getRecommendedLevelRange(
  questLevel: number,
  questDifficulty?: string
): { min: number; max: number } {
  const baseMin = Math.max(1, questLevel - 2);
  const baseMax = questLevel + 1;

  // Epic and Legendary quests have wider level ranges
  if (questDifficulty) {
    const lower = questDifficulty.toLowerCase();
    if (lower === 'epic') {
      return { min: questLevel - 1, max: questLevel + 3 };
    }
    if (lower === 'legendary') {
      return { min: questLevel, max: questLevel + 5 };
    }
  }

  return { min: baseMin, max: baseMax };
}

/**
 * Check if player meets recommended level for quest
 */
export function meetsRecommendedLevel(
  questLevel: number,
  playerLevel: number,
  questDifficulty?: string
): boolean {
  const { min, max } = getRecommendedLevelRange(questLevel, questDifficulty);
  return playerLevel >= min && playerLevel <= max;
}

/**
 * Get XP multiplier based on difficulty (for over-leveled quests)
 */
export function getXPMultiplier(questLevel: number, playerLevel: number): number {
  const levelDiff = playerLevel - questLevel;

  if (levelDiff <= 0) return 1.0; // Full XP for same or higher level
  if (levelDiff === 1) return 0.9;
  if (levelDiff === 2) return 0.7;
  if (levelDiff === 3) return 0.5;
  if (levelDiff === 4) return 0.3;
  return 0.1; // Minimal XP for severely over-leveled quests
}

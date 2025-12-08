/**
 * Fitness Goals and Achievements
 *
 * Track fitness milestones, daily goals, and reward players for staying active
 */

export interface FitnessGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  metric: 'steps' | 'distance' | 'calories' | 'active_time';
  target: number;
  current: number;
  reward: {
    xp: number;
    gold: number;
    items?: string[];
  };
  expiresAt?: Date;
  completedAt?: Date;
}

export interface FitnessStreak {
  currentStreak: number; // consecutive days
  longestStreak: number;
  lastActiveDate: Date;
  streakBonus: number; // multiplier (1.0 = no bonus, 2.0 = double)
}

export interface FitnessStats {
  today: {
    steps: number;
    distance: number; // meters
    calories: number;
    activeTime: number; // minutes
  };
  week: {
    steps: number;
    distance: number;
    calories: number;
    activeTime: number;
    daysActive: number;
  };
  month: {
    steps: number;
    distance: number;
    calories: number;
    activeTime: number;
    daysActive: number;
  };
  lifetime: {
    steps: number;
    distance: number;
    calories: number;
    activeTime: number;
    totalDays: number;
  };
}

/**
 * Check if goal is completed
 */
export function isGoalCompleted(goal: FitnessGoal): boolean {
  return goal.current >= goal.target;
}

/**
 * Calculate streak bonus multiplier
 * +5% per day up to 100% bonus at 20 days
 */
export function calculateStreakBonus(streakDays: number): number {
  const bonusPerDay = 0.05;
  const maxBonus = 1.0; // 100% bonus
  const bonus = Math.min(streakDays * bonusPerDay, maxBonus);
  return 1.0 + bonus;
}

/**
 * Update streak based on activity
 */
export function updateStreak(
  streak: FitnessStreak,
  isActiveToday: boolean
): FitnessStreak {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = new Date(streak.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const daysSinceLastActive = Math.floor(
    (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isActiveToday) {
    if (daysSinceLastActive === 0) {
      // Same day, no change
      return streak;
    } else if (daysSinceLastActive === 1) {
      // Consecutive day
      const newStreak = streak.currentStreak + 1;
      return {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActiveDate: today,
        streakBonus: calculateStreakBonus(newStreak)
      };
    } else {
      // Streak broken
      return {
        currentStreak: 1,
        longestStreak: streak.longestStreak,
        lastActiveDate: today,
        streakBonus: 1.0
      };
    }
  }

  return streak;
}

/**
 * Generate daily fitness goals
 */
export function generateDailyGoals(
  playerLevel: number,
  previousStats?: FitnessStats
): FitnessGoal[] {
  const baseSteps = 2000;
  const baseDistance = 1000; // meters
  const baseCalories = 100;

  // Scale goals with player level
  const levelMultiplier = 1 + (playerLevel * 0.1);

  const goals: FitnessGoal[] = [
    {
      id: 'daily_steps',
      type: 'daily',
      metric: 'steps',
      target: Math.floor(baseSteps * levelMultiplier),
      current: 0,
      reward: {
        xp: 50 + playerLevel * 5,
        gold: 25 + playerLevel * 2
      },
      expiresAt: getEndOfDay()
    },
    {
      id: 'daily_distance',
      type: 'daily',
      metric: 'distance',
      target: Math.floor(baseDistance * levelMultiplier),
      current: 0,
      reward: {
        xp: 75 + playerLevel * 7,
        gold: 35 + playerLevel * 3
      },
      expiresAt: getEndOfDay()
    },
    {
      id: 'daily_active',
      type: 'daily',
      metric: 'active_time',
      target: 15, // 15 minutes
      current: 0,
      reward: {
        xp: 100 + playerLevel * 10,
        gold: 50 + playerLevel * 5
      },
      expiresAt: getEndOfDay()
    }
  ];

  return goals;
}

/**
 * Calculate calories burned from distance and activity type
 */
export function calculateCalories(
  distanceMeters: number,
  activityType: 'walking' | 'running' | 'cycling',
  userWeight: number = 70 // kg
): number {
  const distanceKm = distanceMeters / 1000;

  const caloriesPerKm = {
    walking: 50,
    running: 80,
    cycling: 40
  };

  const baseCalories = distanceKm * caloriesPerKm[activityType];

  // Adjust for weight (70kg = baseline)
  const weightMultiplier = userWeight / 70;

  return Math.floor(baseCalories * weightMultiplier);
}

/**
 * Get fitness milestone rewards
 */
export function getFitnessMilestoneReward(milestone: string): {
  xp: number;
  gold: number;
  items: string[];
  title: string;
} {
  const milestones: Record<string, any> = {
    steps_10k: {
      xp: 500,
      gold: 200,
      items: ['fitness_badge_bronze'],
      title: 'Marathon Walker'
    },
    steps_50k: {
      xp: 2000,
      gold: 1000,
      items: ['fitness_badge_silver'],
      title: 'Step Master'
    },
    distance_100km: {
      xp: 1000,
      gold: 500,
      items: ['fitness_badge_gold'],
      title: 'Distance Legend'
    },
    streak_7: {
      xp: 300,
      gold: 150,
      items: ['streak_badge_week'],
      title: 'Dedicated'
    },
    streak_30: {
      xp: 1500,
      gold: 750,
      items: ['streak_badge_month', 'legendary_chest'],
      title: 'Unstoppable'
    }
  };

  return milestones[milestone] || {
    xp: 100,
    gold: 50,
    items: [],
    title: 'Fitness Enthusiast'
  };
}

/**
 * Helper: Get end of current day
 */
function getEndOfDay(): Date {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
}

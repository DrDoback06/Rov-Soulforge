import type { ActivityEvent, ActivityKind, Reward } from '@rov/types';

/**
 * Fitness Rewards System
 * 
 * Calculates rewards for fitness activities:
 * - Gold based on distance and elevation
 * - XP based on activity type and intensity
 * - Temporary stat buffs based on heart rate zones
 * - Streak bonuses for consistent activity
 */

export interface FitnessReward {
  gold: number;
  xp: number;
  renown: number;
  temporaryBuffs: Array<{
    stat: 'atk' | 'def' | 'maxHp' | 'maxMana';
    amount: number;
    durationMs: number;
    expiresAt: number;
  }>;
  streakBonus?: {
    days: number;
    multiplier: number;
  };
}

/**
 * Calculate rewards for a fitness activity
 */
export function calculateFitnessRewards(
  activity: ActivityEvent,
  userStreak: number = 0,
  dailyActivityCount: number = 0
): FitnessReward {
  const reward: FitnessReward = {
    gold: 0,
    xp: 0,
    renown: 0,
    temporaryBuffs: []
  };

  // Distance rewards: 1 Gold per 0.5km (max 20/day)
  if (activity.distanceM) {
    const distanceKm = activity.distanceM / 1000;
    const distanceGold = Math.floor(distanceKm / 0.5);
    const dailyDistanceCap = 20;
    
    reward.gold += Math.min(distanceGold, dailyDistanceCap - Math.min(dailyActivityCount * 5, dailyDistanceCap));
  }

  // Elevation rewards: 1 Gold per 100m (max 10/day)
  if (activity.elevGainM) {
    const elevGold = Math.floor(activity.elevGainM / 100);
    const dailyElevCap = 10;
    
    reward.gold += Math.min(elevGold, dailyElevCap);
  }

  // Activity type XP bonuses
  const xpByActivityType: Record<ActivityKind, number> = {
    'run': 30,
    'hike': 25,
    'bike': 20,
    'walk': 15,
    'hr-session': 10
  };

  reward.xp = xpByActivityType[activity.kind] || 10;

  // Duration bonus XP (5 XP per 10 minutes)
  const durationMinutes = (activity.end - activity.start) / (1000 * 60);
  reward.xp += Math.floor(durationMinutes / 10) * 5;

  // Heart rate based temporary buffs
  if (activity.avgHr && activity.avgHr > 0) {
    const hrBuffs = calculateHeartRateBuffs(
      activity.avgHr,
      durationMinutes,
      activity.kind
    );
    reward.temporaryBuffs.push(...hrBuffs);
  }

  // Streak bonuses
  if (userStreak >= 30) {
    reward.streakBonus = { days: userStreak, multiplier: 1.5 };
    reward.xp = Math.floor(reward.xp * 1.5);
  } else if (userStreak >= 7) {
    reward.streakBonus = { days: userStreak, multiplier: 1.2 };
    reward.xp = Math.floor(reward.xp * 1.2);
  } else if (userStreak >= 3) {
    reward.streakBonus = { days: userStreak, multiplier: 1.1 };
    reward.xp = Math.floor(reward.xp * 1.1);
  }

  // Quality bonus (based on GPS and HR data quality)
  if (activity.proofs?.gpsQuality === 'great' && activity.proofs?.hrOK) {
    reward.renown = 5;
  }

  return reward;
}

/**
 * Calculate temporary stat buffs based on heart rate zones
 * 
 * High intensity (70%+ max HR) for sustained periods grants attack buffs
 * Moderate intensity grants defense buffs
 */
function calculateHeartRateBuffs(
  avgHr: number,
  durationMinutes: number,
  activityKind: ActivityKind
): Array<{
  stat: 'atk' | 'def' | 'maxHp' | 'maxMana';
  amount: number;
  durationMs: number;
  expiresAt: number;
}> {
  const buffs: Array<any> = [];
  const now = Date.now();

  // Estimate max HR (220 - age, using conservative 180 for avg)
  const estimatedMaxHr = 180;
  const hrPercent = (avgHr / estimatedMaxHr) * 100;

  // High intensity (70%+ max HR for 2+ minutes) = Attack buff
  if (hrPercent >= 70 && durationMinutes >= 2) {
    const buffDuration = 10 * 60 * 1000; // 10 minutes
    const buffAmount = Math.min(5, Math.floor(durationMinutes / 10)); // 1 ATK per 10 min, max 5
    
    buffs.push({
      stat: 'atk' as const,
      amount: buffAmount,
      durationMs: buffDuration,
      expiresAt: now + buffDuration
    });
  }

  // Moderate intensity (50-70% max HR for 20+ minutes) = Defense buff
  if (hrPercent >= 50 && hrPercent < 70 && durationMinutes >= 20) {
    const buffDuration = 15 * 60 * 1000; // 15 minutes
    const buffAmount = Math.min(4, Math.floor(durationMinutes / 15));
    
    buffs.push({
      stat: 'def' as const,
      amount: buffAmount,
      durationMs: buffDuration,
      expiresAt: now + buffDuration
    });
  }

  // Long endurance activities (60+ minutes) = Max HP buff
  if (durationMinutes >= 60) {
    const buffDuration = 30 * 60 * 1000; // 30 minutes
    const buffAmount = Math.min(20, Math.floor(durationMinutes / 30) * 10);
    
    buffs.push({
      stat: 'maxHp' as const,
      amount: buffAmount,
      durationMs: buffDuration,
      expiresAt: now + buffDuration
    });
  }

  // Circuit training / HIIT (multiple HR spikes) = Mana buff
  if (activityKind === 'hr-session' && durationMinutes >= 20) {
    const buffDuration = 20 * 60 * 1000; // 20 minutes
    const buffAmount = Math.min(15, Math.floor(durationMinutes / 10) * 5);
    
    buffs.push({
      stat: 'maxMana' as const,
      amount: buffAmount,
      durationMs: buffDuration,
      expiresAt: now + buffDuration
    });
  }

  return buffs;
}

/**
 * Calculate user's current activity streak
 */
export function calculateActivityStreak(activityDates: number[]): number {
  if (activityDates.length === 0) return 0;

  // Sort dates descending
  const sorted = [...activityDates].sort((a, b) => b - a);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  // Check if most recent activity was today or yesterday
  const lastActivityDate = new Date(sorted[0]);
  lastActivityDate.setHours(0, 0, 0, 0);
  const lastActivityTimestamp = lastActivityDate.getTime();
  
  const daysSinceLastActivity = Math.floor((todayTimestamp - lastActivityTimestamp) / (1000 * 60 * 60 * 24));
  
  // Streak is broken if more than 1 day has passed
  if (daysSinceLastActivity > 1) {
    return 0;
  }
  
  // Count consecutive days
  let streak = 0;
  let currentDate = todayTimestamp;
  
  for (const activityTimestamp of sorted) {
    const activityDate = new Date(activityTimestamp);
    activityDate.setHours(0, 0, 0, 0);
    const activityDateTimestamp = activityDate.getTime();
    
    if (activityDateTimestamp === currentDate || activityDateTimestamp === currentDate - (1000 * 60 * 60 * 24)) {
      streak++;
      currentDate = activityDateTimestamp - (1000 * 60 * 60 * 24);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Validate activity data to prevent cheating
 */
export function validateActivity(activity: ActivityEvent): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for impossible pace (faster than world record)
  if (activity.kind === 'run' && activity.distanceM && activity.end && activity.start) {
    const durationSeconds = (activity.end - activity.start) / 1000;
    const paceMinPerKm = (durationSeconds / 60) / (activity.distanceM / 1000);
    
    // World record pace is ~2:50 min/km, flag anything under 3:00
    if (paceMinPerKm < 3.0) {
      issues.push('Pace is unrealistically fast');
    }
  }

  // Check for impossible heart rate
  if (activity.avgHr) {
    if (activity.avgHr < 40 || activity.avgHr > 220) {
      issues.push('Heart rate is outside normal range');
    }
  }

  // Check for impossible elevation gain
  if (activity.elevGainM && activity.distanceM) {
    const elevPerKm = activity.elevGainM / (activity.distanceM / 1000);
    
    // More than 500m elevation per km is very unlikely
    if (elevPerKm > 500) {
      issues.push('Elevation gain seems unrealistic');
    }
  }

  // Check for GPS quality
  if (activity.proofs) {
    if (activity.proofs.gpsQuality === 'poor') {
      issues.push('GPS quality is too low for verification');
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get daily fitness quest recommendations based on activity history
 */
export function getDailyFitnessRecommendations(
  recentActivities: ActivityEvent[],
  userLevel: number
): Array<{
  title: string;
  description: string;
  type: ActivityKind;
  target: { distanceKm?: number; durationMin?: number; elevGainM?: number };
  reward: { gold: number; xp: number };
}> {
  const recommendations: Array<any> = [];

  // Calculate average activity metrics
  const avgDistance = recentActivities.reduce((sum, a) => sum + (a.distanceM || 0), 0) / recentActivities.length / 1000;
  const avgDuration = recentActivities.reduce((sum, a) => sum + (a.end - a.start), 0) / recentActivities.length / 1000 / 60;

  // Beginner recommendations (Level 1-5)
  if (userLevel <= 5) {
    recommendations.push({
      title: 'Morning Walk',
      description: 'Start your day with a refreshing walk',
      type: 'walk' as const,
      target: { distanceKm: 1.0, durationMin: 15 },
      reward: { gold: 15, xp: 25 }
    });
  }

  // Intermediate recommendations (Level 6-15)
  if (userLevel > 5 && userLevel <= 15) {
    recommendations.push({
      title: 'Daily Run',
      description: 'Keep your training consistent',
      type: 'run' as const,
      target: { distanceKm: Math.max(3, avgDistance * 1.1), durationMin: 30 },
      reward: { gold: 30, xp: 50 }
    });
  }

  // Advanced recommendations (Level 16+)
  if (userLevel > 15) {
    recommendations.push({
      title: 'Challenge Yourself',
      description: 'Push your limits with an intense session',
      type: 'run' as const,
      target: { distanceKm: Math.max(5, avgDistance * 1.2), durationMin: 45 },
      reward: { gold: 50, xp: 100 }
    });

    recommendations.push({
      title: 'Hill Conquest',
      description: 'Gain elevation and strength',
      type: 'hike' as const,
      target: { distanceKm: 3, elevGainM: 200 },
      reward: { gold: 60, xp: 120 }
    });
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
}

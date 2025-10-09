/**
 * Fitness Tracker Hook
 *
 * Integrates with:
 * - Strava API for tracked workouts (100% rewards)
 * - Manual entry for untracked workouts (50% rewards)
 * - Device sensors (step counter, heart rate) for basic tracking
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StravaTokens, StravaActivity } from '@/lib/strava-auth';
import {
  authenticateWithStrava,
  refreshStravaToken,
  getStravaActivities,
  isStravaTokenExpired,
  disconnectStrava
} from '@/lib/strava-auth';

const STRAVA_TOKENS_KEY = '@rov_strava_tokens';

export interface FitnessTrackerState {
  isConnected: boolean;
  provider: 'strava' | 'manual' | null;
  athlete: {
    id: string;
    name: string;
    photo?: string;
  } | null;
}

export interface WorkoutData {
  type: 'run' | 'pushups' | 'situps' | 'squats' | 'circuit' | 'hike';
  duration: number; // seconds
  distance?: number; // meters
  calories?: number;
  heartRate?: {
    average?: number;
    max?: number;
  };
  isTracked: boolean; // true = Strava/device, false = manual
  completedAt: Date;
  stravaActivityId?: number;
}

export function useFitnessTracker() {
  const [state, setState] = useState<FitnessTrackerState>({
    isConnected: false,
    provider: null,
    athlete: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<StravaTokens | null>(null);

  // Load saved Strava tokens on mount
  useEffect(() => {
    loadStravaTokens();
  }, []);

  async function loadStravaTokens() {
    try {
      const saved = await AsyncStorage.getItem(STRAVA_TOKENS_KEY);
      if (saved) {
        const savedTokens: StravaTokens = JSON.parse(saved);

        // Check if token is expired
        if (isStravaTokenExpired(savedTokens.expiresAt)) {
          console.log('🔄 Strava token expired, refreshing...');
          const newTokens = await refreshStravaToken(savedTokens.refreshToken);

          if (newTokens) {
            await saveStravaTokens(newTokens);
            setTokens(newTokens);
            setState({
              isConnected: true,
              provider: 'strava',
              athlete: {
                id: newTokens.athleteId,
                name: 'Strava Athlete'
              }
            });
          } else {
            // Refresh failed, clear tokens
            await clearStravaTokens();
          }
        } else {
          // Token still valid
          setTokens(savedTokens);
          setState({
            isConnected: true,
            provider: 'strava',
            athlete: {
              id: savedTokens.athleteId,
              name: 'Strava Athlete'
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load Strava tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveStravaTokens(tokens: StravaTokens) {
    try {
      await AsyncStorage.setItem(STRAVA_TOKENS_KEY, JSON.stringify(tokens));
      setTokens(tokens);
    } catch (error) {
      console.error('Failed to save Strava tokens:', error);
    }
  }

  async function clearStravaTokens() {
    try {
      await AsyncStorage.removeItem(STRAVA_TOKENS_KEY);
      setTokens(null);
      setState({
        isConnected: false,
        provider: null,
        athlete: null
      });
    } catch (error) {
      console.error('Failed to clear Strava tokens:', error);
    }
  }

  /**
   * Connect to Strava
   */
  async function connectStrava(): Promise<boolean> {
    try {
      setIsLoading(true);
      const newTokens = await authenticateWithStrava();

      if (newTokens) {
        await saveStravaTokens(newTokens);
        setState({
          isConnected: true,
          provider: 'strava',
          athlete: {
            id: newTokens.athleteId,
            name: 'Strava Athlete'
          }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to connect Strava:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Disconnect from Strava
   */
  async function disconnectFitnessTracker(): Promise<void> {
    try {
      if (tokens?.accessToken) {
        await disconnectStrava(tokens.accessToken);
      }
      await clearStravaTokens();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  /**
   * Get recent workouts from Strava
   */
  async function getRecentWorkouts(count: number = 10): Promise<StravaActivity[]> {
    if (!tokens?.accessToken) {
      return [];
    }

    try {
      return await getStravaActivities(tokens.accessToken, count);
    } catch (error) {
      console.error('Failed to get recent workouts:', error);
      return [];
    }
  }

  /**
   * Verify a workout was completed (for quest objectives)
   */
  async function verifyWorkoutCompleted(
    workoutType: string,
    minDuration: number,
    startTime: Date,
    endTime: Date
  ): Promise<{ verified: boolean; activity?: StravaActivity }> {
    if (!tokens?.accessToken) {
      return { verified: false };
    }

    try {
      // Get activities in the time range
      const activities = await getStravaActivities(tokens.accessToken, 30);

      // Find matching activity
      const matching = activities.find(activity => {
        const activityTime = new Date(activity.start_date_local);
        return (
          activityTime >= startTime &&
          activityTime <= endTime &&
          activity.elapsed_time >= minDuration &&
          matchesWorkoutType(activity.type, workoutType)
        );
      });

      return {
        verified: !!matching,
        activity: matching
      };
    } catch (error) {
      console.error('Failed to verify workout:', error);
      return { verified: false };
    }
  }

  /**
   * Submit manual workout (50% rewards)
   */
  function submitManualWorkout(workout: Omit<WorkoutData, 'isTracked' | 'completedAt'>): WorkoutData {
    return {
      ...workout,
      isTracked: false,
      completedAt: new Date()
    };
  }

  /**
   * Calculate workout rewards multiplier
   */
  function getRewardMultiplier(isTracked: boolean): number {
    return isTracked ? 1.0 : 0.5;
  }

  return {
    state,
    isLoading,
    isConnected: state.isConnected,
    provider: state.provider,
    connectStrava,
    disconnectFitnessTracker,
    getRecentWorkouts,
    verifyWorkoutCompleted,
    submitManualWorkout,
    getRewardMultiplier
  };
}

/**
 * Helper to match Strava activity type with quest workout type
 */
function matchesWorkoutType(stravaType: string, questType: string): boolean {
  const typeMap: Record<string, string[]> = {
    run: ['Run', 'VirtualRun', 'TrailRun'],
    hike: ['Hike', 'Walk'],
    circuit: ['Workout', 'CrossFit', 'HIIT'],
    pushups: ['Workout', 'WeightTraining'],
    situps: ['Workout', 'WeightTraining'],
    squats: ['Workout', 'WeightTraining']
  };

  const validTypes = typeMap[questType.toLowerCase()] || [];
  return validTypes.includes(stravaType);
}

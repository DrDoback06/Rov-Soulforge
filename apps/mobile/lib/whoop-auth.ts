/**
 * WHOOP Integration (Cross-platform)
 * 
 * OAuth 2.0 flow and API integration
 * Requires WHOOP Developer Portal registration
 */

export interface WhoopCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface WhoopWorkout {
  id: string;
  sport: string;
  startTime: string;
  endTime: string;
  strain: number; // 0-21 WHOOP strain score
  averageHeartRate: number;
  maxHeartRate: number;
  calories: number;
  distance?: number; // meters
  zones: {
    zone0: number; // <50% max HR (seconds)
    zone1: number; // 50-60%
    zone2: number; // 60-70%
    zone3: number; // 70-80%
    zone4: number; // 80-90%
    zone5: number; // 90%+
  };
}

export interface WhoopRecovery {
  date: string;
  score: number; // 0-100 recovery percentage
  restingHeartRate: number;
  hrv: number; // Heart rate variability
  sleepPerformance: number; // 0-100
  recommendation: 'peak' | 'perform' | 'recover'; // WHOOP recommendation
}

export interface WhoopCycle {
  id: string;
  start: string;
  end: string;
  strain: number;
  recovery: number;
  sleep: {
    duration: number; // minutes
    quality: number; // 0-100
    stages: {
      wake: number;
      light: number;
      rem: number;
      sws: number; // Slow wave sleep
    };
  };
}

/**
 * WHOOP API Client
 */
export class WhoopAuth {
  private static credentials: WhoopCredentials | null = null;
  private static readonly API_BASE = 'https://api.whoop.com/v1';

  /**
   * Initialize OAuth 2.0 flow
   */
  static async initiateOAuth(clientId: string, clientSecret: string): Promise<string> {
    this.credentials = {
      clientId,
      clientSecret
    };

    // In production:
    // Build OAuth URL with:
    // - client_id
    // - response_type=code
    // - redirect_uri
    // - scope=read:workout,read:recovery,read:sleep,read:profile

    const authUrl = `https://api.whoop.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=read:workout,read:recovery,read:sleep`;
    console.log('WHOOP: OAuth initiated');

    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string, redirectUri: string): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('OAuth not initiated');
    }

    try {
      // In production:
      // POST /oauth/token
      // Body: {
      //   grant_type: 'authorization_code',
      //   code,
      //   client_id,
      //   client_secret,
      //   redirect_uri
      // }

      // Mock successful token exchange
      this.credentials.accessToken = 'mock_access_token';
      this.credentials.refreshToken = 'mock_refresh_token';
      this.credentials.expiresAt = Date.now() + (3600 * 1000); // 1 hour

      console.log('WHOOP: Access token obtained');
      return true;
    } catch (error) {
      console.error('WHOOP token exchange failed:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(): Promise<boolean> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // In production:
      // POST /oauth/token
      // Body: {
      //   grant_type: 'refresh_token',
      //   refresh_token,
      //   client_id,
      //   client_secret
      // }

      // Mock successful refresh
      this.credentials.accessToken = 'new_access_token';
      this.credentials.expiresAt = Date.now() + (3600 * 1000);

      console.log('WHOOP: Token refreshed');
      return true;
    } catch (error) {
      console.error('WHOOP token refresh failed:', error);
      return false;
    }
  }

  /**
   * Get workouts for date range
   */
  static async getWorkouts(startDate: Date, endDate: Date): Promise<WhoopWorkout[]> {
    await this.ensureValidToken();

    try {
      // In production:
      // GET /activities?start={start}&end={end}
      // Headers: Authorization: Bearer {access_token}

      // Mock data
      return [
        {
          id: 'whoop_workout_1',
          sport: 'Running',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 1800000).toISOString(),
          strain: 14.5,
          averageHeartRate: 155,
          maxHeartRate: 175,
          calories: 350,
          distance: 5000,
          zones: {
            zone0: 120,
            zone1: 240,
            zone2: 480,
            zone3: 600,
            zone4: 300,
            zone5: 60
          }
        }
      ];
    } catch (error) {
      console.error('WHOOP get workouts failed:', error);
      return [];
    }
  }

  /**
   * Get recovery score
   */
  static async getRecovery(date: Date): Promise<WhoopRecovery | null> {
    await this.ensureValidToken();

    try {
      // In production:
      // GET /recovery?date={YYYY-MM-DD}

      const dateStr = date.toISOString().split('T')[0];

      // Mock data
      return {
        date: dateStr,
        score: 72,
        restingHeartRate: 55,
        hrv: 68,
        sleepPerformance: 85,
        recommendation: 'perform'
      };
    } catch (error) {
      console.error('WHOOP get recovery failed:', error);
      return null;
    }
  }

  /**
   * Get sleep data
   */
  static async getSleep(startDate: Date, endDate: Date): Promise<WhoopCycle[]> {
    await this.ensureValidToken();

    try {
      // In production:
      // GET /cycles?start={start}&end={end}

      // Mock data
      return [
        {
          id: 'whoop_cycle_1',
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          strain: 12.3,
          recovery: 72,
          sleep: {
            duration: 480, // 8 hours
            quality: 85,
            stages: {
              wake: 20,
              light: 240,
              rem: 120,
              sws: 100
            }
          }
        }
      ];
    } catch (error) {
      console.error('WHOOP get sleep failed:', error);
      return [];
    }
  }

  /**
   * Sync recent data (last 7 days)
   */
  static async syncRecentData(): Promise<{
    workouts: WhoopWorkout[];
    recoveries: (WhoopRecovery | null)[];
    cycles: WhoopCycle[];
  }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [workouts, cycles] = await Promise.all([
      this.getWorkouts(sevenDaysAgo, now),
      this.getSleep(sevenDaysAgo, now)
    ]);

    // Get recovery for each day
    const recoveries: (WhoopRecovery | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const recovery = await this.getRecovery(date);
      recoveries.push(recovery);
    }

    console.log('WHOOP: Synced', {
      workouts: workouts.length,
      recoveries: recoveries.filter(r => r !== null).length,
      cycles: cycles.length
    });

    return {
      workouts,
      recoveries,
      cycles
    };
  }

  /**
   * Ensure token is valid (refresh if needed)
   */
  private static async ensureValidToken(): Promise<void> {
    if (!this.credentials?.accessToken) {
      throw new Error('Not authorized');
    }

    // Check if token is expired
    if (this.credentials.expiresAt && Date.now() >= this.credentials.expiresAt) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Disconnect WHOOP
   */
  static async disconnect(): Promise<void> {
    this.credentials = null;
    console.log('WHOOP: Disconnected');
  }

  /**
   * Use recovery score to adjust quest difficulty
   * WHOOP Special Integration!
   */
  static getRecommendedQuestDifficulty(recoveryScore: number): 'Easy' | 'Moderate' | 'Hard' | 'Expert' {
    if (recoveryScore >= 75) return 'Expert'; // Green (peak performance)
    if (recoveryScore >= 50) return 'Hard'; // Yellow (perform)
    if (recoveryScore >= 33) return 'Moderate'; // Orange (recover)
    return 'Easy'; // Red (rest needed)
  }
}

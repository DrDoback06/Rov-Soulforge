/**
 * Garmin Connect Integration (Cross-platform)
 * 
 * OAuth 2.0 flow and API integration
 * Requires Garmin Developer Portal registration
 */

export interface GarminCredentials {
  consumerKey: string;
  consumerSecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

export interface GarminActivity {
  activityId: string;
  activityName: string;
  activityType: string;
  startTimeGMT: string;
  distance: number; // meters
  duration: number; // seconds
  elevationGain: number; // meters
  calories: number;
  averageHR?: number;
  maxHR?: number;
  averageSpeed?: number; // m/s
}

export interface GarminDailySummary {
  calendarDate: string;
  steps: number;
  distance: number; // meters
  activeCalories: number;
  moderateIntensityMinutes: number;
  vigorousIntensityMinutes: number;
}

/**
 * Garmin Connect API Client
 */
export class GarminAuth {
  private static credentials: GarminCredentials | null = null;
  private static readonly API_BASE = 'https://apis.garmin.com';

  /**
   * Initialize OAuth flow
   */
  static async initiateOAuth(consumerKey: string, consumerSecret: string): Promise<string> {
    this.credentials = {
      consumerKey,
      consumerSecret
    };

    // In production:
    // 1. Request OAuth token from Garmin
    // 2. Build authorization URL
    // 3. Open in-app browser
    // 4. Handle callback with verifier

    const authUrl = `${this.API_BASE}/oauth-service/oauth/request_token`;
    console.log('Garmin: OAuth initiated');

    // Return mock auth URL
    return 'https://connect.garmin.com/oauthConfirm?oauth_token=mock_token';
  }

  /**
   * Complete OAuth flow with verifier
   */
  static async completeOAuth(oauthToken: string, oauthVerifier: string): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('OAuth not initiated');
    }

    try {
      // In production:
      // Exchange oauth_token + verifier for access token
      // POST to /oauth-service/oauth/access_token

      // Mock successful authorization
      this.credentials.accessToken = 'mock_access_token';
      this.credentials.accessTokenSecret = 'mock_access_token_secret';

      console.log('Garmin: OAuth completed');
      return true;
    } catch (error) {
      console.error('Garmin OAuth completion failed:', error);
      return false;
    }
  }

  /**
   * Get recent activities
   */
  static async getActivities(limit: number = 20): Promise<GarminActivity[]> {
    if (!this.credentials?.accessToken) {
      throw new Error('Not authorized');
    }

    try {
      // In production:
      // GET /activitylist-service/activities/search/activities
      // Headers: OAuth 1.0a signature

      // Mock data
      return [
        {
          activityId: '123456789',
          activityName: 'Morning Run',
          activityType: 'running',
          startTimeGMT: new Date().toISOString(),
          distance: 5000,
          duration: 1800,
          elevationGain: 50,
          calories: 350,
          averageHR: 155,
          maxHR: 175
        }
      ];
    } catch (error) {
      console.error('Garmin get activities failed:', error);
      return [];
    }
  }

  /**
   * Get daily summary
   */
  static async getDailySummary(date: Date): Promise<GarminDailySummary> {
    if (!this.credentials?.accessToken) {
      throw new Error('Not authorized');
    }

    try {
      // In production:
      // GET /usersummary-service/usersummary/daily/{displayName}
      // Query param: calendarDate=YYYY-MM-DD

      const dateStr = date.toISOString().split('T')[0];

      // Mock data
      return {
        calendarDate: dateStr,
        steps: 8500,
        distance: 6200,
        activeCalories: 450,
        moderateIntensityMinutes: 30,
        vigorousIntensityMinutes: 15
      };
    } catch (error) {
      console.error('Garmin get daily summary failed:', error);
      throw error;
    }
  }

  /**
   * Sync last 7 days
   */
  static async syncRecentData(): Promise<{
    activities: GarminActivity[];
    dailySummaries: GarminDailySummary[];
  }> {
    const activities = await this.getActivities(20);
    const summaries: GarminDailySummary[] = [];

    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const summary = await this.getDailySummary(date);
      summaries.push(summary);
    }

    console.log('Garmin: Synced', {
      activities: activities.length,
      summaries: summaries.length
    });

    return {
      activities,
      dailySummaries: summaries
    };
  }

  /**
   * Disconnect Garmin
   */
  static async disconnect(): Promise<void> {
    this.credentials = null;
    console.log('Garmin: Disconnected');
  }
}

/**
 * Strava OAuth Integration
 *
 * Handles Strava authentication and API calls for fitness tracking
 * Uses OAuth 2.0 flow with PKCE for security
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Required for web authentication
WebBrowser.maybeCompleteAuthSession();

const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '';
const STRAVA_REDIRECT_URI = process.env.EXPO_PUBLIC_STRAVA_REDIRECT_URI || '';

// Strava OAuth endpoints
const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
  tokenEndpoint: 'https://www.strava.com/oauth/token',
  revocationEndpoint: 'https://www.strava.com/oauth/deauthorize'
};

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  athleteId: string;
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  profile: string; // Profile photo URL
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string; // 'Run', 'Ride', 'Workout', etc.
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  start_date: string;
  start_date_local: string;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
}

/**
 * Initiate Strava OAuth flow
 */
export async function authenticateWithStrava(): Promise<StravaTokens | null> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'rov',
      path: 'strava-callback'
    });

    console.log('🏃 Starting Strava OAuth...');
    console.log('Redirect URI:', redirectUri);

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
      {
        clientId: STRAVA_CLIENT_ID,
        scopes: ['activity:read_all', 'activity:write', 'profile:read_all'],
        redirectUri,
        usePKCE: true,
        extraParams: {
          approval_prompt: 'auto'
        }
      },
      discovery
    );

    if (!request) {
      throw new Error('Failed to create auth request');
    }

    const result = await promptAsync();

    if (result.type === 'success') {
      const { code } = result.params;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.access_token) {
        console.log('✅ Strava authentication successful!');

        return {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_at,
          athleteId: tokenData.athlete.id.toString()
        };
      }
    } else if (result.type === 'error') {
      console.error('Strava auth error:', result.error);
    }

    return null;
  } catch (error) {
    console.error('Strava authentication failed:', error);
    throw error;
  }
}

/**
 * Refresh expired Strava access token
 */
export async function refreshStravaToken(refreshToken: string): Promise<StravaTokens | null> {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();

    if (data.access_token) {
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        athleteId: data.athlete.id.toString()
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to refresh Strava token:', error);
    return null;
  }
}

/**
 * Get current athlete profile
 */
export async function getStravaAthlete(accessToken: string): Promise<StravaAthlete | null> {
  try {
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error('Failed to get Strava athlete:', error);
    return null;
  }
}

/**
 * Get recent activities
 */
export async function getStravaActivities(
  accessToken: string,
  perPage: number = 30,
  page: number = 1
): Promise<StravaActivity[]> {
  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }

    return [];
  } catch (error) {
    console.error('Failed to get Strava activities:', error);
    return [];
  }
}

/**
 * Get specific activity by ID
 */
export async function getStravaActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity | null> {
  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error('Failed to get Strava activity:', error);
    return null;
  }
}

/**
 * Create a manual activity (for untracked workouts)
 */
export async function createStravaActivity(
  accessToken: string,
  activity: {
    name: string;
    type: string;
    start_date_local: string;
    elapsed_time: number; // seconds
    description?: string;
    distance?: number; // meters
  }
): Promise<StravaActivity | null> {
  try {
    const response = await fetch('https://www.strava.com/api/v3/activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activity)
    });

    if (response.ok) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error('Failed to create Strava activity:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isStravaTokenExpired(expiresAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  // Consider expired if less than 5 minutes remaining
  return expiresAt - now < 300;
}

/**
 * Disconnect Strava account
 */
export async function disconnectStrava(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.strava.com/oauth/deauthorize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to disconnect Strava:', error);
    return false;
  }
}

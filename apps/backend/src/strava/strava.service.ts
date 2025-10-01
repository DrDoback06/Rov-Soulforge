import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import axios from 'axios';

interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
}

@Injectable()
export class StravaService {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {
    this.clientId = this.configService.get('STRAVA_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('STRAVA_CLIENT_SECRET') || '';
  }

  async exchangeCodeForTokens(code: string, userId: string): Promise<StravaTokens> {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
    });

    const tokens: StravaTokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: response.data.expires_at,
    };

    // Store tokens in Firestore
    await this.firebaseService.firestore.collection('strava_tokens').doc(userId).set({
      ...tokens,
      athlete_id: response.data.athlete.id,
      updated_at: new Date(),
    });

    return tokens;
  }

  async refreshTokens(userId: string): Promise<StravaTokens> {
    const tokenDoc = await this.firebaseService.firestore
      .collection('strava_tokens')
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      throw new Error('No Strava tokens found for user');
    }

    const { refresh_token } = tokenDoc.data() as StravaTokens;

    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token,
      grant_type: 'refresh_token',
    });

    const tokens: StravaTokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: response.data.expires_at,
    };

    await this.firebaseService.firestore.collection('strava_tokens').doc(userId).update({
      ...tokens,
      updated_at: new Date(),
    });

    return tokens;
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const tokenDoc = await this.firebaseService.firestore
      .collection('strava_tokens')
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      throw new Error('No Strava tokens found for user');
    }

    const tokens = tokenDoc.data() as StravaTokens;
    const now = Math.floor(Date.now() / 1000);

    // If token expires in less than 5 minutes, refresh it
    if (tokens.expires_at - now < 300) {
      const newTokens = await this.refreshTokens(userId);
      return newTokens.access_token;
    }

    return tokens.access_token;
  }

  async getRecentActivities(userId: string, page = 1, perPage = 30): Promise<StravaActivity[]> {
    const accessToken = await this.getValidAccessToken(userId);

    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, per_page: perPage },
    });

    return response.data;
  }

  async processActivityRewards(userId: string, activity: StravaActivity): Promise<void> {
    // Calculate rewards based on activity type and metrics
    const distanceKm = activity.distance / 1000;
    const durationHours = activity.moving_time / 3600;

    let xpReward = 0;
    let goldReward = 0;

    // Base rewards on activity type
    switch (activity.type) {
      case 'Run':
        xpReward = Math.floor(distanceKm * 50);
        goldReward = Math.floor(distanceKm * 10);
        break;
      case 'Ride':
        xpReward = Math.floor(distanceKm * 20);
        goldReward = Math.floor(distanceKm * 5);
        break;
      case 'Walk':
        xpReward = Math.floor(distanceKm * 30);
        goldReward = Math.floor(distanceKm * 8);
        break;
      default:
        xpReward = Math.floor(durationHours * 100);
        goldReward = Math.floor(durationHours * 20);
    }

    // Bonus for elevation gain
    if (activity.total_elevation_gain > 0) {
      const elevationBonus = Math.floor(activity.total_elevation_gain / 10);
      xpReward += elevationBonus;
      goldReward += Math.floor(elevationBonus / 5);
    }

    // Award rewards to character
    const characterRef = this.firebaseService.firestore.collection('characters').doc(userId);
    await characterRef.update({
      'counters.xp': (await characterRef.get()).data()?.counters?.xp + xpReward,
      gold: (await characterRef.get()).data()?.gold + goldReward,
    });

    // Log activity reward
    await this.firebaseService.firestore.collection('activity_rewards').add({
      userId,
      activityId: activity.id,
      activityType: activity.type,
      distance: activity.distance,
      duration: activity.moving_time,
      xpReward,
      goldReward,
      timestamp: new Date(activity.start_date),
      processed_at: new Date(),
    });
  }

  async handleWebhookEvent(event: any): Promise<void> {
    if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
      return;
    }

    // Find user by athlete_id
    const tokensSnapshot = await this.firebaseService.firestore
      .collection('strava_tokens')
      .where('athlete_id', '==', event.owner_id)
      .limit(1)
      .get();

    if (tokensSnapshot.empty) {
      console.log('No user found for athlete_id:', event.owner_id);
      return;
    }

    const userId = tokensSnapshot.docs[0].id;
    const accessToken = await this.getValidAccessToken(userId);

    // Fetch activity details
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${event.object_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const activity: StravaActivity = response.data;
    await this.processActivityRewards(userId, activity);
  }
}

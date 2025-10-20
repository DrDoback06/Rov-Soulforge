/**
 * Trail System Types
 * 
 * Defines hiking/running/cycling trails with full integration:
 * - Difficulty levels and types
 * - Strava segment data
 * - Quest generation
 * - Leaderboards
 * - Rewards estimation
 */

export type TrailDifficulty = 'Easy' | 'Moderate' | 'Hard' | 'Expert';
export type TrailType = 'Hiking' | 'Running' | 'Cycling' | 'Walking' | 'MountainBiking';

export interface TrailWaypoint {
  latitude: number;
  longitude: number;
  elevation?: number; // meters above sea level
  name?: string; // Named waypoint (e.g., "Waterfall viewpoint")
}

export interface StravaSegment {
  id: string;
  name: string;
  distance: number; // meters
  elevationGain: number; // meters
  grade: number; // average gradient %
  kom: {
    // King/Queen of the Mountain
    name: string;
    time: number; // seconds
    date: string;
  };
  pr?: {
    // Personal Record
    time: number;
    date: string;
    rank: number; // Your rank on leaderboard
  };
  leaderboard: Array<{
    rank: number;
    name: string;
    time: number;
    date: string;
  }>;
}

export interface Trail {
  id: string;
  name: string;
  description: string;
  startLocation: {
    latitude: number;
    longitude: number;
  };
  endLocation: {
    latitude: number;
    longitude: number;
  };
  waypoints: TrailWaypoint[];
  distance: number; // meters
  elevationGain: number; // meters
  difficulty: TrailDifficulty;
  type: TrailType;
  tags: string[]; // ['scenic', 'forest', 'waterfall', etc.]
  region: string;
  country: string;
  rating: number; // 0-5
  reviewCount: number;
  imageUrl?: string;

  // Enhanced properties from other agent's work
  stravaSegment?: StravaSegment; // Strava integration
  weather?: {
    conditions: string;
    temperature: number; // Celsius
    windSpeed: number; // km/h
    visibility: string;
    lastUpdated: string;
  };
  safety?: {
    hazards: string[]; // ['steep drops', 'river crossing', etc.]
    permits: string[]; // Required permits
    emergencyContacts: string[];
  };
  social?: {
    recentCompletions: Array<{
      userId: string;
      userName: string;
      completedAt: string;
      time: number; // seconds
    }>;
    friendsCompleted: string[]; // Friend user IDs
  };
  
  // Quest integration
  questId?: string; // Auto-generated quest ID
  estimatedRewards?: {
    gold: number;
    xp: number;
    buffs: Array<{
      stat: string;
      amount: number;
      duration: number;
    }>;
  };
  
  // Multi-sport difficulty ratings
  difficultyByType?: {
    [key in TrailType]?: TrailDifficulty;
  };

  metadata: {
    estimatedTime: string; // "4-6 hours"
    bestTime: string; // "May to September"
    parking?: string;
    facilities?: string[]; // ['toilets', 'cafe', 'visitor_center']
    surface?: string; // "gravel", "paved", "dirt"
    elevation?: {
      min: number;
      max: number;
    };
  };
}

export interface TrailCompletionHistory {
  trailId: string;
  userId: string;
  completedAt: string;
  time: number; // seconds
  distance: number; // meters (actual, may differ from trail distance)
  elevationGain: number; // meters (actual)
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  pace?: number; // min/km
  photos?: string[]; // Photo URLs
  notes?: string;
  activityId?: string; // From Strava/etc
}

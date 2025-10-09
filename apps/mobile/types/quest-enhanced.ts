/**
 * Enhanced Quest System Types
 * Epic features for an amazing player experience
 */

export enum QuestType {
  LANDMARK = 'landmark',           // Static quests at real-world landmarks
  DYNAMIC = 'dynamic',             // Randomly spawned around player
  CHAIN = 'chain',                 // Multi-part story quests
  EVENT = 'event',                 // Time-limited special events
  LEGENDARY = 'legendary',         // Ultra-rare, high-reward quests
  SOCIAL = 'social',               // Multiplayer team quests
  SEASONAL = 'seasonal',           // Limited-time seasonal content
  DAILY = 'daily',                 // Daily challenges
  DISCOVERY = 'discovery',         // Hidden exploration quests
  BOSS = 'boss'                    // Epic boss battles
}

export enum QuestDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum QuestStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export interface QuestObjective {
  id: string;
  type: 'travel' | 'battle' | 'collect' | 'interact' | 'fitness' | 'defend' | 'summit';
  description: string;
  target: number;
  current: number;
  completed: boolean;
  order: number; // For sequential objectives
  metadata?: {
    // Fitness specific
    fitnessType?: 'run' | 'pushups' | 'situps' | 'squats' | 'circuit' | 'hike';
    distance?: number; // meters
    timeLimit?: number; // seconds
    tracked?: boolean; // Whether fitness tracker is connected

    // Battle specific
    enemyTypes?: string[];
    enemyCount?: number;
    spawnedEnemies?: Array<{
      id: string;
      latitude: number;
      longitude: number;
      defeated: boolean;
    }>;

    // Defend specific
    defendDuration?: number; // seconds to hold position
    defendRadius?: number; // meters

    // Summit specific
    summitName?: string;
    trailDifficulty?: 'easy' | 'moderate' | 'difficult' | 'extreme';
    elevation?: number; // meters

    // Collection specific
    collectibleItems?: string[];

    [key: string]: any;
  };
}

export interface QuestReward {
  gold: number;
  xp: number;
  items?: Array<{
    id: string;
    type: 'card' | 'equipment' | 'consumable' | 'unidentified';
    rarity: 'normal' | 'magic' | 'rare' | 'epic' | 'legendary' | 'set' | 'unique';
    quantity: number;
    needsIdentification?: boolean; // For Diablo-style unidentified items
    cardType?: 'monster' | 'spell' | 'equipment' | 'consumable'; // If type is 'card'
  }>;
  titles?: string[];
  badges?: string[];
  magicFind?: number; // % bonus magic find for co-op
}

export interface QuestChainInfo {
  chainId: string;
  chainName: string;
  position: number;     // 1, 2, 3... in chain
  totalQuests: number;
  nextQuestId?: string;
  previousQuestId?: string;
}

export interface EnhancedQuest {
  id: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  visibility: 'static' | 'local' | 'dynamic'; // Quest visibility type

  // Basic Info
  title: string;
  description: string;
  lore: string;              // Rich backstory

  // Location
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
    name?: string;           // "The Green Dragon Pub", "Snowdonia Peak"
    type?: 'landmark' | 'poi' | 'natural';
  };

  // Activation
  activationRadius: number;  // Meters - how close to trigger popup
  acceptRadius?: number;     // Meters - how close to accept quest (defaults to activationRadius)

  // Quest Mechanics
  objectives: QuestObjective[];
  rewards: QuestReward;
  requiredLevel: number;
  recommendedLevel: number;

  // Quest Chain (if part of series)
  chainInfo?: QuestChainInfo;

  // Time-based
  spawnedAt: Date;
  expiresAt?: Date;
  duration?: number;         // in minutes
  timeLimit?: number;        // seconds to complete after accepting
  retryDelay?: number;       // seconds before can retry after failure

  // Social Features
  maxPlayers?: number;       // 1 = solo, 2-4 = group
  currentPlayers?: string[]; // UIDs of players on quest
  coopBonusPerPlayer?: number; // % bonus rewards per additional player (default 25)

  // Boss Features
  isLegendary: boolean;
  isBoss: boolean;
  isSeasonal: boolean;
  bossPhases?: number;       // Number of phases for boss battles
  discoveryRadius?: number;  // How close to discover it

  // Rotation (for daily/weekly/monthly quests)
  rotation?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  resetTime?: string;        // ISO timestamp of next reset

  // Penalties
  xpPenaltyOnFail?: number;  // XP lost if quest failed

  // Visual
  icon: string;              // Emoji or icon name
  color: string;             // Hex color for map marker
  pulseEffect?: boolean;     // Animated pulse on map

  // Metadata
  tags: string[];            // ['combat', 'exploration', 'fitness']
  createdBy: 'system' | 'admin' | 'procedural';
  completionCount?: number;  // How many times completed globally
}

export interface QuestProgress {
  id: string;
  questId: string;
  uid: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  startedAt: Date;
  completedAt?: Date;
  teammates?: string[];      // For social quests
}

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  lore: string;

  // Coverage
  region: {
    center: { latitude: number; longitude: number };
    radius: number;          // km
  };

  // Timing
  startTime: Date;
  endTime: Date;

  // Quests
  questIds: string[];        // All quests part of this event

  // Rewards
  globalRewards: QuestReward;
  leaderboardRewards: Array<{
    rank: number;
    reward: QuestReward;
  }>;

  // Participation
  participantCount: number;
  completionCount: number;
}

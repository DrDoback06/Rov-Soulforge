/**
 * Battleground System Types
 *
 * Stack-based combat with LIFO resolution
 * Supports PvE, PvP, Co-op raids, and tournament modes
 */

import type { Card, DeckType, EffectDef } from '@rov/types';

// ============================================================================
// Battle Types
// ============================================================================

export type BattleType = 'pve' | 'pvp_casual' | 'pvp_ranked' | 'coop_raid' | 'tournament';
export type BattleStatus = 'waiting' | 'active' | 'completed' | 'abandoned';
export type PlayerRole = 'attacker' | 'defender' | 'ally_1' | 'ally_2' | 'ally_3';

export interface Battle {
  id: string;
  type: BattleType;
  status: BattleStatus;

  // Players
  players: BattlePlayer[];
  currentTurnPlayer: string; // userId
  turnNumber: number;

  // The Stack (LIFO resolution)
  stack: StackEntry[];

  // Battle State
  rngSeed: string; // For deterministic randomness
  battleLog: BattleLogEntry[];

  // Timing
  turnStartedAt: number;
  turnTimeLimit: number; // seconds (60 base + 15 per stack entry)
  createdAt: number;
  completedAt?: number;

  // Matchmaking (for PvP/Co-op)
  matchmakingData?: {
    averageElo?: number;
    normalizedDeck?: boolean;
    region?: string;
  };

  // Quest/Raid context
  questId?: string;
  enemyData?: EnemyData;

  // Winners
  winnerIds?: string[];
}

export interface BattlePlayer {
  userId: string;
  username: string;
  role: PlayerRole;

  // Stats
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  lives: number;

  // Character stats
  atk: number;
  def: number;
  spd: number;

  // Decks
  actionDeck: Card[];
  skillDeck: Card[];
  lootDeck: Card[];

  // Discard piles
  actionDiscard: Card[];
  skillDiscard: Card[];
  lootDiscard: Card[];

  // Hand
  hand: Card[];
  maxHandSize: number;

  // Battlefield (persistent effects)
  battlefield: PersistentEffect[];

  // Buffs/Debuffs
  buffs: TemporaryEffect[];
  debuffs: TemporaryEffect[];

  // Equipped items (loot cards)
  equipped: {
    weapon?: Card;
    armor?: Card;
    accessory?: Card;
  };

  // Turn state
  hasDrawn: boolean;
  hasPlayedCard: boolean;

  // Connection
  isConnected: boolean;
  lastActivityAt: number;
}

export interface EnemyData {
  enemyId: string;
  enemyName: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;

  // AI deck
  deck: Card[];

  // Loot drops
  lootTable: {
    cardId: string;
    dropChance: number;
  }[];
}

// ============================================================================
// The Stack
// ============================================================================

export interface StackEntry {
  id: string;
  playerId: string;
  cardId: string;
  cardName: string;

  // Effect to resolve
  effect: EffectDef;

  // Targets
  targets: TargetSelection[];

  // Can this be countered?
  canCounter: boolean;

  // Timestamp
  addedAt: number;

  // Dice rolls (for damage/heal with variance)
  diceRolls?: DiceRoll[];
}

export interface TargetSelection {
  type: 'player' | 'opponent' | 'self' | 'ally' | 'all_opponents' | 'all_allies' | 'random_opponent';
  targetId?: string; // Specific player ID if applicable
}

export interface DiceRoll {
  id: string;
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  result: number;
  rngSeed: string;
}

// ============================================================================
// Effects
// ============================================================================

export interface PersistentEffect {
  id: string;
  cardId: string;
  cardName: string;
  type: 'aura' | 'curse' | 'summon';

  // Effect
  effect: EffectDef;

  // Trigger
  trigger?: 'on_turn_start' | 'on_turn_end' | 'on_damage_taken' | 'on_damage_dealt';

  // Duration
  turnsRemaining?: number; // undefined = permanent
}

export interface TemporaryEffect {
  id: string;
  cardId: string;
  type: 'buff' | 'debuff';

  // Stat modification
  stat: 'atk' | 'def' | 'maxHp' | 'maxMana';
  amount: number;

  // Duration
  duration: 'temp' | 'battle' | 'permanent';
  turnsRemaining?: number;
}

// ============================================================================
// Battle Log
// ============================================================================

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  turnNumber: number;

  // Event type
  type: BattleLogEventType;

  // Who did it
  playerId: string;
  playerName: string;

  // What happened
  message: string;

  // Details
  cardPlayed?: {
    cardId: string;
    cardName: string;
  };
  damage?: {
    amount: number;
    targetId: string;
    targetName: string;
  };
  heal?: {
    amount: number;
    targetId: string;
    targetName: string;
  };
  diceRolls?: DiceRoll[];

  // RNG seed for this event
  rngSeed?: string;
}

export type BattleLogEventType =
  | 'turn_start'
  | 'turn_end'
  | 'card_played'
  | 'card_drawn'
  | 'stack_added'
  | 'stack_resolved'
  | 'stack_countered'
  | 'damage_dealt'
  | 'healing_done'
  | 'buff_applied'
  | 'debuff_applied'
  | 'effect_expired'
  | 'item_equipped'
  | 'item_destroyed'
  | 'player_died'
  | 'battle_won'
  | 'battle_lost'
  | 'player_surrendered'
  | 'player_disconnected';

// ============================================================================
// Turn Actions
// ============================================================================

export interface PlayCardAction {
  playerId: string;
  cardId: string;
  cardIndex: number; // Position in hand

  // Targets
  targets: TargetSelection[];

  // If the card has choices (e.g., "draw from Action OR Skill")
  choices?: {
    deck?: DeckType;
    target?: string;
  };
}

export interface RespondToStackAction {
  playerId: string;

  // Response type
  responseType: 'counter' | 'pass';

  // If countering
  cardId?: string;
  cardIndex?: number;
}

export interface PassTurnAction {
  playerId: string;
}

export interface SurrenderAction {
  playerId: string;
}

// ============================================================================
// Matchmaking
// ============================================================================

export interface MatchmakingQueue {
  userId: string;
  username: string;

  // Queue type
  queueType: 'pvp_casual' | 'pvp_ranked' | 'coop_raid';

  // Player stats
  elo?: number;
  level: number;

  // Deck
  deckId: string;

  // Preferences
  region?: string;
  acceptCrossRegion: boolean;

  // Timestamps
  queuedAt: number;
  estimatedWaitTime?: number;
}

export interface MatchmakingResult {
  battleId: string;
  players: {
    userId: string;
    username: string;
    role: PlayerRole;
  }[];

  // Balancing
  eloRange: {
    min: number;
    max: number;
    average: number;
  };

  // Deck normalization (for ranked)
  normalizedDeck: boolean;
}

// ============================================================================
// Ranked System
// ============================================================================

export interface RankedStats {
  userId: string;

  // Current season
  season: string;
  elo: number;
  rank: RankedTier;
  division: number; // 1-5 within tier

  // LP (League Points)
  lp: number;

  // Stats
  wins: number;
  losses: number;
  winStreak: number;

  // Historical
  peakElo: number;
  peakRank: RankedTier;

  // Rewards
  seasonRewardsClaimed: boolean;
}

export type RankedTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'grandmaster'
  | 'challenger';

export interface RankedRewards {
  tier: RankedTier;
  division: number;

  // Rewards
  gold: number;
  packs: number;
  exclusiveCardId?: string;
  cosmeticId?: string;
}

// ============================================================================
// Tournament System
// ============================================================================

export interface Tournament {
  id: string;
  name: string;

  // Format
  format: 'single_elimination' | 'double_elimination' | 'swiss' | 'round_robin';
  maxPlayers: number;

  // Registration
  registeredPlayers: TournamentPlayer[];
  registrationOpens: number;
  registrationCloses: number;

  // Schedule
  startsAt: number;
  endsAt?: number;

  // Rounds
  rounds: TournamentRound[];
  currentRound: number;

  // Rules
  deckNormalized: boolean;
  bestOf: number; // 1, 3, or 5

  // Prizes
  prizes: TournamentPrize[];

  // Status
  status: 'registration' | 'active' | 'completed' | 'cancelled';
}

export interface TournamentPlayer {
  userId: string;
  username: string;
  elo: number;
  seed: number;

  // Deck
  deckId: string;

  // Progress
  wins: number;
  losses: number;
  isEliminated: boolean;
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];

  // Timing
  startsAt: number;
  endsAt?: number;
}

export interface TournamentMatch {
  id: string;
  roundNumber: number;
  matchNumber: number;

  // Players
  player1Id: string;
  player2Id?: string; // undefined if bye

  // Battle IDs (for best-of series)
  battleIds: string[];

  // Result
  winnerId?: string;
  score?: string; // e.g., "2-1"

  // Status
  status: 'pending' | 'active' | 'completed';
}

export interface TournamentPrize {
  placement: number; // 1 = 1st place, 2 = 2nd place, etc.
  gold: number;
  packs: number;
  exclusiveCards?: string[];
  title?: string;
}

// ============================================================================
// Co-op Raid System
// ============================================================================

export interface CoopRaid {
  id: string;
  raidBossId: string;

  // Difficulty
  difficulty: 'normal' | 'hard' | 'mythic';

  // Players (1-4)
  players: string[]; // userIds
  maxPlayers: number;

  // Boss
  boss: RaidBoss;

  // Phases
  currentPhase: number;
  phases: RaidPhase[];

  // Rewards (shared)
  rewardPool: {
    gold: number;
    xp: number;
    items: string[]; // cardIds
  };

  // Status
  status: 'forming' | 'active' | 'completed' | 'failed';

  // Timing
  startedAt?: number;
  completedAt?: number;
  timeLimit?: number; // seconds
}

export interface RaidBoss {
  id: string;
  name: string;
  level: number;

  // Stats
  hp: number;
  maxHp: number;
  atk: number;
  def: number;

  // Special mechanics
  mechanics: BossMechanic[];

  // Phases (HP thresholds)
  phaseThresholds: number[]; // HP percentages (e.g., [75, 50, 25])
}

export interface BossMechanic {
  id: string;
  name: string;
  description: string;

  // Trigger
  trigger: 'phase_change' | 'turn_start' | 'hp_threshold' | 'player_action';
  triggerValue?: number; // HP threshold percentage

  // Effect
  effect: EffectDef;

  // Targeting
  targeting: 'random_player' | 'all_players' | 'highest_hp' | 'lowest_hp';
}

export interface RaidPhase {
  phaseNumber: number;

  // Boss changes
  bossStatChanges?: {
    atk?: number;
    def?: number;
  };

  // New mechanics
  mechanicsUnlocked?: string[];

  // Environment changes
  environmentEffect?: PersistentEffect;
}

// ============================================================================
// Battle Rewards
// ============================================================================

export interface BattleReward {
  battleId: string;
  userId: string;

  // Victory/Defeat
  victory: boolean;

  // Base rewards
  gold: number;
  xp: number;

  // Item drops
  items: string[]; // cardIds

  // Ranked rewards (if applicable)
  rankedChanges?: {
    eloBefore: number;
    eloAfter: number;
    lpGained: number;
    rankUp: boolean;
    newRank?: RankedTier;
  };

  // Quest completion (if applicable)
  questCompleted?: boolean;
  questRewards?: {
    gold: number;
    xp: number;
    items: string[];
  };

  // Statistics
  damageDealt: number;
  damageTaken: number;
  cardsPlayed: number;
  turnsTaken: number;
  timeElapsed: number; // seconds
}

// ============================================================================
// Card Animation & Visual Effects
// ============================================================================

export interface CardAnimation {
  type: 'play' | 'draw' | 'discard' | 'destroy' | 'counter';
  cardId: string;
  fromLocation: CardLocation;
  toLocation: CardLocation;
  duration: number; // ms
}

export interface CardLocation {
  type: 'hand' | 'deck' | 'discard' | 'stack' | 'battlefield' | 'equipped';
  deckType?: DeckType;
  index?: number;
}

export interface VisualEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'dice_roll' | 'card_glow';
  targetId?: string;
  duration: number; // ms
  particleEffect?: 'sparkles' | 'flames' | 'ice' | 'lightning' | 'poison';
}

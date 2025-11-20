// ============================================================================
// User & Character Types
// ============================================================================

export interface User {
  uid: string;
  name?: string;
  region?: string;
  prefs?: {
    shareLocation?: boolean;
    allowFriendInvites?: boolean;
    colorBlindMode?: boolean;
  };
  createdAt: number;
}

export interface Character {
  id: string;
  uid: string;
  classId?: string;
  alignment?: Alignment;
  counters: {
    hp: number;
    mana: number;
    xp: number;
    renown: number;
  };
  stats: {
    atk: number;
    def: number;
    spd: number;
    maxHp?: number;
    maxMana?: number;
  };
  level: number;
  lives: number;
  inventory: ItemInstance[];
  equipped: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  skills: string[];
  gold: number;
}

export interface ComputedStats {
  // Base stats from character class/level
  base: {
    atk: number;
    def: number;
    spd: number;
    maxHp: number;
    maxMana: number;
  };
  
  // Bonuses from equipped items
  equipment: {
    atk: number;
    def: number;
    spd: number;
    hp: number;
    mana: number;
    strength: number;
    dexterity: number;
    intelligence: number;
    vitality: number;
  };
  
  // Temporary buffs from fitness activities
  buffs: {
    atk: number;
    def: number;
    maxHp: number;
    maxMana: number;
    expiresAt?: number;
  };
  
  // Final computed totals
  total: {
    atk: number;
    def: number;
    spd: number;
    maxHp: number;
    maxMana: number;
  };
}

export interface ItemInstance {
  id: string;
  cardId: string;
  durability?: number;
  bound?: boolean;
}

// ============================================================================
// Card & Game Content Types
// ============================================================================

export type Alignment = "Holy" | "Chaos" | "Arcane" | "Neutral";
export type DeckType = "Action" | "Skill" | "Loot" | "Boss" | "Summon" | "Renown" | "Quest" | "Class";
export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export interface CardDef {
  id: string;
  name: string;
  deck: DeckType;
  rarity: Rarity;
  alignment?: Alignment;
  manaCost?: number;
  tags?: string[];
  portable: boolean;
  text: string;
  effects: EffectDef[];
  art?: {
    iconUrl?: string;
    fullUrl?: string;
  };
}

// ============================================================================
// Digital Game Card Types (for in-app usage)
// ============================================================================

export type GameCardType = 'Equipment' | 'Skill' | 'Companion' | 'Consumable' | 'Quest';

export interface GameCard {
  // Identity
  id: string;
  name: string;
  type: GameCardType;
  rarity: Rarity;
  
  // Visual
  image: string; // emoji or image URL
  description: string;
  
  // Game Mechanics
  cost?: number; // Mana cost for skills
  usableInApp: boolean; // false for physical-only cards
  
  // Equipment Stats (if type === 'Equipment')
  equipmentSlot?: 'Weapon' | 'Armor' | 'Accessory' | 'Ring';
  statBonuses?: {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    vitality?: number;
    hp?: number;
    mana?: number;
    attack?: number;
    defense?: number;
  };
  
  // Skill Effects (if type === 'Skill')
  skillEffect?: {
    type: 'Damage' | 'Heal' | 'Buff' | 'Debuff' | 'Summon';
    value: number;
    target: 'Self' | 'Enemy' | 'All';
    duration?: number; // turns
  };
  
  // Upgrade System
  level: number; // 1-10
  upgradeRequirements?: {
    gold: number;
    materials: { itemId: string; count: number }[];
  };
  
  // Ownership
  count: number;
  location: 'inventory' | 'stash' | 'equipped' | 'deck';
  equippedSlot?: string; // if equipped
}

export interface QuestCard extends GameCard {
  type: 'Quest';
  
  questData: {
    title: string;
    description: string;
    objectives: QuestObjective[];
    rewards: QuestRewards;
    duration: number; // hours until expires
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  };
}

export interface QuestObjective {
  id: string;
  type: 'battle' | 'fitness' | 'defend' | 'collect';
  description: string;
  target: number;
  current: number;
  completed: boolean;
}

export interface QuestRewards {
  xp: number;
  gold: number;
  cards?: { cardId: string; rarity: Rarity }[];
}

export type StatScale = {
  stat: "atk" | "def" | "spd";
  factor: number;
};

export type EffectDef =
  | { type: "damage"; amount: number; scaling?: StatScale }
  | { type: "heal"; amount: number; scaling?: StatScale }
  | { type: "draw"; deck: "Action" | "Skill" | "Loot"; amount: number }
  | { type: "buff"; stat: "atk" | "def" | "maxMana" | "maxHp"; amount: number; duration?: "temp" | "battle" | "permanent" }
  | { type: "debuff"; stat: "atk" | "def" | "maxMana" | "maxHp"; amount: number; duration?: "temp" | "battle" }
  | { type: "instantCancel" }
  | { type: "stealRandom"; from: "opponent"; deck: "Action" | "Skill" | "Loot"; amount: number }
  | { type: "spawn"; what: "npc" | "boss" | "quest"; refId: string }
  | { type: "discardRandom"; who: "self" | "opponent"; amount: number }
  | { type: "gainRenown"; amount: number }
  | { type: "gainGold"; amount: number }
  | { type: "gainXP"; amount: number }
  | { type: "gainTempMana"; amount: number }
  | { type: "gainTempHP"; amount: number }
  | { type: "destroyPersistent"; target?: "aura" | "curse" | "summon" | "any" }
  | { type: "equipLoot"; slot: "weapon" | "armor" | "accessory" }
  | { type: "aoe"; damage: number; exclude?: "self" }
  | { type: "persistent"; subtype: "aura" | "curse" | "link"; hp?: number }
  | { type: "custom"; key: string; payload?: any };

export interface ClassCard extends Omit<CardDef, "deck"> {
  deck: "Class";
  baseHP: number;
  baseMana: number;
  baseAttack: {
    name: string;
    cost: number;
    damage: number;
    effect?: string;
  };
  baseSkill: {
    name: string;
    cost: number;
    effect: string;
  };
  avatarPower?: string; // Not used in app (Soulforge Trial removed in-app)
}

export interface BossCard extends Omit<CardDef, "deck"> {
  deck: "Boss";
  baseHP: number;
  hpScaling: "perPlayer" | "fixed";
  action: string;
  passive: string;
  special?: string;
  reward: string;
}

// ============================================================================
// Battle & Combat Types
// ============================================================================

export type BattleMode = "PvP" | "NPC" | "Boss" | "Coop";
export type BattleState = "waiting" | "active" | "resolved";

export interface Battle {
  id: string;
  mode: BattleMode;
  participants: string[]; // character ids
  state: BattleState;
  turnOrder: string[];
  currentTurn?: string; // character id whose turn it is
  stack: StackItem[];
  log: BattleLogEntry[];
  timers: {
    ropeMs: number;
    maxMs: number;
    turnStart?: number;
  };
  normalization?: {
    ranked: boolean;
  };
  bossState?: {
    bossId: string;
    hp: number;
    maxHp: number;
    counters?: Record<string, number>; // e.g., "armorPlates": 3
  };
  // Enhanced battle data
  createdAt: number;
  updatedAt: number;
  winner?: string; // character id of winner
  battleSettings: {
    maxTurns: number;
    timeLimitMs: number;
    allowSpectators: boolean;
  };
  playerStates: Record<string, BattlePlayerState>;
  aiOpponent?: BattleAIState;
}

export interface BattlePlayerState {
  characterId: string;
  userId: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  lives: number;
  maxLives: number;
  hand: string[]; // card instance ids
  deck: string[]; // card instance ids
  discard: string[]; // card instance ids
  buffs: BattleBuff[];
  debuffs: BattleDebuff[];
  isActive: boolean;
  hasPassed: boolean;
  lastAction?: number; // timestamp
}

export interface BattleAIState {
  aiId: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Boss';
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  lives: number;
  maxLives: number;
  deck: string[]; // AI card templates
  hand: string[]; // AI card instances
  discard: string[]; // AI card instances
  behavior: AIBehavior;
  isActive: boolean;
}

export interface AIBehavior {
  aggression: number; // 0-1, how likely to attack
  defense: number; // 0-1, how likely to defend
  cardPlay: number; // 0-1, how likely to play cards
  targetPriority: 'weakest' | 'strongest' | 'random' | 'balanced';
}

export interface BattleBuff {
  id: string;
  name: string;
  stat: 'atk' | 'def' | 'maxMana' | 'maxHp' | 'spd';
  amount: number;
  duration: number; // turns remaining
  source: string; // card or effect that applied it
}

export interface BattleDebuff {
  id: string;
  name: string;
  stat: 'atk' | 'def' | 'maxMana' | 'maxHp' | 'spd';
  amount: number;
  duration: number; // turns remaining
  source: string; // card or effect that applied it
}

export interface StackItem {
  id: string;
  sourceCharId: string;
  cardId?: string;
  effect: EffectDef;
  targetIds?: string[];
  timestamp: number;
}

export interface BattleLogEntry {
  id: string;
  t: number;
  msg: string;
  seed?: string; // RNG seed used
}

// ============================================================================
// Battle Action Types
// ============================================================================

export type BattleAction = 
  | PlayCardAction
  | PassTurnAction
  | SurrenderAction
  | ResolveStackAction;

export interface PlayCardAction {
  type: 'playCard';
  battleId: string;
  playerId: string;
  cardId: string;
  targets?: string[]; // character ids
  timestamp: number;
}

export interface PassTurnAction {
  type: 'passTurn';
  battleId: string;
  playerId: string;
  timestamp: number;
}

export interface SurrenderAction {
  type: 'surrender';
  battleId: string;
  playerId: string;
  timestamp: number;
}

export interface ResolveStackAction {
  type: 'resolveStack';
  battleId: string;
  stackItemId: string;
  timestamp: number;
}

// ============================================================================
// Cloud Function Interfaces
// ============================================================================

export interface CreateBattleRequest {
  mode: BattleMode;
  participants: string[]; // character ids
  settings?: {
    maxTurns?: number;
    timeLimitMs?: number;
    allowSpectators?: boolean;
  };
  aiOpponent?: {
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Boss';
    aiId: string;
  };
}

export interface CreateBattleResponse {
  success: boolean;
  battleId?: string;
  error?: string;
}

export interface PlayCardRequest {
  battleId: string;
  playerId: string;
  cardId: string;
  targets?: string[];
}

export interface PlayCardResponse {
  success: boolean;
  error?: string;
  battleState?: Battle;
}

export interface PassTurnRequest {
  battleId: string;
  playerId: string;
}

export interface PassTurnResponse {
  success: boolean;
  error?: string;
  battleState?: Battle;
}

export interface GetBattleRequest {
  battleId: string;
  playerId: string;
}

export interface GetBattleResponse {
  success: boolean;
  battle?: Battle;
  error?: string;
}

// ============================================================================
// Quest & Adventure Types
// ============================================================================

export type QuestType =
  | "Physical"
  | "Social"
  | "Enemy"
  | "Friendly"
  | "Interest"
  | "Story"
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Yearly"
  | "Seasonal";

export type PlaceType =
  | "Pub"
  | "Mountain"
  | "Trail"
  | "Monument"
  | "Park"
  | "Gym"
  | "Shop"
  | "Landmark"
  | "Water"
  | "Any";

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  rarity: Rarity;
  placeType: PlaceType;
  dynamic: boolean;
  timerSec: number;
  maxCompletions?: number;
  requirements: Requirement[];
  rewards: Reward[];
  spawnRules?: SpawnRules;
}

export type Requirement =
  | { kind: "distanceKm"; value: number }
  | { kind: "hrZone"; minPct: number; durationSec: number }
  | { kind: "steps"; value: number }
  | { kind: "elevGainM"; value: number }
  | { kind: "poiRadiusM"; value: number };

export type Reward =
  | { kind: "xp"; value: number }
  | { kind: "gold"; value: number }
  | { kind: "renown"; value: number }
  | { kind: "card"; cardId: string }
  | { kind: "item"; cardId: string }
  | { kind: "tempBuff"; stat: "atk" | "def" | "maxMana" | "maxHp"; amount: number; durationSec: number };

export interface SpawnRules {
  regionId?: string;
  minLevel?: number;
  maxLevel?: number;
  ttlMinutes: number;
  budget?: number; // spawn cost/weight
}

export interface MapPOI {
  id: string;
  type: PlaceType;
  lat: number;
  lng: number;
  radiusM: number;
  tags?: string[];
  active: boolean;
}

// ============================================================================
// Fitness & Activity Types
// ============================================================================

export type ActivitySource = "HealthKit" | "Fit" | "Strava" | "Garmin" | "WHOOP";
export type ActivityKind = "run" | "hike" | "bike" | "walk" | "hr-session";

export interface ActivityEvent {
  id: string;
  uid: string;
  source: ActivitySource;
  kind: ActivityKind;
  start: number;
  end: number;
  distanceM?: number;
  steps?: number;
  calories?: number;
  avgHr?: number;
  elevGainM?: number;
  proofs?: {
    gpsQuality: "poor" | "fair" | "good" | "great";
    paceOK: boolean;
    hrOK: boolean;
    cadenceOK?: boolean;
  };
  samplesHash?: string;
}

// ============================================================================
// Shop & Economy Types
// ============================================================================

export type ShopItemKind = "item" | "pack" | "adventure" | "cosmetic" | "stashSlot" | "pass" | "respecToken";

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  name: string;
  description?: string;
  priceGold?: number;
  priceIAP?: number; // in cents
  spotlight?: boolean;
  stock?: number;
  contentsSpec?: any; // pack odds, adventure spawn rules, etc.
}

export interface PackContents {
  packSize: number;
  rarityOdds: number[]; // [Common%, Uncommon%, Rare%, Epic%, Legendary%]
}

// ============================================================================
// Season & Events Types
// ============================================================================

export interface Season {
  id: string;
  name: string;
  start: number;
  end: number;
  rules?: any;
  cardPools?: string[];
  bossRotation?: string[];
}

// ============================================================================
// Trade & Social Types
// ============================================================================

export interface Trade {
  id: string;
  fromUid: string;
  toUid: string;
  fromItems: string[]; // item instance ids
  toItems: string[];
  state: "pending" | "accepted" | "finalized" | "cancelled";
  createdAt: number;
}

export interface FriendAlliance {
  id: string;
  players: string[]; // character ids
  cardId: string; // "Friends" action card id
  createdAt: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface APIResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  User,
  Character,
  ComputedStats,
  ItemInstance,
  CardDef,
  GameCard,
  QuestCard,
  QuestObjective,
  QuestRewards,
  ClassCard,
  BossCard,
  EffectDef,
  StatScale,
  Battle,
  StackItem,
  BattleLogEntry,
  Quest,
  Requirement,
  Reward,
  SpawnRules,
  MapPOI,
  ActivityEvent,
  ShopItem,
  PackContents,
  Season,
  Trade,
  FriendAlliance,
  APIResponse,
  PaginatedResponse,
};

export {
  Alignment,
  DeckType,
  Rarity,
  GameCardType,
  BattleMode,
  BattleState,
  QuestType,
  PlaceType,
  ActivitySource,
  ActivityKind,
  ShopItemKind,
};
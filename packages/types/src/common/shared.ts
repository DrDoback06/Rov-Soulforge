/**
 * Shared Common Types
 *
 * Common enums and types used across the entire application
 */

export type Alignment = "Holy" | "Chaos" | "Arcane" | "Neutral";

export type DeckType = "Action" | "Skill" | "Loot" | "Boss" | "Summon" | "Renown" | "Quest" | "Class";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export type GameCardType = 'Equipment' | 'Skill' | 'Companion' | 'Consumable' | 'Quest';

export type BattleMode = "PvP" | "NPC" | "Boss" | "Coop";

export type BattleState = "waiting" | "active" | "resolved";

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

export type ActivitySource = "HealthKit" | "Fit" | "Strava" | "Garmin" | "WHOOP";

export type ActivityKind = "run" | "hike" | "bike" | "walk" | "hr-session";

export type ShopItemKind = "item" | "pack" | "adventure" | "cosmetic" | "stashSlot" | "pass" | "respecToken";

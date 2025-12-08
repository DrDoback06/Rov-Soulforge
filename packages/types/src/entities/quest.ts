/**
 * Quest Types
 */

import type { QuestType, PlaceType, Rarity } from '../common/shared';
import type { Requirement, Reward, SpawnRules } from '../objectives/quest-objectives';

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

export interface MapPOI {
  id: string;
  type: PlaceType;
  lat: number;
  lng: number;
  radiusM: number;
  tags?: string[];
  active: boolean;
}

/**
 * Card Types
 *
 * All card-related type definitions
 */

import type { Alignment, DeckType, Rarity, GameCardType } from '../common/shared';
import type { EffectDef } from '../effects/effect-def';
import type { QuestObjective, QuestRewards } from '../objectives/quest-objectives';

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

/**
 * Party & Boss Raid Types
 * 
 * Supports 1-4 player co-op parties for boss raids
 */

export type PartyRole = 'Tank' | 'DPS' | 'Support' | 'Flex';

export interface PartyMember {
  userId: string;
  characterId: string;
  characterName: string;
  characterClass: string;
  level: number;
  role: PartyRole;
  isReady: boolean;
  isLeader: boolean;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
}

export interface Party {
  id: string;
  leaderId: string;
  members: PartyMember[];
  maxSize: number; // 2 for 2v2, 4 for raids
  status: 'forming' | 'ready' | 'in_battle' | 'disbanded';
  battleMode: '2v2' | '4v4_raid';
  targetBossId?: string; // For raids
  createdAt: number;
  updatedAt: number;
}

export interface QuickChatMessage {
  id: string;
  text: string;
  icon: string;
  category: 'Combat' | 'Strategy' | 'Social';
}

export interface Emote {
  id: string;
  icon: string;
  name: string;
  animation?: string;
}

export const QUICK_CHAT_MESSAGES: QuickChatMessage[] = [
  // Combat
  { id: 'attack', text: 'Attack!', icon: '⚔️', category: 'Combat' },
  { id: 'defend', text: 'Defend!', icon: '🛡️', category: 'Combat' },
  { id: 'heal', text: 'Need Healing!', icon: '❤️', category: 'Combat' },
  { id: 'mana', text: 'Low Mana', icon: '⚡', category: 'Combat' },
  { id: 'run', text: 'Retreat!', icon: '🏃', category: 'Combat' },
  { id: 'ultimate', text: 'Ultimate Ready!', icon: '💥', category: 'Combat' },
  
  // Strategy
  { id: 'wait', text: 'Wait', icon: '✋', category: 'Strategy' },
  { id: 'go', text: 'Go Now!', icon: '▶️', category: 'Strategy' },
  { id: 'target', text: 'Focus Target', icon: '🎯', category: 'Strategy' },
  { id: 'help', text: 'Help Me!', icon: '🆘', category: 'Strategy' },
  { id: 'group', text: 'Stay Together', icon: '👥', category: 'Strategy' },
  { id: 'spread', text: 'Spread Out', icon: '↔️', category: 'Strategy' },
  
  // Social
  { id: 'thanks', text: 'Thanks!', icon: '🙏', category: 'Social' },
  { id: 'sorry', text: 'Sorry!', icon: '😅', category: 'Social' },
  { id: 'nice', text: 'Nice!', icon: '👍', category: 'Social' },
  { id: 'gg', text: 'Good Game!', icon: '🎮', category: 'Social' },
  { id: 'ready', text: 'Ready!', icon: '✅', category: 'Social' },
  { id: 'afk', text: 'AFK', icon: '⏸️', category: 'Social' },
];

export const EMOTES: Emote[] = [
  { id: 'wave', icon: '👋', name: 'Wave' },
  { id: 'cheer', icon: '🎉', name: 'Cheer' },
  { id: 'thumbs_up', icon: '👍', name: 'Thumbs Up' },
  { id: 'laugh', icon: '😂', name: 'Laugh' },
  { id: 'cry', icon: '😢', name: 'Cry' },
  { id: 'angry', icon: '😡', name: 'Angry' },
  { id: 'love', icon: '❤️', name: 'Love' },
  { id: 'thinking', icon: '🤔', name: 'Thinking' },
  { id: 'celebrate', icon: '🥳', name: 'Celebrate' },
  { id: 'shocked', icon: '😱', name: 'Shocked' },
  { id: 'cool', icon: '😎', name: 'Cool' },
  { id: 'sleep', icon: '😴', name: 'Sleep' },
  { id: 'fire', icon: '🔥', name: 'Fire' },
  { id: 'star', icon: '⭐', name: 'Star' },
  { id: 'trophy', icon: '🏆', name: 'Trophy' },
  { id: 'target', icon: '🎯', name: 'Target' },
];

export interface BossRaidPhase {
  phase: number;
  hpThreshold: number; // 0.66 = phase 2 at 66% HP
  name: string;
  description: string;
  mechanicsActive: string[];
  difficultyMultiplier: number;
}

export interface BossRaid {
  id: string;
  bossId: string;
  bossName: string;
  partyId: string;
  difficulty: 'Normal' | 'Heroic' | 'Mythic';
  currentPhase: number;
  bossHp: number;
  bossMaxHp: number;
  phases: BossRaidPhase[];
  startedAt: number;
  enrageAt: number; // 15 minutes from start
  status: 'active' | 'completed' | 'failed';
  loot: any[]; // Dropped items
  mvp?: string; // User ID of MVP
}

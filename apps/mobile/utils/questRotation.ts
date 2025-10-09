/**
 * Quest Rotation System
 *
 * Manages daily, weekly, and monthly quest rotations
 * Automatically generates and expires time-limited quests
 */

import type { Firestore } from 'firebase/firestore';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';

export type RotationType = 'daily' | 'weekly' | 'monthly';

export interface RotationQuest {
  id: string;
  type: RotationType;
  questData: any;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

/**
 * Generate daily quests for a specific location
 * Called at midnight UTC every day
 */
export async function generateDailyQuests(
  db: Firestore,
  centerLat: number,
  centerLng: number,
  count: number = 3
): Promise<string[]> {
  const questIds: string[] = [];

  try {
    console.log('🌅 Generating daily quests...');

    // Calculate dates
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
      const quest = generateRandomQuest('daily', centerLat, centerLng, i);
      const questId = `daily_${now.toISOString().split('T')[0]}_${i}`;

      const questRef = doc(db, `quests/dynamic/${questId}`);
      await setDoc(questRef, {
        ...quest,
        rotationType: 'daily',
        startDate: now,
        endDate: tomorrow,
        isActive: true
      });

      questIds.push(questId);
      console.log(`   ✅ Created daily quest: ${quest.title}`);
    }

    console.log(`✨ Generated ${questIds.length} daily quests`);
    return questIds;

  } catch (error) {
    console.error('Failed to generate daily quests:', error);
    return [];
  }
}

/**
 * Generate weekly quests
 * Called every Monday at midnight UTC
 */
export async function generateWeeklyQuests(
  db: Firestore,
  centerLat: number,
  centerLng: number,
  count: number = 5
): Promise<string[]> {
  const questIds: string[] = [];

  try {
    console.log('📅 Generating weekly quests...');

    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (8 - now.getDay()) % 7);
    nextMonday.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
      const quest = generateRandomQuest('weekly', centerLat, centerLng, i);
      const questId = `weekly_${getWeekNumber(now)}_${now.getFullYear()}_${i}`;

      const questRef = doc(db, `quests/dynamic/${questId}`);
      await setDoc(questRef, {
        ...quest,
        rotationType: 'weekly',
        startDate: now,
        endDate: nextMonday,
        isActive: true
      });

      questIds.push(questId);
      console.log(`   ✅ Created weekly quest: ${quest.title}`);
    }

    console.log(`✨ Generated ${questIds.length} weekly quests`);
    return questIds;

  } catch (error) {
    console.error('Failed to generate weekly quests:', error);
    return [];
  }
}

/**
 * Generate monthly quests
 * Called on the 1st of each month at midnight UTC
 */
export async function generateMonthlyQuests(
  db: Firestore,
  centerLat: number,
  centerLng: number,
  count: number = 3
): Promise<string[]> {
  const questIds: string[] = [];

  try {
    console.log('📆 Generating monthly quests...');

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    for (let i = 0; i < count; i++) {
      const quest = generateRandomQuest('monthly', centerLat, centerLng, i);
      const questId = `monthly_${now.getFullYear()}_${now.getMonth() + 1}_${i}`;

      const questRef = doc(db, `quests/dynamic/${questId}`);
      await setDoc(questRef, {
        ...quest,
        rotationType: 'monthly',
        startDate: now,
        endDate: nextMonth,
        isActive: true,
        // Monthly quests are more challenging
        difficulty: ['hard', 'epic', 'legendary'][i % 3],
        rewards: {
          ...quest.rewards,
          gold: quest.rewards.gold * 2,
          xp: quest.rewards.xp * 2
        }
      });

      questIds.push(questId);
      console.log(`   ✅ Created monthly quest: ${quest.title}`);
    }

    console.log(`✨ Generated ${questIds.length} monthly quests`);
    return questIds;

  } catch (error) {
    console.error('Failed to generate monthly quests:', error);
    return [];
  }
}

/**
 * Remove expired quests
 * Should be run periodically (every hour)
 */
export async function removeExpiredQuests(db: Firestore): Promise<number> {
  try {
    const now = new Date();
    const dynamicQuestsRef = collection(db, 'quests/dynamic');
    const snapshot = await getDocs(dynamicQuestsRef);

    let removedCount = 0;

    for (const questDoc of snapshot.docs) {
      const data = questDoc.data();
      const endDate = data.endDate?.toDate();

      if (endDate && endDate < now) {
        await deleteDoc(questDoc.ref);
        removedCount++;
        console.log(`   🗑️  Removed expired quest: ${data.title}`);
      }
    }

    if (removedCount > 0) {
      console.log(`✨ Removed ${removedCount} expired quests`);
    }

    return removedCount;

  } catch (error) {
    console.error('Failed to remove expired quests:', error);
    return 0;
  }
}

/**
 * Generate a random quest based on rotation type
 */
function generateRandomQuest(
  rotationType: RotationType,
  lat: number,
  lng: number,
  seed: number
): any {
  const questTypes = ['battle', 'fitness', 'collection'];
  const difficulties = ['easy', 'medium', 'hard'];

  // Use seed to generate consistent randomness
  const typeIndex = seed % questTypes.length;
  const diffIndex = seed % difficulties.length;

  const questType = questTypes[typeIndex];
  const difficulty = difficulties[diffIndex];

  // Generate random location within 5km radius
  const angle = (seed * 137.5) % 360; // Golden angle for distribution
  const distance = ((seed % 100) / 100) * 5000; // 0-5km
  const offsetLat = (distance / 111000) * Math.cos(angle * Math.PI / 180);
  const offsetLng = (distance / 111000) * Math.sin(angle * Math.PI / 180) / Math.cos(lat * Math.PI / 180);

  const questLat = lat + offsetLat;
  const questLng = lng + offsetLng;

  const baseQuest = {
    type: 'dynamic',
    difficulty,
    status: 'available',
    visibility: 'dynamic',
    location: {
      latitude: questLat,
      longitude: questLng,
      geohash: geohashForLocation([questLat, questLng]),
      name: `${rotationType.charAt(0).toUpperCase() + rotationType.slice(1)} Location`,
      type: 'dynamic'
    },
    activationRadius: 100,
    acceptRadius: 50,
    requiredLevel: 1,
    maxPlayers: rotationType === 'monthly' ? 4 : 1,
    coopBonusPerPlayer: 25,
    isLegendary: rotationType === 'monthly' && seed % 3 === 0,
    isBoss: false,
    icon: questType === 'battle' ? '⚔️' : questType === 'fitness' ? '🏃' : '🎁',
    color: difficulty === 'hard' ? '#ef4444' : difficulty === 'medium' ? '#fbbf24' : '#22c55e',
    tags: [rotationType, questType],
    createdBy: 'system',
    completionCount: 0,
    spawnedAt: new Date()
  };

  // Quest-specific generation
  switch (questType) {
    case 'battle':
      return {
        ...baseQuest,
        title: `${rotationType.charAt(0).toUpperCase() + rotationType.slice(1)} Battle: ${getBattleTitle(seed)}`,
        description: 'Defeat enemies to complete this challenge.',
        objectives: [
          {
            id: 'battle_obj',
            type: 'battle',
            description: `Defeat ${difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5} enemies`,
            target: difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5,
            current: 0,
            completed: false,
            order: 1,
            metadata: { enemyTypes: ['goblin', 'orc', 'troll'], enemyCount: 10 }
          }
        ],
        rewards: {
          gold: difficulty === 'hard' ? 800 : difficulty === 'medium' ? 500 : 300,
          xp: difficulty === 'hard' ? 1500 : difficulty === 'medium' ? 1000 : 600,
          items: []
        },
        recommendedLevel: difficulty === 'hard' ? 10 : difficulty === 'medium' ? 5 : 3
      };

    case 'fitness':
      return {
        ...baseQuest,
        title: `${rotationType.charAt(0).toUpperCase() + rotationType.slice(1)} Fitness: ${getFitnessTitle(seed)}`,
        description: 'Complete the workout challenge.',
        objectives: [
          {
            id: 'fitness_obj',
            type: 'fitness',
            description: 'Complete: 25 pushups, 35 situps, 45 squats',
            target: 1,
            current: 0,
            completed: false,
            order: 1,
            metadata: { fitnessType: 'circuit', timeLimit: 600 }
          }
        ],
        rewards: {
          gold: 400,
          xp: 800,
          items: []
        },
        recommendedLevel: 3
      };

    case 'collection':
      return {
        ...baseQuest,
        title: `${rotationType.charAt(0).toUpperCase() + rotationType.slice(1)} Hunt: ${getCollectionTitle(seed)}`,
        description: 'Find and collect hidden items.',
        objectives: [
          {
            id: 'collect_obj',
            type: 'collect',
            description: 'Find 3 hidden items',
            target: 3,
            current: 0,
            completed: false,
            order: 1,
            metadata: { collectibleItems: ['Ancient Coin', 'Mystic Crystal', 'Lost Scroll'] }
          }
        ],
        rewards: {
          gold: 350,
          xp: 700,
          items: []
        },
        recommendedLevel: 4
      };

    default:
      return baseQuest;
  }
}

// Helper functions for quest titles
function getBattleTitle(seed: number): string {
  const titles = [
    'Shadow Invasion',
    'Monster Outbreak',
    'Goblin Raid',
    'Dark Forces',
    'Enemy Surge',
    'Creature Hunt',
    'Battle Royale'
  ];
  return titles[seed % titles.length];
}

function getFitnessTitle(seed: number): string {
  const titles = [
    'Morning Workout',
    'Strength Test',
    'Endurance Challenge',
    'Power Training',
    'Cardio Blast',
    'Core Crusher',
    'Full Body Burn'
  ];
  return titles[seed % titles.length];
}

function getCollectionTitle(seed: number): string {
  const titles = [
    'Treasure Hunt',
    'Relic Search',
    'Mystery Items',
    'Lost Artifacts',
    'Hidden Cache',
    'Secret Stash',
    'Ancient Relics'
  ];
  return titles[seed % titles.length];
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Check if rotation quests need to be generated
 * Returns which rotations need to be run
 */
export function checkRotationNeeded(): {
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
} {
  const now = new Date();
  const lastRun = getLastRotationRun();

  return {
    daily: !lastRun.daily || !isSameDay(now, lastRun.daily),
    weekly: !lastRun.weekly || !isSameWeek(now, lastRun.weekly),
    monthly: !lastRun.monthly || !isSameMonth(now, lastRun.monthly)
  };
}

function getLastRotationRun(): { daily?: Date; weekly?: Date; monthly?: Date } {
  // In production, this would read from database or AsyncStorage
  // For now, return empty object to always generate
  return {};
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

function isSameWeek(date1: Date, date2: Date): boolean {
  return getWeekNumber(date1) === getWeekNumber(date2);
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}

import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { EnhancedQuest, QuestObjective } from '@/types/quest-enhanced';
import { distanceBetween } from 'geofire-common';
import { questObjectiveCompleted, questCompleted } from './haptics';

/**
 * Quest Objective Tracker
 *
 * Handles updating and checking quest objective progress
 * Determines when objectives and quests are completed
 */

export interface QuestProgressData {
  id: string;
  questId: string;
  userId: string;
  status: 'active' | 'completed' | 'failed';
  objectives: QuestObjective[];
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  teammates?: string[]; // For co-op quests
  coopBonus?: number; // Calculated bonus from teammates
  lastUpdated: string;
}

/**
 * Initialize quest progress when player accepts quest
 */
export async function initializeQuestProgress(
  db: Firestore,
  userId: string,
  quest: EnhancedQuest,
  teammates: string[] = []
): Promise<string> {
  const progressId = `${userId}_${quest.id}`;

  // Calculate co-op bonus
  const coopBonus = teammates.length > 0
    ? (quest.coopBonusPerPlayer || 25) * teammates.length
    : 0;

  const progressData: QuestProgressData = {
    id: progressId,
    questId: quest.id,
    userId,
    status: 'active',
    objectives: quest.objectives.map(obj => ({
      ...obj,
      current: 0,
      completed: false
    })),
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    teammates,
    coopBonus
  };

  const docRef = doc(db, 'questProgress', progressId);
  await setDoc(docRef, progressData);

  console.log(`✅ Quest progress initialized: ${quest.title}`);
  return progressId;
}

/**
 * Update objective progress
 */
export async function updateObjectiveProgress(
  db: Firestore,
  progressId: string,
  objectiveId: string,
  increment: number = 1
): Promise<QuestProgressData | null> {
  const docRef = doc(db, 'questProgress', progressId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error('Quest progress not found');
    return null;
  }

  const progressData = docSnap.data() as QuestProgressData;

  // Update objective
  let justCompletedObjective = false;
  const updatedObjectives = progressData.objectives.map(obj => {
    if (obj.id === objectiveId) {
      const wasCompleted = obj.completed;
      const newCurrent = Math.min(obj.current + increment, obj.target);
      const isCompleted = newCurrent >= obj.target;

      // Check if objective just completed (wasn't completed before, but is now)
      if (!wasCompleted && isCompleted) {
        justCompletedObjective = true;
        // Trigger haptic feedback for objective completion
        questObjectiveCompleted().catch(err =>
          console.warn('Failed to trigger haptic feedback:', err)
        );
      }

      console.log(`📊 Objective progress: ${obj.description} - ${newCurrent}/${obj.target}`);

      return {
        ...obj,
        current: newCurrent,
        completed: isCompleted
      };
    }
    return obj;
  });

  // Check if all objectives are completed (in order)
  const allObjectivesCompleted = checkAllObjectivesCompleted(updatedObjectives);

  const updates: Partial<QuestProgressData> = {
    objectives: updatedObjectives,
    lastUpdated: new Date().toISOString()
  };

  if (allObjectivesCompleted) {
    updates.status = 'completed';
    updates.completedAt = new Date().toISOString();
    console.log(`🎉 Quest completed!`);

    // Trigger haptic feedback for quest completion
    questCompleted().catch(err =>
      console.warn('Failed to trigger haptic feedback:', err)
    );
  }

  await updateDoc(docRef, updates);

  return {
    ...progressData,
    ...updates
  } as QuestProgressData;
}

/**
 * Check if all objectives are completed in order
 */
function checkAllObjectivesCompleted(objectives: QuestObjective[]): boolean {
  // Sort by order
  const sortedObjectives = [...objectives].sort((a, b) => a.order - b.order);

  // Check if all are completed
  return sortedObjectives.every(obj => obj.completed);
}

/**
 * Get current active objective (first incomplete in order)
 */
export function getCurrentObjective(objectives: QuestObjective[]): QuestObjective | null {
  const sortedObjectives = [...objectives].sort((a, b) => a.order - b.order);
  return sortedObjectives.find(obj => !obj.completed) || null;
}

/**
 * Check if player can complete quest (all objectives done + in range)
 */
export async function canCompleteQuest(
  db: Firestore,
  progressId: string,
  playerLocation: { latitude: number; longitude: number },
  quest: EnhancedQuest
): Promise<boolean> {
  const docRef = doc(db, 'questProgress', progressId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return false;

  const progressData = docSnap.data() as QuestProgressData;

  // Check all objectives completed
  const allCompleted = progressData.objectives.every(obj => obj.completed);
  if (!allCompleted) return false;

  // Check if player is within quest location radius
  const distance = distanceBetween(
    [playerLocation.latitude, playerLocation.longitude],
    [quest.location.latitude, quest.location.longitude]
  );

  const distanceMeters = distance * 1000;
  return distanceMeters <= (quest.acceptRadius || quest.activationRadius);
}

/**
 * Complete quest and mark as completed
 */
export async function completeQuest(
  db: Firestore,
  progressId: string
): Promise<void> {
  const docRef = doc(db, 'questProgress', progressId);

  await updateDoc(docRef, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  console.log(`✅ Quest marked as completed`);
}

/**
 * Fail quest (e.g., time limit exceeded, player died too many times)
 */
export async function failQuest(
  db: Firestore,
  progressId: string,
  reason?: string
): Promise<void> {
  const docRef = doc(db, 'questProgress', progressId);

  await updateDoc(docRef, {
    status: 'failed',
    failedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    failureReason: reason
  });

  console.log(`❌ Quest failed: ${reason || 'Unknown'}`);
}

/**
 * Abandon quest
 */
export async function abandonQuest(
  db: Firestore,
  progressId: string
): Promise<void> {
  const docRef = doc(db, 'questProgress', progressId);

  await updateDoc(docRef, {
    status: 'abandoned',
    lastUpdated: new Date().toISOString()
  });

  console.log(`🚪 Quest abandoned`);
}

/**
 * Track battle objective - when enemy is defeated
 */
export async function trackBattleObjective(
  db: Firestore,
  progressId: string,
  objectiveId: string,
  enemyId: string
): Promise<void> {
  const docRef = doc(db, 'questProgress', progressId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  const progressData = docSnap.data() as QuestProgressData;

  // Find objective and mark enemy as defeated
  const updatedObjectives = progressData.objectives.map(obj => {
    if (obj.id === objectiveId && obj.metadata?.spawnedEnemies) {
      const updatedEnemies = obj.metadata.spawnedEnemies.map((enemy: any) => {
        if (enemy.id === enemyId) {
          return { ...enemy, defeated: true };
        }
        return enemy;
      });

      // Count defeated enemies
      const defeatedCount = updatedEnemies.filter((e: any) => e.defeated).length;

      return {
        ...obj,
        current: defeatedCount,
        completed: defeatedCount >= obj.target,
        metadata: {
          ...obj.metadata,
          spawnedEnemies: updatedEnemies
        }
      };
    }
    return obj;
  });

  await updateDoc(docRef, {
    objectives: updatedObjectives,
    lastUpdated: new Date().toISOString()
  });

  console.log(`⚔️ Enemy defeated: ${enemyId}`);
}

/**
 * Track fitness objective - update progress from fitness tracker
 */
export async function trackFitnessObjective(
  db: Firestore,
  progressId: string,
  objectiveId: string,
  progress: number,
  isTracked: boolean
): Promise<void> {
  // If untracked, only give 50% credit
  const actualProgress = isTracked ? progress : Math.floor(progress * 0.5);

  await updateObjectiveProgress(db, progressId, objectiveId, actualProgress);
}

/**
 * Track defend objective - check if player held position for duration
 */
export async function trackDefendObjective(
  db: Firestore,
  progressId: string,
  objectiveId: string,
  secondsHeld: number
): Promise<void> {
  await updateObjectiveProgress(db, progressId, objectiveId, secondsHeld);
}

/**
 * Get quest progress
 */
export async function getQuestProgress(
  db: Firestore,
  progressId: string
): Promise<QuestProgressData | null> {
  const docRef = doc(db, 'questProgress', progressId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data() as QuestProgressData;
}

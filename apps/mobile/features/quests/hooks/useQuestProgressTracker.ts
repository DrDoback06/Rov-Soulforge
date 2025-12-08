/**
 * Quest Progress Tracker
 *
 * Enhanced quest tracking with detailed progress, milestones, and rewards
 */

import { useState, useEffect, useCallback } from 'react';
import type { QuestObjective } from '@rov/types';

export interface QuestProgress {
  questId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  objectives: ObjectiveProgress[];
  startedAt?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  milestones: QuestMilestone[];
}

export interface ObjectiveProgress {
  id: string;
  type: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface QuestMilestone {
  id: string;
  name: string;
  description: string;
  condition: 'objectives_25' | 'objectives_50' | 'objectives_75' | 'objectives_100';
  reward: {
    xp?: number;
    gold?: number;
    item?: string;
  };
  claimed: boolean;
}

/**
 * Enhanced Quest Progress Hook
 *
 * Tracks quest progress with milestones and detailed objective tracking
 */
export function useQuestProgressTracker(questId: string) {
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestProgress();
  }, [questId]);

  const loadQuestProgress = async () => {
    setLoading(true);
    try {
      // TODO: Load from Firebase or local storage
      // Mock data for now
      const mockProgress: QuestProgress = {
        questId,
        status: 'in_progress',
        objectives: [],
        progress: 0,
        milestones: [
          {
            id: 'milestone_25',
            name: 'Getting Started',
            description: 'Complete 25% of quest objectives',
            condition: 'objectives_25',
            reward: { xp: 25, gold: 10 },
            claimed: false
          },
          {
            id: 'milestone_50',
            name: 'Halfway There',
            description: 'Complete 50% of quest objectives',
            condition: 'objectives_50',
            reward: { xp: 50, gold: 25 },
            claimed: false
          },
          {
            id: 'milestone_75',
            name: 'Almost Done',
            description: 'Complete 75% of quest objectives',
            condition: 'objectives_75',
            reward: { xp: 75, gold: 50 },
            claimed: false
          },
          {
            id: 'milestone_100',
            name: 'Quest Complete',
            description: 'Complete all objectives',
            condition: 'objectives_100',
            reward: { xp: 100, gold: 100, item: 'legendary_chest' },
            claimed: false
          }
        ]
      };
      setProgress(mockProgress);
    } catch (error) {
      console.error('Failed to load quest progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateObjectiveProgress = useCallback((objectiveId: string, current: number) => {
    if (!progress) return;

    setProgress(prev => {
      if (!prev) return null;

      const objectives = prev.objectives.map(obj => {
        if (obj.id === objectiveId) {
          const completed = current >= obj.target;
          return { ...obj, current, completed };
        }
        return obj;
      });

      const completedCount = objectives.filter(o => o.completed).length;
      const totalCount = objectives.length;
      const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      return {
        ...prev,
        objectives,
        progress: progressPercent,
        status: progressPercent === 100 ? 'completed' : 'in_progress'
      };
    });
  }, [progress]);

  const claimMilestone = useCallback((milestoneId: string) => {
    if (!progress) return;

    setProgress(prev => {
      if (!prev) return null;

      const milestones = prev.milestones.map(m => {
        if (m.id === milestoneId && !m.claimed) {
          // TODO: Grant rewards to player
          console.log('Claiming milestone rewards:', m.reward);
          return { ...m, claimed: true };
        }
        return m;
      });

      return { ...prev, milestones };
    });
  }, [progress]);

  const getAvailableMilestones = useCallback(() => {
    if (!progress) return [];

    return progress.milestones.filter(m => {
      if (m.claimed) return false;

      const requiredProgress = {
        objectives_25: 25,
        objectives_50: 50,
        objectives_75: 75,
        objectives_100: 100
      }[m.condition];

      return progress.progress >= requiredProgress;
    });
  }, [progress]);

  return {
    progress,
    loading,
    updateObjectiveProgress,
    claimMilestone,
    getAvailableMilestones
  };
}

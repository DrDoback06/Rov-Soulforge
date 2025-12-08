/**
 * Quest Battle Listener Hook
 *
 * Listens for battle completions and updates quest progress
 * Automatically marks enemies as defeated when battles are won
 */

import { useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { handleQuestBattleComplete } from '@/utils/questBattles';

interface BattleCompletionData {
  battleId: string;
  winner: string;
  loser: string;
  completedAt: Date;
  questId?: string;
  enemyId?: string;
}

/**
 * Listen for completed battles and update quest progress
 */
export function useQuestBattleListener(
  db: Firestore | null,
  userId: string | undefined,
  onBattleComplete?: (data: BattleCompletionData) => void
) {
  useEffect(() => {
    if (!db || !userId) return;

    console.log('👂 Starting quest battle listener for user:', userId);

    // Listen for battles where this user is a participant and status is 'completed'
    const battlesQuery = query(
      collection(db, 'battles'),
      where('playerIds', 'array-contains', userId),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(battlesQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added' || change.type === 'modified') {
          const battleData = change.doc.data();

          // Check if this is a quest battle (PvE)
          if (battleData.mode === 'pve' && battleData.options?.questId) {
            const victory = battleData.winner === userId;
            const enemyId = battleData.options?.enemyData?.id;

            console.log(`⚔️ Quest battle completed - Victory: ${victory}, Enemy: ${enemyId}`);

            if (enemyId) {
              try {
                // Find the quest progress and objective
                const progressRef = doc(db, 'questProgress', battleData.options.questId);
                const progressSnap = await getDoc(progressRef);

                if (progressSnap.exists()) {
                  const progressData = progressSnap.data();

                  // Find the battle objective
                  const battleObjective = progressData.objectives?.find(
                    (obj: any) => obj.type === 'battle'
                  );

                  if (battleObjective) {
                    await handleQuestBattleComplete(
                      db,
                      userId,
                      battleData.options.questId,
                      battleObjective.id,
                      enemyId,
                      victory
                    );

                    console.log('✅ Quest progress updated successfully');

                    // Call optional callback
                    if (onBattleComplete) {
                      onBattleComplete({
                        battleId: change.doc.id,
                        winner: battleData.winner,
                        loser: battleData.loser,
                        completedAt: battleData.completedAt?.toDate() || new Date(),
                        questId: battleData.options.questId,
                        enemyId
                      });
                    }
                  }
                }
              } catch (error) {
                console.error('Failed to update quest progress after battle:', error);
              }
            }
          }
        }
      }
    });

    return () => {
      console.log('🔇 Stopping quest battle listener');
      unsubscribe();
    };
  }, [db, userId]);
}

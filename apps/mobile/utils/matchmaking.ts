/**
 * PvP Matchmaking System
 *
 * Handles player queuing, skill-based matchmaking, and battle creation
 * Supports casual, ranked, and co-op modes
 */

import type { Firestore } from 'firebase/firestore';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import type {
  MatchmakingQueue,
  MatchmakingResult,
  Battle,
  BattlePlayer,
  PlayerRole
} from '@/types/battleground';
import { generateBattleSeed } from './rngEngine';

// ============================================================================
// Queue Management
// ============================================================================

/**
 * Join matchmaking queue
 */
export async function joinQueue(
  db: Firestore,
  queueData: Omit<MatchmakingQueue, 'queuedAt' | 'estimatedWaitTime'>
): Promise<{ success: boolean; queueId: string; error?: string }> {
  try {
    const queueRef = doc(collection(db, 'matchmakingQueue'), queueData.userId);

    const queueEntry: MatchmakingQueue = {
      ...queueData,
      queuedAt: Date.now(),
      estimatedWaitTime: estimateWaitTime(queueData.queueType)
    };

    await setDoc(queueRef, queueEntry);

    console.log(`🎮 ${queueData.username} joined ${queueData.queueType} queue`);

    return {
      success: true,
      queueId: queueData.userId
    };

  } catch (error) {
    console.error('Error joining queue:', error);
    return {
      success: false,
      queueId: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Leave matchmaking queue
 */
export async function leaveQueue(
  db: Firestore,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const queueRef = doc(db, 'matchmakingQueue', userId);
    await deleteDoc(queueRef);

    console.log(`🚪 User ${userId} left queue`);

    return { success: true };

  } catch (error) {
    console.error('Error leaving queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Listen for match found
 */
export function listenForMatch(
  db: Firestore,
  userId: string,
  onMatchFound: (battleId: string) => void
): () => void {
  const queueRef = doc(db, 'matchmakingQueue', userId);

  const unsubscribe = onSnapshot(queueRef, (snapshot) => {
    if (!snapshot.exists()) {
      // Queue entry deleted - match was found!
      // Check for active battle
      checkForActiveBattle(db, userId).then(battleId => {
        if (battleId) {
          onMatchFound(battleId);
        }
      });
    }
  });

  return unsubscribe;
}

async function checkForActiveBattle(
  db: Firestore,
  userId: string
): Promise<string | null> {
  const battlesRef = collection(db, 'battles');
  const q = query(
    battlesRef,
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const battle = doc.data() as Battle;
    if (battle.players.some(p => p.userId === userId)) {
      return doc.id;
    }
  }

  return null;
}

// ============================================================================
// Matchmaking Algorithm
// ============================================================================

/**
 * Find match for queued player (called by backend/cloud function)
 */
export async function findMatch(
  db: Firestore,
  queueEntry: MatchmakingQueue
): Promise<MatchmakingResult | null> {
  const { userId, queueType, elo = 1000, region, acceptCrossRegion } = queueEntry;

  // Get all queued players for this queue type
  const queueRef = collection(db, 'matchmakingQueue');
  const q = query(
    queueRef,
    where('queueType', '==', queueType)
  );

  const snapshot = await getDocs(q);
  const candidates: MatchmakingQueue[] = [];

  snapshot.forEach(doc => {
    const candidate = doc.data() as MatchmakingQueue;
    if (candidate.userId !== userId) {
      candidates.push(candidate);
    }
  });

  if (candidates.length === 0) {
    return null; // No match found
  }

  // Calculate ELO range based on wait time
  const waitTime = Date.now() - queueEntry.queuedAt;
  const eloRange = calculateEloRange(elo, waitTime);

  // Filter by ELO and region
  let validCandidates = candidates.filter(candidate => {
    const candidateElo = candidate.elo || 1000;
    const inEloRange = candidateElo >= eloRange.min && candidateElo <= eloRange.max;

    const regionMatch = region === candidate.region ||
      acceptCrossRegion ||
      candidate.acceptCrossRegion;

    return inEloRange && regionMatch;
  });

  if (validCandidates.length === 0) {
    return null;
  }

  // Sort by closest ELO
  validCandidates.sort((a, b) => {
    const diffA = Math.abs((a.elo || 1000) - elo);
    const diffB = Math.abs((b.elo || 1000) - elo);
    return diffA - diffB;
  });

  // For PvP, match with closest player
  if (queueType === 'pvp_casual' || queueType === 'pvp_ranked') {
    const opponent = validCandidates[0];

    // Create battle via Firebase callable function
    const functions = getFunctions();
    const battleId = await createPvPBattle(functions, queueEntry, opponent);

    // Remove both players from queue
    await deleteDoc(doc(db, 'matchmakingQueue', userId));
    await deleteDoc(doc(db, 'matchmakingQueue', opponent.userId));

    return {
      battleId,
      players: [
        { userId, username: queueEntry.username, role: 'attacker' },
        { userId: opponent.userId, username: opponent.username, role: 'defender' }
      ],
      eloRange: {
        min: Math.min(elo, opponent.elo || 1000),
        max: Math.max(elo, opponent.elo || 1000),
        average: (elo + (opponent.elo || 1000)) / 2
      },
      normalizedDeck: queueType === 'pvp_ranked'
    };
  }

  // For co-op raids, need 2-4 players
  if (queueType === 'coop_raid') {
    // Wait for at least 2 players (can start with 2-4)
    const raidGroup = validCandidates.slice(0, 3); // Max 4 players total (including queueEntry)

    if (raidGroup.length >= 1) {
      // Create raid battle via Firebase callable function
      const functions = getFunctions();
      const battleId = await createCoopRaidBattle(functions, [queueEntry, ...raidGroup]);

      // Remove all players from queue
      await deleteDoc(doc(db, 'matchmakingQueue', userId));
      for (const player of raidGroup) {
        await deleteDoc(doc(db, 'matchmakingQueue', player.userId));
      }

      return {
        battleId,
        players: [
          { userId, username: queueEntry.username, role: 'attacker' },
          ...raidGroup.map((p, i) => ({
            userId: p.userId,
            username: p.username,
            role: `ally_${i + 1}` as PlayerRole
          }))
        ],
        eloRange: {
          min: Math.min(elo, ...raidGroup.map(p => p.elo || 1000)),
          max: Math.max(elo, ...raidGroup.map(p => p.elo || 1000)),
          average: ([elo, ...raidGroup.map(p => p.elo || 1000)].reduce((a, b) => a + b, 0)) / (raidGroup.length + 1)
        },
        normalizedDeck: false
      };
    }
  }

  return null;
}

function calculateEloRange(elo: number, waitTimeMs: number): { min: number; max: number } {
  // Start with ±100 ELO range
  // Expand by 50 every 30 seconds
  const baseRange = 100;
  const expansion = Math.floor(waitTimeMs / 30000) * 50;
  const totalRange = baseRange + expansion;

  return {
    min: Math.max(0, elo - totalRange),
    max: Math.min(3000, elo + totalRange)
  };
}

function estimateWaitTime(queueType: string): number {
  // Rough estimates in seconds
  switch (queueType) {
    case 'pvp_casual': return 30;
    case 'pvp_ranked': return 60;
    case 'coop_raid': return 120;
    default: return 60;
  }
}

// ============================================================================
// Battle Creation (via Firebase callable functions)
// ============================================================================

async function createPvPBattle(
  functions: any, // Functions type
  player1: MatchmakingQueue,
  player2: MatchmakingQueue
): Promise<string> {
  try {
    // Use Firebase callable function to create battle
    // This ensures server-side validation and proper turn order calculation
    const { BattleClient } = await import('./battleClient');
    const battleClient = new BattleClient(functions);

    const response = await battleClient.createBattle({
      participants: [player1.userId, player2.userId],
      mode: player1.queueType === 'pvp_ranked' ? 'ranked' : 'pvp',
      ranked: player1.queueType === 'pvp_ranked'
    });

    console.log(`⚔️ Created PvP battle via server: ${response.battleId}`);
    return response.battleId;
  } catch (error: any) {
    console.error('❌ Failed to create PvP battle:', error);
    throw new Error(`Failed to create battle: ${error.message}`);
  }
}

async function createCoopRaidBattle(
  functions: any, // Functions type
  players: MatchmakingQueue[],
  bossId: string = 'raid_boss_1'
): Promise<string> {
  try {
    // Use Firebase callable function to create co-op battle
    const { BattleClient } = await import('./battleClient');
    const battleClient = new BattleClient(functions);

    const response = await battleClient.createBattle({
      participants: players.map(p => p.userId),
      mode: 'coop',
      bossId
    });

    console.log(`🐉 Created Co-op Raid battle via server: ${response.battleId}`);
    return response.battleId;
  } catch (error: any) {
    console.error('❌ Failed to create co-op battle:', error);
    throw new Error(`Failed to create raid battle: ${error.message}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function loadPlayerBattleData(
  db: Firestore,
  userId: string,
  deckId: string
): Promise<{
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  spd: number;
  lives: number;
  actionDeck: any[];
  skillDeck: any[];
  lootDeck: any[];
}> {
  // Load user character
  const characterRef = doc(db, 'users', userId, 'character', 'main');
  const characterSnap = await getDoc(characterRef);

  if (!characterSnap.exists()) {
    throw new Error(`Character not found for user ${userId}`);
  }

  const character = characterSnap.data();

  // Load deck
  const deckRef = doc(db, 'users', userId, 'decks', deckId);
  const deckSnap = await getDoc(deckRef);

  if (!deckSnap.exists()) {
    throw new Error(`Deck ${deckId} not found for user ${userId}`);
  }

  const deck = deckSnap.data();

  return {
    hp: character.counters?.hp || 100,
    maxHp: character.stats?.maxHp || 100,
    mana: character.counters?.mana || 50,
    maxMana: character.stats?.maxMana || 50,
    atk: character.stats?.atk || 10,
    def: character.stats?.def || 10,
    spd: character.stats?.spd || 10,
    lives: character.lives || 3,
    actionDeck: deck.actionCards || [],
    skillDeck: deck.skillCards || [],
    lootDeck: deck.lootCards || []
  };
}

function createBattlePlayer(
  userId: string,
  username: string,
  role: PlayerRole,
  data: Awaited<ReturnType<typeof loadPlayerBattleData>>
): BattlePlayer {
  return {
    userId,
    username,
    role,
    hp: data.hp,
    maxHp: data.maxHp,
    mana: data.mana,
    maxMana: data.maxMana,
    lives: data.lives,
    atk: data.atk,
    def: data.def,
    spd: data.spd,
    actionDeck: data.actionDeck,
    skillDeck: data.skillDeck,
    lootDeck: data.lootDeck,
    actionDiscard: [],
    skillDiscard: [],
    lootDiscard: [],
    hand: [],
    maxHandSize: 7,
    battlefield: [],
    buffs: [],
    debuffs: [],
    equipped: {},
    hasDrawn: false,
    hasPlayedCard: false,
    isConnected: true,
    lastActivityAt: Date.now()
  };
}

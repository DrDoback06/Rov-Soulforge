/**
 * Ranked System - ELO Rating and League Management
 *
 * Implements competitive ladder with tiers, divisions, and seasonal rewards
 */

import type { Firestore } from 'firebase/firestore';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import type { RankedStats, RankedTier, RankedRewards, Battle } from '@/types/battleground';

// ============================================================================
// ELO Calculation
// ============================================================================

const BASE_ELO = 1000;
const K_FACTOR = 32; // Standard chess K-factor

/**
 * Calculate ELO change after a match
 */
export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  playerWon: boolean
): {
  newElo: number;
  eloChange: number;
  expectedWinRate: number;
} {
  // Calculate expected win rate
  const expectedWinRate = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

  // Calculate actual score (1 for win, 0 for loss)
  const actualScore = playerWon ? 1 : 0;

  // Calculate ELO change
  const eloChange = Math.round(K_FACTOR * (actualScore - expectedWinRate));

  // New ELO
  const newElo = Math.max(0, playerElo + eloChange);

  return {
    newElo,
    eloChange,
    expectedWinRate
  };
}

/**
 * Calculate LP (League Points) from ELO
 */
export function calculateLP(elo: number, currentTier: RankedTier, division: number): number {
  const tierElo = getTierEloRange(currentTier);

  // LP within current division (0-100)
  const eloRange = (tierElo.max - tierElo.min) / 5; // 5 divisions per tier
  const divisionMin = tierElo.min + (5 - division) * eloRange;
  const divisionMax = divisionMin + eloRange;

  const lp = Math.floor(((elo - divisionMin) / (divisionMax - divisionMin)) * 100);

  return Math.max(0, Math.min(100, lp));
}

/**
 * Check if player ranked up or down
 */
export function checkRankChange(
  oldElo: number,
  newElo: number,
  currentTier: RankedTier,
  division: number
): {
  newTier: RankedTier;
  newDivision: number;
  rankUp: boolean;
  rankDown: boolean;
  tierChange: boolean;
} {
  const oldTierData = getTierFromElo(oldElo);
  const newTierData = getTierFromElo(newElo);

  const rankUp = newTierData.tier !== oldTierData.tier && TIER_ORDER[newTierData.tier] > TIER_ORDER[oldTierData.tier];
  const rankDown = newTierData.tier !== oldTierData.tier && TIER_ORDER[newTierData.tier] < TIER_ORDER[oldTierData.tier];
  const tierChange = newTierData.tier !== oldTierData.tier;

  return {
    newTier: newTierData.tier,
    newDivision: newTierData.division,
    rankUp,
    rankDown,
    tierChange
  };
}

// ============================================================================
// Tier System
// ============================================================================

const TIER_ORDER: Record<RankedTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
  master: 6,
  grandmaster: 7,
  challenger: 8
};

const TIER_ELO_RANGES: Record<RankedTier, { min: number; max: number }> = {
  bronze: { min: 0, max: 999 },
  silver: { min: 1000, max: 1249 },
  gold: { min: 1250, max: 1499 },
  platinum: { min: 1500, max: 1749 },
  diamond: { min: 1750, max: 1999 },
  master: { min: 2000, max: 2249 },
  grandmaster: { min: 2250, max: 2499 },
  challenger: { min: 2500, max: 5000 }
};

function getTierEloRange(tier: RankedTier): { min: number; max: number } {
  return TIER_ELO_RANGES[tier];
}

function getTierFromElo(elo: number): { tier: RankedTier; division: number } {
  for (const [tierName, range] of Object.entries(TIER_ELO_RANGES)) {
    if (elo >= range.min && elo <= range.max) {
      // Calculate division (1-5, where 1 is highest)
      const tierRange = range.max - range.min;
      const divisionSize = tierRange / 5;
      const division = 5 - Math.floor((elo - range.min) / divisionSize);

      return {
        tier: tierName as RankedTier,
        division: Math.max(1, Math.min(5, division))
      };
    }
  }

  // Default to bronze 5
  return { tier: 'bronze', division: 5 };
}

// ============================================================================
// Ranked Stats Management
// ============================================================================

/**
 * Get player's ranked stats
 */
export async function getRankedStats(
  db: Firestore,
  userId: string,
  season: string
): Promise<RankedStats> {
  const statsRef = doc(db, 'users', userId, 'ranked', season);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    return statsSnap.data() as RankedStats;
  }

  // Create initial stats
  const initialStats: RankedStats = {
    userId,
    season,
    elo: BASE_ELO,
    rank: 'bronze',
    division: 5,
    lp: 0,
    wins: 0,
    losses: 0,
    winStreak: 0,
    peakElo: BASE_ELO,
    peakRank: 'bronze',
    seasonRewardsClaimed: false
  };

  await setDoc(statsRef, initialStats);

  return initialStats;
}

/**
 * Update ranked stats after a match
 */
export async function updateRankedStats(
  db: Firestore,
  userId: string,
  season: string,
  won: boolean,
  eloChange: number
): Promise<{
  oldStats: RankedStats;
  newStats: RankedStats;
  rankChange: ReturnType<typeof checkRankChange>;
}> {
  const statsRef = doc(db, 'users', userId, 'ranked', season);
  const oldStats = await getRankedStats(db, userId, season);

  const newElo = oldStats.elo + eloChange;
  const rankChange = checkRankChange(oldStats.elo, newElo, oldStats.rank, oldStats.division);

  const newWinStreak = won ? oldStats.winStreak + 1 : 0;
  const newLp = calculateLP(newElo, rankChange.newTier, rankChange.newDivision);

  const newStats: RankedStats = {
    ...oldStats,
    elo: newElo,
    rank: rankChange.newTier,
    division: rankChange.newDivision,
    lp: newLp,
    wins: won ? oldStats.wins + 1 : oldStats.wins,
    losses: won ? oldStats.losses : oldStats.losses + 1,
    winStreak: newWinStreak,
    peakElo: Math.max(oldStats.peakElo, newElo),
    peakRank: TIER_ORDER[rankChange.newTier] > TIER_ORDER[oldStats.peakRank]
      ? rankChange.newTier
      : oldStats.peakRank
  };

  await setDoc(statsRef, newStats);

  return {
    oldStats,
    newStats,
    rankChange
  };
}

// ============================================================================
// Seasonal Rewards
// ============================================================================

/**
 * Calculate season rewards based on rank
 */
export function calculateSeasonRewards(
  tier: RankedTier,
  division: number,
  wins: number
): RankedRewards {
  const baseRewards: Record<RankedTier, RankedRewards> = {
    bronze: {
      tier: 'bronze',
      division,
      gold: 500,
      packs: 1
    },
    silver: {
      tier: 'silver',
      division,
      gold: 1000,
      packs: 2
    },
    gold: {
      tier: 'gold',
      division,
      gold: 2000,
      packs: 3,
      exclusiveCardId: 'gold_season_card'
    },
    platinum: {
      tier: 'platinum',
      division,
      gold: 3500,
      packs: 5,
      exclusiveCardId: 'platinum_season_card'
    },
    diamond: {
      tier: 'diamond',
      division,
      gold: 5000,
      packs: 8,
      exclusiveCardId: 'diamond_season_card',
      cosmeticId: 'diamond_frame'
    },
    master: {
      tier: 'master',
      division,
      gold: 7500,
      packs: 12,
      exclusiveCardId: 'master_season_card',
      cosmeticId: 'master_frame'
    },
    grandmaster: {
      tier: 'grandmaster',
      division,
      gold: 10000,
      packs: 15,
      exclusiveCardId: 'grandmaster_season_card',
      cosmeticId: 'grandmaster_frame'
    },
    challenger: {
      tier: 'challenger',
      division,
      gold: 15000,
      packs: 20,
      exclusiveCardId: 'challenger_season_card',
      cosmeticId: 'challenger_frame'
    }
  };

  const rewards = baseRewards[tier];

  // Bonus for high win count
  if (wins >= 100) {
    rewards.gold += 1000;
    rewards.packs += 2;
  } else if (wins >= 50) {
    rewards.gold += 500;
    rewards.packs += 1;
  }

  // Bonus for division 1
  if (division === 1) {
    rewards.gold = Math.floor(rewards.gold * 1.2);
    rewards.packs += 1;
  }

  return rewards;
}

/**
 * Claim season rewards
 */
export async function claimSeasonRewards(
  db: Firestore,
  userId: string,
  season: string
): Promise<{
  success: boolean;
  rewards?: RankedRewards;
  error?: string;
}> {
  try {
    const statsRef = doc(db, 'users', userId, 'ranked', season);
    const stats = await getRankedStats(db, userId, season);

    if (stats.seasonRewardsClaimed) {
      return {
        success: false,
        error: 'Rewards already claimed'
      };
    }

    const rewards = calculateSeasonRewards(stats.rank, stats.division, stats.wins);

    // Update user inventory with rewards
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      gold: increment(rewards.gold)
    });

    // Mark rewards as claimed
    await updateDoc(statsRef, {
      seasonRewardsClaimed: true
    });

    console.log(`🏆 ${userId} claimed season ${season} rewards: ${JSON.stringify(rewards)}`);

    return {
      success: true,
      rewards
    };

  } catch (error) {
    console.error('Error claiming rewards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// Leaderboards
// ============================================================================

export interface LeaderboardEntry {
  userId: string;
  username: string;
  elo: number;
  rank: RankedTier;
  division: number;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * Get top players for season leaderboard
 */
export async function getSeasonLeaderboard(
  db: Firestore,
  season: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  // This would require a Cloud Function to aggregate
  // For now, return empty array
  // In production, use Firestore composite index on elo + season

  return [];
}

// ============================================================================
// Deck Normalization (for ranked)
// ============================================================================

/**
 * Normalize deck for ranked play
 * Ensures fair competition by standardizing card levels/stats
 */
export function normalizeDeck(cards: any[]): any[] {
  return cards.map(card => ({
    ...card,
    // Normalize stats to base values
    atk: card.baseAtk || card.atk,
    def: card.baseDef || card.def,
    hp: card.baseHp || card.hp,
    manaCost: card.baseManaCost || card.manaCost,
    // Remove enhancements
    enhancements: undefined,
    upgrades: undefined
  }));
}

// ============================================================================
// Current Season
// ============================================================================

/**
 * Get current season ID
 */
export function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();

  // Seasons: Q1, Q2, Q3, Q4
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  return `S${year}_Q${quarter}`;
}

/**
 * Check if season is active
 */
export function isSeasonActive(season: string): boolean {
  return season === getCurrentSeason();
}

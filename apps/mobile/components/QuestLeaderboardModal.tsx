/**
 * Quest Leaderboard Modal
 *
 * Displays competitive leaderboard for quest completions
 * Shows top performers with rankings and rewards
 */

import { Modal, View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import type { QuestLeaderboard, LeaderboardEntry } from '@/utils/questLeaderboards';
import { formatLeaderboardScore } from '@/utils/questLeaderboards';

interface QuestLeaderboardModalProps {
  visible: boolean;
  questId: string;
  questTitle: string;
  questType: 'fitness' | 'battle' | 'other';
  currentUserId?: string;
  onClose: () => void;
  onLoadLeaderboard: (questId: string) => Promise<QuestLeaderboard>;
}

export function QuestLeaderboardModal({
  visible,
  questId,
  questTitle,
  questType,
  currentUserId,
  onClose,
  onLoadLeaderboard
}: QuestLeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<QuestLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && questId) {
      loadLeaderboard();
    }
  }, [visible, questId]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const data = await onLoadLeaderboard(questId);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const userEntry = leaderboard?.entries.find(e => e.userId === currentUserId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.trophy}>🏆</Text>
                <View>
                  <Text style={styles.title}>Leaderboard</Text>
                  <Text style={styles.questTitle} numberOfLines={1}>{questTitle}</Text>
                </View>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            {/* Stats Bar */}
            {leaderboard && (
              <View style={styles.statsBar}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Participants</Text>
                  <Text style={styles.statValue}>{leaderboard.totalParticipants}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Top 10%</Text>
                  <Text style={styles.statValue}>
                    {Math.ceil(leaderboard.totalParticipants * 0.1)}
                  </Text>
                </View>
              </View>
            )}

            {/* User's Position (if they participated) */}
            {userEntry && (
              <View style={[styles.userCard, userEntry.isTopTen && styles.userCardTopTen]}>
                <View style={styles.userCardContent}>
                  <View style={styles.userRankBadge}>
                    <Text style={styles.userRankText}>#{userEntry.rank}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>You</Text>
                    {userEntry.isTopTen && (
                      <View style={styles.topTenBadge}>
                        <Text style={styles.topTenText}>TOP 10%</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userScore}>
                    {formatLeaderboardScore(userEntry.score, questType)}
                  </Text>
                </View>
              </View>
            )}

            {/* Leaderboard List */}
            <ScrollView style={styles.leaderboardList} contentContainerStyle={styles.leaderboardContent}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fbbf24" />
                  <Text style={styles.loadingText}>Loading leaderboard...</Text>
                </View>
              ) : leaderboard && leaderboard.entries.length > 0 ? (
                leaderboard.entries.map((entry) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    questType={questType}
                    isCurrentUser={entry.userId === currentUserId}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyText}>No entries yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to complete this quest!</Text>
                </View>
              )}
            </ScrollView>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
                <Text style={styles.legendText}>Top 3</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.legendText}>Top 10%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

function LeaderboardRow({
  entry,
  questType,
  isCurrentUser
}: {
  entry: LeaderboardEntry;
  questType: 'fitness' | 'battle' | 'other';
  isCurrentUser: boolean;
}) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#fbbf24'; // Gold
    if (rank === 2) return '#c0c0c0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    if (entry.isTopTen) return '#22c55e'; // Green for top 10%
    return '#6b7280'; // Gray for others
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <View style={[styles.rankBadge, { backgroundColor: getRankColor(entry.rank!) }]}>
        <Text style={styles.rankText}>{getRankIcon(entry.rank!)}</Text>
      </View>

      <View style={styles.rowContent}>
        <Text style={[styles.rowName, isCurrentUser && styles.rowNameHighlight]} numberOfLines={1}>
          {isCurrentUser ? `${entry.username} (You)` : entry.username}
        </Text>
        <Text style={styles.rowTime}>
          {new Date(entry.completedAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={[styles.rowScore, entry.isTopTen && styles.rowScoreTopTen]}>
        {formatLeaderboardScore(entry.score, questType)}
      </Text>

      {entry.isTopTen && (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusText}>🎁</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    height: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  trophy: {
    fontSize: 32
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white'
  },
  questTitle: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a4e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  stat: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  userCard: {
    backgroundColor: '#2a2a3e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4488ff'
  },
  userCardTopTen: {
    borderColor: '#22c55e'
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  userRankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4488ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userRankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  userInfo: {
    flex: 1,
    gap: 4
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  topTenBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  topTenText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  userScore: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold'
  },
  leaderboardList: {
    flex: 1
  },
  leaderboardContent: {
    gap: 8,
    paddingBottom: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 14
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  emptyIcon: {
    fontSize: 48
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 14
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    gap: 12
  },
  rowHighlight: {
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#4488ff'
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  rowContent: {
    flex: 1
  },
  rowName: {
    color: '#e5e5e5',
    fontSize: 14,
    fontWeight: '600'
  },
  rowNameHighlight: {
    color: 'white'
  },
  rowTime: {
    color: '#8e8e93',
    fontSize: 11,
    marginTop: 2
  },
  rowScore: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'right'
  },
  rowScoreTopTen: {
    color: '#22c55e'
  },
  bonusBadge: {
    width: 24,
    height: 24
  },
  bonusText: {
    fontSize: 20
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a4e'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  legendText: {
    color: '#8e8e93',
    fontSize: 12
  }
});

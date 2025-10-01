import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

/**
 * Leaderboard Tab
 *
 * Display rankings for various categories
 */

type LeaderboardType = 'renown' | 'level' | 'gold';

interface LeaderboardEntry {
  uid: string;
  characterId: string;
  characterName: string;
  score: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [selectedType, setSelectedType] = useState<LeaderboardType>('renown');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', selectedType],
    queryFn: async () => {
      // In full implementation, call Firebase function
      return {
        entries: [
          { uid: '1', characterId: 'c1', characterName: 'Warrior', score: 1250, rank: 1 },
          { uid: '2', characterId: 'c2', characterName: 'Mage', score: 1180, rank: 2 },
          { uid: '3', characterId: 'c3', characterName: 'Rogue', score: 1090, rank: 3 },
          { uid: '4', characterId: 'c4', characterName: 'Paladin', score: 980, rank: 4 },
          { uid: '5', characterId: 'c5', characterName: 'Ranger', score: 920, rank: 5 }
        ] as LeaderboardEntry[]
      };
    }
  });

  const types: { value: LeaderboardType; label: string; icon: string }[] = [
    { value: 'renown', label: 'Renown', icon: '🏆' },
    { value: 'level', label: 'Level', icon: '⭐' },
    { value: 'gold', label: 'Gold', icon: '💰' }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Leaderboards</Text>

        {/* Type Selector */}
        <View style={styles.typesRow}>
          {types.map((type) => (
            <Pressable
              key={type.value}
              style={[
                styles.typeButton,
                selectedType === type.value && styles.typeButtonActive
              ]}
              onPress={() => setSelectedType(type.value)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === type.value && styles.typeLabelActive
                ]}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={data?.entries || []}
          keyExtractor={(item) => item.characterId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <LeaderboardRow
              entry={item}
              type={selectedType}
            />
          )}
        />
      )}
    </View>
  );
}

function LeaderboardRow({
  entry,
  type
}: {
  entry: LeaderboardEntry;
  type: LeaderboardType;
}) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700'; // Gold
    if (rank === 2) return '#c0c0c0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return '#8e8e93';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <View style={styles.row}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        {getRankIcon(entry.rank) ? (
          <Text style={styles.rankIcon}>{getRankIcon(entry.rank)}</Text>
        ) : (
          <Text style={[styles.rank, { color: getRankColor(entry.rank) }]}>
            #{entry.rank}
          </Text>
        )}
      </View>

      {/* Character */}
      <View style={styles.characterContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {entry.characterName.charAt(0)}
          </Text>
        </View>
        <Text style={styles.characterName}>{entry.characterName}</Text>
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>
          {type === 'gold' && '💰 '}
          {entry.score.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16
  },
  typesRow: {
    flexDirection: 'row',
    gap: 8
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a3e',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6
  },
  typeButtonActive: {
    backgroundColor: '#4488ff'
  },
  typeIcon: {
    fontSize: 20
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93'
  },
  typeLabelActive: {
    color: '#ffffff'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16
  },
  listContent: {
    padding: 16,
    paddingTop: 100
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  rankContainer: {
    width: 50,
    alignItems: 'center'
  },
  rankIcon: {
    fontSize: 24
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  characterContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4488ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  scoreContainer: {
    alignItems: 'flex-end'
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700'
  }
});
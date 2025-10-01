import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuests } from '@/hooks/useQuests';

/**
 * Quests Tab - View active and available quests
 */
export default function QuestsScreen() {
  const { questProgress, isLoading } = useQuests();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1e']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4488ff" />
          <Text style={styles.loadingText}>Loading quests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Quests</Text>
        <Text style={styles.subtitle}>
          {questProgress?.length || 0} Active
        </Text>
      </View>

      <FlatList
        data={questProgress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <QuestProgressCard quest={item} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>No active quests</Text>
            <Text style={styles.emptySubtext}>
              Explore the map to find adventures!
            </Text>
            <Pressable
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.exploreButtonText}>Explore Map</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

function QuestProgressCard({ quest }: { quest: any }) {
  return (
    <Pressable
      style={styles.questCard}
      onPress={() => router.push(`/quest/${quest.id}`)}
    >
      <Text style={styles.questTitle}>{quest.title}</Text>
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${quest.progress}%` }]}
        />
      </View>
      <Text style={styles.progressText}>{quest.progress}% Complete</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4
  },
  listContent: {
    padding: 16
  },
  questCard: {
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4488ff',
    borderRadius: 4
  },
  progressText: {
    fontSize: 12,
    color: '#8e8e93'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    color: '#8e8e93',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5e5e6e',
    marginBottom: 24
  },
  exploreButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Trail } from '@/types/trail';

interface QuestCompletion {
  trailId: string;
  trailName: string;
  icon: string;
  completions: number;
  bestTime?: number;
  lastCompleted?: string;
  currentStreak: number;
  bestStreak: number;
  nextReward: {
    gold: number;
    xp: number;
    percentage: number; // 100%, 75%, 60%, 50%
  };
  canRepeat: boolean;
  cooldownEndsAt?: number;
}

interface QuestCompletionHistoryProps {
  completions: QuestCompletion[];
  onRepeat: (trailId: string) => void;
}

/**
 * Quest Completion History
 * 
 * Shows in quests tab:
 * - All completed trails with icons
 * - Total completions per trail
 * - Current & best streaks
 * - "Repeat" button or countdown timer
 * - Next reward preview
 * - Milestone progress
 */
export function QuestCompletionHistory({ completions, onRepeat }: QuestCompletionHistoryProps) {
  if (completions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🏔️</Text>
        <Text style={styles.emptyText}>No completed trails yet</Text>
        <Text style={styles.emptySubtext}>Complete your first trail to start tracking progress!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📜 Completion History</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStat}>
            {completions.reduce((sum, c) => sum + c.completions, 0)} Total Completions
          </Text>
        </View>
      </View>

      {completions.map((completion) => (
        <CompletionCard
          key={completion.trailId}
          completion={completion}
          onRepeat={() => onRepeat(completion.trailId)}
        />
      ))}
    </ScrollView>
  );
}

function CompletionCard({ completion, onRepeat }: { completion: QuestCompletion; onRepeat: () => void }) {
  const [expanded, setExpanded] = React.useState(false);

  // Calculate milestone progress
  const nextMilestone = getNextMilestone(completion.completions);
  const milestoneProgress = nextMilestone 
    ? (completion.completions / nextMilestone) * 100
    : 100;

  // Cooldown check
  const now = Date.now();
  const onCooldown = completion.cooldownEndsAt ? now < completion.cooldownEndsAt : false;
  const cooldownRemaining = onCooldown && completion.cooldownEndsAt
    ? Math.ceil((completion.cooldownEndsAt - now) / 1000 / 60) // minutes
    : 0;

  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <LinearGradient
        colors={['#2a2a3e', '#1a1a2e']}
        style={styles.card}
      >
        {/* Main Info */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{completion.icon}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{completion.trailName}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardStat}>✅ {completion.completions}x</Text>
              {completion.currentStreak > 0 && (
                <Text style={styles.cardStat}>
                  🔥 {completion.currentStreak} day{completion.currentStreak > 1 ? 's' : ''}
                </Text>
              )}
              {completion.bestTime && (
                <Text style={styles.cardStat}>⏱️ {formatTime(completion.bestTime)}</Text>
              )}
            </View>
          </View>

          {/* Expand Arrow */}
          <Text style={styles.expandArrow}>{expanded ? '▼' : '▶'}</Text>
        </View>

        {/* Expanded Details */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Streaks */}
            {(completion.currentStreak > 0 || completion.bestStreak > 0) && (
              <View style={styles.streaksRow}>
                <View style={styles.streakBox}>
                  <Text style={styles.streakLabel}>Current Streak</Text>
                  <Text style={styles.streakValue}>
                    {completion.currentStreak > 0 ? `🔥 ${completion.currentStreak}` : '—'}
                  </Text>
                </View>
                <View style={styles.streakBox}>
                  <Text style={styles.streakLabel}>Best Streak</Text>
                  <Text style={styles.streakValue}>
                    {completion.bestStreak > 0 ? `⭐ ${completion.bestStreak}` : '—'}
                  </Text>
                </View>
              </View>
            )}

            {/* Next Reward */}
            <View style={styles.rewardPreview}>
              <Text style={styles.rewardPreviewTitle}>Next Completion Rewards</Text>
              <View style={styles.rewardPreviewRow}>
                <Text style={styles.rewardPreviewItem}>
                  💰 {completion.nextReward.gold} ({completion.nextReward.percentage}%)
                </Text>
                <Text style={styles.rewardPreviewItem}>
                  ⭐ {completion.nextReward.xp} ({completion.nextReward.percentage}%)
                </Text>
              </View>
            </View>

            {/* Milestone Progress */}
            {nextMilestone && (
              <View style={styles.milestoneBox}>
                <Text style={styles.milestoneTitle}>
                  🏆 Next Milestone: {nextMilestone} completions
                </Text>
                <View style={styles.milestoneBar}>
                  <View style={[styles.milestoneBarFill, { width: `${milestoneProgress}%` }]} />
                </View>
                <Text style={styles.milestoneText}>
                  {nextMilestone - completion.completions} more to go!
                </Text>
              </View>
            )}

            {/* Repeat Button */}
            <Pressable
              style={[styles.repeatButton, onCooldown && styles.repeatButtonDisabled]}
              onPress={onRepeat}
              disabled={onCooldown}
            >
              <LinearGradient
                colors={onCooldown ? ['#2a2a3e', '#1a1a2e'] : ['#4488ff', '#2266dd']}
                style={styles.repeatButtonGradient}
              >
                <Text style={styles.repeatButtonText}>
                  {onCooldown ? `⏳ ${cooldownRemaining}m cooldown` : '🔄 Repeat Quest'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function getNextMilestone(completions: number): number | null {
  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
  return milestones.find(m => m > completions) || null;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8e8e93',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5e5e6e',
    textAlign: 'center'
  },
  header: {
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16
  },
  headerStat: {
    fontSize: 14,
    color: '#8e8e93'
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  cardIcon: {
    fontSize: 40
  },
  cardInfo: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12
  },
  cardStat: {
    fontSize: 12,
    color: '#8e8e93'
  },
  expandArrow: {
    fontSize: 16,
    color: '#8e8e93'
  },
  expandedContent: {
    marginTop: 16,
    gap: 12
  },
  streaksRow: {
    flexDirection: 'row',
    gap: 12
  },
  streakBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  streakLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 4
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  rewardPreview: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd700'
  },
  rewardPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 8
  },
  rewardPreviewRow: {
    flexDirection: 'row',
    gap: 16
  },
  rewardPreviewItem: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff'
  },
  milestoneBox: {
    backgroundColor: 'rgba(68, 136, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4488ff'
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4488ff',
    marginBottom: 8
  },
  milestoneBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6
  },
  milestoneBarFill: {
    height: '100%',
    backgroundColor: '#4488ff'
  },
  milestoneText: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'center'
  },
  repeatButton: {
    width: '100%'
  },
  repeatButtonDisabled: {
    opacity: 0.5
  },
  repeatButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  repeatButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

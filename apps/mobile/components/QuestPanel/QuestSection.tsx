import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QuestCard } from './QuestCard';
import type { EnhancedQuest } from '@/types/quest-enhanced';
import { useState } from 'react';

interface QuestSectionProps {
  title: string;
  icon: string;
  quests: EnhancedQuest[];
  acceptedQuestIds?: string[];
  playerLocation?: { latitude: number; longitude: number } | null;
  getDistance: (quest: EnhancedQuest) => number;
  onQuestPress?: (quest: EnhancedQuest) => void;
  onAcceptQuest?: (quest: EnhancedQuest) => void;
  onAbandonQuest?: (quest: EnhancedQuest) => void;
  onAddToActive?: (quest: EnhancedQuest) => void;
  onNavigate?: (quest: EnhancedQuest) => void;
  onViewLocation?: (quest: EnhancedQuest) => void;
  defaultExpanded?: boolean;
}

/**
 * Quest Section Component
 * 
 * Collapsible section for Main/World/Side quests
 */
export function QuestSection({
  title,
  icon,
  quests,
  acceptedQuestIds = [],
  playerLocation,
  getDistance,
  onQuestPress,
  onAcceptQuest,
  onAbandonQuest,
  onAddToActive,
  onNavigate,
  onViewLocation,
  defaultExpanded = true
}: QuestSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (quests.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <LinearGradient
          colors={['#2a2a3e', '#1a1a2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>{icon}</Text>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{quests.length}</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
        </LinearGradient>
      </Pressable>

      {/* Quest List */}
      {expanded && (
        <View style={styles.questList}>
          {quests.map(quest => {
            const isAccepted = acceptedQuestIds.includes(quest.id);
            return (
              <QuestCard
                key={quest.id}
                quest={quest}
                distance={playerLocation ? getDistance(quest) : null}
                isAccepted={isAccepted}
                onPress={() => onQuestPress?.(quest)}
                onAccept={!isAccepted ? () => onAcceptQuest?.(quest) : undefined}
                onAbandon={isAccepted ? () => onAbandonQuest?.(quest) : undefined}
                onAddToActive={isAccepted ? () => onAddToActive?.(quest) : undefined}
                onNavigate={() => onNavigate?.(quest)}
                onViewLocation={() => onViewLocation?.(quest)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  header: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerIcon: {
    fontSize: 20
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  countBadge: {
    backgroundColor: '#4488ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center'
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  expandIcon: {
    color: '#8e8e93',
    fontSize: 14
  },
  questList: {
    gap: 8
  }
});

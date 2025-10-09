import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { QuestObjective } from '@/types/quest-enhanced';

interface QuestObjectiveHUDProps {
  questTitle: string;
  currentObjective: QuestObjective;
  totalObjectives: number;
  currentObjectiveIndex: number;
  onPress?: () => void;
}

/**
 * Quest Objective HUD
 *
 * Displays at top of screen during active quest
 * Shows current objective progress and overall quest status
 */
export function QuestObjectiveHUD({
  questTitle,
  currentObjective,
  totalObjectives,
  currentObjectiveIndex,
  onPress
}: QuestObjectiveHUDProps) {
  const progress = (currentObjective.current / currentObjective.target) * 100;
  const isCompleted = currentObjective.completed;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={isCompleted ? ['#22c55e', '#16a34a'] : ['#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Quest Title */}
          <Text style={styles.questTitle} numberOfLines={1}>
            {questTitle}
          </Text>

          {/* Objective Info */}
          <View style={styles.objectiveRow}>
            <Text style={styles.objectiveText} numberOfLines={1}>
              {getObjectiveIcon(currentObjective.type)} {currentObjective.description}
            </Text>
            <Text style={styles.progressText}>
              {currentObjective.current}/{currentObjective.target}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
          </View>

          {/* Objective Counter */}
          <View style={styles.counterRow}>
            <Text style={styles.counterText}>
              Objective {currentObjectiveIndex + 1} of {totalObjectives}
            </Text>
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function getObjectiveIcon(type: string): string {
  const icons: Record<string, string> = {
    travel: '🗺️',
    battle: '⚔️',
    collect: '🎁',
    interact: '💬',
    fitness: '🏃',
    defend: '🛡️',
    summit: '⛰️'
  };
  return icons[type] || '📍';
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  gradient: {
    padding: 12
  },
  content: {
    gap: 6
  },
  questTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9
  },
  objectiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  objectiveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.9
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import type { QuestObjective } from '@/types/quest-enhanced';

interface FitnessWODModalProps {
  visible: boolean;
  objective: QuestObjective;
  isTrackerConnected: boolean;
  onComplete: (completed: boolean, isTracked: boolean) => void;
  onDismiss: () => void;
}

/**
 * Fitness WOD (Workout of the Day) Modal
 *
 * Displays fitness challenge with timer and manual completion checkboxes
 * Supports both tracked (with fitness device) and untracked modes
 * Untracked mode gives 50% rewards
 */
export function FitnessWODModal({
  visible,
  objective,
  isTrackerConnected,
  onComplete,
  onDismiss
}: FitnessWODModalProps) {
  const [useTracker, setUseTracker] = useState(isTrackerConnected);
  const [manualProgress, setManualProgress] = useState<Record<string, boolean>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Parse WOD from objective metadata
  const fitnessType = objective.metadata?.fitnessType || 'circuit';
  const timeLimit = objective.metadata?.timeLimit; // seconds
  const exercises = parseWOD(objective.description, objective.target);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  useEffect(() => {
    // Auto-stop timer if time limit reached
    if (timeLimit && timeElapsed >= timeLimit) {
      setTimerActive(false);
    }
  }, [timeElapsed, timeLimit]);

  function parseWOD(description: string, target: number): Array<{id: string; name: string; reps: number}> {
    // Example description: "Complete 15 push-ups, 20 sit-ups, and 25 squats"
    const exercises = [];

    if (description.includes('push-up') || description.includes('pushup')) {
      exercises.push({ id: 'pushups', name: 'Push-ups', reps: 15 });
    }
    if (description.includes('sit-up') || description.includes('situp')) {
      exercises.push({ id: 'situps', name: 'Sit-ups', reps: 20 });
    }
    if (description.includes('squat')) {
      exercises.push({ id: 'squats', name: 'Squats', reps: 25 });
    }
    if (description.includes('run')) {
      const distance = objective.metadata?.distance || 500;
      exercises.push({ id: 'run', name: `Run ${distance}m`, reps: 1 });
    }
    if (description.includes('burpee')) {
      exercises.push({ id: 'burpees', name: 'Burpees', reps: 10 });
    }

    // If no specific exercises found, create generic ones
    if (exercises.length === 0) {
      exercises.push({ id: 'exercise1', name: 'Exercise 1', reps: target });
    }

    return exercises;
  }

  function handleToggleExercise(exerciseId: string) {
    setManualProgress(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  }

  function handleStartTimer() {
    setTimerActive(true);
    setTimeElapsed(0);
  }

  function handleComplete() {
    const allExercisesCompleted = exercises.every(ex => manualProgress[ex.id]);

    if (!useTracker && !allExercisesCompleted) {
      alert('Please complete all exercises!');
      return;
    }

    onComplete(true, useTracker);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.98)', 'rgba(15, 15, 30, 0.98)']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>💪 Fitness Challenge</Text>
              <Pressable style={styles.closeButton} onPress={onDismiss}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            {/* Tracker Toggle */}
            <View style={styles.trackerSection}>
              <View>
                <Text style={styles.trackerLabel}>Use Fitness Tracker</Text>
                <Text style={styles.trackerSubtext}>
                  {useTracker ? '100% rewards' : '50% rewards (manual tracking)'}
                </Text>
              </View>
              <Switch
                value={useTracker}
                onValueChange={setUseTracker}
                disabled={!isTrackerConnected}
                trackColor={{ false: '#666', true: '#22c55e' }}
                thumbColor={useTracker ? '#fff' : '#ccc'}
              />
            </View>

            {!isTrackerConnected && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ No fitness tracker connected. You can still complete this manually for 50% rewards.
                </Text>
              </View>
            )}

            {/* Timer */}
            {timeLimit && (
              <View style={styles.timerSection}>
                <Text style={styles.timerLabel}>Time Limit</Text>
                <Text style={styles.timerValue}>
                  {formatTime(timeElapsed)} / {formatTime(timeLimit)}
                </Text>
                {!timerActive && timeElapsed === 0 && (
                  <Pressable style={styles.startButton} onPress={handleStartTimer}>
                    <Text style={styles.startButtonText}>Start Timer</Text>
                  </Pressable>
                )}
                {timerActive && (
                  <View style={styles.timerProgress}>
                    <View style={[styles.timerBar, { width: `${Math.min((timeElapsed / timeLimit) * 100, 100)}%` }]} />
                  </View>
                )}
              </View>
            )}

            {/* Exercise List */}
            <ScrollView style={styles.exerciseScroll}>
              <Text style={styles.sectionTitle}>Exercises</Text>

              {exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseReps}>{exercise.reps} reps</Text>
                  </View>

                  {!useTracker && (
                    <Pressable
                      style={[
                        styles.checkbox,
                        manualProgress[exercise.id] && styles.checkboxChecked
                      ]}
                      onPress={() => handleToggleExercise(exercise.id)}
                    >
                      {manualProgress[exercise.id] && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </Pressable>
                  )}

                  {useTracker && (
                    <View style={styles.trackedBadge}>
                      <Text style={styles.trackedText}>📊 Tracked</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Leaderboard Info */}
            <View style={styles.leaderboardSection}>
              <Text style={styles.leaderboardTitle}>🏆 Top Performers</Text>
              <Text style={styles.leaderboardText}>
                Finish in the top 10% for bonus rewards!
              </Text>
            </View>

            {/* Complete Button */}
            <Pressable
              style={styles.completeButton}
              onPress={handleComplete}
            >
              <LinearGradient
                colors={['#4ade80', '#22c55e']}
                style={styles.completeButtonGradient}
              >
                <Text style={styles.completeButtonText}>Complete Workout</Text>
                {!useTracker && (
                  <Text style={styles.completeButtonSubtext}>(50% rewards)</Text>
                )}
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  modalContent: {
    padding: 20,
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
  },
  trackerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12
  },
  trackerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  trackerSubtext: {
    fontSize: 11,
    color: '#888',
    marginTop: 2
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  warningText: {
    fontSize: 11,
    color: '#f59e0b',
    textAlign: 'center'
  },
  timerSection: {
    backgroundColor: 'rgba(68, 136, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#4488ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  timerLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  timerValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4488ff',
    marginBottom: 12
  },
  startButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  timerProgress: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#4488ff'
  },
  exerciseScroll: {
    maxHeight: 300,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  exerciseInfo: {
    flex: 1
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2
  },
  exerciseReps: {
    fontSize: 12,
    color: '#888'
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#4488ff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#4488ff'
  },
  checkmark: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
  },
  trackedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  trackedText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '600'
  },
  leaderboardSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  leaderboardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 4
  },
  leaderboardText: {
    fontSize: 11,
    color: '#ccc'
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  completeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  completeButtonSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2
  }
});

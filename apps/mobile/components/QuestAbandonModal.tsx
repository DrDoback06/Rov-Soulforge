import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface QuestAbandonModalProps {
  visible: boolean;
  quest: EnhancedQuest | null;
  progress?: number; // Percentage of quest completed (0-100)
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Quest Abandon Confirmation Modal
 * 
 * Warns user about consequences of abandoning:
 * - Progress will be lost
 * - Rewards forfeited
 * - XP penalty applied
 */
export function QuestAbandonModal({
  visible,
  quest,
  progress = 0,
  onConfirm,
  onCancel
}: QuestAbandonModalProps) {
  
  if (!quest) return null;

  const xpPenalty = Math.floor((quest.rewards.xp || 0) * 0.1); // 10% XP penalty

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1e']}
            style={styles.gradient}
          >
            {/* Warning Header */}
            <View style={styles.header}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.title}>Abandon Quest?</Text>
            </View>

            {/* Quest Info */}
            <View style={styles.questInfo}>
              <Text style={styles.questIcon}>{quest.icon || '🎯'}</Text>
              <Text style={styles.questTitle}>{quest.title}</Text>
            </View>

            {/* Warning Message */}
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>⚡ You will lose:</Text>
              
              <View style={styles.consequencesList}>
                {/* Progress Loss */}
                {progress > 0 && (
                  <View style={styles.consequenceItem}>
                    <Text style={styles.consequenceIcon}>📊</Text>
                    <Text style={styles.consequenceText}>
                      All quest progress ({progress.toFixed(0)}% complete)
                    </Text>
                  </View>
                )}

                {/* Reward Loss */}
                <View style={styles.consequenceItem}>
                  <Text style={styles.consequenceIcon}>🎁</Text>
                  <View style={styles.consequenceTextContainer}>
                    <Text style={styles.consequenceText}>Quest rewards:</Text>
                    {quest.rewards.gold && (
                      <Text style={styles.rewardDetail}>• {quest.rewards.gold} gold</Text>
                    )}
                    {quest.rewards.xp && (
                      <Text style={styles.rewardDetail}>• {quest.rewards.xp} XP</Text>
                    )}
                    {quest.rewards.items && quest.rewards.items.length > 0 && (
                      <Text style={styles.rewardDetail}>
                        • {quest.rewards.items.length} item{quest.rewards.items.length > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                </View>

                {/* XP Penalty */}
                {xpPenalty > 0 && (
                  <View style={styles.consequenceItem}>
                    <Text style={styles.consequenceIcon}>⚡</Text>
                    <Text style={styles.consequenceText}>
                      {xpPenalty} XP penalty for abandoning
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.finalWarning}>
                <Text style={styles.finalWarningText}>
                  Once abandoned, this quest cannot be recovered.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <LinearGradient
                  colors={['#4488ff', '#2266dd']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Keep Quest</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
              >
                <View style={styles.dangerButton}>
                  <Text style={styles.dangerButtonText}>Abandon Quest</Text>
                </View>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20
  },
  gradient: {
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700'
  },
  questInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  questIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  questTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  warningContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  warningTitle: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16
  },
  consequencesList: {
    gap: 16,
    marginBottom: 16
  },
  consequenceItem: {
    flexDirection: 'row',
    gap: 12
  },
  consequenceIcon: {
    fontSize: 20
  },
  consequenceTextContainer: {
    flex: 1,
    gap: 4
  },
  consequenceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  rewardDetail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginLeft: 8
  },
  finalWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8
  },
  finalWarningText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18
  },
  actions: {
    gap: 12
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  cancelButton: {
    shadowColor: '#4488ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  confirmButton: {
    borderWidth: 2,
    borderColor: '#ef4444'
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  },
  dangerButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700'
  }
});
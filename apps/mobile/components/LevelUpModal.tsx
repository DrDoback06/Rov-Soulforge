import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

interface LevelUpModalProps {
  visible: boolean;
  onClose: () => void;
  levelUp: {
    oldLevel: number;
    newLevel: number;
    statIncreases: {
      atk?: number;
      def?: number;
      spd?: number;
      maxHp: number;
      maxMana: number;
    };
  };
}

/**
 * Level Up Celebration Modal
 * 
 * Displays when character levels up with:
 * - Celebration animation
 * - New level
 * - Stat increases
 * - Motivational message
 */
export function LevelUpModal({ visible, onClose, levelUp }: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (!levelUp) return null;

  const { oldLevel, newLevel, statIncreases } = levelUp;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#2a1a4e', '#1a1a2e']}
            style={styles.content}
          >
            {/* Celebration Icon */}
            <Animated.View style={[styles.iconContainer, { transform: [{ rotate: rotation }] }]}>
              <Text style={styles.celebrationIcon}>⭐</Text>
            </Animated.View>

            {/* Level Up Title */}
            <Text style={styles.title}>LEVEL UP!</Text>
            
            {/* Level Display */}
            <View style={styles.levelDisplay}>
              <Text style={styles.oldLevel}>{oldLevel}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.newLevel}>{newLevel}</Text>
            </View>

            {/* Stat Increases */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Stat Increases</Text>
              
              <View style={styles.statsList}>
                {statIncreases.atk && statIncreases.atk > 0 && (
                  <StatIncrease icon="⚔️" label="Attack" value={statIncreases.atk} />
                )}
                {statIncreases.def && statIncreases.def > 0 && (
                  <StatIncrease icon="🛡️" label="Defense" value={statIncreases.def} />
                )}
                {statIncreases.spd && statIncreases.spd > 0 && (
                  <StatIncrease icon="💨" label="Speed" value={statIncreases.spd} />
                )}
                {statIncreases.maxHp > 0 && (
                  <StatIncrease icon="❤️" label="Max HP" value={statIncreases.maxHp} />
                )}
                {statIncreases.maxMana > 0 && (
                  <StatIncrease icon="⚡" label="Max Mana" value={statIncreases.maxMana} />
                )}
              </View>

              {/* Health & Mana Restored */}
              <View style={styles.restoredBox}>
                <Text style={styles.restoredText}>✨ Health & Mana Restored!</Text>
              </View>
            </View>

            {/* Motivational Message */}
            <Text style={styles.message}>
              {getMotivationalMessage(newLevel)}
            </Text>

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <LinearGradient
                colors={['#4488ff', '#2266dd']}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Continue</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

function StatIncrease({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>+{value}</Text>
    </View>
  );
}

function getMotivationalMessage(level: number): string {
  if (level >= 50) return "You've become a legend! 🏆";
  if (level >= 25) return "Your power grows immense! 💪";
  if (level >= 10) return "You're becoming formidable! ⚡";
  if (level >= 5) return "Your skills are improving! 🌟";
  return "Keep growing stronger! 💪";
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
    maxWidth: 400
  },
  content: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#4488ff',
    alignItems: 'center'
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  celebrationIcon: {
    fontSize: 64
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24
  },
  oldLevel: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8e8e93'
  },
  arrow: {
    fontSize: 32,
    color: '#4488ff'
  },
  newLevel: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4caf50'
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center'
  },
  statsList: {
    gap: 8
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    gap: 12
  },
  statIcon: {
    fontSize: 24
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50'
  },
  restoredBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50'
  },
  restoredText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24
  },
  closeButton: {
    width: '100%'
  },
  closeButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});

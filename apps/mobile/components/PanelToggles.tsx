import { View, Pressable, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PanelTogglesProps {
  onQuestPress: () => void;
  onHeroPress: () => void;
  questPanelOpen: boolean;
  heroPanelOpen: boolean;
}

/**
 * Panel Toggle Buttons
 * 
 * Stacked buttons on right side of screen
 * - Quest Panel toggle (top)
 * - Hero Panel toggle (bottom)
 */
export function PanelToggles({
  onQuestPress,
  onHeroPress,
  questPanelOpen,
  heroPanelOpen
}: PanelTogglesProps) {
  return (
    <View style={styles.container}>
      {/* Quest Panel Button */}
      {!questPanelOpen && (
        <Pressable onPress={onQuestPress} style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#4488ff', '#2266dd']}
            style={styles.button}
          >
            <Text style={styles.icon}>📜</Text>
          </LinearGradient>
        </Pressable>
      )}

      {/* Hero Panel Button */}
      {!heroPanelOpen && (
        <Pressable onPress={onHeroPress} style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#ffd700', '#ff8c00']}
            style={styles.button}
          >
            <Text style={styles.icon}>⚔️</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -64 }],
    zIndex: 99,
    gap: 12
  },
  buttonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff'
  },
  icon: {
    fontSize: 32
  }
});


import { Pressable, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HeroPanelToggleProps {
  onPress: () => void;
}

/**
 * Hero Panel Toggle Button
 * 
 * Floating button to open the Hero Panel
 * Positioned on the right side of the screen
 */
export function HeroPanelToggle({ onPress }: HeroPanelToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
    >
      <LinearGradient
        colors={['#ffd700', '#ff8c00']}
        style={styles.button}
      >
        <Text style={styles.icon}>⚔️</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -32 }],
    zIndex: 99,
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


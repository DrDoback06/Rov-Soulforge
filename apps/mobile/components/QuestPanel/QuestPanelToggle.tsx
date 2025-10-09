import { Pressable, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface QuestPanelToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  questCount?: number;
}

/**
 * Quest Panel Toggle Button
 * 
 * Floating button to open/close quest panel
 * Shows on right edge of screen
 */
export function QuestPanelToggle({ isOpen, onToggle, questCount = 0 }: QuestPanelToggleProps) {
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isOpen ? 0 : 1),
    transform: [
      { scale: withSpring(isOpen ? 0.8 : 1) }
    ]
  }));

  if (isOpen) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable onPress={onToggle}>
        <LinearGradient
          colors={['#4488ff', '#2266dd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.icon}>🎯</Text>
          {questCount > 0 && (
            <Text style={styles.count}>{questCount}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    zIndex: 1000
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  icon: {
    fontSize: 28
  },
  count: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  }
});

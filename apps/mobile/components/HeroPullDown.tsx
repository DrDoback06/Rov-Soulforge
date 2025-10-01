import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCharacter } from '@/hooks/useCharacter';
import type { Character } from '@rov/types';

/**
 * Hero Pull-Down Component
 *
 * Displays character counters at the top of the screen:
 * - HP (Health Points)
 * - Mana
 * - XP (Experience)
 * - Renown
 *
 * Features:
 * - Collapsible to show minimal info
 * - Pull down to expand full character sheet
 * - Real-time counter updates
 */

const COLLAPSED_HEIGHT = 60;
const EXPANDED_HEIGHT = 300;

export function HeroPullDown() {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);

  const { character, loading } = useCharacter();

  // Animation values
  const translateY = useSharedValue(-COLLAPSED_HEIGHT);
  const progress = useSharedValue(0);

  // Pan gesture for pull-down
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newY = Math.max(-COLLAPSED_HEIGHT, Math.min(0, e.translationY - COLLAPSED_HEIGHT));
      translateY.value = newY;
      progress.value = Math.abs(newY) / COLLAPSED_HEIGHT;
    })
    .onEnd((e) => {
      // Snap to collapsed or expanded
      if (e.velocityY > 500 || progress.value > 0.5) {
        // Expand
        translateY.value = withSpring(EXPANDED_HEIGHT - COLLAPSED_HEIGHT);
        progress.value = withTiming(1);
        setIsExpanded(true);
      } else {
        // Collapse
        translateY.value = withSpring(-COLLAPSED_HEIGHT);
        progress.value = withTiming(0);
        setIsExpanded(false);
      }
    });

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      height: interpolate(
        progress.value,
        [0, 1],
        [COLLAPSED_HEIGHT, EXPANDED_HEIGHT]
      )
    };
  });

  const handleToggle = () => {
    if (isExpanded) {
      translateY.value = withSpring(-COLLAPSED_HEIGHT);
      progress.value = withTiming(0);
      setIsExpanded(false);
    } else {
      translateY.value = withSpring(EXPANDED_HEIGHT - COLLAPSED_HEIGHT);
      progress.value = withTiming(1);
      setIsExpanded(true);
    }
  };

  if (loading || !character) {
    return <LoadingState />;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          containerStyle,
          { paddingTop: insets.top }
        ]}
      >
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1e']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Collapsed view - Always visible */}
        <Pressable onPress={handleToggle} style={styles.collapsedView}>
          <CounterRow character={character} />
          <View style={styles.dragIndicator} />
        </Pressable>

        {/* Expanded view - Character details */}
        {isExpanded && (
          <View style={styles.expandedView}>
            <CharacterDetails character={character} />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * Counter row - HP, Mana, XP, Renown
 */
function CounterRow({ character }: { character: Character }) {
  return (
    <View style={styles.counterRow}>
      <Counter
        label="HP"
        value={character.counters.hp}
        max={character.stats.maxHp}
        color="#ff4444"
      />
      <Counter
        label="Mana"
        value={character.counters.mana}
        max={character.stats.maxMana}
        color="#4488ff"
      />
      <Counter
        label="XP"
        value={character.counters.xp}
        color="#ffd700"
      />
      <Counter
        label="Renown"
        value={character.counters.renown}
        color="#ff88ff"
      />
    </View>
  );
}

/**
 * Individual counter display
 */
function Counter({
  label,
  value,
  max,
  color
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
}) {
  const displayValue = max ? `${value}/${max}` : value.toString();
  const percentage = max ? (value / max) * 100 : 100;

  return (
    <View style={styles.counter}>
      <Text style={styles.counterLabel}>{label}</Text>
      <Text style={[styles.counterValue, { color }]}>{displayValue}</Text>
      {max && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: color,
                width: `${percentage}%`
              }
            ]}
          />
        </View>
      )}
    </View>
  );
}

/**
 * Expanded character details
 */
function CharacterDetails({ character }: { character: Character }) {
  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.characterName}>
        {character.classId || 'Hero'} - Level {character.level}
      </Text>

      <View style={styles.statsGrid}>
        <StatItem label="ATK" value={character.stats.atk} />
        <StatItem label="DEF" value={character.stats.def} />
        <StatItem label="SPD" value={character.stats.spd} />
        <StatItem label="Lives" value={character.lives} />
      </View>

      <View style={styles.goldContainer}>
        <Text style={styles.goldLabel}>Gold</Text>
        <Text style={styles.goldValue}>{character.gold}💰</Text>
      </View>

      {character.alignment && (
        <View style={styles.alignmentBadge}>
          <Text style={styles.alignmentText}>{character.alignment}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Stat item display
 */
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/**
 * Loading state
 */
function LoadingState() {
  return (
    <View style={[styles.container, { height: COLLAPSED_HEIGHT }]}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  collapsedView: {
    height: COLLAPSED_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center'
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  counter: {
    flex: 1,
    alignItems: 'center'
  },
  counterLabel: {
    fontSize: 10,
    color: '#8e8e93',
    fontWeight: '600',
    marginBottom: 2
  },
  counterValue: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#2a2a3e',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 2
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#3a3a4e',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8
  },
  expandedView: {
    flex: 1,
    padding: 16
  },
  detailsContainer: {
    gap: 16
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a2a3e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  goldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12
  },
  goldLabel: {
    fontSize: 16,
    color: '#8e8e93'
  },
  goldValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  alignmentBadge: {
    alignSelf: 'center',
    backgroundColor: '#4a4a5e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16
  },
  alignmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  loadingText: {
    color: '#8e8e93',
    textAlign: 'center',
    fontSize: 14
  }
});
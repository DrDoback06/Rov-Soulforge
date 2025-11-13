/**
 * Battlefield Component
 *
 * Displays persistent effects (auras, curses, summons) active on the battlefield
 * Shows duration remaining and effect descriptions
 * Supports player-specific and global battlefield effects
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { PersistentEffect } from '@/types/battleground';
import { lightImpact } from '@/utils/haptics';

interface BattlefieldProps {
  // Player effects
  playerEffects: PersistentEffect[];
  opponentEffects?: PersistentEffect[];

  // Global effects (affect all players)
  globalEffects?: PersistentEffect[];

  // Callbacks
  onEffectPress?: (effect: PersistentEffect) => void;

  // Compact mode for limited space
  compact?: boolean;
}

export function Battlefield({
  playerEffects,
  opponentEffects = [],
  globalEffects = [],
  onEffectPress,
  compact = false
}: BattlefieldProps) {
  const hasAnyEffects =
    playerEffects.length > 0 ||
    opponentEffects.length > 0 ||
    globalEffects.length > 0;

  if (!hasAnyEffects) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Global Effects (top) */}
      {globalEffects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🌍 Global Effects</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.effectsRow}
          >
            {globalEffects.map((effect) => (
              <EffectCard
                key={effect.id}
                effect={effect}
                onPress={onEffectPress}
                compact={compact}
                variant="global"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Player Effects */}
      {playerEffects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🛡️ Your Effects</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.effectsRow}
          >
            {playerEffects.map((effect) => (
              <EffectCard
                key={effect.id}
                effect={effect}
                onPress={onEffectPress}
                compact={compact}
                variant="player"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Opponent Effects */}
      {opponentEffects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>⚔️ Opponent Effects</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.effectsRow}
          >
            {opponentEffects.map((effect) => (
              <EffectCard
                key={effect.id}
                effect={effect}
                onPress={onEffectPress}
                compact={compact}
                variant="opponent"
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

interface EffectCardProps {
  effect: PersistentEffect;
  onPress?: (effect: PersistentEffect) => void;
  compact?: boolean;
  variant: 'player' | 'opponent' | 'global';
}

function EffectCard({ effect, onPress, compact = false, variant }: EffectCardProps) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Pulse animation for expiring effects
    if (effect.turnsRemaining !== undefined && effect.turnsRemaining <= 2) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [effect.turnsRemaining]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const handlePress = () => {
    if (onPress) {
      lightImpact();
      onPress(effect);
    }
  };

  const config = getEffectConfig(effect.type, variant);
  const isPermanent = effect.turnsRemaining === undefined;
  const isExpiring = effect.turnsRemaining !== undefined && effect.turnsRemaining <= 2;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        disabled={!onPress}
        style={compact ? styles.effectCardCompact : styles.effectCard}
      >
        <LinearGradient colors={config.gradientColors} style={styles.effectGradient}>
          {/* Icon & Name */}
          <View style={styles.effectHeader}>
            <Text style={styles.effectIcon}>{config.icon}</Text>
            {!compact && (
              <Text style={styles.effectName} numberOfLines={1}>
                {effect.cardName}
              </Text>
            )}
          </View>

          {/* Duration */}
          {!isPermanent && (
            <View style={[styles.durationBadge, isExpiring && styles.durationBadgeExpiring]}>
              <Text style={[styles.durationText, isExpiring && styles.durationTextExpiring]}>
                {effect.turnsRemaining === 1
                  ? '1 turn'
                  : `${effect.turnsRemaining} turns`}
              </Text>
            </View>
          )}

          {/* Permanent indicator */}
          {isPermanent && (
            <View style={styles.permanentBadge}>
              <Text style={styles.permanentText}>∞</Text>
            </View>
          )}

          {/* Trigger indicator (if applicable) */}
          {effect.trigger && !compact && (
            <View style={styles.triggerBadge}>
              <Text style={styles.triggerText}>{getTriggerIcon(effect.trigger)}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function getEffectConfig(
  type: 'aura' | 'curse' | 'summon',
  variant: 'player' | 'opponent' | 'global'
) {
  const configs = {
    aura: {
      player: {
        icon: '✨',
        gradientColors: ['#4c6ef5', '#364fc7']
      },
      opponent: {
        icon: '💫',
        gradientColors: ['#4c6ef5', '#364fc7']
      },
      global: {
        icon: '🌟',
        gradientColors: ['#845ef7', '#5f3dc4']
      }
    },
    curse: {
      player: {
        icon: '🔮',
        gradientColors: ['#f03e3e', '#c92a2a']
      },
      opponent: {
        icon: '💀',
        gradientColors: ['#f03e3e', '#c92a2a']
      },
      global: {
        icon: '☠️',
        gradientColors: ['#e64980', '#a61e4d']
      }
    },
    summon: {
      player: {
        icon: '🐉',
        gradientColors: ['#37b24d', '#2b8a3e']
      },
      opponent: {
        icon: '👹',
        gradientColors: ['#37b24d', '#2b8a3e']
      },
      global: {
        icon: '🌀',
        gradientColors: ['#20c997', '#087f5b']
      }
    }
  };

  return configs[type][variant];
}

function getTriggerIcon(trigger: string): string {
  const icons: Record<string, string> = {
    on_turn_start: '▶️',
    on_turn_end: '⏸️',
    on_damage_taken: '🩹',
    on_damage_dealt: '⚔️'
  };
  return icons[trigger] || '📍';
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 8
  },
  section: {
    gap: 6
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93',
    paddingHorizontal: 12
  },
  effectsRow: {
    paddingHorizontal: 12,
    gap: 8
  },
  effectCard: {
    width: 100,
    height: 120
  },
  effectCardCompact: {
    width: 60,
    height: 80
  },
  effectGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative'
  },
  effectHeader: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center'
  },
  effectIcon: {
    fontSize: 32
  },
  effectName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center'
  },
  durationBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  durationBadgeExpiring: {
    backgroundColor: 'rgba(255, 68, 68, 0.6)',
    borderColor: '#ff4444'
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff'
  },
  durationTextExpiring: {
    color: '#ffffff'
  },
  permanentBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)'
  },
  permanentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  triggerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  triggerText: {
    fontSize: 10
  }
});

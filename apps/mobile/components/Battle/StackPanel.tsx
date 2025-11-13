/**
 * Stack Panel Component
 *
 * Displays the battle stack (LIFO resolution order)
 * Shows cards that have been played and are waiting to resolve
 * Features slide-in animations when cards are added
 * Allows players to respond with counter cards
 */

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
  Layout
} from 'react-native-reanimated';
import type { StackEntry } from '@/types/battleground';
import { lightImpact } from '@/utils/haptics';

interface StackPanelProps {
  stack: StackEntry[];
  canRespond?: boolean;
  onRespondToStack?: (stackEntryId: string) => void;
  onViewCard?: (stackEntry: StackEntry) => void;
  compact?: boolean;
}

export function StackPanel({
  stack,
  canRespond = false,
  onRespondToStack,
  onViewCard,
  compact = false
}: StackPanelProps) {
  const isEmpty = stack.length === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>📚 The Stack</Text>
          <Text style={styles.subtitle}>(LIFO)</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.count}>{stack.length}</Text>
        </View>
      </View>

      {/* Stack entries */}
      <View style={styles.stackContainer}>
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>∅</Text>
            <Text style={styles.emptyText}>Stack is empty</Text>
            <Text style={styles.emptySubtext}>Play a card to add it to the stack</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Render stack in reverse order (top to bottom = last to first) */}
            {[...stack].reverse().map((entry, index) => {
              const isTop = index === 0;
              const resolveOrder = stack.length - index;

              return (
                <Animated.View
                  key={entry.id}
                  entering={SlideInRight.duration(300).delay(index * 50)}
                  exiting={SlideOutLeft.duration(200)}
                  layout={Layout.springify()}
                >
                  <StackEntryCard
                    entry={entry}
                    resolveOrder={resolveOrder}
                    isTop={isTop}
                    canRespond={canRespond && isTop}
                    onRespond={onRespondToStack}
                    onView={onViewCard}
                    compact={compact}
                  />
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Help text */}
      {!isEmpty && !compact && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Top card resolves first{canRespond ? ' • Tap to respond' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

interface StackEntryCardProps {
  entry: StackEntry;
  resolveOrder: number;
  isTop: boolean;
  canRespond: boolean;
  onRespond?: (stackEntryId: string) => void;
  onView?: (stackEntry: StackEntry) => void;
  compact?: boolean;
}

function StackEntryCard({
  entry,
  resolveOrder,
  isTop,
  canRespond,
  onRespond,
  onView,
  compact = false
}: StackEntryCardProps) {
  const handlePress = () => {
    lightImpact();
    if (onView) {
      onView(entry);
    }
  };

  const handleRespond = () => {
    if (onRespond && canRespond) {
      lightImpact();
      onRespond(entry.id);
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.entryCard}>
      <LinearGradient
        colors={
          isTop
            ? ['#4c6ef5', '#364fc7']
            : ['#3a3a4e', '#2a2a3e']
        }
        style={styles.entryGradient}
      >
        {/* Order badge */}
        <View style={[styles.orderBadge, isTop && styles.orderBadgeTop]}>
          <Text style={styles.orderText}>#{resolveOrder}</Text>
        </View>

        {/* Card info */}
        <View style={styles.entryContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎴</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>
                {entry.cardName}
              </Text>
              {!compact && (
                <Text style={styles.playerName} numberOfLines={1}>
                  by {entry.playerId}
                </Text>
              )}
            </View>
          </View>

          {/* Effect preview */}
          {!compact && entry.effect && (
            <View style={styles.effectPreview}>
              <Text style={styles.effectIcon}>{getEffectIcon(entry.effect.type)}</Text>
              <Text style={styles.effectText} numberOfLines={2}>
                {entry.effect.description || entry.effect.type}
              </Text>
            </View>
          )}

          {/* Targets */}
          {!compact && entry.targets.length > 0 && (
            <View style={styles.targetsRow}>
              <Text style={styles.targetsLabel}>→</Text>
              <Text style={styles.targetsText} numberOfLines={1}>
                {entry.targets.map((t) => t.type).join(', ')}
              </Text>
            </View>
          )}

          {/* Counter indicator */}
          {entry.canCounter && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>Can be countered</Text>
            </View>
          )}
        </View>

        {/* Respond button */}
        {canRespond && onRespond && entry.canCounter && (
          <Pressable style={styles.respondButton} onPress={handleRespond}>
            <Text style={styles.respondButtonText}>🚫 Counter</Text>
          </Pressable>
        )}

        {/* Top indicator */}
        {isTop && (
          <View style={styles.topIndicator}>
            <Text style={styles.topIndicatorText}>RESOLVES NEXT</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function getEffectIcon(effectType: string): string {
  const icons: Record<string, string> = {
    damage: '⚔️',
    heal: '💚',
    draw: '🃏',
    discard: '🗑️',
    buff: '⬆️',
    debuff: '⬇️',
    destroy: '💥',
    summon: '🐉',
    transform: '🔄',
    counter: '🚫'
  };
  return icons[effectType] || '✨';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a4e'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic'
  },
  headerRight: {
    backgroundColor: '#4c6ef5',
    borderRadius: 12,
    minWidth: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  count: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  stackContainer: {
    minHeight: 200,
    maxHeight: 400
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8
  },
  emptyIcon: {
    fontSize: 48,
    color: '#3a3a4e'
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8e93'
  },
  emptySubtext: {
    fontSize: 12,
    color: '#5e5e6e',
    textAlign: 'center'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 12,
    gap: 8
  },
  entryCard: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  entryGradient: {
    padding: 12,
    position: 'relative'
  },
  orderBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  orderBadgeTop: {
    backgroundColor: '#ffd700',
    borderColor: '#ffd700'
  },
  orderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  entryContent: {
    gap: 8
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardIcon: {
    fontSize: 32
  },
  cardInfo: {
    flex: 1,
    gap: 2
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  playerName: {
    fontSize: 12,
    color: '#8e8e93'
  },
  effectPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    padding: 8
  },
  effectIcon: {
    fontSize: 16
  },
  effectText: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18
  },
  targetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  targetsLabel: {
    fontSize: 14,
    color: '#8e8e93'
  },
  targetsText: {
    flex: 1,
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic'
  },
  counterBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)'
  },
  counterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffd700',
    textAlign: 'center'
  },
  respondButton: {
    backgroundColor: '#f03e3e',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    alignItems: 'center'
  },
  respondButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  topIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingVertical: 4
  },
  topIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    letterSpacing: 1
  },
  helpContainer: {
    padding: 12,
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
    borderTopWidth: 1,
    borderTopColor: '#3a3a4e'
  },
  helpText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center'
  }
});

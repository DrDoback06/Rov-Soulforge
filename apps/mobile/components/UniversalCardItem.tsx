import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DraggableItem } from '@/components/DraggableItem';
import { useDragDropContext } from '@/contexts/DragDropContext';
import type { Rarity } from '@rov/types';

/**
 * Universal Card Item Component
 *
 * A reusable card component that can be used in:
 * - Inventory tab
 * - Stash tab
 * - Shop tab
 * - Any other location that needs card display
 *
 * Features:
 * - Hover preview support
 * - Drag and drop functionality
 * - Rarity-based colors
 * - Stack count display
 * - Mobile-friendly (tap to lock hover, long press to drag)
 */

interface UniversalCardItemProps {
  card: any;
  count: number;
  sourceZone: string; // e.g., 'inventory', 'stash-equipment', 'shop'
  onHover?: (card: any | null) => void;
  onDragStart?: () => void;
  onDragEnd?: (itemId: string, itemData: any, position: { x: number; y: number }) => void;
  showUsabilityIndicator?: boolean; // Show red dot for unusable cards
}

export function UniversalCardItem({
  card,
  count,
  sourceZone,
  onHover,
  onDragStart,
  onDragEnd,
  showUsabilityIndicator = true
}: UniversalCardItemProps) {
  const { dragState, startDrag, endDrag } = useDragDropContext();
  const [isHoverLocked, setIsHoverLocked] = useState(false);

  const handleDragStart = () => {
    console.log(`🎯 [${sourceZone}] Starting drag for card:`, card.name);
    setIsHoverLocked(false); // Unlock hover during drag
    onHover?.(null); // Hide tooltip during drag

    // Use custom onDragStart if provided, otherwise use context
    if (onDragStart) {
      onDragStart();
    }
    startDrag(card.id, { ...card, count }, sourceZone);
  };

  const handleDragEnd = (itemId: string, itemData: any, position: { x: number; y: number }) => {
    console.log(`🎯 [${sourceZone}] Drag ended for card:`, card.name, 'at position:', position);

    // Check if dropped in a valid zone
    const targetZone = detectDropZoneAtPosition(position);

    if (targetZone) {
      console.log('✅ Dropped in zone:', targetZone);
      endDrag(targetZone);
    } else {
      console.log(`❌ Dropped outside any zone - returning to ${sourceZone}`);
      endDrag(null);
    }

    // Call custom onDragEnd if provided
    if (onDragEnd) {
      onDragEnd(itemId, itemData, position);
    }
  };

  const handlePress = () => {
    // Mobile: Tap to lock/unlock hover
    if (isHoverLocked) {
      setIsHoverLocked(false);
      onHover?.(null);
    } else {
      setIsHoverLocked(true);
      onHover?.(card);
    }
  };

  const handleMouseEnter = () => {
    // Desktop: Hover to show (only if not dragging and not locked)
    if (!dragState.isDragging && !isHoverLocked) {
      onHover?.(card);
    }
  };

  const handleMouseLeave = () => {
    // Desktop: Leave to hide (only if not locked)
    if (!isHoverLocked) {
      onHover?.(null);
    }
  };

  return (
    <DraggableItem
      itemId={card.id}
      itemData={{ ...card, count }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Pressable
        style={[styles.cardIcon, isHoverLocked && styles.cardIconLocked]}
        onPress={handlePress}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <LinearGradient
          colors={[getRarityColor(card.rarity) + '40', getRarityColor(card.rarity) + '10']}
          style={styles.cardIconGradient}
        >
          {/* Card Icon/Image */}
          <Text style={styles.cardIconImage}>{card.image || '🃏'}</Text>

          {/* Stack Count */}
          {count > 1 && (
            <View style={styles.stackBadge}>
              <Text style={styles.stackCount}>×{count}</Text>
            </View>
          )}

          {/* Rarity Border */}
          <View style={[styles.cardIconBorder, { borderColor: getRarityColor(card.rarity) }]} />

          {/* Unusable indicator */}
          {showUsabilityIndicator && !isCardUsableInApp(card) && (
            <View style={styles.unusableDot} />
          )}

          {/* Locked indicator */}
          {isHoverLocked && (
            <View style={styles.lockedIndicator}>
              <Text style={styles.lockedIcon}>📌</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </DraggableItem>
  );
}

/**
 * Helper: Get rarity color based on card rarity
 */
export function getRarityColor(rarity: Rarity | string): string {
  const colors: Record<string, string> = {
    Common: '#ffffff',
    common: '#8e8e93',
    Uncommon: '#00ff00',
    uncommon: '#4488ff',
    Rare: '#0088ff',
    rare: '#9944ff',
    Epic: '#ff00ff',
    epic: '#ff44ff',
    Legendary: '#ffd700',
    legendary: '#ff8800',
    Mythic: '#ff6b00',
    mythic: '#ff6b00'
  };
  return colors[rarity] || '#ffffff';
}

/**
 * Helper: Check if card is usable in app version
 * Cards marked as "physical-only" can only be used in real card game
 */
export function isCardUsableInApp(card: any): boolean {
  // Cards with type "Boss" or "Class" might be physical-only
  // You can add a "appUsable: false" flag to cards in the future
  return !card.physicalOnly && card.type !== 'Boss'; // Example logic
}

/**
 * Helper: Detect which drop zone contains the given position
 */
export function detectDropZoneAtPosition(position: { x: number; y: number }): string | null {
  if (typeof window === 'undefined') return null;

  const dropZones = (window as any).__dropZones || {};

  for (const [zoneId, bounds] of Object.entries(dropZones)) {
    const { x, y, width, height } = bounds as any;

    // Check if position is within bounds
    if (
      position.x >= x &&
      position.x <= x + width &&
      position.y >= y &&
      position.y <= y + height
    ) {
      return zoneId;
    }
  }

  return null;
}

const styles = StyleSheet.create({
  // Card Icon (Small, Diablo II style)
  cardIcon: {
    width: 56,
    height: 80,
    position: 'relative'
  },
  cardIconGradient: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4
  },
  cardIconImage: {
    fontSize: 32
  },
  cardIconBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 8,
    pointerEvents: 'none'
  },
  stackBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffd700'
  },
  stackCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  unusableDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444'
  },
  cardIconLocked: {
    transform: [{ scale: 1.05 }],
    elevation: 5,
    shadowColor: '#4488ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8
  },
  lockedIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#4488ff',
    borderRadius: 8,
    padding: 2
  },
  lockedIcon: {
    fontSize: 10
  }
});

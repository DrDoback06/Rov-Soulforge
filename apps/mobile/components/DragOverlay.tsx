import { View, Text, StyleSheet } from 'react-native';
import { useDragDropContext } from '@/contexts/DragDropContext';

/**
 * Drag Overlay Component
 * 
 * Renders a floating preview of the item being dragged.
 * Follows the cursor/touch position with z-index 9999999 to stay above everything.
 */

export function DragOverlay() {
  const { dragState } = useDragDropContext();

  if (!dragState.isDragging || !dragState.itemData) {
    return null;
  }

  const { itemData, currentX, currentY } = dragState;

  return (
    <View
      style={[
        styles.overlay,
        {
          left: currentX,
          top: currentY
        }
      ]}
      pointerEvents="none"
    >
      <View style={styles.card}>
        {/* Card icon */}
        {itemData.icon && (
          <Text style={styles.icon}>{itemData.icon}</Text>
        )}
        
        {/* Card name */}
        <Text style={styles.name} numberOfLines={1}>
          {itemData.name || itemData.id}
        </Text>
        
        {/* Rarity indicator */}
        {itemData.rarity && (
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(itemData.rarity) }]}>
            <Text style={styles.rarityText}>{itemData.rarity}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: '#9E9E9E',
    Uncommon: '#4CAF50',
    Rare: '#2196F3',
    Epic: '#9C27B0',
    Legendary: '#FF9800'
  };
  return colors[rarity] || '#9E9E9E';
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    zIndex: 9999999,
    pointerEvents: 'none'
  },
  card: {
    width: 80,
    height: 110,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4488ff',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10
  },
  icon: {
    fontSize: 32,
    marginBottom: 4
  },
  name: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center'
  },
  rarityBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  rarityText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold'
  }
});


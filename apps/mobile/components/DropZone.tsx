import { ReactNode, useEffect, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useDragDropContext } from '@/contexts/DragDropContext';

/**
 * Drop Zone Component
 * 
 * Defines an area that can accept dragged items.
 * Shows visual feedback when a compatible item is being dragged over it.
 */

interface DropZoneProps {
  zoneId: string;
  onItemDrop: (itemId: string, itemData: any) => void;
  children?: ReactNode;
  acceptedTypes?: string[];
  style?: any;
}

export function DropZone({ zoneId, onItemDrop, children, acceptedTypes, style }: DropZoneProps) {
  const { registerDropZone, unregisterDropZone, dragState } = useDragDropContext();
  const viewRef = useRef<View>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    // Get absolute position using measureInWindow
    viewRef.current?.measureInWindow((x, y, width, height) => {
      registerDropZone(zoneId, {
        x,
        y,
        width,
        height,
        onDrop: onItemDrop,
        acceptedTypes
      });
    });
  };

  useEffect(() => {
    return () => {
      unregisterDropZone(zoneId);
    };
  }, [zoneId, unregisterDropZone]);

  // Check if the currently dragged item is compatible
  const isCompatible = () => {
    if (!dragState.isDragging || !dragState.itemData) return true;
    if (!acceptedTypes || acceptedTypes.length === 0) return true;
    
    const itemType = dragState.itemData.type || dragState.itemData.category;
    return acceptedTypes.includes(itemType);
  };

  const compatible = isCompatible();
  const showFeedback = dragState.isDragging;

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      style={[
        styles.container,
        style,
        showFeedback && compatible && styles.compatibleHighlight,
        showFeedback && !compatible && styles.incompatibleHighlight
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative'
  },
  compatibleHighlight: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  incompatibleHighlight: {
    borderColor: '#F44336',
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'rgba(244, 67, 54, 0.1)'
  }
});


import { ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { useDragDropContext } from '@/contexts/DragDropContext';

/**
 * Draggable Item Component
 * 
 * Makes any child component draggable.
 * On drag, notifies the DragDropContext and shows visual feedback.
 */

interface DraggableItemProps {
  itemId: string;
  itemData: any;
  children: ReactNode;
  sourceId?: string;
}

export function DraggableItem({ itemId, itemData, children, sourceId }: DraggableItemProps) {
  const { startDrag, updateDragPosition, endDrag, findDropZoneAt } = useDragDropContext();
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const handleDragStart = () => {
    isDragging.value = true;
    startDrag(itemId, itemData, sourceId);
  };

  const handleDragUpdate = (x: number, y: number, absoluteX: number, absoluteY: number) => {
    updateDragPosition(absoluteX, absoluteY);
  };

  const handleDragEnd = (absoluteX: number, absoluteY: number) => {
    // Find if dropped on a zone
    const targetZone = findDropZoneAt(absoluteX, absoluteY);
    
    if (targetZone) {
      console.log('✅ Dropped on zone:', targetZone);
      // Get the drop zone handler from window
      if (typeof window !== 'undefined') {
        const dropZones = (window as any).__dropZones || {};
        const zone = dropZones[targetZone];
        if (zone?.onDrop) {
          zone.onDrop(itemId, itemData);
        }
      }
    } else {
      console.log('❌ Dropped outside zones');
    }

    // Reset position
    isDragging.value = false;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    endDrag();
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(handleDragStart)();
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      
      // Calculate absolute position
      const absoluteX = e.absoluteX;
      const absoluteY = e.absoluteY;
      
      runOnJS(handleDragUpdate)(e.translationX, e.translationY, absoluteX, absoluteY);
    })
    .onEnd((e) => {
      const absoluteX = e.absoluteX;
      const absoluteY = e.absoluteY;
      
      runOnJS(handleDragEnd)(absoluteX, absoluteY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    opacity: isDragging.value ? 0.2 : 1,
    zIndex: isDragging.value ? 9999 : 1
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    // Base styles
  }
});


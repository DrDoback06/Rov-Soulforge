import { useState, useCallback } from 'react';

interface DragState {
  isDragging: boolean;
  itemId: string | null;
  itemData: any | null;
  activeZone: string | null;
}

/**
 * Drag & Drop Hook
 *
 * Manages global drag-and-drop state across the app.
 * Detects collision between dragged items and drop zones.
 */
export function useDragDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    itemId: null,
    itemData: null,
    activeZone: null,
  });

  const handleDragStart = useCallback((itemId: string, itemData: any) => {
    console.log('🎯 Drag started:', itemId);
    setDragState({
      isDragging: true,
      itemId,
      itemData,
      activeZone: null,
    });
  }, []);

  const handleDragEnd = useCallback((
    itemId: string,
    itemData: any,
    position: { x: number; y: number }
  ) => {
    console.log('🎯 Drag ended:', itemId, 'at position:', position);

    // Check collision with drop zones
    const dropZone = detectDropZone(position);

    if (dropZone) {
      console.log('✅ Dropped in zone:', dropZone);
    } else {
      console.log('❌ Dropped outside any zone');
    }

    setDragState({
      isDragging: false,
      itemId: null,
      itemData: null,
      activeZone: dropZone,
    });

    return dropZone;
  }, []);

  const handleDragMove = useCallback((position: { x: number; y: number }) => {
    if (!dragState.isDragging) return;

    const dropZone = detectDropZone(position);

    if (dropZone !== dragState.activeZone) {
      setDragState(prev => ({
        ...prev,
        activeZone: dropZone,
      }));
    }
  }, [dragState.isDragging, dragState.activeZone]);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
  };
}

/**
 * Detect which drop zone (if any) contains the given position
 */
function detectDropZone(position: { x: number; y: number }): string | null {
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

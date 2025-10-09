import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * Drag and Drop Context
 * 
 * Global state management for drag-and-drop operations across the app.
 * Tracks what's being dragged, where it is, and manages drop zones.
 * 
 * NEW: Supports "hover zones" that trigger callbacks after hovering during drag
 */

interface DragState {
  isDragging: boolean;
  itemId: string | null;
  itemData: any;
  currentX: number;
  currentY: number;
  sourceId?: string;
}

interface DropZoneRegistration {
  x: number;
  y: number;
  width: number;
  height: number;
  onDrop?: (itemId: string, itemData: any) => void;
  acceptedTypes?: string[];
}

interface HoverZoneRegistration {
  x: number;
  y: number;
  width: number;
  height: number;
  onHover: () => void;
  hoverDelay?: number; // milliseconds to wait before triggering
}

interface DragDropContextValue {
  dragState: DragState;
  startDrag: (itemId: string, itemData: any, sourceId?: string) => void;
  updateDragPosition: (x: number, y: number) => void;
  endDrag: () => void;
  registerDropZone: (zoneId: string, zone: DropZoneRegistration) => void;
  unregisterDropZone: (zoneId: string) => void;
  findDropZoneAt: (x: number, y: number) => string | null;
  registerHoverZone: (zoneId: string, zone: HoverZoneRegistration) => void;
  unregisterHoverZone: (zoneId: string) => void;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    itemId: null,
    itemData: null,
    currentX: 0,
    currentY: 0
  });

  // Store drop zones globally
  // We use window to make it accessible across components
  const dropZones = typeof window !== 'undefined' 
    ? ((window as any).__dropZones = (window as any).__dropZones || {})
    : {};

  const hoverZones = typeof window !== 'undefined'
    ? ((window as any).__hoverZones = (window as any).__hoverZones || {})
    : {};

  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const currentHoverZone = useRef<string | null>(null);

  const startDrag = useCallback((itemId: string, itemData: any, sourceId?: string) => {
    console.log('🎯 Starting drag:', itemId, itemData);
    setDragState({
      isDragging: true,
      itemId,
      itemData,
      currentX: 0,
      currentY: 0,
      sourceId
    });
  }, []);

  const updateDragPosition = useCallback((x: number, y: number) => {
    setDragState(prev => ({
      ...prev,
      currentX: x,
      currentY: y
    }));

    // Check for hover zones
    let hoveredZone: string | null = null;
    for (const [zoneId, zone] of Object.entries(hoverZones)) {
      const z = zone as HoverZoneRegistration;
      if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
        hoveredZone = zoneId;
        break;
      }
    }

    // If we entered a new hover zone
    if (hoveredZone && hoveredZone !== currentHoverZone.current) {
      // Clear any existing timer
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }

      currentHoverZone.current = hoveredZone;
      const zone = hoverZones[hoveredZone] as HoverZoneRegistration;
      const delay = zone.hoverDelay || 1000; // Default 1 second

      // Start new timer
      hoverTimer.current = setTimeout(() => {
        console.log('🎯 Hover zone triggered:', hoveredZone);
        zone.onHover();
        hoverTimer.current = null;
      }, delay);
    } 
    // If we left all hover zones
    else if (!hoveredZone && currentHoverZone.current) {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      currentHoverZone.current = null;
    }
  }, [hoverZones]);

  const endDrag = useCallback(() => {
    console.log('🎯 Ending drag');
    // Clear hover timer
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    currentHoverZone.current = null;

    setDragState({
      isDragging: false,
      itemId: null,
      itemData: null,
      currentX: 0,
      currentY: 0
    });
  }, []);

  const registerDropZone = useCallback((zoneId: string, zone: DropZoneRegistration) => {
    dropZones[zoneId] = zone;
    console.log('📍 Registered drop zone:', zoneId, zone);
  }, [dropZones]);

  const unregisterDropZone = useCallback((zoneId: string) => {
    delete dropZones[zoneId];
    console.log('📍 Unregistered drop zone:', zoneId);
  }, [dropZones]);

  const findDropZoneAt = useCallback((x: number, y: number): string | null => {
    for (const [zoneId, zone] of Object.entries(dropZones)) {
      const z = zone as DropZoneRegistration;
      if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
        console.log('📍 Found drop zone:', zoneId);
        return zoneId;
      }
    }
    return null;
  }, [dropZones]);

  const registerHoverZone = useCallback((zoneId: string, zone: HoverZoneRegistration) => {
    hoverZones[zoneId] = zone;
    console.log('👆 Registered hover zone:', zoneId, zone);
  }, [hoverZones]);

  const unregisterHoverZone = useCallback((zoneId: string) => {
    delete hoverZones[zoneId];
    console.log('👆 Unregistered hover zone:', zoneId);
  }, [hoverZones]);

  return (
    <DragDropContext.Provider
      value={{
        dragState,
        startDrag,
        updateDragPosition,
        endDrag,
        registerDropZone,
        unregisterDropZone,
        findDropZoneAt,
        registerHoverZone,
        unregisterHoverZone
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDropContext() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDropContext must be used within DragDropProvider');
  }
  return context;
}


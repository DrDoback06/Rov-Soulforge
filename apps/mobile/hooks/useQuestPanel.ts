import { useState, useCallback, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * Quest Panel State Management Hook
 * 
 * Manages the sliding quest panel from the right side of screen
 * Controls map viewport adjustment when panel opens/closes
 */

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.4; // 40% of screen

export function useQuestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelTranslateX = useSharedValue(PANEL_WIDTH); // Start off-screen right
  const mapAdjustment = useSharedValue(0); // Map shift amount

  /**
   * Open the quest panel
   */
  const openPanel = useCallback(() => {
    setIsOpen(true);
    
    // Slide panel in from right
    panelTranslateX.value = withSpring(0, {
      damping: 20,
      stiffness: 90
    });
    
    // Shift map left by half panel width for better centering
    mapAdjustment.value = withSpring(-PANEL_WIDTH / 2, {
      damping: 20,
      stiffness: 90
    });
  }, [panelTranslateX, mapAdjustment]);

  /**
   * Close the quest panel
   */
  const closePanel = useCallback(() => {
    // Slide panel out to right
    panelTranslateX.value = withSpring(PANEL_WIDTH, {
      damping: 20,
      stiffness: 90
    });
    
    // Reset map position
    mapAdjustment.value = withSpring(0, {
      damping: 20,
      stiffness: 90
    });
    
    // Delay state update until animation completes
    setTimeout(() => setIsOpen(false), 300);
  }, [panelTranslateX, mapAdjustment]);

  /**
   * Toggle panel open/closed
   */
  const togglePanel = useCallback(() => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }, [isOpen, openPanel, closePanel]);

  return {
    isOpen,
    panelWidth: PANEL_WIDTH,
    panelTranslateX,
    mapAdjustment,
    openPanel,
    closePanel,
    togglePanel
  };
}

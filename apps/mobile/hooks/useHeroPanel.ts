import { useState, useCallback } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Dimensions } from 'react-native';

/**
 * Hero Panel Hook
 * 
 * Manages the state and animations for the sliding Hero Panel (character screen)
 * Similar to Quest Panel but for character management
 */

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.4, 500); // 40% of screen, max 500px

export function useHeroPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'inventory'>('stats');

  // Animation value for panel slide (0 = closed, 1 = open)
  const panelTranslateX = useSharedValue(PANEL_WIDTH);

  const openPanel = useCallback((tab?: 'stats' | 'skills' | 'inventory') => {
    setIsOpen(true);
    if (tab) setActiveTab(tab);
    panelTranslateX.value = withSpring(0, {
      damping: 20,
      stiffness: 90
    });
  }, [panelTranslateX]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    panelTranslateX.value = withSpring(PANEL_WIDTH, {
      damping: 20,
      stiffness: 90
    });
  }, [panelTranslateX]);

  const togglePanel = useCallback(() => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }, [isOpen, openPanel, closePanel]);

  return {
    isOpen,
    activeTab,
    setActiveTab,
    panelTranslateX,
    panelWidth: PANEL_WIDTH,
    openPanel,
    closePanel,
    togglePanel
  };
}


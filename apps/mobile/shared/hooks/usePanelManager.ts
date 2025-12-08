import { useState, useCallback } from 'react';

/**
 * Panel Manager Hook
 * 
 * Manages multiple panels with mutual exclusion
 * Only one panel can be open at a time
 */

export type PanelType = 'quest' | 'hero' | null;

export function usePanelManager() {
  const [openPanel, setOpenPanel] = useState<PanelType>(null);

  const openQuestPanel = useCallback(() => {
    setOpenPanel('quest');
  }, []);

  const openHeroPanel = useCallback(() => {
    setOpenPanel('hero');
  }, []);

  const closeAllPanels = useCallback(() => {
    setOpenPanel(null);
  }, []);

  const toggleQuestPanel = useCallback(() => {
    setOpenPanel(prev => prev === 'quest' ? null : 'quest');
  }, []);

  const toggleHeroPanel = useCallback(() => {
    setOpenPanel(prev => prev === 'hero' ? null : 'hero');
  }, []);

  return {
    openPanel,
    isQuestPanelOpen: openPanel === 'quest',
    isHeroPanelOpen: openPanel === 'hero',
    openQuestPanel,
    openHeroPanel,
    closeAllPanels,
    toggleQuestPanel,
    toggleHeroPanel
  };
}


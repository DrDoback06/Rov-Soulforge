import { createContext, useContext, ReactNode } from 'react';
import { usePanelManager, PanelType } from '@/hooks/usePanelManager';

/**
 * Panel Manager Context
 * 
 * Provides global access to panel state and controls
 * Ensures only one panel (Quest or Hero) is open at a time
 */

interface PanelManagerContextType {
  openPanel: PanelType;
  isQuestPanelOpen: boolean;
  isHeroPanelOpen: boolean;
  openQuestPanel: () => void;
  openHeroPanel: () => void;
  closeAllPanels: () => void;
  toggleQuestPanel: () => void;
  toggleHeroPanel: () => void;
}

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export function PanelManagerProvider({ children }: { children: ReactNode }) {
  const panelManager = usePanelManager();

  return (
    <PanelManagerContext.Provider value={panelManager}>
      {children}
    </PanelManagerContext.Provider>
  );
}

export function usePanelManagerContext() {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManagerContext must be used within PanelManagerProvider');
  }
  return context;
}


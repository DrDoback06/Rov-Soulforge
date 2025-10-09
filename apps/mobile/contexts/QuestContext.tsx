import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { EnhancedQuest } from '@/types/quest-enhanced';

interface QuestContextType {
  selectedQuestToShow: EnhancedQuest | null;
  selectedQuestToNavigate: EnhancedQuest | null;
  setSelectedQuestToShow: (quest: EnhancedQuest | null) => void;
  setSelectedQuestToNavigate: (quest: EnhancedQuest | null) => void;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export function QuestProvider({ children }: { children: ReactNode }) {
  const [selectedQuestToShow, setSelectedQuestToShow] = useState<EnhancedQuest | null>(null);
  const [selectedQuestToNavigate, setSelectedQuestToNavigate] = useState<EnhancedQuest | null>(null);

  return (
    <QuestContext.Provider
      value={{
        selectedQuestToShow,
        selectedQuestToNavigate,
        setSelectedQuestToShow,
        setSelectedQuestToNavigate,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
}

export function useQuestContext() {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuestContext must be used within a QuestProvider');
  }
  return context;
}

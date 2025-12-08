/**
 * DEPRECATED: Hooks have been moved to feature modules
 *
 * Import from feature modules instead:
 * - Quest hooks: @/features/quests/hooks
 * - Battle hooks: @/features/battle/hooks  
 * - Character hooks: @/features/character/hooks
 * - Inventory hooks: @/features/inventory/hooks
 * - Fitness hooks: @/features/fitness/hooks
 * - Social hooks: @/features/social/hooks
 * - Map hooks: @/features/map/tracking, @/features/map/routing
 * - Shared hooks: @/shared/hooks
 *
 * These re-exports are for backward compatibility only.
 */

// Quest hooks
export { useActiveQuests } from '../features/quests/hooks/useActiveQuests';
export { useQuestActions } from '../features/quests/hooks/useQuestActions';
export { useQuestBattleListener } from '../features/quests/hooks/useQuestBattleListener';
export { useQuestFilters } from '../features/quests/hooks/useQuestFilters';
export { useQuestLoader } from '../features/quests/hooks/useQuestLoader';
export { useQuestNavigation } from '../features/quests/hooks/useQuestNavigation';
export { useQuestPanel } from '../features/quests/hooks/useQuestPanel';
export { useQuestProximity } from '../features/quests/hooks/useQuestProximity';
export { useQuests } from '../features/quests/hooks/useQuests';
export { useSavedQuests } from '../features/quests/hooks/useSavedQuests';

// Battle hooks
export { useBattle } from '../features/battle/hooks/useBattle';

// Character hooks
export { useCharacter } from '../features/character/hooks/useCharacter';

// Inventory hooks
export { useInventory } from '../features/inventory/hooks/useInventory';
export { useInventoryTransfer } from '../features/inventory/hooks/useInventoryTransfer';
export { useDragDrop } from '../features/inventory/hooks/useDragDrop';

// Fitness hooks
export { useFitnessTracker } from '../features/fitness/hooks/useFitnessTracker';

// Social hooks
export { useParty } from '../features/social/hooks/useParty';

// Map hooks
export { useRouteOptimization } from '../features/map/routing/useRouteOptimization';

// Shared hooks
export { useAuth } from '../shared/hooks/useAuth';
export { useHeroPanel } from '../shared/hooks/useHeroPanel';
export { usePanelManager } from '../shared/hooks/usePanelManager';

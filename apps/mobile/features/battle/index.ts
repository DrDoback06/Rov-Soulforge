/**
 * Battle System - Complete Combat Module
 *
 * Simple, working turn-based card battle system.
 * Built from scratch with local-first approach.
 */

// Battle Engine - Core logic
export {
  SimpleBattleEngine,
} from './engine';

export type {
  SimpleBattleState,
  SimpleCard,
} from './engine';

// Battle Hooks - React integration
export {
  useSimpleBattle,
} from './hooks';

export type {
  UseSimpleBattleReturn,
} from './hooks';

// Battle UI - Components
export {
  BattleScreen,
  BattleCard,
} from './ui';

export type {
  BattleScreenProps,
  BattleCardProps,
} from './ui';

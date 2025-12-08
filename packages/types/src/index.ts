/**
 * @rov/types - Type Definitions Package
 *
 * All types have been split into domain-based modules for better organization.
 * This file re-exports everything for backward compatibility.
 *
 * New imports can use specific modules:
 * - import { Character } from '@rov/types/entities/character'
 * - import { Battle } from '@rov/types/entities/battle'
 * - import { Quest } from '@rov/types/entities/quest'
 * - import { EffectDef } from '@rov/types/effects/effect-def'
 * - etc.
 *
 * Or continue using the main export:
 * - import { Character, Battle, Quest } from '@rov/types'
 */

// Common/Shared Types
export * from './common/shared';

// Entity Types
export * from './entities/character';
export * from './entities/card';
export * from './entities/battle';
export * from './entities/quest';
export * from './entities/activity';
export * from './entities/shop';
export * from './entities/social';

// Effects
export * from './effects/effect-def';

// Objectives
export * from './objectives/quest-objectives';

// API Types
export * from './api/common';
export * from './api/requests';

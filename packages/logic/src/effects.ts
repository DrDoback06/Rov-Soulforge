import type { EffectDef, Character, BattleState } from '@rov/types';

/**
 * Effect Registry and Handlers
 *
 * Provides a centralized system for registering and executing card effects.
 * Supports custom effects, scaling, conditions, and validation.
 */

export interface EffectContext {
  source: Character;
  target?: Character;
  battle: BattleState;
  rng: () => number;
  params?: Record<string, any>;
}

export interface EffectHandler {
  type: string;
  validate?: (effect: EffectDef, context: EffectContext) => boolean;
  execute: (effect: EffectDef, context: EffectContext) => EffectResult;
}

export interface EffectResult {
  success: boolean;
  modifiedChars?: Character[];
  modifiedBattle?: Partial<BattleState>;
  log?: string;
  value?: number;
}

/**
 * Effect Registry - stores all registered effect handlers
 */
class EffectRegistry {
  private handlers = new Map<string, EffectHandler>();

  register(handler: EffectHandler): void {
    this.handlers.set(handler.type, handler);
  }

  get(type: string): EffectHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  getAll(): EffectHandler[] {
    return Array.from(this.handlers.values());
  }
}

// Singleton registry
export const effectRegistry = new EffectRegistry();

/**
 * Register a custom effect handler
 */
export function registerEffect(handler: EffectHandler): void {
  effectRegistry.register(handler);
}

/**
 * Execute an effect using the registered handler
 */
export function executeRegisteredEffect(
  effect: EffectDef,
  context: EffectContext
): EffectResult {
  const handler = effectRegistry.get(effect.type);

  if (!handler) {
    return {
      success: false,
      log: `Unknown effect type: ${effect.type}`
    };
  }

  // Validate effect if validator exists
  if (handler.validate && !handler.validate(effect, context)) {
    return {
      success: false,
      log: `Effect validation failed: ${effect.type}`
    };
  }

  // Execute the effect
  return handler.execute(effect, context);
}

// ============================================================================
// Built-in Effect Handlers
// ============================================================================

/**
 * Damage Effect Handler
 */
registerEffect({
  type: 'damage',
  validate: (effect, context) => {
    if (effect.type !== 'damage') return false;
    return effect.amount > 0 && context.target !== undefined;
  },
  execute: (effect, context) => {
    if (effect.type !== 'damage' || !context.target) {
      return { success: false };
    }

    const baseAmount = effect.amount;
    const scaling = effect.scaling;

    // Calculate scaled damage
    let finalAmount = baseAmount;
    if (scaling) {
      const statValue = context.source.stats[scaling.stat as keyof typeof context.source.stats] || 0;
      finalAmount = Math.floor(baseAmount + (statValue * scaling.multiplier));
    }

    // Apply ATK bonus
    finalAmount += context.source.stats.atk;

    // Apply DEF reduction
    finalAmount = Math.max(1, finalAmount - context.target.stats.def);

    // Apply damage
    const newHp = Math.max(0, context.target.counters.hp - finalAmount);
    context.target.counters.hp = newHp;

    return {
      success: true,
      modifiedChars: [context.target],
      value: finalAmount,
      log: `${context.source.id} dealt ${finalAmount} damage to ${context.target.id}`
    };
  }
});

/**
 * Heal Effect Handler
 */
registerEffect({
  type: 'heal',
  execute: (effect, context) => {
    if (effect.type !== 'heal') {
      return { success: false };
    }

    const target = context.target || context.source;
    const amount = effect.amount;

    // Calculate scaling
    let finalAmount = amount;
    if (effect.scaling) {
      const statValue = context.source.stats[effect.scaling.stat as keyof typeof context.source.stats] || 0;
      finalAmount = Math.floor(amount + (statValue * effect.scaling.multiplier));
    }

    const maxHp = target.stats.maxHp || 100;
    const oldHp = target.counters.hp;
    target.counters.hp = Math.min(maxHp, oldHp + finalAmount);
    const actualHealed = target.counters.hp - oldHp;

    return {
      success: true,
      modifiedChars: [target],
      value: actualHealed,
      log: `${target.id} healed ${actualHealed} HP`
    };
  }
});

/**
 * Draw Effect Handler
 */
registerEffect({
  type: 'draw',
  execute: (effect, context) => {
    if (effect.type !== 'draw') {
      return { success: false };
    }

    // In a full implementation, this would interact with deck manager
    // For now, just log the draw
    return {
      success: true,
      value: effect.amount,
      log: `${context.source.id} drew ${effect.amount} card(s) from ${effect.deck} deck`
    };
  }
});

/**
 * Buff Effect Handler
 */
registerEffect({
  type: 'buff',
  execute: (effect, context) => {
    if (effect.type !== 'buff') {
      return { success: false };
    }

    const target = context.target || context.source;
    const { stat, amount, duration } = effect;

    // Apply buff based on stat type
    switch (stat) {
      case 'atk':
        target.stats.atk += amount;
        break;
      case 'def':
        target.stats.def += amount;
        break;
      case 'maxMana':
        target.stats.maxMana = (target.stats.maxMana || 10) + amount;
        break;
      case 'maxHp':
        target.stats.maxHp = (target.stats.maxHp || 100) + amount;
        break;
    }

    const durationText = duration === 'permanent' ? 'permanently' :
      duration === 'battle' ? 'for this battle' : 'temporarily';

    return {
      success: true,
      modifiedChars: [target],
      value: amount,
      log: `${target.id} gained +${amount} ${stat} ${durationText}`
    };
  }
});

/**
 * Instant Cancel Effect Handler
 */
registerEffect({
  type: 'instantCancel',
  execute: (effect, context) => {
    return {
      success: true,
      log: `${context.source.id} cancelled an effect`
    };
  }
});

/**
 * Steal Random Effect Handler
 */
registerEffect({
  type: 'stealRandom',
  execute: (effect, context) => {
    if (effect.type !== 'stealRandom' || !context.target) {
      return { success: false };
    }

    // In a full implementation, this would interact with deck manager
    // to steal cards from opponent's hand
    return {
      success: true,
      value: effect.amount,
      log: `${context.source.id} stole ${effect.amount} card(s) from ${context.target.id}`
    };
  }
});

/**
 * Gain Renown Effect Handler
 */
registerEffect({
  type: 'gainRenown',
  execute: (effect, context) => {
    if (effect.type !== 'gainRenown') {
      return { success: false };
    }

    context.source.counters.renown += effect.amount;

    return {
      success: true,
      modifiedChars: [context.source],
      value: effect.amount,
      log: `${context.source.id} gained ${effect.amount} Renown`
    };
  }
});

/**
 * Gain Gold Effect Handler
 */
registerEffect({
  type: 'gainGold',
  execute: (effect, context) => {
    if (effect.type !== 'gainGold') {
      return { success: false };
    }

    context.source.gold += effect.amount;

    return {
      success: true,
      modifiedChars: [context.source],
      value: effect.amount,
      log: `${context.source.id} gained ${effect.amount} Gold`
    };
  }
});

/**
 * Custom Effect Handler
 */
registerEffect({
  type: 'custom',
  execute: (effect, context) => {
    if (effect.type !== 'custom') {
      return { success: false };
    }

    // Custom effects need to be implemented per-card
    // For now, log the custom effect key
    return {
      success: true,
      log: `Custom effect: ${effect.key}`
    };
  }
});

// ============================================================================
// Effect Utilities
// ============================================================================

/**
 * Batch execute multiple effects
 */
export function executeEffectBatch(
  effects: EffectDef[],
  context: EffectContext
): EffectResult[] {
  return effects.map(effect => executeRegisteredEffect(effect, context));
}

/**
 * Check if an effect can be executed
 */
export function canExecuteEffect(
  effect: EffectDef,
  context: EffectContext
): boolean {
  const handler = effectRegistry.get(effect.type);

  if (!handler) return false;
  if (!handler.validate) return true;

  return handler.validate(effect, context);
}

/**
 * Get effect description for UI
 */
export function getEffectDescription(effect: EffectDef): string {
  switch (effect.type) {
    case 'damage':
      return `Deal ${effect.amount} damage${effect.scaling ? ` (scales with ${effect.scaling.stat})` : ''}`;
    case 'heal':
      return `Heal ${effect.amount} HP${effect.scaling ? ` (scales with ${effect.scaling.stat})` : ''}`;
    case 'draw':
      return `Draw ${effect.amount} card(s) from ${effect.deck} deck`;
    case 'buff':
      return `+${effect.amount} ${effect.stat}${effect.duration ? ` (${effect.duration})` : ''}`;
    case 'instantCancel':
      return 'Cancel target effect';
    case 'stealRandom':
      return `Steal ${effect.amount} random card(s)`;
    case 'gainRenown':
      return `Gain ${effect.amount} Renown`;
    case 'gainGold':
      return `Gain ${effect.amount} Gold`;
    case 'custom':
      return effect.key;
    default:
      return 'Unknown effect';
  }
}
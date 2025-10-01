import type { StackItem, BattleState, EffectDef, Character } from '@rov/types';

/**
 * Stack Resolver
 *
 * Implements LIFO (Last-In-First-Out) resolution for instant cards and effects.
 * When an instant is played, it goes on top of the stack. The stack resolves
 * from top to bottom, with each effect executing before the one below it.
 */

export interface StackContext {
  battle: BattleState;
  characters: Map<string, Character>;
  rng: () => number; // Seeded RNG function
}

export interface ResolveResult {
  success: boolean;
  cancelled?: boolean;
  effects: ExecutedEffect[];
  log: string[];
}

export interface ExecutedEffect {
  effectDef: EffectDef;
  target?: string;
  value?: number;
  cancelled?: boolean;
}

/**
 * Add an item to the stack
 */
export function pushToStack(
  stack: StackItem[],
  item: StackItem
): StackItem[] {
  return [...stack, item];
}

/**
 * Remove the top item from the stack
 */
export function popFromStack(stack: StackItem[]): {
  item: StackItem | undefined;
  remaining: StackItem[];
} {
  if (stack.length === 0) {
    return { item: undefined, remaining: [] };
  }

  const item = stack[stack.length - 1];
  const remaining = stack.slice(0, -1);

  return { item, remaining };
}

/**
 * Resolve the entire stack, executing effects from top to bottom
 */
export function resolveStack(
  stack: StackItem[],
  context: StackContext
): ResolveResult[] {
  const results: ResolveResult[] = [];
  let workingStack = [...stack];

  while (workingStack.length > 0) {
    const { item, remaining } = popFromStack(workingStack);

    if (!item) break;

    const result = resolveStackItem(item, context);
    results.push(result);

    // If this was a cancel effect, mark the next item as cancelled
    const hasCancelEffect = item.effects.some(
      e => e.type === 'instantCancel'
    );

    if (hasCancelEffect && remaining.length > 0) {
      // Cancel the next item on the stack
      remaining[remaining.length - 1].cancelled = true;
    }

    workingStack = remaining;
  }

  return results;
}

/**
 * Resolve a single stack item, executing all its effects
 */
export function resolveStackItem(
  item: StackItem,
  context: StackContext
): ResolveResult {
  const log: string[] = [];
  const executedEffects: ExecutedEffect[] = [];

  // Check if this item was cancelled
  if (item.cancelled) {
    log.push(`${item.cardName} was cancelled`);
    return {
      success: false,
      cancelled: true,
      effects: executedEffects,
      log
    };
  }

  log.push(`Resolving ${item.cardName}`);

  // Execute each effect in order
  for (const effect of item.effects) {
    const effectResult = executeEffect(
      effect,
      item.playedBy,
      context
    );

    executedEffects.push(effectResult);

    if (effectResult.cancelled) {
      log.push(`Effect cancelled: ${effect.type}`);
      break;
    }

    // Log the effect execution
    log.push(formatEffectLog(effectResult, item.playedBy));
  }

  return {
    success: true,
    effects: executedEffects,
    log
  };
}

/**
 * Execute a single effect, modifying game state as needed
 */
function executeEffect(
  effect: EffectDef,
  sourceCharId: string,
  context: StackContext
): ExecutedEffect {
  const sourceChar = context.characters.get(sourceCharId);

  if (!sourceChar) {
    return {
      effectDef: effect,
      cancelled: true
    };
  }

  switch (effect.type) {
    case 'damage': {
      const amount = calculateScaledAmount(
        effect.amount,
        effect.scaling,
        sourceChar
      );

      // Find target (for now, assume opponent)
      const targetId = findOpponent(sourceCharId, context);
      const target = context.characters.get(targetId);

      if (target) {
        // Apply damage reduction based on DEF
        const finalDamage = Math.max(1, amount - target.stats.def);
        target.counters.hp = Math.max(0, target.counters.hp - finalDamage);

        return {
          effectDef: effect,
          target: targetId,
          value: finalDamage
        };
      }

      return { effectDef: effect, cancelled: true };
    }

    case 'heal': {
      const amount = calculateScaledAmount(
        effect.amount,
        effect.scaling,
        sourceChar
      );

      const maxHp = sourceChar.stats.maxHp || 100;
      sourceChar.counters.hp = Math.min(
        maxHp,
        sourceChar.counters.hp + amount
      );

      return {
        effectDef: effect,
        target: sourceCharId,
        value: amount
      };
    }

    case 'draw': {
      // Drawing cards - this would interact with deck manager
      return {
        effectDef: effect,
        target: sourceCharId,
        value: effect.amount
      };
    }

    case 'buff': {
      // Apply buff to stat
      const buffAmount = effect.amount;

      switch (effect.stat) {
        case 'atk':
          sourceChar.stats.atk += buffAmount;
          break;
        case 'def':
          sourceChar.stats.def += buffAmount;
          break;
        case 'maxMana':
          sourceChar.stats.maxMana = (sourceChar.stats.maxMana || 10) + buffAmount;
          break;
        case 'maxHp':
          sourceChar.stats.maxHp = (sourceChar.stats.maxHp || 100) + buffAmount;
          break;
      }

      return {
        effectDef: effect,
        target: sourceCharId,
        value: buffAmount
      };
    }

    case 'instantCancel': {
      // Cancel is handled in resolveStack
      return {
        effectDef: effect,
        target: sourceCharId
      };
    }

    case 'gainRenown': {
      sourceChar.counters.renown += effect.amount;

      return {
        effectDef: effect,
        target: sourceCharId,
        value: effect.amount
      };
    }

    case 'gainGold': {
      sourceChar.gold += effect.amount;

      return {
        effectDef: effect,
        target: sourceCharId,
        value: effect.amount
      };
    }

    case 'stealRandom': {
      // Steal random card from opponent's hand
      // This would interact with deck manager
      return {
        effectDef: effect,
        target: sourceCharId,
        value: effect.amount
      };
    }

    case 'custom': {
      // Custom effects need special handling
      return {
        effectDef: effect,
        target: sourceCharId
      };
    }

    default:
      return {
        effectDef: effect,
        cancelled: true
      };
  }
}

/**
 * Calculate scaled amount based on character stats
 */
function calculateScaledAmount(
  baseAmount: number,
  scaling: { stat: string; multiplier: number } | undefined,
  character: Character
): number {
  if (!scaling) return baseAmount;

  const statValue = character.stats[scaling.stat as keyof typeof character.stats] || 0;
  return Math.floor(baseAmount + (statValue * scaling.multiplier));
}

/**
 * Find the opponent of the given character
 */
function findOpponent(charId: string, context: StackContext): string {
  const allCharIds = Array.from(context.characters.keys());
  return allCharIds.find(id => id !== charId) || charId;
}

/**
 * Format effect execution for battle log
 */
function formatEffectLog(effect: ExecutedEffect, sourceCharId: string): string {
  if (effect.cancelled) {
    return `Effect cancelled`;
  }

  switch (effect.effectDef.type) {
    case 'damage':
      return `Dealt ${effect.value} damage to ${effect.target}`;
    case 'heal':
      return `Healed ${effect.value} HP`;
    case 'buff':
      return `Buffed ${effect.effectDef.stat} by ${effect.value}`;
    case 'draw':
      return `Drew ${effect.value} card(s) from ${effect.effectDef.deck} deck`;
    case 'gainRenown':
      return `Gained ${effect.value} Renown`;
    case 'gainGold':
      return `Gained ${effect.value} Gold`;
    case 'instantCancel':
      return `Cancelled effect`;
    default:
      return `Executed ${effect.effectDef.type}`;
  }
}

/**
 * Check if stack can be resolved (no more responses expected)
 */
export function canResolveStack(
  stack: StackItem[],
  context: StackContext
): boolean {
  if (stack.length === 0) return false;

  // In a real implementation, you'd check if all players have passed priority
  // For now, we'll assume the stack can resolve if it has items
  return true;
}
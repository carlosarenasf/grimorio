/**
 * Condition (status effect) management on a single combatant. Conditions are
 * keyed by `Condition.key`, so a combatant can never carry two entries for
 * the same key — applying twice is idempotent and updates in place.
 */
import type { Combatant, Condition } from '../types.js';

/**
 * Add a condition, or replace the existing one with the same key (idempotent
 * by key; re-applying the identical condition is a no-op in effect, and
 * applying a condition with the same key but different label/color updates
 * it rather than duplicating it).
 */
export function setCondition(combatant: Combatant, condition: Condition): Combatant {
  const withoutKey = combatant.conditions.filter((c) => c.key !== condition.key);

  return {
    ...combatant,
    conditions: [...withoutKey, condition],
  };
}

/**
 * Remove a condition by key. No-op if the key is not present.
 */
export function clearCondition(combatant: Combatant, key: string): Combatant {
  return {
    ...combatant,
    conditions: combatant.conditions.filter((c) => c.key !== key),
  };
}

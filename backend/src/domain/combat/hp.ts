/**
 * HP adjustments for a single combatant, clamped to the valid 0..maxHp range.
 */
import type { Combatant } from '../types.js';

/**
 * Apply damage, clamping currentHp to a minimum of 0 (no negative HP / death
 * saves tracking here — that's a higher-level concern).
 */
export function applyDamage(combatant: Combatant, amount: number): Combatant {
  return {
    ...combatant,
    currentHp: Math.max(0, combatant.currentHp - amount),
  };
}

/**
 * Apply healing, clamping currentHp to a maximum of maxHp.
 */
export function applyHealing(combatant: Combatant, amount: number): Combatant {
  return {
    ...combatant,
    currentHp: Math.min(combatant.maxHp, combatant.currentHp + amount),
  };
}

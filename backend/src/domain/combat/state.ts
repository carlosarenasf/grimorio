/**
 * Combat lifecycle: starting an encounter and reordering initiative.
 */
import type { Combatant, CombatState } from '../types.js';

/**
 * Build the initial CombatState from a roster of combatants, ordered by
 * initiative descending. Ties are broken by stable sort — combatants keep
 * their relative input order when initiative is equal, so ordering is
 * deterministic and reproducible from the same roster.
 */
export function startCombat(combatants: Combatant[]): CombatState {
  const order = [...combatants]
    .sort((a, b) => b.initiative - a.initiative)
    .map((c) => c.id);

  return {
    active: true,
    round: 1,
    order,
    currentTurnIndex: 0,
  };
}

/**
 * Replace the turn order with a DM-supplied sequence of combatant ids
 * (e.g. manual drag-to-reorder in the UI). Round and active flag are
 * preserved; currentTurnIndex is re-anchored to the same combatant id that
 * was active before reordering, if still present, otherwise 0.
 */
export function reorder(state: CombatState, orderedIds: string[]): CombatState {
  const activeId = state.order[state.currentTurnIndex];
  const newIndex = orderedIds.indexOf(activeId);

  return {
    ...state,
    order: [...orderedIds] as CombatState['order'],
    currentTurnIndex: newIndex === -1 ? 0 : newIndex,
  };
}

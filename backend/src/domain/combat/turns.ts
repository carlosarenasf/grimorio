/**
 * Turn-order advancement and turn-ownership checks within an active CombatState.
 */
import type { Combatant, CombatState } from '../types.js';

/**
 * Advance to the next combatant in turn order. Wrapping past the last
 * combatant starts a new round (round + 1, currentTurnIndex 0).
 */
export function nextTurn(state: CombatState): CombatState {
  const wrapping = state.currentTurnIndex >= state.order.length - 1;

  return {
    ...state,
    currentTurnIndex: wrapping ? 0 : state.currentTurnIndex + 1,
    round: wrapping ? state.round + 1 : state.round,
  };
}

/**
 * Move back to the previous combatant in turn order. Wrapping before the
 * first combatant goes back to the previous round (round - 1, last index),
 * but the round counter never drops below 1.
 */
export function prevTurn(state: CombatState): CombatState {
  const wrapping = state.currentTurnIndex <= 0;

  return {
    ...state,
    currentTurnIndex: wrapping ? state.order.length - 1 : state.currentTurnIndex - 1,
    round: wrapping ? Math.max(1, state.round - 1) : state.round,
  };
}

/**
 * Whether `userId` may end the currently active turn.
 *
 * A player may end the turn only when the active combatant is a PC they control
 * (`controllerUserId === userId`). Monsters never match a player; only the DM
 * advances their turns (a DM authorization concern handled in the application
 * layer, not here).
 */
export function canEndOwnTurn(
  state: CombatState,
  combatants: Combatant[],
  userId: string,
): boolean {
  const activeId = state.order[state.currentTurnIndex];
  const active = combatants.find((c) => c.id === activeId);

  if (!active || active.type !== 'pc') {
    return false;
  }

  return active.controllerUserId === userId;
}

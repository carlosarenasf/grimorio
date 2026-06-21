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
 * Ownership-mapping assumption: `Combatant` (domain/types.ts) has no direct
 * `ownerId` field — it only carries `refId: string | null`, documented as
 * "sheet (pc) or bestiary entry (monster)". For this pure-domain check we
 * treat `refId` on a `type === 'pc'` combatant as holding the controlling
 * user's id. The application layer is responsible for populating
 * `Combatant.refId` with `CharacterSheet.ownerId` (not the CharacterId
 * itself) when it builds PC combatants for a LiveTable, specifically so this
 * function can compare ownership without reaching outside the domain layer.
 * Monsters (`type === 'monster'`) never match any userId — only the table's
 * DM may end a monster's turn, which is an authorization concern decided by
 * the application/transport layer, not here.
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

  return active.refId === userId;
}

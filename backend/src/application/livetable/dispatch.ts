/**
 * `dispatchLiveCommand` — the single entry point for the live/WS command subset.
 *
 * Responsibilities, in order:
 *  1. Authorize the command against the `Principal` (role + turn ownership).
 *  2. Delegate to the matching pure handler (which mutates the table + emits events).
 *
 * It is a pure function: it does NOT persist or broadcast (the transport layer
 * does both with the returned `{ table, events }`). All randomness flows through
 * `deps.rng` and all timestamps through `deps.clock` so it is deterministic in
 * tests.
 */
import { canEndOwnTurn } from '../../domain/combat/index.js';
import type { LiveTable } from '../../domain/types.js';
import type { Command } from '@grimorio/shared/commands';
import type { Deps, DispatchResult, Principal } from './principal.js';
import { Forbidden, NotActiveTurn } from './errors.js';
import {
  handleAddCombatantFromBestiary,
  handleAddManualCombatant,
  handleApplyDamage,
  handleApplyHealing,
  handleAppendDmNote,
  handleClearCondition,
  handleEndCombat,
  handleNextTurn,
  handlePrevTurn,
  handleReorderInitiative,
  handleRollAttack,
  handleRollDice,
  handleRollHidden,
  handleSetCondition,
  handleSetInitiative,
  handleStartCombat,
} from './handlers.js';

/** Commands only the DM may issue. */
const DM_ONLY = new Set<Command['type']>([
  'StartCombat',
  'AddCombatantFromBestiary',
  'AddManualCombatant',
  'SetInitiative',
  'ReorderInitiative',
  'NextTurn',
  'PrevTurn',
  'SetCondition',
  'ClearCondition',
  'AppendDmNote',
  'EndCombat',
  'RollHidden',
]);

/** The WS/live subset this dispatcher handles (everything else is HTTP). */
type LiveCommand = Extract<
  Command,
  {
    type:
      | 'StartCombat'
      | 'AddCombatantFromBestiary'
      | 'AddManualCombatant'
      | 'SetInitiative'
      | 'ReorderInitiative'
      | 'NextTurn'
      | 'PrevTurn'
      | 'EndMyTurn'
      | 'SetCondition'
      | 'ClearCondition'
      | 'ApplyDamage'
      | 'ApplyHealing'
      | 'RollDice'
      | 'RollAttack'
      | 'RollHidden'
      | 'AppendDmNote'
      | 'EndCombat';
  }
>;

function authorize(table: LiveTable, command: LiveCommand, principal: Principal): void {
  if (DM_ONLY.has(command.type) && principal.role !== 'dm') {
    throw new Forbidden(`Command ${command.type} is DM-only`);
  }

  if (command.type === 'EndMyTurn') {
    // Players (and the DM, when controlling a PC) may only end the active turn
    // they own. canEndOwnTurn matches the active combatant's refId === userId.
    if (!canEndOwnTurn(table.combat, table.combatants, principal.userId)) {
      throw new NotActiveTurn();
    }
  }

  // HP changes: the DM may target anyone, at any time. A player may damage any
  // monster (e.g. attacking on or off their turn) or themselves, and may heal
  // only themselves — never another player or a monster's HP up.
  if (command.type === 'ApplyDamage' || command.type === 'ApplyHealing') {
    if (principal.role === 'dm') return;
    const target = table.combatants.find((c) => c.id === command.combatantId);
    if (!target) throw new Forbidden('Unknown combatant');
    const isOwnPc = target.type === 'pc' && target.controllerUserId === principal.userId;
    if (command.type === 'ApplyHealing') {
      if (!isOwnPc) throw new Forbidden('Players can only heal their own character');
    } else if (target.type !== 'monster' && !isOwnPc) {
      throw new Forbidden('Players can only damage monsters or their own character');
    }
  }
}

export function dispatchLiveCommand(
  table: LiveTable,
  command: Command,
  principal: Principal,
  deps: Deps,
): DispatchResult {
  const cmd = command as LiveCommand;
  authorize(table, cmd, principal);

  switch (cmd.type) {
    case 'StartCombat':
      return handleStartCombat(table, deps);
    case 'AddCombatantFromBestiary':
      return handleAddCombatantFromBestiary(table, cmd, deps);
    case 'AddManualCombatant':
      return handleAddManualCombatant(table, cmd, deps);
    case 'SetInitiative':
      return handleSetInitiative(table, cmd, deps);
    case 'ReorderInitiative':
      return handleReorderInitiative(table, cmd, deps);
    case 'NextTurn':
      return handleNextTurn(table, deps);
    case 'PrevTurn':
      return handlePrevTurn(table, deps);
    case 'EndMyTurn':
      // Ownership already verified; advancing the turn is the same as NextTurn.
      return handleNextTurn(table, deps);
    case 'SetCondition':
      return handleSetCondition(table, cmd, deps);
    case 'ClearCondition':
      return handleClearCondition(table, cmd, deps);
    case 'ApplyDamage':
      return handleApplyDamage(table, cmd, deps);
    case 'ApplyHealing':
      return handleApplyHealing(table, cmd, deps);
    case 'RollDice':
      return handleRollDice(table, cmd, principal, deps);
    case 'RollAttack':
      return handleRollAttack(table, cmd, principal, deps);
    case 'RollHidden':
      return handleRollHidden(table, cmd, principal, deps);
    case 'AppendDmNote':
      return handleAppendDmNote(table, cmd, deps);
    case 'EndCombat':
      return handleEndCombat(table, deps);
    default: {
      const _exhaustive: never = cmd;
      throw new Forbidden(`Unsupported live command: ${(_exhaustive as { type: string }).type}`);
    }
  }
}

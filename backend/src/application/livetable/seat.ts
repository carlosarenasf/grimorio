/**
 * Seat a player's character into a live table as a PC combatant.
 *
 * This is the link the player loop depends on: it builds a `Combatant` whose
 * `refId` is the CharacterId and whose `controllerUserId` is the owning user, so
 * the visibility projection can surface the player's `ownCharacterId` and
 * `canEndOwnTurn` can authorize the player ending their own turn. Idempotent: if
 * the character is already seated it returns null (no change).
 */
import type { CharacterSheet, Combatant, LiveTable } from '../../domain/types.js';
import { newCombatantId } from '../../domain/ids.js';
import type { Clock } from '../../domain/ports.js';
import type { GameEvent } from '@grimorio/shared/events';

export interface SeatResult {
  table: LiveTable;
  event: GameEvent;
}

export function seatCharacter(
  table: LiveTable,
  sheet: CharacterSheet,
  clock: Clock,
): SeatResult | null {
  const alreadySeated = table.combatants.some(
    (c) => c.type === 'pc' && c.refId === sheet.id,
  );
  if (alreadySeated) return null;

  const combatant: Combatant = {
    id: newCombatantId(),
    refId: sheet.id,
    controllerUserId: sheet.ownerId,
    type: 'pc',
    name: sheet.name,
    initiative: 0,
    maxHp: sheet.maxHp,
    currentHp: sheet.currentHp,
    conditions: [],
    hpVisibility: 'public',
  };

  const combatants = [...table.combatants, combatant];
  // If combat is already running, append the newcomer to the turn order so they
  // can act this encounter (the DM can reorder via SetInitiative/ReorderInitiative).
  const combat = table.combat.active
    ? { ...table.combat, order: [...table.combat.order, combatant.id] }
    : table.combat;

  const newTable: LiveTable = { ...table, combatants, combat, version: table.version + 1 };

  const event: GameEvent = {
    type: 'CombatantAdded',
    version: newTable.version,
    at: clock.now(),
    combatant: {
      id: combatant.id,
      type: 'pc',
      name: combatant.name,
      initiative: combatant.initiative,
      conditions: [],
      currentHp: combatant.currentHp,
      maxHp: combatant.maxHp,
    },
  };

  return { table: newTable, event };
}

/**
 * Live-table command handlers — pure transformations over a `LiveTable`.
 *
 * Each handler takes the current table, an (already-authorized) command, the
 * principal, and the injected ports, and returns the next table plus the
 * `GameEvent`s to broadcast. Handlers NEVER perform I/O beyond the synchronous
 * `srd`/`rng`/`clock` ports: persistence + fan-out are the transport layer's job.
 *
 * All state mutation is delegated to the pure domain (combat, dice, visibility);
 * handlers only orchestrate, bump the `version`, and shape wire events.
 */
import { newCombatantId } from '../../domain/ids.js';
import {
  applyDamage,
  applyHealing,
  clearCondition,
  nextTurn,
  prevTurn,
  reorder,
  setCondition,
  startCombat,
} from '../../domain/combat/index.js';
import { parseNotation, rollAttack, rollNotation } from '../../domain/dice/index.js';
import { projectCombatant } from '../../domain/visibility/index.js';
import type {
  Combatant,
  CombatEvent,
  DiceRoll,
  LiveTable,
  Visibility,
} from '../../domain/types.js';
import type { UserId } from '../../domain/ids.js';
import type {
  AddCombatantFromBestiaryCommand,
  AddManualCombatantCommand,
  ApplyDamageCommand,
  ApplyHealingCommand,
  AppendDmNoteCommand,
  ClearConditionCommand,
  ReorderInitiativeCommand,
  RollAttackCommand,
  RollDiceCommand,
  RollHiddenCommand,
  SetConditionCommand,
  SetInitiativeCommand,
} from '@grimorio/shared/commands';
import type { GameEvent } from '@grimorio/shared/events';
import type { Deps, DispatchResult, Principal } from './principal.js';
import { CombatantNotFound, InvalidNotation } from './errors.js';

// ---------- small shared helpers ----------

function bump(table: LiveTable): LiveTable {
  return { ...table, version: table.version + 1 };
}

/** Display label for a roll/note author. */
function authorLabel(table: LiveTable, principal: Principal): string {
  if (principal.role === 'dm') return 'Máster';
  // A player's label is the name of the PC combatant they control, if present.
  const own = table.combatants.find(
    (c) => c.type === 'pc' && c.controllerUserId === principal.userId,
  );
  return own?.name ?? 'Jugador';
}

function dmViewer(): { userId: UserId; role: 'dm' } {
  return { userId: '' as UserId, role: 'dm' };
}

function requireCombatant(table: LiveTable, combatantId: string): Combatant {
  const c = table.combatants.find((x) => x.id === combatantId);
  if (!c) throw new CombatantNotFound(combatantId);
  return c;
}

function replaceCombatant(table: LiveTable, next: Combatant): LiveTable {
  return {
    ...table,
    combatants: table.combatants.map((c) => (c.id === next.id ? next : c)),
  };
}

// ---------- handlers ----------

export function handleStartCombat(table: LiveTable, deps: Deps): DispatchResult {
  const combat = startCombat(table.combatants);
  const next = bump({ ...table, combat });
  const event: GameEvent = {
    type: 'CombatStarted',
    version: next.version,
    at: deps.clock.now(),
    combat: next.combat,
  };
  return { table: next, events: [event] };
}

export function handleAddCombatantFromBestiary(
  table: LiveTable,
  cmd: AddCombatantFromBestiaryCommand,
  deps: Deps,
): DispatchResult {
  const monster = deps.srd.getMonster(cmd.monsterId);
  if (!monster) throw new CombatantNotFound(cmd.monsterId);

  // Number duplicates of the same monster so the table can tell them apart:
  // "Goblin", "Goblin 2", "Goblin 3"…
  const sameKind = table.combatants.filter((c) => c.refId === monster.id).length;
  const name = sameKind === 0 ? monster.name : `${monster.name} ${sameKind + 1}`;

  const combatant: Combatant = {
    id: newCombatantId(),
    refId: monster.id,
    type: 'monster',
    name,
    initiative: 0,
    maxHp: monster.hp,
    currentHp: monster.hp,
    conditions: [],
    hpVisibility: cmd.hpVisibility, // defaults to 'dm_only' at the schema layer
  };

  // If combat is already running, drop the newcomer into the turn order so the
  // DM can act with it this encounter (reorder via SetInitiative if needed).
  const combat = table.combat.active
    ? { ...table.combat, order: [...table.combat.order, combatant.id] }
    : table.combat;

  const next = bump({ ...table, combat, combatants: [...table.combatants, combatant] });
  const event: GameEvent = {
    type: 'CombatantAdded',
    version: next.version,
    at: deps.clock.now(),
    combatant: projectCombatant(combatant, dmViewer()),
  };
  return { table: next, events: [event] };
}

export function handleAddManualCombatant(
  table: LiveTable,
  cmd: AddManualCombatantCommand,
  deps: Deps,
): DispatchResult {
  const combatant: Combatant = {
    id: newCombatantId(),
    refId: cmd.refId,
    type: cmd.combatantType,
    name: cmd.name,
    initiative: cmd.initiative,
    maxHp: cmd.maxHp,
    currentHp: cmd.maxHp,
    conditions: [],
    hpVisibility: cmd.hpVisibility,
  };

  const next = bump({ ...table, combatants: [...table.combatants, combatant] });
  const event: GameEvent = {
    type: 'CombatantAdded',
    version: next.version,
    at: deps.clock.now(),
    combatant: projectCombatant(combatant, dmViewer()),
  };
  return { table: next, events: [event] };
}

export function handleSetInitiative(
  table: LiveTable,
  cmd: SetInitiativeCommand,
  deps: Deps,
): DispatchResult {
  const target = requireCombatant(table, cmd.combatantId);
  const updated: Combatant = { ...target, initiative: cmd.initiative };
  const next = bump(replaceCombatant(table, updated));
  const event: GameEvent = {
    type: 'InitiativeSet',
    version: next.version,
    at: deps.clock.now(),
    combatantId: cmd.combatantId,
    initiative: cmd.initiative,
  };
  return { table: next, events: [event] };
}

export function handleReorderInitiative(
  table: LiveTable,
  cmd: ReorderInitiativeCommand,
  deps: Deps,
): DispatchResult {
  const combat = reorder(table.combat, cmd.order);
  const next = bump({ ...table, combat });
  const event: GameEvent = {
    type: 'InitiativeReordered',
    version: next.version,
    at: deps.clock.now(),
    order: combat.order,
  };
  return { table: next, events: [event] };
}

export function handleNextTurn(table: LiveTable, deps: Deps): DispatchResult {
  const combat = nextTurn(table.combat);
  const next = bump({ ...table, combat });
  const event: GameEvent = {
    type: 'TurnAdvanced',
    version: next.version,
    at: deps.clock.now(),
    combat,
  };
  return { table: next, events: [event] };
}

export function handlePrevTurn(table: LiveTable, deps: Deps): DispatchResult {
  const combat = prevTurn(table.combat);
  const next = bump({ ...table, combat });
  const event: GameEvent = {
    type: 'TurnAdvanced',
    version: next.version,
    at: deps.clock.now(),
    combat,
  };
  return { table: next, events: [event] };
}

export function handleSetCondition(
  table: LiveTable,
  cmd: SetConditionCommand,
  deps: Deps,
): DispatchResult {
  const target = requireCombatant(table, cmd.combatantId);
  const updated = setCondition(target, cmd.condition);
  const next = bump(replaceCombatant(table, updated));
  const event: GameEvent = {
    type: 'ConditionChanged',
    version: next.version,
    at: deps.clock.now(),
    combatant: projectCombatant(updated, dmViewer()),
  };
  return { table: next, events: [event] };
}

export function handleClearCondition(
  table: LiveTable,
  cmd: ClearConditionCommand,
  deps: Deps,
): DispatchResult {
  const target = requireCombatant(table, cmd.combatantId);
  const updated = clearCondition(target, cmd.conditionKey);
  const next = bump(replaceCombatant(table, updated));
  const event: GameEvent = {
    type: 'ConditionChanged',
    version: next.version,
    at: deps.clock.now(),
    combatant: projectCombatant(updated, dmViewer()),
  };
  return { table: next, events: [event] };
}

function hpChangeEvent(
  table: LiveTable,
  combatant: Combatant,
  logLine: CombatEvent,
): GameEvent {
  return {
    type: 'HpChanged',
    version: table.version,
    at: logLine.at,
    combatant: projectCombatant(combatant, dmViewer()),
    event: {
      id: logLine.id,
      text: logLine.text,
      color: logLine.color,
      visibility: logLine.visibility,
      at: logLine.at,
    },
  };
}

export function handleApplyDamage(
  table: LiveTable,
  cmd: ApplyDamageCommand,
  deps: Deps,
): DispatchResult {
  const target = requireCombatant(table, cmd.combatantId);
  const updated = applyDamage(target, cmd.amount);
  const at = deps.clock.now();
  const logLine: CombatEvent = {
    id: newCombatantId(),
    text: `${target.name} recibe ${cmd.amount} de daño`,
    color: 'red',
    visibility: 'public',
    at,
  };
  const next = bump({
    ...replaceCombatant(table, updated),
    eventLog: [...table.eventLog, logLine],
  });
  return { table: next, events: [hpChangeEvent(next, updated, logLine)] };
}

export function handleApplyHealing(
  table: LiveTable,
  cmd: ApplyHealingCommand,
  deps: Deps,
): DispatchResult {
  const target = requireCombatant(table, cmd.combatantId);
  const updated = applyHealing(target, cmd.amount);
  const at = deps.clock.now();
  const logLine: CombatEvent = {
    id: newCombatantId(),
    text: `${target.name} recupera ${cmd.amount} PV`,
    color: 'green',
    visibility: 'public',
    at,
  };
  const next = bump({
    ...replaceCombatant(table, updated),
    eventLog: [...table.eventLog, logLine],
  });
  return { table: next, events: [hpChangeEvent(next, updated, logLine)] };
}

function pushRoll(table: LiveTable, roll: DiceRoll): DispatchResult {
  const next = bump({ ...table, rollLog: [...table.rollLog, roll] });
  const event: GameEvent = {
    type: 'DiceRolled',
    version: next.version,
    at: roll.at,
    roll,
  };
  return { table: next, events: [event] };
}

function buildRoll(
  table: LiveTable,
  principal: Principal,
  deps: Deps,
  notation: string,
  visibility: Visibility,
): DiceRoll {
  if (!parseNotation(notation)) throw new InvalidNotation(notation);
  const result = rollNotation(notation, deps.rng);
  return {
    id: newCombatantId(),
    byUserId: principal.userId,
    byLabel: authorLabel(table, principal),
    notation,
    results: result.results,
    breakdown: result.breakdown,
    total: result.total,
    tone: result.tone,
    visibility,
    at: deps.clock.now(),
  };
}

export function handleRollDice(
  table: LiveTable,
  cmd: RollDiceCommand,
  principal: Principal,
  deps: Deps,
): DispatchResult {
  // Always public regardless of any client-supplied visibility (RollHidden is
  // the dm_only path); a player must not be able to inject a hidden roll.
  const roll = buildRoll(table, principal, deps, cmd.notation, 'public');
  return pushRoll(table, roll);
}

export function handleRollHidden(
  table: LiveTable,
  cmd: RollHiddenCommand,
  principal: Principal,
  deps: Deps,
): DispatchResult {
  const roll = buildRoll(table, principal, deps, cmd.notation, 'dm_only');
  return pushRoll(table, roll);
}

export function handleRollAttack(
  table: LiveTable,
  cmd: RollAttackCommand,
  principal: Principal,
  deps: Deps,
): DispatchResult {
  if (cmd.damage !== null && !parseNotation(cmd.damage)) {
    throw new InvalidNotation(cmd.damage);
  }
  const result = rollAttack({ toHitBonus: cmd.toHitBonus, damage: cmd.damage }, deps.rng);
  const roll: DiceRoll = {
    id: newCombatantId(),
    byUserId: principal.userId,
    byLabel: authorLabel(table, principal),
    notation: cmd.name,
    results: result.results,
    breakdown: result.breakdown,
    total: result.total,
    tone: result.tone,
    visibility: 'public',
    at: deps.clock.now(),
  };
  return pushRoll(table, roll);
}

export function handleAppendDmNote(
  table: LiveTable,
  cmd: AppendDmNoteCommand,
  deps: Deps,
): DispatchResult {
  const notes = table.dmNotes === '' ? cmd.notes : `${table.dmNotes}\n${cmd.notes}`;
  const next = bump({ ...table, dmNotes: notes });
  const event: GameEvent = {
    type: 'DmNotesUpdated',
    version: next.version,
    at: deps.clock.now(),
    notes,
  };
  return { table: next, events: [event] };
}

export function handleEndCombat(table: LiveTable, deps: Deps): DispatchResult {
  const combat = { ...table.combat, active: false };
  const next = bump({ ...table, combat });
  const event: GameEvent = {
    type: 'CombatEnded',
    version: next.version,
    at: deps.clock.now(),
    combat,
  };
  return { table: next, events: [event] };
}

/**
 * Server-side visibility projection (SPEC §2). This is the ONLY place that
 * decides what a given viewer (the DM or a specific player) is allowed to see
 * of a `LiveTable`. The DM always gets the full truth (`MasterSnapshot`); a
 * player gets a structurally-filtered `PlayerSnapshot` that has no field
 * capable of carrying a dm-only secret (no `dmNotes`, no numeric HP for
 * hidden combatants, no dm-only rolls or events).
 */
import type { Combatant, LiveTable, Role } from '../types.js';
import type { UserId } from '../ids.js';
import type { MasterSnapshot, PlayerSnapshot, PublicCombatantDTO } from '@grimorio/shared/wire';
import { hpStatusLabel } from './statusLabel.js';

export interface Viewer {
  userId: UserId;
  role: Role;
}

function canSeeNumericHp(combatant: Combatant, viewer: Viewer): boolean {
  return viewer.role === 'dm' || combatant.hpVisibility !== 'dm_only';
}

export function projectCombatant(combatant: Combatant, viewer: Viewer): PublicCombatantDTO {
  const base: PublicCombatantDTO = {
    id: combatant.id,
    type: combatant.type,
    name: combatant.name,
    initiative: combatant.initiative,
    conditions: combatant.conditions,
  };

  if (canSeeNumericHp(combatant, viewer)) {
    return { ...base, currentHp: combatant.currentHp, maxHp: combatant.maxHp };
  }

  return { ...base, statusLabel: hpStatusLabel(combatant.currentHp, combatant.maxHp) };
}

export function projectLiveTable(
  table: LiveTable,
  viewer: Viewer,
): MasterSnapshot | PlayerSnapshot {
  const combatants = table.combatants.map((c) => projectCombatant(c, viewer));

  if (viewer.role === 'dm') {
    const snapshot: MasterSnapshot = {
      liveTableId: table.id,
      campaignId: table.campaignId,
      combatants,
      combat: table.combat,
      rollLog: table.rollLog,
      eventLog: table.eventLog,
      version: table.version,
      viewerRole: 'dm',
      dmNotes: table.dmNotes,
    };
    return snapshot;
  }

  const snapshot: PlayerSnapshot = {
    liveTableId: table.id,
    campaignId: table.campaignId,
    combatants,
    combat: table.combat,
    rollLog: table.rollLog.filter((roll) => roll.visibility !== 'dm_only'),
    eventLog: table.eventLog.filter((event) => event.visibility !== 'dm_only'),
    version: table.version,
    viewerRole: 'player',
    ownCharacterId: null,
  };
  return snapshot;
}

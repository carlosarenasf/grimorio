/**
 * Wire DTOs — the role-filtered snapshots the SERVER projects to clients.
 *
 * Crucial guarantee (SPEC §2): visibility filtering happens on the server. A
 * `PlayerSnapshot` is the post-projection shape, so it structurally cannot carry
 * dm-only secrets (no `dmNotes`, no numeric HP for hidden monsters, no hidden
 * rolls). `PublicCombatantDTO` exposes a derived `statusLabel` instead of HP for
 * dm-only combatants. These types are self-contained (no backend import) so the
 * frontend can depend on `shared/` alone.
 */

export type Visibility = 'public' | 'dm_only' | 'owner';
export type Role = 'dm' | 'player';
export type CombatantType = 'pc' | 'monster';
export type RollTone = 'normal' | 'crit' | 'fumble';

/** Public HP status label derived from the HP ratio of a dm-only combatant. */
export type HpStatusLabel = 'Intacto' | 'Herido' | 'Malherido' | 'Caído';

export interface ConditionDTO {
  key: string;
  label: string;
  color: string;
}

export interface DiceRollDTO {
  id: string;
  byUserId: string;
  byLabel: string;
  notation: string;
  results: number[];
  breakdown: string;
  total: number;
  tone: RollTone;
  visibility: Visibility;
  at: string;
}

export interface CombatEventDTO {
  id: string;
  text: string;
  color: string;
  visibility: Visibility;
  at: string;
}

export interface CombatStateDTO {
  active: boolean;
  round: number;
  order: string[];
  currentTurnIndex: number;
}

/**
 * A combatant as seen by a client. For dm-only combatants projected to players,
 * `currentHp`/`maxHp` are omitted and `statusLabel` carries the derived label.
 * For the master (or public combatants) numeric HP is present and `statusLabel`
 * is omitted.
 */
export interface PublicCombatantDTO {
  id: string;
  type: CombatantType;
  name: string;
  initiative: number;
  /** For a PC combatant, the CharacterId it represents (so clients can match it). */
  characterId?: string;
  conditions: ConditionDTO[];
  /** Present only when the viewer may see numeric HP. */
  currentHp?: number;
  /** Present only when the viewer may see numeric HP. */
  maxHp?: number;
  /** Present only when HP is hidden from this viewer (dm_only projected to player). */
  statusLabel?: HpStatusLabel;
}

interface BaseSnapshot {
  liveTableId: string;
  campaignId: string;
  combatants: PublicCombatantDTO[];
  combat: CombatStateDTO;
  rollLog: DiceRollDTO[];
  eventLog: CombatEventDTO[];
  version: number;
}

/** The master's full view: numeric HP everywhere, dm notes, hidden rolls. */
export interface MasterSnapshot extends BaseSnapshot {
  viewerRole: 'dm';
  dmNotes: string;
}

/**
 * The player's filtered view: hidden-monster HP is a status label, dm notes and
 * hidden rolls are absent (the type literally has no field to hold them).
 */
export interface PlayerSnapshot extends BaseSnapshot {
  viewerRole: 'player';
  /** The viewer's own character id, if any (so the client can highlight it). */
  ownCharacterId: string | null;
}

export type Snapshot = MasterSnapshot | PlayerSnapshot;

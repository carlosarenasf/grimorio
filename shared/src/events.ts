/**
 * Event payload types — what the server emits after applying a command (SPEC §6).
 *
 * Events are the outbound, role-filtered notifications streamed over WS. Like the
 * snapshot DTOs in wire.ts these are self-contained (no backend import) so the
 * frontend reducer can be typed against them. A `dm_only` event is only delivered
 * to the master's socket; the player reducer never receives one.
 */
import type {
  CombatEventDTO,
  CombatStateDTO,
  DiceRollDTO,
  PublicCombatantDTO,
  Snapshot,
} from './wire.js';

export type EventType =
  | 'UserRegistered'
  | 'SessionStarted'
  | 'CampaignCreated'
  | 'CampaignUpdated'
  | 'InviteIssued'
  | 'MemberJoined'
  | 'CharacterCreated'
  | 'CharacterUpdated'
  | 'CombatStarted'
  | 'CombatantAdded'
  | 'InitiativeSet'
  | 'InitiativeReordered'
  | 'TurnAdvanced'
  | 'ConditionChanged'
  | 'HpChanged'
  | 'DiceRolled'
  | 'DmNotesUpdated'
  | 'CombatEnded';

interface EventBase<T extends EventType> {
  type: T;
  /** Live-table version this event brings the client to (ordering / dedupe). */
  version: number;
  at: string;
}

// ---------- Account & campaign events ----------

export interface UserRegistered extends EventBase<'UserRegistered'> {
  userId: string;
  displayName: string;
}

export interface SessionStarted extends EventBase<'SessionStarted'> {
  userId: string;
  displayName: string;
}

export interface CampaignCreated extends EventBase<'CampaignCreated'> {
  campaignId: string;
  joinCode: string;
}

export interface CampaignUpdated extends EventBase<'CampaignUpdated'> {
  campaignId: string;
}

export interface InviteIssued extends EventBase<'InviteIssued'> {
  campaignId: string;
  joinCode: string;
}

export interface MemberJoined extends EventBase<'MemberJoined'> {
  campaignId: string;
  userId: string;
}

export interface CharacterCreated extends EventBase<'CharacterCreated'> {
  characterId: string;
  campaignId: string;
}

export interface CharacterUpdated extends EventBase<'CharacterUpdated'> {
  characterId: string;
}

// ---------- Live combat events ----------

export interface CombatStarted extends EventBase<'CombatStarted'> {
  combat: CombatStateDTO;
}

export interface CombatantAdded extends EventBase<'CombatantAdded'> {
  combatant: PublicCombatantDTO;
}

export interface InitiativeSet extends EventBase<'InitiativeSet'> {
  combatantId: string;
  initiative: number;
}

export interface InitiativeReordered extends EventBase<'InitiativeReordered'> {
  order: string[];
}

export interface TurnAdvanced extends EventBase<'TurnAdvanced'> {
  combat: CombatStateDTO;
}

export interface ConditionChanged extends EventBase<'ConditionChanged'> {
  combatant: PublicCombatantDTO;
}

export interface HpChanged extends EventBase<'HpChanged'> {
  combatant: PublicCombatantDTO;
  /** Optional log line accompanying the HP change. */
  event?: CombatEventDTO;
}

export interface DiceRolled extends EventBase<'DiceRolled'> {
  roll: DiceRollDTO;
}

/** dm_only — only ever delivered to the master's socket. */
export interface DmNotesUpdated extends EventBase<'DmNotesUpdated'> {
  notes: string;
}

export interface CombatEnded extends EventBase<'CombatEnded'> {
  combat: CombatStateDTO;
}

export type GameEvent =
  | UserRegistered
  | SessionStarted
  | CampaignCreated
  | CampaignUpdated
  | InviteIssued
  | MemberJoined
  | CharacterCreated
  | CharacterUpdated
  | CombatStarted
  | CombatantAdded
  | InitiativeSet
  | InitiativeReordered
  | TurnAdvanced
  | ConditionChanged
  | HpChanged
  | DiceRolled
  | DmNotesUpdated
  | CombatEnded;

/**
 * The outbound WS envelope: either a full snapshot (on connect / reconnect) or an
 * incremental event.
 */
export type ServerMessage =
  | { kind: 'snapshot'; snapshot: Snapshot }
  | { kind: 'event'; event: GameEvent };

/**
 * Principal + Deps shapes for the live-table command pipeline.
 *
 * A `Principal` is the already-authenticated caller (resolved by the transport
 * layer from the WS/HTTP session). `dispatchLiveCommand` authorizes a command
 * against it before applying any state change. The authorization rules live in
 * `dispatch.ts`; this module only declares the shapes.
 */
import type { UserId } from '../../domain/ids.js';
import type { LiveTable, Role } from '../../domain/types.js';
import type {
  CharacterRepository,
  Clock,
  LiveTableRepository,
  Rng,
  SrdProvider,
} from '../ports.js';
import type { GameEvent } from '@grimorio/shared/events';

export interface Principal {
  userId: UserId;
  role: Role; // 'dm' | 'player'
}

export interface Deps {
  tables: LiveTableRepository;
  srd: SrdProvider;
  rng: Rng;
  clock: Clock;
  /** Used by the WS gateway to auto-seat a connecting player's character. */
  characters?: CharacterRepository;
}

/** Result of applying one command: the new table plus the events to broadcast. */
export interface DispatchResult {
  table: LiveTable;
  events: GameEvent[];
}

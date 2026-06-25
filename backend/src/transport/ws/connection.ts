/**
 * Per-socket message handling for the live WS gateway — pure orchestration over
 * the application layer, with NO Fastify/ws dependency so it is unit-testable
 * with fake sockets.
 *
 * Flow for an inbound command (`handleMessage`):
 *   1. Parse the raw frame with `CommandSchema`; on a parse failure, reply to
 *      the SENDER only with an error envelope (never throw, never broadcast).
 *   2. Load the campaign's current live table, `dispatchLiveCommand` it; an
 *      authorization/domain error (e.g. a player issuing a DM-only command)
 *      becomes an error reply to the sender only — no state change, no broadcast.
 *   3. Persist the new table.
 *   4. Fan out to EVERY socket in the room its OWN role-filtered snapshot
 *      (`projectLiveTable(newTable, that client's principal)`), so visibility is
 *      enforced per-recipient on the way out.
 *
 * On (re)connect (`sendInitialSnapshot`): resolve/get-or-create the live table
 * and send the joining socket its filtered snapshot. A reconnect is just a fresh
 * join, so this simply re-sends the current snapshot.
 */
import { CommandSchema } from '@grimorio/shared/commands';
import type { Snapshot } from '@grimorio/shared/wire';
import {
  dispatchLiveCommand,
  getOrCreateLiveTable,
  seatCharacter,
} from '../../application/livetable/index.js';
import type { Deps as LiveDeps, Principal } from '../../application/livetable/index.js';
import { LiveTableError } from '../../application/livetable/index.js';
import { projectLiveTable } from '../../domain/visibility/index.js';
import type { CampaignId, CharacterId } from '../../domain/ids.js';
import type { WsClient, RoomManager } from './room.js';

/** Outbound envelope: a role-filtered snapshot, or a sender-only error. */
export type OutboundMessage =
  | { kind: 'snapshot'; snapshot: Snapshot }
  | { kind: 'error'; error: { code: string; message: string } };

export interface ConnectionContext {
  /** The room id (equals the campaign id — one live room per campaign). */
  roomId: string;
  campaignId: CampaignId;
  principal: Principal;
  client: WsClient;
  rooms: RoomManager;
  deps: LiveDeps;
}

function send(client: WsClient, message: OutboundMessage): void {
  client.send(JSON.stringify(message));
}

function snapshotFor(
  table: Parameters<typeof projectLiveTable>[0],
  principal: Principal,
): OutboundMessage {
  return { kind: 'snapshot', snapshot: projectLiveTable(table, principal) };
}

/**
 * Send the (re)joining socket its current role-filtered snapshot. For a player
 * who owns a character in this campaign and isn't seated yet, auto-seat them as
 * a PC combatant first (so their token, ownCharacterId, and EndMyTurn work), and
 * broadcast the updated table to everyone in the room.
 */
export async function sendInitialSnapshot(ctx: ConnectionContext): Promise<void> {
  let table = await getOrCreateLiveTable(ctx.campaignId, ctx.deps.tables);

  if (ctx.principal.role === 'player' && ctx.deps.characters) {
    const sheets = await ctx.deps.characters.listByCampaign(ctx.campaignId);
    const mine = sheets.find((s) => s.ownerId === ctx.principal.userId);
    if (mine) {
      const seated = seatCharacter(table, mine, ctx.deps.clock);
      if (seated) {
        table = seated.table;
        await ctx.deps.tables.save(table);
        for (const { client, principal } of ctx.rooms.clientsOf(ctx.roomId)) {
          send(client, snapshotFor(table, principal));
        }
        return;
      }
    }
  }

  send(ctx.client, snapshotFor(table, ctx.principal));
}

/**
 * Handle one inbound raw frame from a socket. Errors are reported to the sender
 * only; success broadcasts a per-recipient filtered snapshot to the whole room.
 */
export async function handleMessage(raw: string, ctx: ConnectionContext): Promise<void> {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    send(ctx.client, {
      kind: 'error',
      error: { code: 'BadRequest', message: 'Invalid JSON' },
    });
    return;
  }

  const parsed = CommandSchema.safeParse(parsedJson);
  if (!parsed.success) {
    send(ctx.client, {
      kind: 'error',
      error: { code: 'BadRequest', message: 'Invalid command' },
    });
    return;
  }

  // SeatPlayer needs an async character lookup (repo), so it is handled here
  // rather than in the synchronous dispatcher. DM-only.
  if (parsed.data.type === 'SeatPlayer') {
    await handleSeatPlayer(parsed.data.characterId, ctx);
    return;
  }

  const current = await getOrCreateLiveTable(ctx.campaignId, ctx.deps.tables);

  let result;
  try {
    result = dispatchLiveCommand(current, parsed.data, ctx.principal, ctx.deps);
  } catch (err) {
    if (err instanceof LiveTableError) {
      send(ctx.client, { kind: 'error', error: { code: err.code, message: err.message } });
      return;
    }
    throw err;
  }

  await ctx.deps.tables.save(result.table);
  broadcast(ctx, result.table);
}

/** Fan out a fresh, per-recipient role-filtered snapshot to the whole room. */
function broadcast(ctx: ConnectionContext, table: Parameters<typeof snapshotFor>[0]): void {
  for (const { client, principal } of ctx.rooms.clientsOf(ctx.roomId)) {
    send(client, snapshotFor(table, principal));
  }
}

/** DM seats a campaign character into combat (async character lookup). */
async function handleSeatPlayer(characterId: string, ctx: ConnectionContext): Promise<void> {
  if (ctx.principal.role !== 'dm') {
    send(ctx.client, { kind: 'error', error: { code: 'Forbidden', message: 'Solo el máster' } });
    return;
  }
  if (!ctx.deps.characters) {
    send(ctx.client, { kind: 'error', error: { code: 'Unavailable', message: 'Sin personajes' } });
    return;
  }
  const sheet = await ctx.deps.characters.findById(characterId as CharacterId);
  if (!sheet || sheet.campaignId !== ctx.campaignId) {
    send(ctx.client, {
      kind: 'error',
      error: { code: 'CombatantNotFound', message: 'Personaje no encontrado' },
    });
    return;
  }
  let table = await getOrCreateLiveTable(ctx.campaignId, ctx.deps.tables);
  const seated = seatCharacter(table, sheet, ctx.deps.clock);
  if (seated) {
    table = seated.table;
    await ctx.deps.tables.save(table);
  }
  broadcast(ctx, table);
}

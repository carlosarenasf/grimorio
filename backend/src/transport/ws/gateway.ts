/**
 * Fastify @fastify/websocket wiring for the live gateway — intentionally THIN.
 *
 * All real logic lives in `RoomManager` (room registry / fan-out) and
 * `connection.ts` (parse + dispatch + filtered broadcast), both unit-tested with
 * fake sockets. This module only:
 *   - authenticates the upgrade from the session cookie (`verifySession`; 401 on
 *     failure),
 *   - resolves the caller's per-campaign role from membership (closes on
 *     non-member),
 *   - wraps the raw socket as a minimal `WsClient`, joins the room, sends the
 *     initial snapshot, and wires the message/close handlers.
 */
import type { FastifyInstance } from 'fastify';
// Side-effect import: activates @fastify/websocket's declaration merging so the
// `{ websocket: true }` route option and the `(socket, request)` handler
// signature are typed.
import '@fastify/websocket';
import { verifySession } from '../auth/session.js';
import type { CampaignRepository } from '../../application/ports.js';
import type { Deps as LiveDeps, Principal } from '../../application/livetable/index.js';
import type { Config } from '../../config.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import type { Role } from '../../domain/types.js';
import { RoomManager, type WsClient } from './room.js';
import { handleMessage, sendInitialSnapshot } from './connection.js';

export interface WsGatewayDeps {
  config: Config;
  campaigns: CampaignRepository;
  live: LiveDeps;
  /** Shared across connections so all sockets of a campaign share one room. */
  rooms?: RoomManager;
}

async function resolveRole(
  campaigns: CampaignRepository,
  campaignId: CampaignId,
  userId: UserId,
): Promise<Role | null> {
  const campaign = await campaigns.findById(campaignId);
  if (!campaign) return null;
  const member = campaign.members.find((m) => m.userId === userId);
  return member ? member.role : null;
}

export function registerWsGateway(app: FastifyInstance, deps: WsGatewayDeps): void {
  const rooms = deps.rooms ?? new RoomManager();

  app.get('/ws/:campaignId', { websocket: true }, async (socket, request) => {
    const params = request.params as { campaignId: string };
    const campaignId = params.campaignId as CampaignId;

    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    let token = cookies?.[deps.config.cookieName];
    if (!token) {
      const query = request.query as { token?: string };
      token = query.token;
    }
    const session = verifySession(token, deps.config.sessionSecret);
    if (!session) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    const userId = session.userId as UserId;
    const role = await resolveRole(deps.campaigns, campaignId, userId);
    if (!role) {
      socket.close(4403, 'Forbidden');
      return;
    }

    const principal: Principal = { userId, role };
    const client: WsClient = { send: (data) => socket.send(data) };
    const roomId = campaignId;

    rooms.join(roomId, client, principal);
    await sendInitialSnapshot({
      roomId,
      campaignId,
      principal,
      client,
      rooms,
      deps: deps.live,
    });

    socket.on('message', (raw: Buffer) => {
      void handleMessage(raw.toString(), {
        roomId,
        campaignId,
        principal,
        client,
        rooms,
        deps: deps.live,
      });
    });

    socket.on('close', () => {
      rooms.leave(roomId, client);
    });
  });
}

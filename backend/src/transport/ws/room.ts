/**
 * Transport-agnostic room registry for the live WS gateway.
 *
 * `RoomManager` tracks which sockets are joined to which room (one room per
 * campaign) together with each socket's resolved principal (userId + role).
 * It is deliberately ignorant of Fastify/ws: it speaks only the minimal
 * `WsClient` interface, so it can be driven in unit tests with fake sockets
 * (`{ send: vi.fn() }`). The role-filtered fan-out lives in `WsBroadcaster`,
 * which routes already-projected payloads to the right sockets.
 */
import type { Role } from '../../domain/types.js';
import type { UserId } from '../../domain/ids.js';
import type { Broadcaster, RoleAwarePayload } from '../../application/ports.js';

/** The only capability the room/broadcaster need from a live socket. */
export interface WsClient {
  send(data: string): void;
}

export interface RoomPrincipal {
  userId: UserId;
  role: Role;
}

interface Member {
  client: WsClient;
  principal: RoomPrincipal;
}

export class RoomManager {
  private readonly rooms = new Map<string, Member[]>();

  join(roomId: string, client: WsClient, principal: RoomPrincipal): void {
    const members = this.rooms.get(roomId) ?? [];
    // A fresh join by an already-present socket replaces its membership (idempotent).
    const filtered = members.filter((m) => m.client !== client);
    filtered.push({ client, principal });
    this.rooms.set(roomId, filtered);
  }

  leave(roomId: string, client: WsClient): void {
    const members = this.rooms.get(roomId);
    if (!members) return;
    const remaining = members.filter((m) => m.client !== client);
    if (remaining.length === 0) {
      this.rooms.delete(roomId);
    } else {
      this.rooms.set(roomId, remaining);
    }
  }

  clientsOf(roomId: string): Array<{ client: WsClient; principal: RoomPrincipal }> {
    const members = this.rooms.get(roomId);
    return members ? members.map((m) => ({ client: m.client, principal: m.principal })) : [];
  }
}

/**
 * `Broadcaster` adapter over a `RoomManager`. Given the per-recipient,
 * already-role-filtered payloads, it sends each one (as its own JSON snapshot
 * envelope) to the matching socket(s) in the room. It never decides visibility
 * itself — the application produced the filtered `data` via the domain
 * projection.
 */
export class WsBroadcaster implements Broadcaster {
  constructor(private readonly rooms: RoomManager) {}

  toRoom(roomId: string, payloads: RoleAwarePayload[]): void {
    const members = this.rooms.clientsOf(roomId);
    for (const payload of payloads) {
      const json = JSON.stringify(payload.data);
      for (const { client, principal } of members) {
        if (principal.userId === payload.userId) {
          client.send(json);
        }
      }
    }
  }
}

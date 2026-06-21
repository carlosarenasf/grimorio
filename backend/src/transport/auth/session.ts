/**
 * Stateless session token carried in an httpOnly cookie.
 *
 * The token encodes only IDENTITY (userId + displayName), HMAC-signed with the
 * server secret. It deliberately does NOT carry a role: a user's role (dm vs
 * player) is per-campaign, resolved at room-join time from campaign membership.
 * Both the HTTP layer (sets the cookie on login/register) and the WS gateway
 * (authenticates the upgrade) use this util so the format stays consistent.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SessionPrincipal {
  userId: string;
  displayName: string;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Produce a cookie value: base64url(json).signature */
export function signSession(principal: SessionPrincipal, secret: string): string {
  const payload = Buffer.from(JSON.stringify(principal), 'utf8').toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify and decode a cookie value; returns null if missing/tampered. */
export function verifySession(token: string | undefined, secret: string): SessionPrincipal | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(payload, secret);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as SessionPrincipal;
    if (typeof parsed?.userId !== 'string' || typeof parsed?.displayName !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

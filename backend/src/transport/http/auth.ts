/**
 * Cookie helpers + the `requireSession` preHandler.
 *
 * The session cookie carries only identity (`SessionPrincipal`); role is
 * always resolved per-campaign (see `membership.ts`), never from the cookie.
 */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { signSession, verifySession, type SessionPrincipal } from '../auth/session.js';
import type { Config } from '../../config.js';
import { UnauthorizedError } from './errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    principal?: SessionPrincipal;
  }
}

/** Sign and set the httpOnly session cookie on the reply. */
export function setSessionCookie(
  reply: FastifyReply,
  principal: SessionPrincipal,
  config: Config,
): void {
  const token = signSession(principal, config.sessionSecret);
  reply.setCookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

/** Clear the session cookie on the reply (logout). */
export function clearSessionCookie(reply: FastifyReply, config: Config): void {
  reply.clearCookie(config.cookieName, { path: '/' });
}

/** Resolve the session principal from the request's cookie, or null. */
export function readSession(req: FastifyRequest, config: Config): SessionPrincipal | null {
  const token = req.cookies[config.cookieName];
  return verifySession(token, config.sessionSecret);
}

/**
 * Fastify preHandler factory: rejects with `UnauthorizedError` (mapped to 401
 * by the error handler) unless a valid session cookie is present, otherwise
 * attaches the principal to `req.principal`.
 */
export function requireSession(config: Config) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const principal = readSession(req, config);
    if (!principal) {
      throw new UnauthorizedError();
    }
    req.principal = principal;
  };
}

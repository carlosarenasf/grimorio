/**
 * Composition root for the Fastify app: wires the cross-cutting plugins
 * (cookies, CORS, websocket upgrade) and both transports onto one instance.
 *
 * Kept separate from `main.ts` so tests can build a fully-wired app over
 * injected (in-memory) deps without binding a port or touching the network —
 * see `buildServer.test.ts`.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { HttpDeps } from './http/index.js';
import { registerHttpRoutes } from './http/index.js';
import type { WsGatewayDeps } from './ws/index.js';
import { registerWsGateway } from './ws/index.js';
import { registerHealth } from './health.js';
import type { Config } from '../config.js';

export interface ServerDeps {
  http: HttpDeps;
  ws: WsGatewayDeps;
  config: Config;
  /** Forwarded to Fastify's `logger` option; defaults to off (quiet tests). */
  logger?: boolean;
}

export function buildServer(deps: ServerDeps): FastifyInstance {
  // Logger off by default so test output (and `app.inject` in tests) stays
  // quiet; `main.ts` is the one real caller that wants boot/request logs.
  const app = Fastify({ logger: deps.logger ?? false });

  // Cookies are credentialed, so the browser rejects a wildcard
  // `Access-Control-Allow-Origin`. When `corsOrigin` is the dev default '*',
  // reflect the request's Origin instead (`origin: true` echoes a concrete
  // origin, compatible with credentials). In production `assertSafeForProduction`
  // requires an explicit origin, so this reflection only ever applies in dev.
  const corsOrigin = deps.config.corsOrigin === '*' ? true : deps.config.corsOrigin;
  app.register(cors, {
    origin: corsOrigin,
    credentials: true,
    // Be explicit so preflight allows PATCH/PUT/DELETE (the character wizard
    // PATCHes scores) — otherwise the browser blocks them with a CORS error.
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.register(websocket);

  // Treat an empty JSON body as `{}` instead of erroring 500 — some POSTs carry
  // no body (logout, invite, join) yet clients may still send a JSON content-type.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, done) => {
      const text = typeof body === 'string' ? body.trim() : '';
      if (text.length === 0) {
        done(null, {});
        return;
      }
      try {
        done(null, JSON.parse(text));
      } catch (err) {
        (err as { statusCode?: number }).statusCode = 400;
        done(err as Error, undefined);
      }
    },
  );

  registerHealth(app);
  // registerHttpRoutes registers @fastify/cookie itself; safe to call directly.
  registerHttpRoutes(app, deps.http);

  // The WS gateway's `{ websocket: true }` routes must be registered AFTER
  // @fastify/websocket has loaded. Deferring them inside a plugin guarantees the
  // ordering (plugins load in registration order: websocket → this), so the
  // route actually upgrades instead of being treated as a plain GET.
  app.register(async (instance) => {
    registerWsGateway(instance, deps.ws);
  });

  return app;
}

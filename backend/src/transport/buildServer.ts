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

  app.register(cors, { origin: deps.config.corsOrigin, credentials: true });
  app.register(websocket);

  registerHealth(app);
  // registerHttpRoutes registers @fastify/cookie itself; safe to call directly.
  registerHttpRoutes(app, deps.http);
  registerWsGateway(app, deps.ws);

  return app;
}

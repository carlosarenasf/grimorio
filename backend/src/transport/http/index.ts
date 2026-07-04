/**
 * Public surface of the HTTP transport: `HttpDeps` (what the composition root
 * must inject) and `registerHttpRoutes` (the Fastify plugin/registrar).
 */
import type { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import type {
  CampaignRepository,
  CharacterRepository,
  LiveTableRepository,
  MapRepository,
  PasswordHasher,
  SrdProvider,
  UserRepository,
} from '../../application/ports.js';
import type { Clock, Rng } from '../../domain/ports.js';
import type { Config } from '../../config.js';
import { registerHttpRoutes as registerRoutes } from './routes.js';

export interface HttpDeps {
  users: UserRepository;
  campaigns: CampaignRepository;
  characters: CharacterRepository;
  tables: LiveTableRepository;
  maps: MapRepository;
  hasher: PasswordHasher;
  clock: Clock;
  rng: Rng;
  srd: SrdProvider;
  config: Config;
}

/**
 * Registers `@fastify/cookie` and all HTTP routes on `app`. Safe to call
 * directly (not via `app.register`) since it only needs `app` to already be
 * a Fastify instance — callers in tests use it synchronously with `app.inject`.
 */
export function registerHttpRoutes(app: FastifyInstance, deps: HttpDeps): void {
  app.register(cookie);
  registerRoutes(app, deps);
}

export { resolveRole } from './membership.js';
export { statusForError, bodyForError, UnauthorizedError, NotCampaignMemberError } from './errors.js';
export { requireSession, setSessionCookie, clearSessionCookie, readSession } from './auth.js';

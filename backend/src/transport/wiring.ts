/**
 * Picks concrete adapters for the ports the transports need, per SPEC §8:
 * Postgres when `DATABASE_URL` is configured (production), in-memory
 * otherwise (local dev / no DB available). Both `HttpDeps` and
 * `WsGatewayDeps` share the same repo/clock/rng/srd instances so the two
 * transports see one consistent view of the world.
 */
import {
  InMemoryCampaignRepository,
  InMemoryCharacterRepository,
  InMemoryLiveTableRepository,
  InMemoryUserRepository,
  RealRng,
  SystemClock,
} from '../infra/memory/index.js';
import {
  PostgresCampaignRepository,
  PostgresCharacterRepository,
  PostgresLiveTableRepository,
  PostgresUserRepository,
  createSqlClient,
  migrate,
} from '../infra/postgres/index.js';
import { Argon2Hasher } from '../infra/crypto/argon2Hasher.js';
import { StaticSrdProvider } from '../domain/srd/index.js';
import type { Config } from '../config.js';
import type { HttpDeps } from './http/index.js';
import type { WsGatewayDeps } from './ws/index.js';

export interface BuiltDeps {
  http: HttpDeps;
  ws: WsGatewayDeps;
}

export async function buildDeps(config: Config): Promise<BuiltDeps> {
  const repos = config.databaseUrl
    ? await buildPostgresRepos(config.databaseUrl)
    : buildInMemoryRepos();

  const hasher = new Argon2Hasher();
  const clock = new SystemClock();
  const rng = new RealRng();
  const srd = new StaticSrdProvider();

  const http: HttpDeps = {
    users: repos.users,
    campaigns: repos.campaigns,
    characters: repos.characters,
    tables: repos.tables,
    hasher,
    clock,
    rng,
    srd,
    config,
  };

  const ws: WsGatewayDeps = {
    config,
    campaigns: repos.campaigns,
    live: { tables: repos.tables, srd, rng, clock, characters: repos.characters },
  };

  return { http, ws };
}

interface Repos {
  users: HttpDeps['users'];
  campaigns: HttpDeps['campaigns'];
  characters: HttpDeps['characters'];
  tables: HttpDeps['tables'];
}

function buildInMemoryRepos(): Repos {
  return {
    users: new InMemoryUserRepository(),
    campaigns: new InMemoryCampaignRepository(),
    characters: new InMemoryCharacterRepository(),
    tables: new InMemoryLiveTableRepository(),
  };
}

async function buildPostgresRepos(databaseUrl: string): Promise<Repos> {
  const sql = createSqlClient(databaseUrl);
  await migrate(sql);
  return {
    users: new PostgresUserRepository(sql),
    campaigns: new PostgresCampaignRepository(sql),
    characters: new PostgresCharacterRepository(sql),
    tables: new PostgresLiveTableRepository(sql),
  };
}

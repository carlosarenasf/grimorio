/**
 * Runtime configuration, read from the environment once at boot.
 *
 * `databaseUrl` is optional: when unset the composition root wires the in-memory
 * adapters (handy for local dev and tests), matching SPEC §8 (Postgres is the
 * source of truth in production, memory is a working cache).
 */
export interface Config {
  port: number;
  databaseUrl: string | undefined;
  sessionSecret: string;
  cookieName: string;
  /** Render free tier sleeps; the frontend origin is allowed for CORS. */
  corsOrigin: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: env.PORT ? Number(env.PORT) : 3000,
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET ?? 'dev-insecure-secret-change-me',
    cookieName: env.COOKIE_NAME ?? 'grimorio_session',
    corsOrigin: env.CORS_ORIGIN ?? '*',
  };
}

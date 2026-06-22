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

export const DEFAULT_SESSION_SECRET = 'dev-insecure-secret-change-me';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: env.PORT ? Number(env.PORT) : 3000,
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET ?? DEFAULT_SESSION_SECRET,
    cookieName: env.COOKIE_NAME ?? 'grimorio_session',
    corsOrigin: env.CORS_ORIGIN ?? '*',
  };
}

/**
 * Fail fast on unsafe production config (called from the process entrypoint, not
 * from buildServer, so tests can use defaults). A forgeable default session
 * secret or a wildcard CORS origin with credentialed cookies are footguns.
 * "Production" = NODE_ENV==='production' or a real database is configured.
 */
export function assertSafeForProduction(
  config: Config,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const isProd = env.NODE_ENV === 'production' || Boolean(config.databaseUrl);
  if (!isProd) return;
  const problems: string[] = [];
  if (!config.sessionSecret || config.sessionSecret === DEFAULT_SESSION_SECRET) {
    problems.push('SESSION_SECRET must be set to a strong, non-default value in production.');
  }
  if (config.corsOrigin === '*') {
    problems.push(
      'CORS_ORIGIN must be an explicit origin in production (a wildcard with credentialed cookies is unsafe).',
    );
  }
  if (problems.length > 0) {
    throw new Error('Unsafe production configuration:\n - ' + problems.join('\n - '));
  }
}

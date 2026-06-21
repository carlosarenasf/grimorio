import postgres from 'postgres';

/**
 * Create a `postgres` (postgres.js) client from a connection string.
 *
 * Kept as a one-line factory so repositories/migrate.ts depend on this
 * module rather than constructing clients ad hoc — makes it trivial to swap
 * connection options (ssl, max, etc.) in one place later.
 */
export function createSqlClient(connectionString: string): postgres.Sql {
  return postgres(connectionString);
}

export type { Sql } from 'postgres';

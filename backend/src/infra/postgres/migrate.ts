import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Sql } from 'postgres';

const MIGRATIONS_DIR = path.join(fileURLToPath(import.meta.url), '..', 'migrations');

/** Migration filenames applied in order, e.g. `001_init.sql`. Add new ones here in order. */
const MIGRATION_FILES = ['001_init.sql', '002_fix_double_encoded_jsonb.sql'];

/**
 * Run all migrations against `sql`, in order. Each file is idempotent
 * (`CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`), so calling
 * this multiple times against the same database is safe.
 */
export async function migrate(sql: Sql): Promise<void> {
  for (const file of MIGRATION_FILES) {
    const sqlText = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    await sql.unsafe(sqlText);
  }
}

/**
 * Pure helpers for mapping between domain aggregates and the JSONB snapshot
 * rows used by every Postgres repository (`{ id, ..., data }`). Extracted so
 * they can be unit-tested without a database (see rows.test.ts) — the
 * INTEGRATION test in postgres.test.ts is skipped without `DATABASE_URL`, but
 * this module's tests always run.
 *
 * postgres.js returns `jsonb` columns already parsed into plain JS values,
 * so `toSnapshot` is a type-asserting passthrough rather than a JSON.parse —
 * it exists to document and centralise that boundary (the "untrusted JSON
 * back into a typed aggregate" step) in one place per aggregate.
 */

/** Row shape every table shares: a primary key, lookup columns, and a JSONB snapshot. */
export interface SnapshotRow<T> {
  data: T;
}

/** Re-hydrate a JSONB snapshot column back into its domain type. */
export function toSnapshot<T>(row: SnapshotRow<T> | undefined): T | null {
  return row ? row.data : null;
}

/** Re-hydrate a list of JSONB snapshot rows back into domain aggregates. */
export function toSnapshots<T>(rows: readonly SnapshotRow<T>[]): T[] {
  return rows.map((row) => row.data);
}

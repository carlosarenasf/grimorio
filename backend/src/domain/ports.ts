/**
 * Domain-owned primitive ports (hexagonal architecture).
 *
 * In clean architecture the domain DEFINES the interfaces it needs and infra
 * IMPLEMENTS them. `Rng` and `Clock` are required by pure domain logic (dice
 * resolution, join codes, timestamps), so they live here — never imported from
 * `application/`. The application layer re-exports these for convenience and
 * adds its own driven ports (repositories, broadcaster, SRD) in `application/ports.ts`.
 */

/** Wall clock, injected so domain/handlers stay deterministic in tests. */
export interface Clock {
  /** ISO-8601 timestamp of "now". */
  now(): string;
}

/** Server-authoritative randomness for dice (SPEC §7). Never use Math.random in domain. */
export interface Rng {
  /** Inclusive integer in [min, max]. */
  int(min: number, max: number): number;
}

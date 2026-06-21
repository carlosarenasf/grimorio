import type { Clock } from '../domain/ports.js';

/**
 * Deterministic `Clock` test double. Starts at a fixed ISO timestamp (or a
 * default epoch) and only moves when `advance`/`set` is called explicitly —
 * never on its own — so application tests stay reproducible.
 */
export class FakeClock implements Clock {
  private current: number;

  constructor(iso: string = '2024-01-01T00:00:00.000Z') {
    this.current = Date.parse(iso);
  }

  now(): string {
    return new Date(this.current).toISOString();
  }

  /** Move the clock forward by `ms` milliseconds. */
  advance(ms: number): void {
    this.current += ms;
  }

  /** Jump the clock to an explicit ISO timestamp. */
  set(iso: string): void {
    this.current = Date.parse(iso);
  }
}

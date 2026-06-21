import type { Clock } from '../../domain/ports.js';

/** Real wall clock: `now()` returns the current ISO-8601 timestamp. */
export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

import { describe, expect, it } from 'vitest';
import { SystemClock } from './systemClock.js';

describe('SystemClock', () => {
  it('now() returns a valid ISO-8601 timestamp close to real time', () => {
    const clock = new SystemClock();
    const before = Date.now();
    const iso = clock.now();
    const after = Date.now();

    const parsed = Date.parse(iso);
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
    expect(iso).toBe(new Date(parsed).toISOString());
  });
});

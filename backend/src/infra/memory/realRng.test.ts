import { describe, expect, it } from 'vitest';
import { RealRng } from './realRng.js';

describe('RealRng', () => {
  it('int(min, max) always returns an integer within the inclusive range', () => {
    const rng = new RealRng();
    for (let i = 0; i < 200; i += 1) {
      const value = rng.int(1, 20);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it('int(n, n) always returns n', () => {
    const rng = new RealRng();
    expect(rng.int(5, 5)).toBe(5);
  });

  it('produces more than one distinct value across many rolls (not constant)', () => {
    const rng = new RealRng();
    const values = new Set<number>();
    for (let i = 0; i < 50; i += 1) {
      values.add(rng.int(1, 100));
    }
    expect(values.size).toBeGreaterThan(1);
  });
});

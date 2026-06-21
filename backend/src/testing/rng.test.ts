import { describe, expect, it } from 'vitest';
import { SeededRng } from './rng.js';

describe('SeededRng', () => {
  it('returns scripted values in order', () => {
    const rng = new SeededRng([5, 12, 1]);
    expect(rng.int(1, 20)).toBe(5);
    expect(rng.int(1, 20)).toBe(12);
    expect(rng.int(1, 20)).toBe(1);
  });

  it('cycles back to the start once the script is exhausted', () => {
    const rng = new SeededRng([3, 7]);
    expect(rng.int(1, 20)).toBe(3);
    expect(rng.int(1, 20)).toBe(7);
    expect(rng.int(1, 20)).toBe(3);
    expect(rng.int(1, 20)).toBe(7);
  });

  it('is deterministic: two instances with the same script produce the same sequence', () => {
    const a = new SeededRng([2, 4, 6]);
    const b = new SeededRng([2, 4, 6]);
    const seqA = [a.int(0, 10), a.int(0, 10), a.int(0, 10)];
    const seqB = [b.int(0, 10), b.int(0, 10), b.int(0, 10)];
    expect(seqA).toEqual(seqB);
  });

  it('given a numeric seed (no explicit script), produces a deterministic repeatable sequence', () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    const seqA = [a.int(1, 6), a.int(1, 6), a.int(1, 6)];
    const seqB = [b.int(1, 6), b.int(1, 6), b.int(1, 6)];
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
});

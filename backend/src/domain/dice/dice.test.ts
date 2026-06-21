import { describe, expect, it } from 'vitest';
import { parseNotation } from './parse.js';
import { rollAttack, rollNotation, rollWithAdvantage } from './roll.js';
import type { Rng } from '../ports.js';

/** Deterministic fake Rng that returns values from a fixed queue, cycling if exhausted. */
function fakeRng(...values: number[]): Rng {
  let i = 0;
  return {
    int(_min: number, _max: number): number {
      const v = values[i % values.length];
      i += 1;
      return v;
    },
  };
}

describe('parseNotation', () => {
  it('parses "2d6+3"', () => {
    expect(parseNotation('2d6+3')).toEqual({ count: 2, faces: 6, mod: 3 });
  });

  it('parses "1d20" with mod 0', () => {
    expect(parseNotation('1d20')).toEqual({ count: 1, faces: 20, mod: 0 });
  });

  it('parses "d8" with implicit count 1', () => {
    expect(parseNotation('d8')).toEqual({ count: 1, faces: 8, mod: 0 });
  });

  it('parses "1d20-1" with negative mod', () => {
    expect(parseNotation('1d20-1')).toEqual({ count: 1, faces: 20, mod: -1 });
  });

  it('is whitespace tolerant', () => {
    expect(parseNotation('  2d6 + 3  ')).toEqual({ count: 2, faces: 6, mod: 3 });
  });

  it('rejects an empty string', () => {
    expect(parseNotation('')).toBeNull();
  });

  it('rejects malformed notation like "2x6"', () => {
    expect(parseNotation('2x6')).toBeNull();
  });

  it('rejects dice with 1 face ("d1")', () => {
    expect(parseNotation('d1')).toBeNull();
  });

  it('rejects a count of 0 ("0d6")', () => {
    expect(parseNotation('0d6')).toBeNull();
  });

  it('rejects an excessive dice count ("999d20")', () => {
    expect(parseNotation('999d20')).toBeNull();
  });

  it('rejects faces not in the standard die set (e.g. "1d7")', () => {
    expect(parseNotation('1d7')).toBeNull();
  });
});

describe('rollNotation', () => {
  it('a "1d20" roll of 20 is tone "crit"', () => {
    const result = rollNotation('1d20', fakeRng(20));
    expect(result.tone).toBe('crit');
  });

  it('a "1d20" roll of 1 is tone "fumble"', () => {
    const result = rollNotation('1d20', fakeRng(1));
    expect(result.tone).toBe('fumble');
  });

  it('a "1d20" roll of 10 is tone "normal"', () => {
    const result = rollNotation('1d20', fakeRng(10));
    expect(result.tone).toBe('normal');
  });

  it('rolls "2d6+3" producing 2 results, the correct total, and a readable breakdown', () => {
    const result = rollNotation('2d6+3', fakeRng(4, 5));
    expect(result.results).toEqual([4, 5]);
    expect(result.total).toBe(12);
    expect(result.breakdown).toBe('4 + 5 + 3');
  });

  it('a multi-die roll is never tone "crit" or "fumble" even on max/min faces', () => {
    const result = rollNotation('2d20', fakeRng(20, 20));
    expect(result.tone).toBe('normal');
  });
});

describe('rollAttack', () => {
  it('breakdown includes both the hit roll and the damage roll', () => {
    const result = rollAttack({ toHitBonus: 7, damage: '1d8+4' }, fakeRng(10, 6));
    expect(result.breakdown).toContain('to hit');
    expect(result.breakdown).toContain('damage');
  });

  it('a natural 20 on the to-hit roll is tone "crit"', () => {
    const result = rollAttack({ toHitBonus: 7, damage: '1d8+4' }, fakeRng(20, 6));
    expect(result.tone).toBe('crit');
  });

  it('a natural 1 on the to-hit roll is tone "fumble"', () => {
    const result = rollAttack({ toHitBonus: 7, damage: '1d8+4' }, fakeRng(1, 6));
    expect(result.tone).toBe('fumble');
  });

  it('works with toHitBonus null and only damage (e.g. a save-based spell)', () => {
    const result = rollAttack({ toHitBonus: null, damage: '2d6' }, fakeRng(3, 4));
    expect(result.results).toEqual([3, 4]);
    expect(result.total).toBe(7);
    expect(result.breakdown).not.toContain('to hit');
    expect(result.breakdown).toContain('damage');
    expect(result.tone).toBe('normal');
  });
});

describe('rollWithAdvantage', () => {
  it('"advantage" keeps the higher of two d20 rolls', () => {
    const result = rollWithAdvantage(5, 'advantage', fakeRng(12, 18));
    expect(result.results).toEqual([12, 18]);
    expect(result.total).toBe(23);
  });

  it('"disadvantage" keeps the lower of two d20 rolls', () => {
    const result = rollWithAdvantage(5, 'disadvantage', fakeRng(12, 18));
    expect(result.results).toEqual([12, 18]);
    expect(result.total).toBe(17);
  });

  it('"normal" rolls a single d20', () => {
    const result = rollWithAdvantage(5, 'normal', fakeRng(12, 18));
    expect(result.results).toEqual([12]);
    expect(result.total).toBe(17);
  });
});

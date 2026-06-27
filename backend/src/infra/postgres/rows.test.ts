import { describe, expect, it } from 'vitest';
import { toSnapshot, toSnapshots } from './rows.js';

interface Dummy {
  id: string;
  nested: { count: number };
}

describe('toSnapshot', () => {
  it('returns the data column when a row is found', () => {
    const dummy: Dummy = { id: 'x', nested: { count: 1 } };
    expect(toSnapshot({ data: dummy })).toEqual(dummy);
  });

  it('returns null when no row is found', () => {
    expect(toSnapshot<Dummy>(undefined)).toBeNull();
  });
});

describe('toSnapshots', () => {
  it('maps a list of rows to their data columns, preserving order', () => {
    const a: Dummy = { id: 'a', nested: { count: 1 } };
    const b: Dummy = { id: 'b', nested: { count: 2 } };

    expect(toSnapshots([{ data: a }, { data: b }])).toEqual([a, b]);
  });

  it('returns an empty array for an empty list', () => {
    expect(toSnapshots<Dummy>([])).toEqual([]);
  });
});

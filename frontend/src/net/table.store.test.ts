import { describe, expect, it, vi } from 'vitest';
import { createTableStore, getActiveCombatant } from './table.store';
import type { PlayerSnapshot, PublicCombatantDTO } from '@grimorio/shared/wire';

function combatant(id: string, overrides: Partial<PublicCombatantDTO> = {}): PublicCombatantDTO {
  return {
    id,
    type: 'pc',
    name: id,
    initiative: 0,
    conditions: [],
    ...overrides,
  };
}

function snapshot(overrides: Partial<PlayerSnapshot> = {}): PlayerSnapshot {
  return {
    viewerRole: 'player',
    liveTableId: 't1',
    campaignId: 'c1',
    combatants: [],
    combat: { active: false, round: 0, order: [], currentTurnIndex: 0 },
    rollLog: [],
    eventLog: [],
    version: 1,
    ownCharacterId: null,
    ...overrides,
  };
}

describe('createTableStore', () => {
  it('starts with no snapshot', () => {
    const store = createTableStore();
    expect(store.get()).toBeNull();
  });

  it('applySnapshot() replaces state and notifies subscribers', () => {
    const store = createTableStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const snap = snapshot({ version: 2 });

    store.applySnapshot(snap);

    expect(store.get()).toEqual(snap);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('applySnapshot() called again fully replaces the previous snapshot', () => {
    const store = createTableStore();
    store.applySnapshot(snapshot({ version: 1 }));
    const second = snapshot({ version: 2 });

    store.applySnapshot(second);

    expect(store.get()).toEqual(second);
    expect(store.get()).not.toBe(undefined);
  });

  it('subscribe() returns an unsubscribe function', () => {
    const store = createTableStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.applySnapshot(snapshot());

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('getActiveCombatant', () => {
  it('returns null when combat is not active', () => {
    const snap = snapshot({
      combat: { active: false, round: 0, order: ['a'], currentTurnIndex: 0 },
      combatants: [combatant('a')],
    });
    expect(getActiveCombatant(snap)).toBeNull();
  });

  it('returns null when there is no snapshot order', () => {
    const snap = snapshot({ combat: { active: true, round: 1, order: [], currentTurnIndex: 0 } });
    expect(getActiveCombatant(snap)).toBeNull();
  });

  it('returns the combatant at order[currentTurnIndex]', () => {
    const a = combatant('a');
    const b = combatant('b');
    const snap = snapshot({
      combatants: [a, b],
      combat: { active: true, round: 1, order: ['a', 'b'], currentTurnIndex: 1 },
    });

    expect(getActiveCombatant(snap)).toEqual(b);
  });

  it('returns null if the active id has no matching combatant', () => {
    const snap = snapshot({
      combatants: [combatant('a')],
      combat: { active: true, round: 1, order: ['ghost'], currentTurnIndex: 0 },
    });
    expect(getActiveCombatant(snap)).toBeNull();
  });

  it('returns null when snapshot itself is null', () => {
    expect(getActiveCombatant(null)).toBeNull();
  });
});

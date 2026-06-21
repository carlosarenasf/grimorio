import { describe, expect, it } from 'vitest';
import type { Combatant , Condition } from '../types.js';
import type { CombatantId } from '../ids.js';
import { startCombat, reorder } from './state.js';
import { nextTurn, prevTurn, canEndOwnTurn } from './turns.js';
import { applyDamage, applyHealing } from './hp.js';
import { setCondition, clearCondition } from './conditions.js';

function pcOwnedBy(id: string, initiative: number, ownerId: string): Combatant {
  return { ...pc(id, initiative), refId: ownerId };
}

function monster(id: string, initiative: number): Combatant {
  return { ...pc(id, initiative), type: 'monster', refId: null, hpVisibility: 'dm_only' };
}

function pc(id: string, initiative: number): Combatant {
  return {
    id: id as CombatantId,
    refId: null,
    type: 'pc',
    name: id,
    initiative,
    maxHp: 10,
    currentHp: 10,
    conditions: [],
    hpVisibility: 'public',
  };
}

describe('startCombat', () => {
  it('orders combatants by initiative descending', () => {
    const combatants = [pc('a', 5), pc('b', 20), pc('c', 12)];
    const state = startCombat(combatants);
    expect(state.order).toEqual(['b', 'c', 'a']);
  });

  it('starts at round 1, currentTurnIndex 0, active true', () => {
    const combatants = [pc('a', 5), pc('b', 20)];
    const state = startCombat(combatants);
    expect(state.round).toBe(1);
    expect(state.currentTurnIndex).toBe(0);
    expect(state.active).toBe(true);
  });

  it('breaks initiative ties deterministically by input order (stable sort)', () => {
    const combatants = [pc('a', 10), pc('b', 10), pc('c', 10)];
    const state = startCombat(combatants);
    expect(state.order).toEqual(['a', 'b', 'c']);
  });
});

describe('reorder', () => {
  it('replaces the order with the given ids, preserving round and active flag', () => {
    const state = startCombat([pc('a', 20), pc('b', 10), pc('c', 5)]);
    const reordered = reorder(state, ['c', 'a', 'b']);
    expect(reordered.order).toEqual(['c', 'a', 'b']);
    expect(reordered.round).toBe(state.round);
    expect(reordered.active).toBe(state.active);
  });

  it('re-anchors currentTurnIndex to follow the same active combatant', () => {
    const state = startCombat([pc('a', 20), pc('b', 10), pc('c', 5)]);
    const atB = { ...state, currentTurnIndex: 1 }; // 'b' is active
    const reordered = reorder(atB, ['c', 'a', 'b']);
    expect(reordered.order[reordered.currentTurnIndex]).toBe('b');
  });

  it('falls back to index 0 if the previously active id is no longer present', () => {
    const state = startCombat([pc('a', 20), pc('b', 10), pc('c', 5)]);
    const reordered = reorder(state, ['x', 'y', 'z']);
    expect(reordered.currentTurnIndex).toBe(0);
  });
});

describe('nextTurn', () => {
  it('advances currentTurnIndex within the round', () => {
    const state = startCombat([pc('a', 20), pc('b', 10), pc('c', 5)]);
    const next = nextTurn(state);
    expect(next.currentTurnIndex).toBe(1);
    expect(next.round).toBe(1);
  });

  it('wraps from the last index to 0 and increments round', () => {
    const state = startCombat([pc('a', 20), pc('b', 10)]);
    const last = { ...state, currentTurnIndex: 1 };
    const next = nextTurn(last);
    expect(next.currentTurnIndex).toBe(0);
    expect(next.round).toBe(2);
  });

  it('does not mutate the input state', () => {
    const state = startCombat([pc('a', 20), pc('b', 10)]);
    const before = { ...state };
    nextTurn(state);
    expect(state).toEqual(before);
  });
});

describe('prevTurn', () => {
  it('moves currentTurnIndex back within the round', () => {
    const state = startCombat([pc('a', 20), pc('b', 10), pc('c', 5)]);
    const at2 = { ...state, currentTurnIndex: 2 };
    const prev = prevTurn(at2);
    expect(prev.currentTurnIndex).toBe(1);
    expect(prev.round).toBe(1);
  });

  it('wraps from index 0 to the last index and decrements round', () => {
    const state = startCombat([pc('a', 20), pc('b', 10), pc('c', 5)]);
    const round2 = { ...state, round: 2, currentTurnIndex: 0 };
    const prev = prevTurn(round2);
    expect(prev.currentTurnIndex).toBe(2);
    expect(prev.round).toBe(1);
  });

  it('never decrements round below 1', () => {
    const state = startCombat([pc('a', 20), pc('b', 10)]);
    const prev = prevTurn(state);
    expect(prev.currentTurnIndex).toBe(1);
    expect(prev.round).toBe(1);
  });
});

describe('applyDamage', () => {
  it('subtracts the amount from currentHp', () => {
    const c = pc('a', 10);
    const damaged = applyDamage(c, 4);
    expect(damaged.currentHp).toBe(6);
  });

  it('clamps currentHp to 0 when damage exceeds remaining HP', () => {
    const c = pc('a', 10);
    const damaged = applyDamage(c, 999);
    expect(damaged.currentHp).toBe(0);
  });

  it('does not mutate the input combatant', () => {
    const c = pc('a', 10);
    const before = { ...c };
    applyDamage(c, 4);
    expect(c).toEqual(before);
  });
});

describe('applyHealing', () => {
  it('adds the amount to currentHp', () => {
    const c = { ...pc('a', 10), currentHp: 4 };
    const healed = applyHealing(c, 3);
    expect(healed.currentHp).toBe(7);
  });

  it('clamps currentHp to maxHp when healing exceeds the cap', () => {
    const c = { ...pc('a', 10), currentHp: 8 };
    const healed = applyHealing(c, 999);
    expect(healed.currentHp).toBe(c.maxHp);
  });
});

const poisoned: Condition = { key: 'poisoned', label: 'Envenenado', color: 'green' };

describe('setCondition', () => {
  it('adds a new condition', () => {
    const c = pc('a', 10);
    const result = setCondition(c, poisoned);
    expect(result.conditions).toEqual([poisoned]);
  });

  it('is idempotent when setting the same condition key twice', () => {
    const c = pc('a', 10);
    const once = setCondition(c, poisoned);
    const twice = setCondition(once, poisoned);
    expect(twice.conditions).toEqual([poisoned]);
  });

  it('replaces an existing condition with the same key (e.g. updated label/color)', () => {
    const c = pc('a', 10);
    const once = setCondition(c, poisoned);
    const updated: Condition = { key: 'poisoned', label: 'Poisoned', color: 'olive' };
    const twice = setCondition(once, updated);
    expect(twice.conditions).toEqual([updated]);
  });

  it('does not mutate the input combatant', () => {
    const c = pc('a', 10);
    const before = { ...c, conditions: [...c.conditions] };
    setCondition(c, poisoned);
    expect(c).toEqual(before);
  });
});

describe('clearCondition', () => {
  it('removes a condition by key', () => {
    const c = setCondition(pc('a', 10), poisoned);
    const cleared = clearCondition(c, 'poisoned');
    expect(cleared.conditions).toEqual([]);
  });

  it('is a no-op when the key is not present', () => {
    const c = pc('a', 10);
    const cleared = clearCondition(c, 'poisoned');
    expect(cleared.conditions).toEqual([]);
  });
});

describe('canEndOwnTurn', () => {
  it('is true when the requesting user owns the active PC combatant', () => {
    const combatants = [pcOwnedBy('a', 20, 'user-1'), pcOwnedBy('b', 10, 'user-2')];
    const state = startCombat(combatants); // active = 'a', owned by user-1
    expect(canEndOwnTurn(state, combatants, 'user-1')).toBe(true);
  });

  it('is false when the requesting user does not own the active PC combatant', () => {
    const combatants = [pcOwnedBy('a', 20, 'user-1'), pcOwnedBy('b', 10, 'user-2')];
    const state = startCombat(combatants); // active = 'a', owned by user-1
    expect(canEndOwnTurn(state, combatants, 'user-2')).toBe(false);
  });

  it('is false for any user when the active combatant is a monster', () => {
    const combatants = [monster('m', 20), pcOwnedBy('a', 10, 'user-1')];
    const state = startCombat(combatants); // active = 'm'
    expect(canEndOwnTurn(state, combatants, 'user-1')).toBe(false);
  });

  it('is false when the active combatant id is not found in the roster', () => {
    const combatants = [pcOwnedBy('a', 20, 'user-1')];
    const state = startCombat(combatants);
    const stale = { ...state, order: ['ghost' as Combatant['id']] };
    expect(canEndOwnTurn(stale, combatants, 'user-1')).toBe(false);
  });
});

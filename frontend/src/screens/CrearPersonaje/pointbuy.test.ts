import { describe, it, expect } from 'vitest';
import {
  totalCost,
  remainingPoints,
  isLegalPointBuy,
  isOverBudget,
  canStepInBuy,
  rollAbility,
  rollScores,
  POINT_BUY_BUDGET,
} from './pointbuy';
import type { AbilityScores } from './abilities';
import { ABILITY_KEYS } from './abilities';

const all = (n: number): AbilityScores => ({
  str: n,
  dex: n,
  con: n,
  int: n,
  wis: n,
  cha: n,
});

describe('point-buy costs', () => {
  it('all 8s cost 0 and leave the full budget', () => {
    expect(totalCost(all(8))).toBe(0);
    expect(remainingPoints(all(8))).toBe(POINT_BUY_BUDGET);
  });

  it('a standard 15/15/15/8/8/8 spread costs exactly 27', () => {
    const spread: AbilityScores = {
      str: 15,
      dex: 15,
      con: 15,
      int: 8,
      wis: 8,
      cha: 8,
    };
    expect(totalCost(spread)).toBe(27);
    expect(isLegalPointBuy(spread)).toBe(true);
    expect(isOverBudget(spread)).toBe(false);
  });

  it('marks over-budget when total exceeds 27', () => {
    const spread = all(14); // 7 each * 6 = 42
    expect(isOverBudget(spread)).toBe(true);
    expect(isLegalPointBuy(spread)).toBe(false);
    expect(remainingPoints(spread)).toBeLessThan(0);
  });

  it('rejects scores outside 8..15', () => {
    expect(isLegalPointBuy({ ...all(10), str: 16 })).toBe(false);
    expect(isLegalPointBuy({ ...all(10), str: 7 })).toBe(false);
  });
});

describe('canStepInBuy', () => {
  it('blocks stepping below 8 or above 15', () => {
    expect(canStepInBuy(all(8), 'str', -1)).toBe(false);
    expect(canStepInBuy(all(15), 'str', +1)).toBe(false);
  });

  it('blocks an increment that would exceed the budget', () => {
    const spread: AbilityScores = {
      str: 15,
      dex: 15,
      con: 15,
      int: 8,
      wis: 8,
      cha: 8,
    }; // exactly 27
    expect(canStepInBuy(spread, 'int', +1)).toBe(false);
  });

  it('allows a decrement even when at budget', () => {
    const spread: AbilityScores = {
      str: 15,
      dex: 15,
      con: 15,
      int: 8,
      wis: 8,
      cha: 8,
    };
    expect(canStepInBuy(spread, 'str', -1)).toBe(true);
  });
});

describe('4d6 roll preview', () => {
  it('rollAbility stays in 3..18', () => {
    for (let i = 0; i < 200; i += 1) {
      const v = rollAbility();
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(18);
    }
  });

  it('rollScores fills all six abilities in range', () => {
    const scores = rollScores();
    for (const key of ABILITY_KEYS) {
      expect(scores[key]).toBeGreaterThanOrEqual(3);
      expect(scores[key]).toBeLessThanOrEqual(18);
    }
  });

  it('drops the lowest die (rng=max → 18)', () => {
    expect(rollAbility(() => 0.999)).toBe(18);
  });
});

import { describe, expect, it } from 'vitest';
import {
  abilityMod,
  proficiencyBonus,
  pointBuyCost,
  pointBuyTotal,
  isLegalPointBuy,
  skillModifier,
  spellSaveDc,
  initiative,
} from './index.js';
import type { AbilityKey } from '../types.js';

const baseScores: Record<AbilityKey, number> = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

describe('abilityMod', () => {
  it('returns 0 for a score of 10', () => {
    expect(abilityMod(10)).toBe(0);
  });

  it('returns 4 for a score of 18', () => {
    expect(abilityMod(18)).toBe(4);
  });

  it('returns -4 for a score of 3', () => {
    expect(abilityMod(3)).toBe(-4);
  });
});

describe('proficiencyBonus', () => {
  it('returns 2 at level 1', () => {
    expect(proficiencyBonus(1)).toBe(2);
  });

  it('returns 2 at level 4', () => {
    expect(proficiencyBonus(4)).toBe(2);
  });

  it('returns 3 at level 5', () => {
    expect(proficiencyBonus(5)).toBe(3);
  });

  it('returns 6 at level 20', () => {
    expect(proficiencyBonus(20)).toBe(6);
  });
});

describe('pointBuyCost', () => {
  it('costs 0 at score 8', () => {
    expect(pointBuyCost(8)).toBe(0);
  });

  it('costs 5 at score 13', () => {
    expect(pointBuyCost(13)).toBe(5);
  });

  it('costs 7 at score 14', () => {
    expect(pointBuyCost(14)).toBe(7);
  });

  it('costs 9 at score 15', () => {
    expect(pointBuyCost(15)).toBe(9);
  });
});

describe('pointBuyTotal', () => {
  it('sums the cost of every ability score', () => {
    const scores: Record<AbilityKey, number> = {
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    };
    // 9 + 7 + 5 + 4 + 2 + 0 = 27
    expect(pointBuyTotal(scores)).toBe(27);
  });
});

describe('isLegalPointBuy', () => {
  it('is true at exactly 27 points with all scores in range', () => {
    const scores: Record<AbilityKey, number> = {
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    };
    expect(isLegalPointBuy(scores)).toBe(true);
  });

  it('is false when total exceeds 27', () => {
    const scores: Record<AbilityKey, number> = {
      str: 15,
      dex: 15,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    };
    expect(isLegalPointBuy(scores)).toBe(false);
  });

  it('is false when any score is outside 8..15', () => {
    const scores: Record<AbilityKey, number> = {
      ...baseScores,
      str: 16,
    };
    expect(isLegalPointBuy(scores)).toBe(false);
  });
});

describe('skillModifier', () => {
  it('returns just the ability mod when not proficient', () => {
    const scores: Record<AbilityKey, number> = { ...baseScores, dex: 16 };
    expect(skillModifier(scores, 'dex', false, 5)).toBe(3);
  });

  it('adds the proficiency bonus when proficient', () => {
    const scores: Record<AbilityKey, number> = { ...baseScores, dex: 16 };
    // dex mod (+3) + prof bonus at level 5 (+3) = 6
    expect(skillModifier(scores, 'dex', true, 5)).toBe(6);
  });
});

describe('spellSaveDc', () => {
  it('computes 8 + proficiency + ability mod', () => {
    const scores: Record<AbilityKey, number> = { ...baseScores, cha: 16 };
    // 8 + 3 (level 5 prof) + 3 (cha mod) = 14
    expect(spellSaveDc(scores, 'cha', 5)).toBe(14);
  });
});

describe('initiative', () => {
  it('equals the dex modifier', () => {
    const scores: Record<AbilityKey, number> = { ...baseScores, dex: 14 };
    expect(initiative(scores)).toBe(2);
  });
});

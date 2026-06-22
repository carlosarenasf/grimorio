import { describe, it, expect } from 'vitest';
import {
  abilityMod,
  proficiencyBonus,
  skillModifier,
  spellSaveDc,
} from './derived';
import type { AbilityScores } from './abilities';

const scores: AbilityScores = {
  str: 10,
  dex: 14,
  con: 12,
  int: 16,
  wis: 8,
  cha: 13,
};

describe('abilityMod', () => {
  it('floors (score-10)/2', () => {
    expect(abilityMod(10)).toBe(0);
    expect(abilityMod(14)).toBe(2);
    expect(abilityMod(8)).toBe(-1);
    expect(abilityMod(16)).toBe(3);
    expect(abilityMod(7)).toBe(-2);
  });
});

describe('proficiencyBonus', () => {
  it('is ceil(level/4)+1', () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(4)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(20)).toBe(6);
  });
});

describe('skillModifier', () => {
  it('adds proficiency bonus only when proficient', () => {
    // athletics → str (mod 0); level 1 prof = 2
    expect(skillModifier('athletics', scores, 1, false)).toBe(0);
    expect(skillModifier('athletics', scores, 1, true)).toBe(2);
    // arcana → int (mod 3)
    expect(skillModifier('arcana', scores, 5, false)).toBe(3);
    expect(skillModifier('arcana', scores, 5, true)).toBe(6); // 3 + prof 3
  });
});

describe('spellSaveDc', () => {
  it('is 8 + prof + ability mod', () => {
    // int mod 3, level 1 prof 2 → 13
    expect(spellSaveDc(scores, 1, 'int')).toBe(13);
  });
});

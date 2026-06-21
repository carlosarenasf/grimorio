import { describe, expect, it } from 'vitest';
import { createCharacter } from './create.js';
import { withDerived, clampHp, toggleEquip } from './sheet.js';
import type { CharacterSheet, AbilityKey } from '../types.js';
import type { CampaignId, UserId } from '../ids.js';
import type { Rng } from '../ports.js';

const campaignId = 'cmp_test' as CampaignId;
const ownerId = 'usr_test' as UserId;

const baseInput = {
  campaignId,
  ownerId,
  name: 'Lyra',
  species: 'Elfo',
  className: 'Explorador',
  background: 'Forastero',
  level: 1,
} as const;

const legalScores: Record<AbilityKey, number> = {
  str: 15,
  dex: 14,
  con: 13,
  int: 12,
  wis: 10,
  cha: 8,
};

describe('createCharacter — point buy', () => {
  it('rejects illegal point-buy when total exceeds 27 points', () => {
    const illegalScores: Record<AbilityKey, number> = {
      str: 15,
      dex: 15,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    }; // 9+9+5+4+2+0 = 29 > 27
    expect(() =>
      createCharacter({ ...baseInput, method: 'buy', scores: illegalScores }),
    ).toThrow();
  });

  it('rejects illegal point-buy when a score is outside 8..15', () => {
    const illegalScores: Record<AbilityKey, number> = {
      str: 16,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    };
    expect(() =>
      createCharacter({ ...baseInput, method: 'buy', scores: illegalScores }),
    ).toThrow();
  });

  it('accepts a legal point-buy and stores the scores', () => {
    const sheet = createCharacter({ ...baseInput, method: 'buy', scores: legalScores });
    expect(sheet.scores).toEqual(legalScores);
  });
});

describe('createCharacter — roll', () => {
  it('rolls 4d6-drop-lowest per ability, each score in 3..18, using the seeded rng', () => {
    // Deterministic rng: always returns the max of the range so every "die" is 6.
    const rng: Rng = { int: (_min, max) => max };
    const sheet = createCharacter({ ...baseInput, method: 'roll' }, rng);
    const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (const key of abilities) {
      expect(sheet.scores[key]).toBeGreaterThanOrEqual(3);
      expect(sheet.scores[key]).toBeLessThanOrEqual(18);
    }
    // all dice = 6 → drop lowest (still 6) → sum of top 3 = 18
    expect(sheet.scores.str).toBe(18);
  });

  it('throws if method is roll and no rng is provided', () => {
    expect(() => createCharacter({ ...baseInput, method: 'roll' })).toThrow();
  });
});

describe('createCharacter — invariants', () => {
  it('rejects level 0', () => {
    expect(() =>
      createCharacter({ ...baseInput, level: 0, method: 'buy', scores: legalScores }),
    ).toThrow();
  });

  it('rejects level 21', () => {
    expect(() =>
      createCharacter({ ...baseInput, level: 21, method: 'buy', scores: legalScores }),
    ).toThrow();
  });

  it('defaults to empty attacks/inventory, gold 0, visibility owner', () => {
    const sheet = createCharacter({ ...baseInput, method: 'buy', scores: legalScores });
    expect(sheet.attacks).toEqual([]);
    expect(sheet.inventory).toEqual([]);
    expect(sheet.gold).toBe(0);
    expect(sheet.visibility).toBe('owner');
  });

  it('starts with currentHp equal to maxHp and maxHp >= 0', () => {
    const sheet = createCharacter({ ...baseInput, method: 'buy', scores: legalScores });
    expect(sheet.maxHp).toBeGreaterThanOrEqual(0);
    expect(sheet.currentHp).toBe(sheet.maxHp);
  });
});

describe('withDerived', () => {
  it('exposes correct mods, profBonus, initiative and spellSaveDc for a known sheet', () => {
    const sheet = createCharacter({ ...baseInput, level: 5, method: 'buy', scores: legalScores });
    const derived = withDerived(sheet);
    expect(derived.mods).toEqual({
      str: 2, // 15 -> +2
      dex: 2, // 14 -> +2
      con: 1, // 13 -> +1
      int: 1, // 12 -> +1
      wis: 0, // 10 -> +0
      cha: -1, // 8 -> -1
    });
    expect(derived.profBonus).toBe(3); // level 5
    expect(derived.initiative).toBe(2); // dex mod
    // default spellcasting ability is INT (documented assumption)
    expect(derived.spellSaveDc).toBe(8 + 3 + 1);
  });
});

describe('clampHp', () => {
  it('clamps currentHp down to maxHp when set above it', () => {
    const sheet: CharacterSheet = {
      ...createCharacter({ ...baseInput, method: 'buy', scores: legalScores }),
      maxHp: 10,
      currentHp: 999,
    };
    const clamped = clampHp(sheet);
    expect(clamped.currentHp).toBe(10);
  });

  it('clamps currentHp up to 0 when negative', () => {
    const sheet: CharacterSheet = {
      ...createCharacter({ ...baseInput, method: 'buy', scores: legalScores }),
      maxHp: 10,
      currentHp: -5,
    };
    const clamped = clampHp(sheet);
    expect(clamped.currentHp).toBe(0);
  });
});

describe('toggleEquip', () => {
  it('flips equipped on the matching inventory item and leaves armorClass unchanged', () => {
    const base = createCharacter({ ...baseInput, method: 'buy', scores: legalScores });
    const sheet: CharacterSheet = {
      ...base,
      armorClass: 15,
      inventory: [{ id: 'itm_1', name: 'Cota de malla', note: '', qty: 1, equipped: false }],
    };
    const toggled = toggleEquip(sheet, 'itm_1');
    expect(toggled.inventory[0]?.equipped).toBe(true);
    expect(toggled.armorClass).toBe(15);

    const toggledAgain = toggleEquip(toggled, 'itm_1');
    expect(toggledAgain.inventory[0]?.equipped).toBe(false);
    expect(toggledAgain.armorClass).toBe(15);
  });

  it('leaves other items untouched', () => {
    const base = createCharacter({ ...baseInput, method: 'buy', scores: legalScores });
    const sheet: CharacterSheet = {
      ...base,
      inventory: [
        { id: 'itm_1', name: 'Espada', note: '', qty: 1, equipped: false },
        { id: 'itm_2', name: 'Escudo', note: '', qty: 1, equipped: true },
      ],
    };
    const toggled = toggleEquip(sheet, 'itm_1');
    expect(toggled.inventory[1]?.equipped).toBe(true);
  });
});

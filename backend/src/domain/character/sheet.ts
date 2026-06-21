/**
 * Pure helpers over a `CharacterSheet`: derived 5e values, HP clamping, and
 * equipment toggling. None of these mutate their input — every function
 * returns a new sheet (or a derived view) so callers stay referentially safe.
 */
import type { AbilityKey, CharacterSheet } from '../types.js';
import { abilityMod, proficiencyBonus, initiative, spellSaveDc } from '../rules/index.js';

/**
 * Spellcasting ability used to compute `spellSaveDc` in `withDerived`.
 *
 * ASSUMPTION (documented per task spec): per-class spellcasting ability is out
 * of scope for this module. We default to INT (the Wizard/arcane convention)
 * for every class. Callers that need a class-accurate ability should compute
 * `spellSaveDc` themselves via `domain/rules` with the correct ability key.
 */
export const DEFAULT_SPELLCASTING_ABILITY: AbilityKey = 'int';

export interface DerivedCharacterSheet extends CharacterSheet {
  mods: Record<AbilityKey, number>;
  profBonus: number;
  initiative: number;
  spellSaveDc: number;
}

/** Attaches computed (non-persisted) 5e values to a sheet. */
export function withDerived(sheet: CharacterSheet): DerivedCharacterSheet {
  const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const mods = Object.fromEntries(
    abilities.map((key) => [key, abilityMod(sheet.scores[key])]),
  ) as Record<AbilityKey, number>;

  return {
    ...sheet,
    mods,
    profBonus: proficiencyBonus(sheet.level),
    initiative: initiative(sheet.scores),
    spellSaveDc: spellSaveDc(sheet.scores, DEFAULT_SPELLCASTING_ABILITY, sheet.level),
  };
}

/** Returns a copy of the sheet with `currentHp` clamped to `0..maxHp`. */
export function clampHp(sheet: CharacterSheet): CharacterSheet {
  const currentHp = Math.min(Math.max(sheet.currentHp, 0), sheet.maxHp);
  return { ...sheet, currentHp };
}

/**
 * Flips the `equipped` flag on the inventory item with the given id. Purely a
 * tracking toggle — it never touches `armorClass` (per SPEC, equipping is
 * cosmetic/inventory bookkeeping, not a mechanical AC recompute).
 */
export function toggleEquip(sheet: CharacterSheet, itemId: string): CharacterSheet {
  return {
    ...sheet,
    inventory: sheet.inventory.map((item) =>
      item.id === itemId ? { ...item, equipped: !item.equipped } : item,
    ),
  };
}

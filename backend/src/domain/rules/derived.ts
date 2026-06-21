import type { AbilityKey } from '../types.js';
import { abilityMod } from './abilities.js';
import { proficiencyBonus } from './proficiency.js';

/**
 * Modifier for a given skill's governing ability, plus proficiency bonus if
 * the character is proficient in that skill.
 */
export function skillModifier(
  scores: Record<AbilityKey, number>,
  ability: AbilityKey,
  proficient: boolean,
  level: number,
): number {
  const mod = abilityMod(scores[ability]);
  return proficient ? mod + proficiencyBonus(level) : mod;
}

/** Spell save DC: 8 + proficiency bonus + spellcasting ability modifier. */
export function spellSaveDc(
  scores: Record<AbilityKey, number>,
  ability: AbilityKey,
  level: number,
): number {
  return 8 + proficiencyBonus(level) + abilityMod(scores[ability]);
}

/** Initiative equals the Dexterity modifier. */
export function initiative(scores: Record<AbilityKey, number>): number {
  return abilityMod(scores.dex);
}

// Client-side 5e derived-stat previews — PREVIEW ONLY. The canonical sheet is
// whatever the server returns from createCharacter/updateCharacter.

import type { AbilityKey, AbilityScores } from './abilities';
import { SKILLS } from './skills';

/** abilityMod = floor((score - 10) / 2). */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** proficiencyBonus = ceil(level / 4) + 1, clamped to a sane 1..20 level. */
export function proficiencyBonus(level: number): number {
  const lvl = Math.max(1, Math.min(20, Math.floor(level)));
  return Math.ceil(lvl / 4) + 1;
}

/** skill modifier = abilityMod(governing) + (proficient ? profBonus : 0). */
export function skillModifier(
  skillKey: string,
  scores: AbilityScores,
  level: number,
  proficient: boolean,
): number {
  const def = SKILLS.find((s) => s.key === skillKey);
  const ability: AbilityKey = def ? def.ability : 'str';
  const base = abilityMod(scores[ability]);
  return base + (proficient ? proficiencyBonus(level) : 0);
}

/** spell save DC = 8 + profBonus + abilityMod(of the casting ability). */
export function spellSaveDc(
  scores: AbilityScores,
  level: number,
  castingAbility: AbilityKey,
): number {
  return 8 + proficiencyBonus(level) + abilityMod(scores[castingAbility]);
}

/** Map of every ability key to its current modifier (for the summary). */
export function allModifiers(scores: AbilityScores): Record<AbilityKey, number> {
  return {
    str: abilityMod(scores.str),
    dex: abilityMod(scores.dex),
    con: abilityMod(scores.con),
    int: abilityMod(scores.int),
    wis: abilityMod(scores.wis),
    cha: abilityMod(scores.cha),
  };
}

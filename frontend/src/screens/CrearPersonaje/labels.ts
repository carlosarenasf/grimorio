// Spanish label lookups for ability and skill KEYS as the API delivers them.
// The API uses short skill keys ('animal', 'sleight') for backgrounds/class
// options, while the local SKILLS table uses the long 5e keys
// ('animal-handling', 'sleight-of-hand'). These maps tolerate both so a key
// coming from any source resolves to a Spanish label and a governing ability.

import type { AbilityKey } from './abilities';
import { ABILITIES } from './abilities';
import { SKILLS } from './skills';

/** Ability key -> full Spanish name. */
export const ABILITY_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  ABILITIES.map((a) => [a.key, a.label]),
);

export function abilityLabel(key: string): string {
  return ABILITY_LABELS[key] ?? key.toUpperCase();
}

// Skill aliases: every short API key mapped onto its long local key.
const SKILL_ALIASES: Readonly<Record<string, string>> = {
  animal: 'animal-handling',
  sleight: 'sleight-of-hand',
};

/** Resolve any incoming skill key (short or long) to the canonical local key. */
export function canonicalSkillKey(key: string): string {
  return SKILL_ALIASES[key] ?? key;
}

const SKILL_BY_KEY = new Map(SKILLS.map((s) => [s.key, s]));

/** Spanish label for a skill key (short or long); falls back to the raw key. */
export function skillLabel(key: string): string {
  const def = SKILL_BY_KEY.get(canonicalSkillKey(key));
  return def ? def.label : key;
}

/** Governing ability for a skill key (short or long); defaults to 'str'. */
export function skillAbility(key: string): AbilityKey {
  const def = SKILL_BY_KEY.get(canonicalSkillKey(key));
  return def ? def.ability : 'str';
}

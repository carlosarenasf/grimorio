import type { AbilityKey, AbilityScores } from './types';

/** abilityMod = floor((score - 10) / 2) — SRD 5.2 ability modifier formula. */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitución',
  int: 'Inteligencia',
  wis: 'Sabiduría',
  cha: 'Carisma',
};

export const ABILITY_ORDER: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/** Map every ability key to its current modifier, in canonical 5e order. */
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

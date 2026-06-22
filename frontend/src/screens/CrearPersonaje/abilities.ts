// The six 5e ability scores, in canonical order, with Spanish labels.
// `key` matches the backend `AbilityKey` union ('str' | 'dex' | ...).

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityDef {
  key: AbilityKey;
  /** Full Spanish name, e.g. "Fuerza". */
  label: string;
  /** Three-letter Spanish abbreviation, e.g. "FUE". */
  abbr: string;
}

export const ABILITIES: readonly AbilityDef[] = [
  { key: 'str', label: 'Fuerza', abbr: 'FUE' },
  { key: 'dex', label: 'Destreza', abbr: 'DES' },
  { key: 'con', label: 'Constitución', abbr: 'CON' },
  { key: 'int', label: 'Inteligencia', abbr: 'INT' },
  { key: 'wis', label: 'Sabiduría', abbr: 'SAB' },
  { key: 'cha', label: 'Carisma', abbr: 'CAR' },
] as const;

export const ABILITY_KEYS: readonly AbilityKey[] = ABILITIES.map((a) => a.key);

export type AbilityScores = Record<AbilityKey, number>;

/** A neutral default spread (all 10s) used when starting in buy mode is not chosen. */
export const DEFAULT_SCORES: AbilityScores = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

/** Point-buy starting spread: every ability at the cheapest non-zero baseline (8). */
export const BUY_BASELINE_SCORES: AbilityScores = {
  str: 8,
  dex: 8,
  con: 8,
  int: 8,
  wis: 8,
  cha: 8,
};

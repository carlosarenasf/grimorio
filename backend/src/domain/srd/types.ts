/**
 * Local, dependency-free mirrors of the SRD-related shapes declared in
 * `application/ports.ts` (MonsterRef, MonsterAttack, Monster, RuleSection,
 * SrdProvider). The domain layer must not import from `application/`, so
 * these are structurally identical types that `StaticSrdProvider` satisfies
 * by shape (TypeScript structural typing) without a cross-layer import.
 */
import type { Condition } from '../types.js';

export interface MonsterRef {
  id: string;
  name: string;
  cr: string; // challenge rating, e.g. "1/4", "5"
  meta: string; // size/type line, e.g. "Humanoide Mediano"
}

export interface MonsterAttack {
  name: string;
  bonus: number | null;
  damage: string | null; // "1d8+2"
  damageType: string;
}

export interface Monster extends MonsterRef {
  ac: number;
  hp: number;
  speed: string; // "9 m"
  attacks: MonsterAttack[];
}

export interface RuleSection {
  id: string;
  title: string;
  body: string;
}

// ---------- Character-creation reference (D&D 2024 / SRD 5.2) ----------

export type Spellcasting = 'full' | 'half' | 'none';

export interface SpeciesDef {
  id: string;
  name: string;
  size: string; // "Mediano", "Pequeño"
  speed: number; // metres
  description: string;
  traits: string[];
}

export interface ClassDef {
  id: string;
  name: string;
  hitDie: number; // 6, 8, 10, 12
  primaryAbility: string; // ability key, e.g. "str"
  savingThrows: string[]; // ability keys
  spellcasting: Spellcasting;
  description: string;
  skillChoices: number;
  skillOptions: string[]; // skill keys
}

export interface BackgroundDef {
  id: string;
  name: string;
  description: string;
  /** The abilities this background can boost (2024: background grants ability scores). */
  abilityOptions: string[];
  skills: string[]; // skill keys granted
}

export interface SpellDef {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school: string;
  classes: string[]; // class ids that can learn it
  description: string;
}

/** Curated SRD 5.2 data source (conditions, rules, bestiary, creation reference). */
export interface SrdProvider {
  searchMonsters(query: string): MonsterRef[];
  getMonster(id: string): Monster | null;
  conditions(): Condition[];
  rulesReference(): RuleSection[];
  species(): SpeciesDef[];
  classes(): ClassDef[];
  backgrounds(): BackgroundDef[];
  /** All spells, or those available to a given class id. */
  spells(classId?: string): SpellDef[];
}

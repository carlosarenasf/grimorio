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
  /** 5e.tools URL — same as the full record's externalUrl. */
  externalUrl?: string;
}

export interface MonsterAttack {
  name: string;
  bonus: number | null;
  damage: string | null; // "1d8+2"
  damageType: string;
  description?: string;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  attack?: MonsterAttack;
}

export interface Monster extends MonsterRef {
  ac: number;
  hp: number;
  speed: string; // "9 m"
  attacks: MonsterAttack[];
  // Stats completos (D&D 2024)
  abilities?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  savingThrows?: string[]; // ej: ["DES", "CON"]
  skills?: string[]; // ej: ["Percepción", "Sigilo"]
  damageResistances?: string[]; // ej: ["fuego"]
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: string[]; // ej: ["visión en la oscuridad 18m"]
  languages?: string[];
  traits?: MonsterTrait[];
  actions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: MonsterAction[];
  /** URL to the monster's page on 5e.tools. */
  externalUrl?: string;
  /** Optional remote art URL (user-supplied, community/Creator-licensed). */
  imageUrl?: string;
}

export interface RuleSection {
  id: string;
  title: string;
  body: string;
}

// ---------- Character-creation reference (D&D 2024 / SRD 5.2) ----------

export type Spellcasting = 'full' | 'half' | 'none';

export interface SpeciesTrait {
  name: string;
  description: string;
}

export interface SpeciesDef {
  id: string;
  name: string;
  size: string; // "Mediano", "Pequeño"
  speed: number; // metres
  description: string;
  traits: SpeciesTrait[];
  /** URL to the species page on 5e.tools. */
  externalUrl?: string;
}

export interface ClassFeature {
  level: number;
  name: string;
  description: string;
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
  features: ClassFeature[];
  /** URL to the class page on 5e.tools. */
  externalUrl?: string;
  /** Spell slot count per character level (1-20), indexed by slot level 1-9. */
  spellSlots?: Record<number, [number, number, number, number, number, number, number, number, number]>;
  /** Warlock pact magic: [count, slot level] per character level (1-20). */
  warlockSpellSlots?: Record<number, [number, number]>;
}

export interface BackgroundDef {
  id: string;
  name: string;
  description: string;
  /** The abilities this background can boost (2024: background grants ability scores). */
  abilityOptions: string[];
  skills: string[]; // skill keys granted
  externalUrl?: string;
}

export interface SpellDef {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school: string;
  classes: string[]; // class ids that can learn it
  description: string;
  /** Damage/heal dice notation when the spell rolls dice (e.g. "1d10"); null for utility. */
  damage?: string | null;
  /** URL to the spell page on 5e.tools. */
  externalUrl?: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  category: 'simple' | 'martial';
  damage: string; // dice, e.g. "1d8"
  damageType: string; // "cortante", "perforante"…
  properties: string[]; // "Sutil", "A distancia", "Versátil (1d10)"…
  /** Attack/damage ability: str, dex, or finesse (best of str/dex). */
  ability: 'str' | 'dex' | 'finesse';
  externalUrl?: string;
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
  weapons(): WeaponDef[];
}

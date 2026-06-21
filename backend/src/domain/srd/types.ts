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

/** Curated SRD 5.2 data source (conditions, rules reference, bestiary). */
export interface SrdProvider {
  searchMonsters(query: string): MonsterRef[];
  getMonster(id: string): Monster | null;
  conditions(): Condition[];
  rulesReference(): RuleSection[];
}

/**
 * Curated, in-memory SRD 5.2 data provider. Pure domain: no I/O, no
 * dependency on application/infra/transport. Structurally implements the
 * `SrdProvider` port declared in `application/ports.ts` (see ./types.ts for
 * the local mirror types that make that structural match explicit).
 */
import type { Condition } from '../types.js';
import { BESTIARY } from './data/bestiary.js';
import { CONDITIONS } from './data/conditions.js';
import { RULES_REFERENCE } from './data/rulesReference.js';
import { SPECIES } from './data/species.js';
import { CLASSES } from './data/classes.js';
import { BACKGROUNDS } from './data/backgrounds.js';
import { SPELLS } from './data/spells.js';
import { WEAPONS } from './data/weapons.js';
import type {
  BackgroundDef,
  ClassDef,
  Monster,
  MonsterRef,
  RuleSection,
  SpeciesDef,
  SpellDef,
  SrdProvider,
  WeaponDef,
} from './types.js';

/** Cap on results from an unfiltered/empty bestiary search. */
const MAX_SEARCH_RESULTS = 50;

function toRef(monster: Monster): MonsterRef {
  return { id: monster.id, name: monster.name, cr: monster.cr, meta: monster.meta };
}

export class StaticSrdProvider implements SrdProvider {
  searchMonsters(query: string): MonsterRef[] {
    const needle = query.trim().toLowerCase();
    const matches =
      needle.length === 0
        ? BESTIARY
        : BESTIARY.filter((monster) => monster.name.toLowerCase().includes(needle));
    return matches.slice(0, MAX_SEARCH_RESULTS).map(toRef);
  }

  getMonster(id: string): Monster | null {
    return BESTIARY.find((monster) => monster.id === id) ?? null;
  }

  conditions(): Condition[] {
    return CONDITIONS;
  }

  rulesReference(): RuleSection[] {
    return RULES_REFERENCE;
  }

  species(): SpeciesDef[] {
    return SPECIES;
  }

  classes(): ClassDef[] {
    return CLASSES;
  }

  backgrounds(): BackgroundDef[] {
    return BACKGROUNDS;
  }

  spells(classId?: string): SpellDef[] {
    if (!classId) return SPELLS;
    return SPELLS.filter((s) => s.classes.includes(classId));
  }

  weapons(): WeaponDef[] {
    return WEAPONS;
  }
}

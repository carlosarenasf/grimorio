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
import { FIVE_ETOOLS } from './srdLinks.js';
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

/** Inject a 5e.tools URL on any data record that doesn't already have one. */
function withExternal<T extends { id: string; externalUrl?: string }>(
  list: readonly T[],
  build: (id: string) => string,
): T[] {
  return list.map((item) =>
    item.externalUrl ? item : { ...item, externalUrl: build(item.id) },
  );
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
    const found = BESTIARY.find((monster) => monster.id === id);
    if (!found) return null;
    return found.externalUrl ? found : { ...found, externalUrl: FIVE_ETOOLS.monster(found.id) };
  }

  conditions(): Condition[] {
    return CONDITIONS;
  }

  rulesReference(): RuleSection[] {
    return RULES_REFERENCE;
  }

  species(): SpeciesDef[] {
    return withExternal(SPECIES, FIVE_ETOOLS.species);
  }

  classes(): ClassDef[] {
    return withExternal(CLASSES, FIVE_ETOOLS.class);
  }

  backgrounds(): BackgroundDef[] {
    return withExternal(BACKGROUNDS, FIVE_ETOOLS.background);
  }

  spells(classId?: string): SpellDef[] {
    const filtered = classId ? SPELLS.filter((s) => s.classes.includes(classId)) : SPELLS;
    return withExternal(filtered, FIVE_ETOOLS.spell);
  }

  weapons(): WeaponDef[] {
    return withExternal(WEAPONS, FIVE_ETOOLS.weapon);
  }
}

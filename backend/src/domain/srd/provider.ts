/**
 * SRD data provider, sourced from 5etools (the 5e.tools GitHub mirror).
 * The 5etools data is the source of truth for monsters, spells, classes
 * and races; the hand-curated SRD 5.2 / backgrounds / weapons / rules
 * remain in the repo as a thin layer.
 *
 * Data is bundled into `data/5etools/index.ts` by `scripts/build-5etools.mjs`,
 * which in turn reads the JSONs pulled by `scripts/fetch-5etools.mjs`.
 */
import type { Condition } from '../types.js';
import { BESTIARY_FT, SPELLS_FT, SPECIES_FT, CLASSES_FT } from './data/5etools/index.js';
import { CONDITIONS } from './data/conditions.js';
import { RULES_REFERENCE } from './data/rulesReference.js';
import { BACKGROUNDS } from './data/backgrounds.js';
import { WEAPONS } from './data/weapons.js';
import { FIVE_ETOOLS } from './srdLinks.js';
import { SPELL_CLASS_MAP } from './spellClassMap.js';
import { MONSTER_NAME_ES, SPELL_NAME_ES, RACE_NAME_ES, CLASS_NAME_ES } from './esNames.js';
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

const BESTIARY: Monster[] = BESTIARY_FT.map((m) => ({
  ...m,
  name: MONSTER_NAME_ES[m.name] ?? m.name,
}));

/** 5etools spell ids look like `<slug>-<source>` (e.g. `fire-bolt-phb`).
 *  Strip the source suffix so the SRD class map can match by the bare slug. */
function lookupSpellClasses(id: string): readonly string[] | undefined {
  const withoutSource = id.replace(/-[a-z0-9]+$/, '');
  if (SPELL_CLASS_MAP[withoutSource]) return SPELL_CLASS_MAP[withoutSource];
  if (SPELL_CLASS_MAP[id]) return SPELL_CLASS_MAP[id];
  return undefined;
}

const SPELLS: SpellDef[] = SPELLS_FT.map((s) => ({
  ...s,
  name: SPELL_NAME_ES[s.name] ?? s.name,
  classes: s.classes.length > 0 ? s.classes : [...(lookupSpellClasses(s.id) ?? [])],
}));
const SPECIES: SpeciesDef[] = SPECIES_FT.map((s) => ({
  ...s,
  name: RACE_NAME_ES[s.name] ?? s.name,
}));
const CLASSES: ClassDef[] = CLASSES_FT.map((c) => ({
  ...c,
  name: CLASS_NAME_ES[c.name] ?? c.name,
}));

function toRef(monster: Monster): MonsterRef {
  return {
    id: monster.id,
    name: monster.name,
    cr: monster.cr,
    meta: monster.meta,
    externalUrl: monster.externalUrl,
  };
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

/**
 * Best-effort monster id lookup with backward-compatibility aliases.
 *
 * Older characters and combatant rows store ids like `goblin`; the
 * 5e.tools-backed data now uses `goblin-mm`, `goblin-phb`, etc. We try
 * the exact id first, then a few common source suffixes (mm, phb, xphb,
 * xmm), then a fuzzy "contains" match by stripping the longest suffix
 * from the queried id. This makes old persisted ids resolve to the
 * right monster without a DB migration.
 */
const MONSTER_ALIAS_SUFFIXES = ['', '-mm', '-phb', '-xphb', '-xmm', '-mpmm', '-wdmm'];

function findMonster(id: string): Monster | undefined {
  if (!id) return undefined;
  for (const suffix of MONSTER_ALIAS_SUFFIXES) {
    const found = BESTIARY.find((m) => m.id === id + suffix);
    if (found) return found;
  }
  // Last resort: anything whose id starts with the queried id (handles
  // cases like `young-red-dragon` matching `young-red-dragon-xphb`).
  const prefix = id;
  return BESTIARY.find((m) => m.id.startsWith(prefix + '-') || m.id === prefix);
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
    const found = findMonster(id);
    if (!found) return null;
    return found;
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
    if (!classId) return withExternal(SPELLS, FIVE_ETOOLS.spell);
    const list = SPELLS.filter((s) => {
      // Backfill `classes` from the SRD 5.2 hand-curated map (5etools data
      // doesn't tag spells with their class list). Match by id prefix
      // because 5etools ids are `<slug>-<source>`.
      const classes = s.classes.length > 0 ? s.classes : (lookupSpellClasses(s.id) ?? []);
      return classes.includes(classId as never);
    });
    return withExternal(list, FIVE_ETOOLS.spell);
  }

  weapons(): WeaponDef[] {
    return withExternal(WEAPONS, FIVE_ETOOLS.weapon);
  }
}

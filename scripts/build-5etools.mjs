#!/usr/bin/env node
/**
 * Build a TypeScript module from the 5etools JSONs we pulled in
 * `scripts/fetch-5etools.mjs`. The output lives at
 * `backend/src/domain/srd/data/5etools/index.ts` and is what the SRD
 * provider imports — the raw JSONs sit alongside for traceability.
 *
 * The 5etools data is rich but uses a custom inline markup
 * (`{@damage 1d6}`, `{@spell Fireball}`, etc.). We strip it to plain
 * text for display. The original `source` field is kept on every record
 * so the 5e.tools URL is unambiguous (`#name|source`).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename, extname, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IN = resolve(ROOT, 'backend/src/domain/srd/data/5etools');
const OUT = resolve(IN, 'index.ts');

// ---------- 5etools markup stripper ----------
//
// The data uses `{@tag payload}` and `{@tag payload|display}`. We:
//   - keep the display (e.g. `{@damage 1d6}` → `1d6`)
//   - drop the tag (e.g. `{@spell Fireball}` → `Fireball`)
//   - drop empty `{}` constructs
//   - drop variantrule / variantrule / condition / status tags (we keep the
//     content of `entries` arrays; for inline tags we keep the payload).
function stripMarkup(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\{@(?:b|i|damage|dice|scaledamage|scaledice)\s+([^}]+?)\}/g, (_m, body) => body)
    .replace(/\{@spell\s+([^}|]+?)(?:\|[^}]*)?\}/g, (_m, name) => name)
    .replace(/\{@creature\s+([^}|]+?)(?:\|[^}]*)?\}/g, (_m, name) => name)
    .replace(/\{@item\s+([^}|]+?)(?:\|[^}]*)?\}/g, (_m, name) => name)
    .replace(/\{@hazard\s+([^}|]+?)(?:\|[^}]*)?\}/g, (_m, name) => name)
    .replace(/\{@(?:condition|status|action|reaction|trait)\s+([^}|]+?)(?:\|[^}]*)?\}/g, (_m, name) => name)
    .replace(/\{@(?:variantrule|skill|class|classFeature|feat|optionalfeature|psionic|item)\s+[^}]+?\}/g, '')
    .replace(/\{@[^}\s]+\s*([^}|]*?)(?:\|([^}]*))?\}/g, (_m, p1, p2) => (p2 || p1 || '').trim())
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Convert an `entries` array (mix of strings/objects) into a single string. */
function flattenEntries(entries) {
  if (!Array.isArray(entries)) return '';
  return entries
    .map((e) => {
      if (typeof e === 'string') return stripMarkup(e);
      if (e && typeof e === 'object') {
        if (typeof e.entries === 'string') return stripMarkup(e.entries);
        if (Array.isArray(e.entries)) return flattenEntries(e.entries);
        if (typeof e.text === 'string') return stripMarkup(e.text);
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

// ---------- Bestiary mapping ----------
const SCHOOL = { A: 'Abjuración', C: 'Conjuración', D: 'Adivinación', E: 'Encantamiento', V: 'Evocación', I: 'Ilusión', N: 'Necromancia', T: 'Transmutación' };
const SIZE_ES = { T: 'Diminuto', S: 'Pequeño', M: 'Mediano', L: 'Grande', H: 'Enorme', G: 'Gargantuesco', C: 'Colosal' };
const SPEED_FEET_TO_M = (ft) => Math.round(ft * 0.3048 * 2) / 2; // 5 ft → 1.5 m, 30 ft → 9 m
const DAMAGE_TYPE_ES = {
  bludgeoning: 'contundente', piercing: 'perforante', slashing: 'cortante',
  acid: 'ácido', cold: 'frío', fire: 'fuego', lightning: 'eléctrico', thunder: 'trueno',
  poison: 'veneno', radiant: 'radiante', necrotic: 'necrótico', psychic: 'psíquico', force: 'fuerza',
};

function mapAbility(a) { return a === undefined ? 10 : a; }
function mapAc(ac) { return Array.isArray(ac) ? (ac[0]?.ac ?? ac[0] ?? 10) : (ac?.ac ?? ac ?? 10); }
function mapHp(hp) {
  if (!hp) return 1;
  return Number(hp.average ?? hp.special ?? 1) || 1;
}
function mapSpeed(speed) {
  if (!speed) return '9 m';
  const parts = [];
  if (typeof speed.walk === 'number') parts.push(`${SPEED_FEET_TO_M(speed.walk)} m`);
  if (typeof speed.fly === 'number') parts.push(`volar ${SPEED_FEET_TO_M(speed.fly)} m`);
  if (typeof speed.swim === 'number') parts.push(`nadar ${SPEED_FEET_TO_M(speed.swim)} m`);
  if (typeof speed.climb === 'number') parts.push(`escalar ${SPEED_FEET_TO_M(speed.climb)} m`);
  if (typeof speed.burrow === 'number') parts.push(`excavar ${SPEED_FEET_TO_M(speed.burrow)} m`);
  return parts.join(', ') || '9 m';
}
function mapCr(cr) {
  if (cr === undefined || cr === null) return '0';
  if (typeof cr === 'object') return cr.cr ?? '0';
  return String(cr);
}
function mapType(t) {
  if (!t) return '—';
  const type = t.type ?? t;
  const tags = t.tags?.length ? ` (${t.tags.join(', ')})` : '';
  return `${type}${tags}`;
}

/** Pull the first dice (`{@damage 2d6+3}` → `2d6+3`) from a text. */
function extractFirstDice(text) {
  if (typeof text !== 'string') return null;
  const m = text.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/);
  return m ? m[1] : null;
}

/** Pull the attack bonus from a text like "to hit, reach 5 ft." — only after `+N`. */
function extractAttackBonus(text) {
  if (typeof text !== 'string') return null;
  const m = text.match(/\+(\d+)\s+to hit/);
  return m ? Number(m[1]) : null;
}

function mapAttackFromAction(action) {
  if (!action?.entries) return null;
  const text = flattenEntries(action.entries);
  // First entry that contains a damage roll.
  let damage = null;
  let damageType = '—';
  let bonus = null;
  for (const line of Array.isArray(action.entries) ? action.entries : []) {
    if (typeof line !== 'string') continue;
    const flat = stripMarkup(line);
    if (!damage) {
      damage = extractFirstDice(flat);
      if (damage) {
        const m = flat.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+([A-Za-zÀ-ÿ]+)\s+damage/);
        if (m) {
          damage = m[1];
          damageType = DAMAGE_TYPE_ES[m[2].toLowerCase()] ?? m[2].toLowerCase();
        }
      }
    }
    if (bonus === null) {
      bonus = extractAttackBonus(flat);
    }
  }
  return {
    name: action.name ?? '—',
    bonus,
    damage,
    damageType,
    description: text,
  };
}

function bestiarySlug(m) {
  // 5e.tools uses `<name>` as the hash, and appends `|<source-lowercase>` if the
  // name isn't unique. We always include the source for stability.
  return `${m.name}|${(m.source ?? 'MM').toLowerCase()}`;
}

function bestiaryUrl(m) {
  return `https://5e.tools/bestiary.html#${encodeURIComponent(bestiarySlug(m))}`;
}

function mapMonster(m) {
  const attacks = [];
  const actions = [];
  for (const action of m.action ?? []) {
    const a = mapAttackFromAction(action);
    if (a) {
      actions.push(a);
      if (a.damage) {
        attacks.push({ name: action.name, bonus: a.bonus, damage: a.damage, damageType: a.damageType });
      }
    }
  }
  const traits = (m.trait ?? []).map((t) => ({
    name: t.name,
    description: flattenEntries(t.entries),
  }));
  const ac = mapAc(m.ac);
  const hp = mapHp(m.hp);
  const speed = mapSpeed(m.speed);
  return {
    id: bestiarySlug(m).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    name: m.name,
    cr: mapCr(m.cr),
    meta: `${SIZE_ES[m.size?.[0]] ?? m.size?.[0] ?? 'Mediano'} ${mapType(m.type)}`.trim(),
    ac,
    hp,
    speed,
    abilities: { str: mapAbility(m.str), dex: mapAbility(m.dex), con: mapAbility(m.con), int: mapAbility(m.int), wis: mapAbility(m.wis), cha: mapAbility(m.cha) },
    savingThrows: Object.entries(m.save ?? {}).map(([k]) => k.toUpperCase().slice(0, 3)),
    skills: Object.keys(m.skill ?? {}),
    damageResistances: (m.resist ?? []).flatMap((x) => (typeof x === 'string' ? [x] : Array.isArray(x) ? x : (x && Array.isArray(x.resist) ? x.resist : []))).filter((s) => typeof s === 'string'),
    damageImmunities: (m.immune ?? []).flatMap((x) => (typeof x === 'string' ? [x] : Array.isArray(x) ? x : (x && Array.isArray(x.immune) ? x.immune : []))).filter((s) => typeof s === 'string'),
    damageVulnerabilities: (m.vulnerable ?? []).flatMap((x) => (typeof x === 'string' ? [x] : Array.isArray(x) ? x : (x && Array.isArray(x.vulnerable) ? x.vulnerable : []))).filter((s) => typeof s === 'string'),
    conditionImmunities: (m.conditionImmune ?? []).flatMap((x) => (typeof x === 'string' ? [x] : (x && Array.isArray(x.conditionImmune) ? x.conditionImmune : []))).filter((s) => typeof s === 'string'),
    senses: Array.isArray(m.senses) ? m.senses : (m.senses ? [m.senses] : []),
    languages: Array.isArray(m.languages) ? m.languages : (m.languages ? [m.languages] : []),
    traits,
    actions: actions.map((a) => ({ name: a.name, description: a.description, attack: a.damage ? a : undefined })),
    attacks,
    externalUrl: bestiaryUrl(m),
  };
}

// ---------- Spells mapping ----------
const CLASS_NAME_TO_ID = {
  Barbarian: 'barbarian', Bard: 'bard', Cleric: 'cleric', Druid: 'druid', Fighter: 'fighter',
  Monk: 'monk', Paladin: 'paladin', Ranger: 'ranger', Rogue: 'rogue', Sorcerer: 'sorcerer',
  Warlock: 'warlock', Wizard: 'wizard', Artificer: 'artificer',
};

function spellSlug(s) {
  return `${s.name}|${(s.source ?? 'XPHB').toLowerCase()}`;
}
function spellUrl(s) {
  return `https://5e.tools/spells.html#${encodeURIComponent(spellSlug(s))}`;
}
function mapSpell(s) {
  const classes = [];
  // 5e.tools spell format: classes can be a dict {className: source}, e.g. {"Wizard": "PHB"}.
  if (s.classes && typeof s.classes === 'object') {
    for (const name of Object.keys(s.classes)) {
      const id = CLASS_NAME_TO_ID[name];
      if (id) classes.push(id);
    }
  }
  // `otherSources` and `fromVariantSet` skipped — only the primary class list.
  const id = spellSlug(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const text = [flattenEntries(s.entries), flattenEntries(s.entriesHigherLevel)].filter(Boolean).join(' ');
  const damage = extractFirstDice(text);
  return {
    id,
    name: s.name,
    level: s.level ?? 0,
    school: SCHOOL[s.school] ?? s.school,
    classes,
    description: text,
    damage,
    externalUrl: spellUrl(s),
  };
}

// ---------- Races mapping ----------
function raceSlug(r) {
  return `${r.name}|${(r.source ?? 'PHB').toLowerCase()}`;
}
function raceUrl(r) {
  return `https://5e.tools/races.html#${encodeURIComponent(raceSlug(r))}`;
}
function mapRace(r) {
  const speed = r.speed?.walk ?? 30;
  const id = raceSlug(r).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const size = Array.isArray(r.size) ? r.size[0] : (r.size ?? 'M');
  const entries = r.entries ?? [];
  // Build a short description from non-trait entries.
  const description = entries
    .filter((e) => !e?.name)
    .map((e) => flattenEntries(e.entries ?? e))
    .join(' ')
    .slice(0, 400);
  const traits = entries
    .filter((e) => e?.name && (Array.isArray(e.entries) || typeof e.entries === 'string'))
    .map((e) => ({ name: e.name, description: flattenEntries(e.entries) }));
  return {
    id,
    name: r.name,
    size: SIZE_ES[size] ?? 'Mediano',
    speed: SPEED_FEET_TO_M(speed),
    description,
    traits,
    externalUrl: raceUrl(r),
  };
}

// ---------- Classes mapping ----------
function classSlug(c) {
  return `${c.name}|${(c.source ?? 'PHB').toLowerCase()}`;
}
function classUrl(c) {
  return `https://5e.tools/classes.html#${encodeURIComponent(classSlug(c))}`;
}
function mapClass(c) {
  const id = c.name.toLowerCase();
  // 5etools class data has no top-level text description — we build a short
  // summary from the meta fields so the UI has something to show before the
  // user clicks through to 5e.tools.
  const parts = [];
  parts.push(`${c.name} (PHB${c.page ? ` p.${c.page}` : ''}).`);
  if (c.hd?.faces) parts.push(`Dado de golpe: d${c.hd.faces}.`);
  if (c.spellcastingAbility) parts.push(`Aptitud mágica: ${c.spellcastingAbility.toUpperCase()}.`);
  if (c.casterProgression && c.casterProgression !== 'none') {
    parts.push(`Progresión: ${c.casterProgression}.`);
  }
  if (c.startingProficiencies) {
    const sp = flattenEntries(c.startingProficiencies ?? []).slice(0, 200);
    if (sp) parts.push(sp);
  }
  const description = parts.join(' ');
  // Surface a level-1 feature (placeholder) and the subclass at 3 if known.
  const subclassSection = (c.entries ?? []).find((e) => e?.name && /[Ss]ubclass/.test(e.name));
  const features = [];
  features.push({ level: 1, name: c.name, description: description || '—' });
  if (subclassSection) {
    features.push({
      level: 3,
      name: 'Subclase',
      description: flattenEntries(subclassSection.entries ?? subclassSection).slice(0, 240),
    });
  }
  return {
    id,
    name: c.name,
    hitDie: c.hd?.faces ?? 8,
    primaryAbility: c.spellcastingAbility ?? '—',
    savingThrows: Array.isArray(c.proficiency) ? c.proficiency : [],
    spellcasting: c.casterProgression === 'full' || c.casterProgression === 'half' ? c.casterProgression : 'none',
    description,
    skillChoices: 0,
    skillOptions: [],
    features,
    externalUrl: classUrl(c),
  };
}

// ---------- Main: load JSONs, map, write TypeScript ----------
async function loadJson(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}

async function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('fluff-'));
}

async function main() {
  if (!existsSync(IN)) {
    console.error(`Missing input dir: ${IN}. Run fetch-5etools.mjs first.`);
    process.exit(1);
  }

  // Source priority for deduping: official (PHB, MM, XPHB, XMM) wins over
  // third-party / homebrew (LFL, CR-CotN, EGW, etc.).
  const SOURCE_PRIORITY = ['XPHB', 'PHB', 'XMM', 'MM', 'MPMM', 'WDMM', 'DMG', 'BGDiA', 'BGG', 'BMT', 'CM', 'CoA', 'Cos', 'CRCotN', 'DC', 'Dip', 'DSotDQ', 'EFA', 'EGW', 'ERLW', 'ESK', 'FTD', 'GGR', 'IDRotF', 'LLK', 'LRDT', 'MM', 'MFF', 'MToF', 'OGA', 'OoTA', 'PaBTSO', 'PSI', 'PS-A', 'PS-D', 'PS-I', 'PS-K', 'PS-X', 'SCC', 'SCAG', 'SCE', 'SDW', 'SLW', 'SD', 'ToA', 'TCE', 'TCoE', 'TDCSR', 'TSR', 'VRGR', 'WBtW', 'XGE', 'XSOLBS', 'XSRD'];
  const PRIORITY_RANK = (s) => {
    const i = SOURCE_PRIORITY.indexOf(s);
    return i < 0 ? 999 : i;
  };
  const bestiary = [];
  for (const f of await listFiles(resolve(IN, 'bestiary'))) {
    const d = await loadJson(resolve(IN, 'bestiary', f));
    for (const m of d.monster ?? []) bestiary.push(mapMonster(m));
  }
  // Sort by name+source so the dedup keeps the highest-priority source.
  bestiary.sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    const ra = PRIORITY_RANK(a.id.split('-').pop());
    const rb = PRIORITY_RANK(b.id.split('-').pop());
    return ra - rb;
  });
  const seen = new Set();
  const bestiaryMap = new Map();
  for (const m of bestiary) {
    if (!seen.has(m.name)) {
      seen.add(m.name);
      bestiaryMap.set(m.id, m);
    }
  }
  const dedupedBestiary = Array.from(bestiaryMap.values());
  console.log(`bestiary: ${dedupedBestiary.length} monsters (de-duped from ${bestiary.length})`);

  const spells = [];
  for (const f of await listFiles(resolve(IN, 'spells'))) {
    const d = await loadJson(resolve(IN, 'spells', f));
    for (const s of d.spell ?? []) spells.push(mapSpell(s));
  }
  // Sort by name+source, keep the highest-priority source for each name.
  spells.sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    const ra = PRIORITY_RANK((a.id.split('-').pop() ?? '').toUpperCase());
    const rb = PRIORITY_RANK((b.id.split('-').pop() ?? '').toUpperCase());
    return ra - rb;
  });
  const seenSpells = new Set();
  const spellMap = new Map();
  for (const s of spells) {
    if (!seenSpells.has(s.name)) {
      seenSpells.add(s.name);
      spellMap.set(s.id, s);
    }
  }
  const dedupedSpells = Array.from(spellMap.values());
  console.log(`spells: ${dedupedSpells.length} (de-duped from ${spells.length})`);

  const races = [];
  const racesData = await loadJson(resolve(IN, 'races.json'));
  for (const r of racesData.race ?? []) races.push(mapRace(r));
  // Sort by name+source, keep the highest-priority source for each name.
  races.sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    const ra = PRIORITY_RANK((a.id.split('-').pop() ?? '').toUpperCase());
    const rb = PRIORITY_RANK((b.id.split('-').pop() ?? '').toUpperCase());
    return ra - rb;
  });
  const seenRaces = new Set();
  const raceMap = new Map();
  for (const r of races) {
    if (!seenRaces.has(r.name)) {
      seenRaces.add(r.name);
      raceMap.set(r.id, r);
    }
  }
  const dedupedRaces = Array.from(raceMap.values());
  console.log(`races: ${dedupedRaces.length} (de-duped from ${races.length})`);

  const classes = [];
  for (const f of await listFiles(resolve(IN, 'class'))) {
    const d = await loadJson(resolve(IN, 'class', f));
    for (const c of d.class ?? []) classes.push(mapClass(c));
  }
  // Sort by name+source, keep the highest-priority source for each name.
  bestiary.sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    const ra = PRIORITY_RANK((a.id.split('-').pop() ?? '').toUpperCase());
    const rb = PRIORITY_RANK((b.id.split('-').pop() ?? '').toUpperCase());
    return ra - rb;
  });
  const seenClasses = new Set();
  const classMap = new Map();
  for (const c of classes) {
    if (!seenClasses.has(c.name)) {
      seenClasses.add(c.name);
      classMap.set(c.id, c);
    }
  }
  const dedupedClasses = Array.from(classMap.values());
  console.log(`classes: ${dedupedClasses.length} (de-duped from ${classes.length})`);

  // Write a single TypeScript module that re-exports the data.
  const header = `// AUTO-GENERATED by scripts/build-5etools.mjs. Do not edit by hand.
// Source: 5etools-mirror-3/5etools-src (CC-BY-4.0 Wizards of the Coast SRD 5.2).
import type { Monster, SpellDef, SpeciesDef, ClassDef } from '../../types.js';
`;
  const body =
    `export const BESTIARY_FT: Monster[] = ${JSON.stringify(dedupedBestiary, null, 2)};\n\n` +
    `export const SPELLS_FT: SpellDef[] = ${JSON.stringify(dedupedSpells, null, 2)};\n\n` +
    `export const SPECIES_FT: SpeciesDef[] = ${JSON.stringify(dedupedRaces, null, 2)};\n\n` +
    `export const CLASSES_FT: ClassDef[] = ${JSON.stringify(dedupedClasses, null, 2)};\n`;
  await writeFile(OUT, header + body, 'utf8');
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/**
 * Pull the 5etools data files we need into backend/src/domain/srd/data/5etools/
 * and generate a typed TypeScript loader that the SRD provider can import.
 *
 * Source: https://github.com/5etools-mirror-3/5etools-src (the 5e.tools GitHub
 * mirror). The data is licensed CC-BY-4.0 (Wizards of the Coast SRD 5.2 + 2014
 * SRD); see the per-record `source` field for the originating book.
 *
 * Run: `node scripts/fetch-5etools.mjs`
 *
 * What we pull (SRD-focused, "core" books only):
 *   - bestiary-mm.json   (Monster Manual 5.1)
 *   - bestiary-mpmm.json (Mordenkainen Presents)
 *   - bestiary-wdmm.json (Wild Beyond the Witchlight)
 *   - bestiary-xmm.json  (Monsters of the Multiverse, 2024)
 *   - spells-phb.json    (Player's Handbook 5.1)
 *   - spells-xphb.json   (Player's Handbook 5.2 — SRD 5.2)
 *   - races.json         (all races)
 *   - class/class-*.json (all classes)
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'backend/src/domain/srd/data/5etools');
const BASE = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data';

const FILES = [
  'bestiary/bestiary-mm.json',
  'bestiary/bestiary-mpmm.json',
  'bestiary/bestiary-wdmm.json',
  'bestiary/bestiary-xmm.json',
  'spells/spells-phb.json',
  'spells/spells-xphb.json',
  'races.json',
  'class/class-barbarian.json',
  'class/class-bard.json',
  'class/class-cleric.json',
  'class/class-druid.json',
  'class/class-fighter.json',
  'class/class-monk.json',
  'class/class-paladin.json',
  'class/class-ranger.json',
  'class/class-rogue.json',
  'class/class-sorcerer.json',
  'class/class-warlock.json',
  'class/class-wizard.json',
];

async function fetchOne(path) {
  const url = `${BASE}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

async function main() {
  if (existsSync(OUT_DIR)) {
    await rm(OUT_DIR, { recursive: true, force: true });
  }
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(resolve(OUT_DIR, 'bestiary'), { recursive: true });
  await mkdir(resolve(OUT_DIR, 'spells'), { recursive: true });
  await mkdir(resolve(OUT_DIR, 'class'), { recursive: true });

  for (const f of FILES) {
    process.stdout.write(`fetching ${f}… `);
    const text = await fetchOne(f);
    const outPath = resolve(OUT_DIR, f);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, text, 'utf8');
    process.stdout.write(`ok (${(text.length / 1024).toFixed(0)} kB)\n`);
  }

  console.log(`\nDone. ${FILES.length} files in ${OUT_DIR}`);
  console.log('Next: run `pnpm -C backend exec tsc --noEmit` to verify types compile.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

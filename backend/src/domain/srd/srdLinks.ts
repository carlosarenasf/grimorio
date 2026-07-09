/**
 * Builders for canonical 5e.tools URLs.
 *
 * 5e.tools hosts the SRD 5.2 + a curated bestiary; we link to their
 * pages for "read more" depth without fetching or redistributing their
 * data. The URL format is `<base>/<page>.html#<name>_<source>`, where
 * the name is lowercased (spaces preserved) and the source is lowercase.
 * URL-encoding handles the spaces and the underscore is left alone.
 *
 * Verified examples (manually opened in a browser, they land on the
 * right record):
 *   - Abominable Yeti (XMM)  → #abominable%20yeti_xmm
 *   - Fire Bolt (PHB)         → #fire%20bolt_phb
 *   - Goblin (MM)             → #goblin_mm
 *   - Elf (PHB)               → #elf_phb
 *
 * The `build-5etools.mjs` script writes the URL directly onto each
 * record (`m.externalUrl`, `s.externalUrl`, etc.) using the original
 * `name` + `source` from the 5etools JSON. This module is a fallback for
 * the data files (`bestiary.ts`, `spells.ts`, ...) that still predate
 * the migration.
 */
const BASE = 'https://5e.tools';

export function fiveEToolsUrl(page: string, name: string, source: string): string {
  const slug = `${name.toLowerCase()}_${source.toLowerCase()}`;
  return `${BASE}/${page}.html#${encodeURIComponent(slug)}`;
}

/**
 * Variants of the builder that accept just a name (no source). The source
 * is omitted from the URL — 5e.tools falls back to its default source
 * picker, which usually works for canonical PHB/MM records.
 */
function pageUrl(page: string, name: string): string {
  return `${BASE}/${page}.html#${encodeURIComponent(name.toLowerCase())}`;
}

export const FIVE_ETOOLS = {
  monster(name: string, source?: string): string {
    return source ? fiveEToolsUrl('bestiary', name, source) : pageUrl('bestiary', name);
  },
  spell(name: string, source?: string): string {
    return source ? fiveEToolsUrl('spells', name, source) : pageUrl('spells', name);
  },
  species(name: string, source?: string): string {
    return source ? fiveEToolsUrl('races', name, source) : pageUrl('races', name);
  },
  class(name: string, source?: string): string {
    return source ? fiveEToolsUrl('classes', name, source) : pageUrl('classes', name);
  },
  background(name: string, source?: string): string {
    return source ? fiveEToolsUrl('backgrounds', name, source) : pageUrl('backgrounds', name);
  },
  weapon(name: string, source?: string): string {
    return source ? fiveEToolsUrl('items', name, source) : pageUrl('items', name);
  },
};

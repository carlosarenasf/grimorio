/**
 * 5e.tools URL builder (frontend mirror of `backend/src/domain/srd/srdLinks.ts`).
 *
 * Used by UI to show "Ver en 5e.tools" links on species/classes/spells/monsters.
 * The 5e.tools hash format is `#<name>_<source>`, URL-encoded; verified
 * manually that e.g. `#abominable%20yeti_xmm` opens the right record.
 *
 * If a data entry already carries an `externalUrl`, that wins; this is the
 * fallback for ad-hoc links (e.g. the bestiary search row that shows the
 * id, not the original name+source).
 */
const BASE = 'https://5e.tools';

function pageUrl(page: string, name: string, source?: string): string {
  const slug = source ? `${name.toLowerCase()}_${source.toLowerCase()}` : name.toLowerCase();
  return `${BASE}/${page}.html#${encodeURIComponent(slug)}`;
}

/** Build a 5e.tools search URL — fallback when we don't have a specific record. */
export function fiveEToolsSearch(name: string): string {
  return `${BASE}/search.html?q=${encodeURIComponent(name)}`;
}

export const fiveETools = {
  monster(name: string, source?: string): string {
    return pageUrl('bestiary', name, source);
  },
  spell(name: string, source?: string): string {
    return pageUrl('spells', name, source);
  },
  species(name: string, source?: string): string {
    return pageUrl('races', name, source);
  },
  class(name: string, source?: string): string {
    return pageUrl('classes', name, source);
  },
  background(name: string, source?: string): string {
    return pageUrl('backgrounds', name, source);
  },
  weapon(name: string, source?: string): string {
    return pageUrl('items', name, source);
  },
};

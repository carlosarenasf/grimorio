/**
 * Builders for canonical 5e.tools URLs.
 *
 * 5e.tools hosts the SRD 5.2 + a curated bestiary; we link to their
 * pages for "read more" depth without fetching or redistributing their
 * data. The URL format is `<base>#<kind>%20<id-slug>`, where the id
 * matches the 5etools source slug (e.g. `goblin`, `mage-armor`, `drow`).
 *
 * If a data entry in `backend/src/domain/srd/data/*.ts` already carries
 * an `externalUrl`, that wins — these builders are the fallback.
 */
const BASE = 'https://5e.tools';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const FIVE_ETOOLS = {
  monster(id: string): string {
    return `${BASE}/bestiary.html#monster%20${encodeURIComponent(slugify(id))}`;
  },
  spell(id: string): string {
    return `${BASE}/spells.html#spell%20${encodeURIComponent(slugify(id))}`;
  },
  species(id: string): string {
    return `${BASE}/races.html#race%20${encodeURIComponent(slugify(id))}`;
  },
  class(id: string): string {
    return `${BASE}/classes.html#class%20${encodeURIComponent(slugify(id))}`;
  },
  background(id: string): string {
    return `${BASE}/backgrounds.html#background%20${encodeURIComponent(slugify(id))}`;
  },
  weapon(id: string): string {
    return `${BASE}/items.html#item%20${encodeURIComponent(slugify(id))}`;
  },
};

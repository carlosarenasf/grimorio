/**
 * 5e.tools URL builder (frontend mirror of `backend/src/domain/srd/srdLinks.ts`).
 *
 * Used by UI to show "Ver en 5e.tools" links on species/classes/spells/monsters.
 * If a data entry already carries an `externalUrl`, that wins; this is the
 * fallback for ad-hoc links (e.g. the bestiary search row).
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

export const fiveETools = {
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

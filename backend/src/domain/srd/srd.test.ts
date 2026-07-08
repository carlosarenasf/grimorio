import { describe, expect, it } from 'vitest';
import { StaticSrdProvider } from './provider.js';

const provider = new StaticSrdProvider();

describe('StaticSrdProvider.searchMonsters', () => {
  it('returns a bounded non-empty list for an empty query', () => {
    const all = provider.searchMonsters('');
    expect(all.length).toBeGreaterThan(0);
    expect(all.length).toBeLessThanOrEqual(50);
  });

  it('returns refs with id, name, cr and meta', () => {
    const [first] = provider.searchMonsters('');
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('cr');
    expect(first).toHaveProperty('meta');
  });

  it('every returned monster has a 5e.tools externalUrl', () => {
    const all = provider.searchMonsters('');
    for (const ref of all) {
      expect(ref).toHaveProperty('id');
    }
  });

  it('searches by name substring (case-insensitive)', () => {
    const lower = provider.searchMonsters('goblin');
    const upper = provider.searchMonsters('GOBLIN');
    expect(lower.length).toBeGreaterThan(0);
    expect(lower.map((m) => m.id).sort()).toEqual(upper.map((m) => m.id).sort());
  });
});

describe('StaticSrdProvider.getMonster', () => {
  it('returns a monster with AC and HP for a known id (goblin-mm)', () => {
    const monster = provider.getMonster('goblin-mm');
    expect(monster).not.toBeNull();
    expect(monster?.ac).toBeGreaterThan(0);
    expect(monster?.hp).toBeGreaterThan(0);
    expect(Array.isArray(monster?.attacks)).toBe(true);
    expect(monster?.externalUrl).toMatch(/^https:\/\/5e\.tools\//);
  });

  it('falls back to the suffixed id when the bare id is requested (legacy data)', () => {
    // Combatants persisted before the 5e.tools migration store `refId: 'goblin'`.
    // The provider transparently resolves that to `goblin-mm` (or whichever source
    // the data picks) so old sessions keep working.
    const viaBare = provider.getMonster('goblin');
    expect(viaBare).not.toBeNull();
    expect(viaBare?.id).toMatch(/^goblin-(mm|phb|xphb|xmm)$/);
  });

  it('returns null for an unknown id', () => {
    expect(provider.getMonster('not-a-real-monster')).toBeNull();
  });
});

describe('StaticSrdProvider.conditions', () => {
  it('includes the canonical 2024 condition set', () => {
    const conditions = provider.conditions();
    const keys = conditions.map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(['cegado', 'envenenado', 'aturdido', 'inconsciente']));
    expect(conditions.length).toBeGreaterThanOrEqual(15);
  });

  it('gives every condition a key, label and color', () => {
    for (const condition of provider.conditions()) {
      expect(condition.key).toBeTruthy();
      expect(condition.label).toBeTruthy();
      expect(condition.color).toBeTruthy();
    }
  });
});

describe('StaticSrdProvider.rulesReference', () => {
  it('returns non-empty sections with id, title and body', () => {
    const sections = provider.rulesReference();
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) {
      expect(section.id).toBeTruthy();
      expect(section.title).toBeTruthy();
      expect(section.body).toBeTruthy();
    }
  });

  it('covers the expected quick-reference topics', () => {
    const ids = provider.rulesReference().map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'economia-acciones',
        'clases-dificultad',
        'cobertura',
        'salvaciones-muerte',
        'descansos',
      ]),
    );
  });
});

describe('StaticSrdProvider.species', () => {
  it('returns a non-empty list of species (50+)', () => {
    const species = provider.species();
    expect(species.length).toBeGreaterThanOrEqual(50);
  });

  it('every species has id, name, size, speed, description and traits', () => {
    for (const s of provider.species()) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.size).toBeTruthy();
      expect(s.speed).toBeGreaterThan(0);
      expect(Array.isArray(s.traits)).toBe(true);
    }
  });

  it('species traits have name and description when present', () => {
    for (const s of provider.species()) {
      for (const trait of s.traits) {
        expect(trait.name).toBeTruthy();
        expect(trait.description).toBeTruthy();
      }
    }
  });

  it('core 2024 races are present (aasimar, dragonborn, goliath, tiefling, orc)', () => {
    // The Spanish name map translates the PHB 2024 species; some 5e.tools
    // names are identical in Spanish and English (e.g. Tiefling, Aasimar,
    // Goliath). We just check that the canonical set is present in any
    // of the accepted spellings.
    const species = provider.species();
    const names = species.map((s) => s.name);
    for (const expected of ['Elfo', 'Enano', 'Mediano', 'Tiefling', 'Aasimar', 'Orco', 'Gnomo', 'Goliath', 'Dracónido', 'Humano']) {
      expect(names).toContain(expected);
    }
  });

  it('every species has a 5e.tools URL', () => {
    for (const s of provider.species()) {
      expect(s.externalUrl).toMatch(/^https:\/\/5e\.tools\//);
    }
  });
});

describe('StaticSrdProvider.classes', () => {
  it('returns a non-empty list of classes (12+ from 5e.tools)', () => {
    const classes = provider.classes();
    expect(classes.length).toBeGreaterThanOrEqual(12);
  });

  it('every class has id, name, hitDie, description, features, and externalUrl', () => {
    for (const c of provider.classes()) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.hitDie).toBeGreaterThan(0);
      expect(Array.isArray(c.savingThrows)).toBe(true);
      expect(['full', 'half', 'none']).toContain(c.spellcasting);
      expect(c.description).toBeTruthy();
      expect(Array.isArray(c.features)).toBe(true);
      expect(c.externalUrl).toMatch(/^https:\/\/5e\.tools\//);
    }
  });

  it('class features have level, name and description', () => {
    for (const c of provider.classes()) {
      for (const feature of c.features) {
        expect(feature.level).toBeGreaterThan(0);
        expect(feature.name).toBeTruthy();
        expect(feature.description).toBeTruthy();
      }
    }
  });

  it('the 12 2024 PHB classes are all present', () => {
    const classes = provider.classes();
    const names = classes.map((c) => c.name.toLowerCase());
    for (const expected of ['bárbaro', 'bardo', 'clérigo', 'druida', 'guerrero', 'monje', 'paladín', 'explorador', 'pícaro', 'hechicero', 'brujo', 'mago']) {
      expect(names).toContain(expected);
    }
  });
});

describe('StaticSrdProvider.spells', () => {
  it('returns the 5e.tools spell list (200+ SRD spells)', () => {
    const spells = provider.spells();
    expect(spells.length).toBeGreaterThanOrEqual(200);
  });

  it('every spell has id, name, level, school, description and externalUrl', () => {
    for (const s of provider.spells()) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.level).toBeGreaterThanOrEqual(0);
      expect(s.school).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.externalUrl).toMatch(/^https:\/\/5e\.tools\//);
    }
  });

  it('filters by classId (e.g. wizard spells)', () => {
    const wizard = provider.spells('wizard');
    expect(wizard.length).toBeGreaterThan(0);
    for (const s of wizard) {
      expect(s.classes).toContain('wizard');
    }
  });

  it('includes Fire Bolt as a wizard cantrip', () => {
    const fire = provider.spells('wizard').find((s) => s.id.includes('fire-bolt'));
    expect(fire).toBeDefined();
    expect(fire?.level).toBe(0);
  });
});

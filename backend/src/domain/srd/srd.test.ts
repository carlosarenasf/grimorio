import { describe, expect, it } from 'vitest';
import { StaticSrdProvider } from './provider.js';

const provider = new StaticSrdProvider();

describe('StaticSrdProvider.searchMonsters', () => {
  it('finds orc-family entries case-insensitively', () => {
    const lower = provider.searchMonsters('orco');
    const upper = provider.searchMonsters('ORCO');
    expect(lower.length).toBeGreaterThan(0);
    expect(lower.map((m) => m.id).sort()).toEqual(upper.map((m) => m.id).sort());
    for (const ref of lower) {
      expect(ref.name.toLowerCase()).toContain('orco');
    }
  });

  it('returns a bounded non-empty list for an empty query', () => {
    const all = provider.searchMonsters('');
    expect(all.length).toBeGreaterThan(0);
    expect(all.length).toBeLessThanOrEqual(100);
  });

  it('returns refs with id, name, cr and meta', () => {
    const [first] = provider.searchMonsters('');
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('cr');
    expect(first).toHaveProperty('meta');
  });
});

describe('StaticSrdProvider.getMonster', () => {
  it('returns a monster with AC and HP for a known id', () => {
    const monster = provider.getMonster('goblin');
    expect(monster).not.toBeNull();
    expect(monster?.ac).toBeGreaterThan(0);
    expect(monster?.hp).toBeGreaterThan(0);
    expect(Array.isArray(monster?.attacks)).toBe(true);
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
  it('returns a non-empty list of species', () => {
    const species = provider.species();
    expect(species.length).toBeGreaterThan(0);
  });

  it('every species has id, name, size, speed, description and traits', () => {
    for (const s of provider.species()) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.size).toBeTruthy();
      expect(s.speed).toBeGreaterThan(0);
      expect(s.description).toBeTruthy();
      expect(Array.isArray(s.traits)).toBe(true);
    }
  });

  it('species traits have name and description', () => {
    for (const s of provider.species()) {
      for (const trait of s.traits) {
        expect(trait.name).toBeTruthy();
        expect(trait.description).toBeTruthy();
      }
    }
  });

  it('elf has darkvision, trance and keen senses', () => {
    const elf = provider.species().find((s) => s.id === 'elf');
    expect(elf).toBeDefined();
    const traitNames = elf!.traits.map((t) => t.name);
    expect(traitNames).toEqual(
      expect.arrayContaining(['Visión en la oscuridad', 'Ancestro (Trance)', 'Sentidos agudos']),
    );
  });

  it('dwarf has darkvision and dwarven resilience', () => {
    const dwarf = provider.species().find((s) => s.id === 'dwarf');
    expect(dwarf).toBeDefined();
    const traitNames = dwarf!.traits.map((t) => t.name);
    expect(traitNames).toEqual(
      expect.arrayContaining(['Visión en la oscuridad', 'Resistencia enana']),
    );
  });

  it('halfling has luck, bravery and agility', () => {
    const halfling = provider.species().find((s) => s.id === 'halfling');
    expect(halfling).toBeDefined();
    const traitNames = halfling!.traits.map((t) => t.name);
    expect(traitNames).toEqual(
      expect.arrayContaining(['Suerte', 'Valentía', 'Agilidad de mediano']),
    );
  });

  it('tiefling has darkvision and infernal legacy', () => {
    const tiefling = provider.species().find((s) => s.id === 'tiefling');
    expect(tiefling).toBeDefined();
    const traitNames = tiefling!.traits.map((t) => t.name);
    expect(traitNames).toEqual(
      expect.arrayContaining(['Visión en la oscuridad', 'Herencia infernal']),
    );
  });

  it('aasimar has darkvision and celestial legacy', () => {
    const aasimar = provider.species().find((s) => s.id === 'aasimar');
    expect(aasimar).toBeDefined();
    const traitNames = aasimar!.traits.map((t) => t.name);
    expect(traitNames).toEqual(
      expect.arrayContaining(['Visión en la oscuridad', 'Herencia celestial']),
    );
  });
});

describe('StaticSrdProvider.classes', () => {
  it('returns a non-empty list of classes', () => {
    const classes = provider.classes();
    expect(classes.length).toBeGreaterThan(0);
  });

  it('every class has id, name, hitDie, primaryAbility, savingThrows, spellcasting, description, skillChoices, skillOptions and features', () => {
    for (const c of provider.classes()) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.hitDie).toBeGreaterThan(0);
      expect(c.primaryAbility).toBeTruthy();
      expect(Array.isArray(c.savingThrows)).toBe(true);
      expect(['full', 'half', 'none']).toContain(c.spellcasting);
      expect(c.description).toBeTruthy();
      expect(c.skillChoices).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(c.skillOptions)).toBe(true);
      expect(Array.isArray(c.features)).toBe(true);
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

  it('fighter has fighting style, second wind and action surge', () => {
    const fighter = provider.classes().find((c) => c.id === 'fighter');
    expect(fighter).toBeDefined();
    const featureNames = fighter!.features.map((f) => f.name);
    expect(featureNames).toEqual(
      expect.arrayContaining(['Estilo de combate', 'Segundo viento', 'Acción adicional']),
    );
  });

  it('wizard has spellcasting and arcane recovery', () => {
    const wizard = provider.classes().find((c) => c.id === 'wizard');
    expect(wizard).toBeDefined();
    const featureNames = wizard!.features.map((f) => f.name);
    expect(featureNames).toEqual(
      expect.arrayContaining(['Lanzamiento de conjuros', 'Recuperación arcana']),
    );
  });

  it('cleric has spellcasting, divine domain and channel divinity', () => {
    const cleric = provider.classes().find((c) => c.id === 'cleric');
    expect(cleric).toBeDefined();
    const featureNames = cleric!.features.map((f) => f.name);
    expect(featureNames).toEqual(
      expect.arrayContaining(['Lanzamiento de conjuros', 'Dominio divino', 'Canalizar divinidad']),
    );
  });

  it('rogue has sneak attack, thieves cant and action surge', () => {
    const rogue = provider.classes().find((c) => c.id === 'rogue');
    expect(rogue).toBeDefined();
    const featureNames = rogue!.features.map((f) => f.name);
    expect(featureNames).toEqual(
      expect.arrayContaining(['Ataque furtivo', 'Jerga de ladrones', 'Acción adicional']),
    );
  });

  it('barbarian has rage, unarmored defense and reckless attack', () => {
    const barbarian = provider.classes().find((c) => c.id === 'barbarian');
    expect(barbarian).toBeDefined();
    const featureNames = barbarian!.features.map((f) => f.name);
    expect(featureNames).toEqual(
      expect.arrayContaining(['Ira', 'Defensa sin armadura', 'Ataque temerario']),
    );
  });

  it('monk has martial arts and ki', () => {
    const monk = provider.classes().find((c) => c.id === 'monk');
    expect(monk).toBeDefined();
    const featureNames = monk!.features.map((f) => f.name);
    expect(featureNames).toEqual(
      expect.arrayContaining(['Artes marciales', 'Ki']),
    );
  });
});

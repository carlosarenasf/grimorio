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

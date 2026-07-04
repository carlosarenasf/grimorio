import { describe, expect, it } from 'vitest';
import {
  TILE_CATEGORIES,
  TILES,
  tilesByCategory,
  getTile,
  tileToDataURL,
} from './tiles';

describe('catálogo de tiles', () => {
  it('expone las 10 categorías esperadas', () => {
    expect(TILE_CATEGORIES).toEqual([
      'bosque',
      'mina',
      'dungeon',
      'pantano',
      'montaña',
      'desierto',
      'pueblo',
      'castillo',
      'casa',
      'decoracion',
    ]);
  });

  it('cada categoría tiene al menos un tile y todos los tiles tienen SVG no vacío', () => {
    for (const cat of TILE_CATEGORIES) {
      const list = tilesByCategory(cat);
      expect(list.length, `categoría ${cat} debe tener tiles`).toBeGreaterThan(0);
      for (const tile of list) {
        expect(typeof tile.id).toBe('string');
        expect(tile.id.length).toBeGreaterThan(0);
        expect(typeof tile.name).toBe('string');
        expect(tile.name.length).toBeGreaterThan(0);
        expect(typeof tile.svg).toBe('string');
        expect(tile.svg.length).toBeGreaterThan(0);
        expect(tile.svg).toContain('<svg');
        expect(tile.svg).toContain('viewBox="0 0 32 32"');
        expect(tile.width).toBe(32);
        expect(tile.height).toBe(32);
      }
    }
  });

  it('los ids de tile son únicos', () => {
    const ids = TILES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getTile devuelve el tile por id y undefined si no existe', () => {
    const first = TILES[0];
    expect(getTile(first.id)).toBe(first);
    expect(getTile('no-existe')).toBeUndefined();
  });

  it('tileToDataURL produce un data URL SVG', () => {
    const tile = TILES[0];
    const url = tileToDataURL(tile);
    expect(typeof url).toBe('string');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
  });
});
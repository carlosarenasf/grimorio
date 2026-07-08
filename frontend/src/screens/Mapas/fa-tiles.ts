/**
 * Catálogo de tiles basados en imágenes del pack Forgotten Adventures.
 *
 * El catálogo se genera con `scripts/generate-fa-catalog.cjs` y se sirve como
 * JSON estático desde `/fa-assets/catalog.json`. Se carga de forma perezosa
 * bajo demanda para no inflar el bundle principal.
 *
 * Cada tile FA referencia un PNG servido por Vite desde `public/fa-assets/`
 * (symlink al directorio local de assets). Las dimensiones se expresan en
 * unidades de grid (`gridW` × `gridH`); el componente que renderiza escala la
 * imagen al tamaño final multiplicando por el `gridSize` del mapa.
 */

export interface FATileDef {
  id: string;
  name: string;
  src: string;
  gridW: number;
  gridH: number;
}

export interface FASubcategory {
  id: string;
  label: string;
  tiles: FATileDef[];
}

export interface FACategory {
  id: string;
  label: string;
  source: string;
  subcategories: FASubcategory[];
  tileCount: number;
}

export interface FACatalog {
  version: number;
  generatedAt: string;
  totalCategories: number;
  totalTiles: number;
  categories: FACategory[];
}

let cachedCatalog: FACatalog | null = null;
let pendingLoad: Promise<FACatalog> | null = null;

/** Carga el catálogo FA desde el JSON estático (una sola vez). */
export async function loadFACatalog(): Promise<FACatalog> {
  if (cachedCatalog) return cachedCatalog;
  if (pendingLoad) return pendingLoad;
  pendingLoad = fetch('/fa-assets/catalog.json')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load FA catalog: ${res.status}`);
      return res.json() as Promise<FACatalog>;
    })
    .then((catalog) => {
      cachedCatalog = catalog;
      return catalog;
    });
  return pendingLoad;
}

/** Busca un tile FA por id en el catálogo (requiere que esté cargado). */
export function findFATile(catalog: FACatalog, tileId: string): FATileDef | undefined {
  for (const cat of catalog.categories) {
    for (const sub of cat.subcategories) {
      const tile = sub.tiles.find((t) => t.id === tileId);
      if (tile) return tile;
    }
  }
  return undefined;
}

/** Devuelve true si el tileId corresponde a un tile FA (prefijo "fa_"). */
export function isFATileId(tileId: string): boolean {
  return tileId.startsWith('fa_');
}

/**
 * Aplanar el catálogo en una lista de tiles con su categoría y subcategoría
 * para el toolbar unificado.
 */
export interface FATileWithCategory extends FATileDef {
  categoryId: string;
  categoryLabel: string;
  subcategoryId: string;
  subcategoryLabel: string;
}

export function flattenFACatalog(catalog: FACatalog): FATileWithCategory[] {
  const result: FATileWithCategory[] = [];
  for (const cat of catalog.categories) {
    for (const sub of cat.subcategories) {
      for (const tile of sub.tiles) {
        result.push({
          ...tile,
          categoryId: cat.id,
          categoryLabel: cat.label,
          subcategoryId: sub.id,
          subcategoryLabel: sub.label,
        });
      }
    }
  }
  return result;
}

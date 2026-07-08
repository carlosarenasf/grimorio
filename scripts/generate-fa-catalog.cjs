#!/usr/bin/env node
/**
 * Escanea el pack de assets de Forgotten Adventures y genera un catálogo JSON
 * para el editor de mapas de Grimorio.
 *
 * Uso: node scripts/generate-fa-catalog.js
 *
 * Salida: frontend/public/fa-assets/catalog.json
 *
 * El catálogo organiza los PNGs por categoría (directorio de primer nivel) y
 * subcategoría (directorios intermedios), extrayendo las dimensiones de grid
 * del sufijo del archivo (_NxM.png). Los archivos sin sufijo (texturas) se
 * tratan como 1x1.
 */

const fs = require('fs');
const path = require('path');

const FA_ROOT = path.resolve(__dirname, '../assets/Core_Mapmaking_Pack_Part1_v1.10/FA_Assets');
const OUTPUT = path.resolve(__dirname, '../frontend/public/fa-assets/catalog.json');

const CATEGORY_LABELS = {
  '!Core_Settlements': {
    Burial_and_Graves: 'Enterramiento y Tumbas',
    Clutter: 'Desorden',
    Combat: 'Combate',
    Decor: 'Decoración',
    Furniture: 'Mobiliario',
    Lightsources: 'Fuentes de Luz',
    Natural_Decor: 'Decoración Natural',
    Textures: 'Texturas',
    Vehicles: 'Vehículos',
    Workplace_Equipment: 'Equipo de Trabajo',
  },
  '!Effects': {
    Animations: 'Animaciones',
    Blast_Marks: 'Marcas de Explosión',
    Fire: 'Fuego',
    Lightning: 'Relámpago',
    Magic: 'Magia',
    Misc_Paths: 'Caminos Varios',
    Shadow_Paths: 'Caminos de Sombra',
    Smoke: 'Humo',
    Spore_Clouds: 'Nubes de Esporas',
    Texture_Overlays: 'Overlays de Textura',
    Webs: 'Telarañas',
  },
};

const SKIP_DIRS = new Set([
  'Filled', 'Broken', 'Fallen', 'Damaged', 'Parts', 'Arms', 'Mobiles',
  'Sail_Cloths', 'Rigging_Mast_Boards', 'Rigging_Platforms', 'Rigging_Rope_Blocks',
  'Rigging_Rope_Hoops', 'Rigging_Rope_Pegs', 'Highchairs',
]);

function parseGridSize(filename) {
  const match = filename.match(/_(\d+)x(\d+)\.png$/i);
  if (match) return { gridW: parseInt(match[1], 10), gridH: parseInt(match[2], 10) };
  return { gridW: 1, gridH: 1 };
}

function humanize(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
}

function tileIdFromPath(relPath) {
  return 'fa_' + relPath
    .replace(/\.png$/i, '')
    .replace(/[^a-zA-Z0-9/]/g, '_')
    .replace(/\/+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .replace(/^_|_$/g, '');
}

function displayName(filename) {
  return humanize(filename.replace(/_\d+x\d+\.png$/i, '').replace(/\.png$/i, ''));
}

function walkDir(dir, basePath = '') {
  const entries = [];
  let items;
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return entries;
  }
  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    const fullPath = path.join(dir, item.name);
    const relPath = path.join(basePath, item.name);
    if (item.isDirectory()) {
      if (SKIP_DIRS.has(item.name)) continue;
      entries.push({ type: 'dir', name: item.name, path: fullPath, relPath });
    } else if (item.isFile() && item.name.toLowerCase().endsWith('.png')) {
      entries.push({ type: 'file', name: item.name, path: fullPath, relPath });
    }
  }
  return entries;
}

function scanCategory(sourceGroup, categoryDir, categoryId) {
  const labels = CATEGORY_LABELS[sourceGroup] || {};
  const categoryLabel = labels[categoryId] || humanize(categoryId);
  const subcategories = [];

  const entries = walkDir(categoryDir);
  const dirs = entries.filter((e) => e.type === 'dir');
  const files = entries.filter((e) => e.type === 'file');

  if (files.length > 0 && dirs.length === 0) {
    const tiles = files.map((f) => {
      const { gridW, gridH } = parseGridSize(f.name);
      const src = `/fa-assets/${sourceGroup}/${categoryId}/${f.name}`;
      return {
        id: tileIdFromPath(`${sourceGroup}/${categoryId}/${f.name}`),
        name: displayName(f.name),
        src,
        gridW,
        gridH,
      };
    });
    if (tiles.length > 0) {
      subcategories.push({
        id: categoryId,
        label: categoryLabel,
        tiles,
      });
    }
    return subcategories;
  }

  for (const dir of dirs) {
    const subTiles = scanSubcategory(sourceGroup, categoryId, dir);
    if (subTiles.length > 0) {
      subcategories.push({
        id: dir.name.toLowerCase(),
        label: humanize(dir.name),
        tiles: subTiles,
      });
    }
  }

  if (files.length > 0) {
    const tiles = files.map((f) => {
      const { gridW, gridH } = parseGridSize(f.name);
      const src = `/fa-assets/${sourceGroup}/${categoryId}/${f.name}`;
      return {
        id: tileIdFromPath(`${sourceGroup}/${categoryId}/${f.name}`),
        name: displayName(f.name),
        src,
        gridW,
        gridH,
      };
    });
    subcategories.unshift({
      id: `${categoryId}_root`,
      label: categoryLabel,
      tiles,
    });
  }

  return subcategories;
}

function scanSubcategory(sourceGroup, categoryId, dirEntry) {
  const tiles = [];
  const entries = walkDir(dirEntry.path);

  for (const entry of entries) {
    if (entry.type === 'file') {
      const { gridW, gridH } = parseGridSize(entry.name);
      const src = `/fa-assets/${sourceGroup}/${categoryId}/${dirEntry.relPath}/${entry.name}`;
      tiles.push({
        id: tileIdFromPath(`${sourceGroup}/${categoryId}/${dirEntry.relPath}/${entry.name}`),
        name: displayName(entry.name),
        src,
        gridW,
        gridH,
      });
    } else if (entry.type === 'dir') {
      tiles.push(...scanSubcategory(sourceGroup, categoryId, entry));
    }
  }
  return tiles;
}

function main() {
  const categories = [];
  const sourceGroups = ['!Core_Settlements', '!Effects'];

  for (const sourceGroup of sourceGroups) {
    const sourceDir = path.join(FA_ROOT, sourceGroup);
    if (!fs.existsSync(sourceDir)) continue;

    const topDirs = walkDir(sourceDir).filter((e) => e.type === 'dir');
    for (const catDir of topDirs) {
      const subcategories = scanCategory(sourceGroup, catDir.path, catDir.name);
      if (subcategories.length > 0) {
        const totalTiles = subcategories.reduce((sum, sc) => sum + sc.tiles.length, 0);
        categories.push({
          id: `${sourceGroup.replace('!', '')}_${catDir.name}`.toLowerCase(),
          label: (CATEGORY_LABELS[sourceGroup] || {})[catDir.name] || humanize(catDir.name),
          source: sourceGroup.replace('!', '').toLowerCase(),
          subcategories,
          tileCount: totalTiles,
        });
      }
    }
  }

  const catalog = {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalCategories: categories.length,
    totalTiles: categories.reduce((sum, c) => sum + c.tileCount, 0),
    categories,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(catalog, null, 2));

  console.log(`Catalog generated: ${catalog.totalCategories} categories, ${catalog.totalTiles} tiles`);
  console.log(`Output: ${OUTPUT}`);
}

main();

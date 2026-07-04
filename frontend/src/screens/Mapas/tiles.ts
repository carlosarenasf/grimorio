/**
 * Catálogo de tiles del editor de mapas.
 *
 * Cada tile es un **SVG inline** (vista de pájaro, pixel art top-down) que se
 * carga como `Konva.Image` vía data URL. Evita dependencias de assets PNG
 * binarios: todo el catálogo vive en el propio bundle.
 *
 * Paleta: tonos terra, verdes bosque, grises de muro, marrones de madera —
 * alineada con los tokens oscuros de Grimorio.
 */

export type TileCategory =
  | 'bosque'
  | 'mina'
  | 'dungeon'
  | 'pantano'
  | 'montaña'
  | 'desierto'
  | 'pueblo'
  | 'castillo'
  | 'casa'
  | 'decoracion';

export interface TileDef {
  id: string;
  name: string;
  category: TileCategory;
  svg: string;
  width: number;
  height: number;
}

export const TILE_CATEGORIES: TileCategory[] = [
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
];

export const TILE_SIZE = 32;

/** Envuelve un contenido SVG en un viewBox 32×32 con fondo oscuro/gris. */
function svg(inner: string, bg = '#2a2640'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges"><rect width="32" height="32" fill="${bg}"/>${inner}</svg>`;
}

// Paletas
const green = '#3a5a40';
const greenDark = '#28402e';
const trunk = '#5a4530';
const stone = '#6b6557';
const stoneDark = '#3d3a34';
const wood = '#7a5a3a';
const woodDark = '#4a3a26';
const water = '#3f587a';
const waterLight = '#5e84a6';
const sand = '#c9a86a';
const snow = '#e8e2d0';
const red = '#8a2e2e';
const gold = '#c9a227';
const grey = '#5a5650';

function def(
  id: string,
  name: string,
  category: TileCategory,
  inner: string,
  bg = '#2a2640',
): TileDef {
  return { id, name, category, svg: svg(inner, bg), width: TILE_SIZE, height: TILE_SIZE };
}

// ---------- BOSQUE ----------
const bosque: TileDef[] = [
  def('for_tree', 'Árbol', 'bosque', `<circle cx="16" cy="13" r="9" fill="${green}"/><circle cx="13" cy="10" r="3" fill="${greenDark}"/><rect x="14" y="20" width="4" height="8" fill="${trunk}"/>`),
  def('for_bush', 'Arbusto', 'bosque', `<ellipse cx="16" cy="18" rx="10" ry="7" fill="${green}"/><ellipse cx="12" cy="16" rx="4" ry="3" fill="${greenDark}"/>`),
  def('for_stump', 'Tocón', 'bosque', `<rect x="8" y="14" width="16" height="10" fill="${trunk}"/><rect x="8" y="14" width="16" height="3" fill="${woodDark}"/><circle cx="16" cy="20" r="2" fill="${woodDark}"/>`),
  def('for_rock', 'Roca', 'bosque', `<path d="M6 22 L10 10 L20 8 L26 18 L22 26 Z" fill="${stone}"/><path d="M10 10 L20 8 L18 16 Z" fill="${stoneDark}"/>`),
  def('for_river', 'Río', 'bosque', `<rect width="32" height="32" fill="${water}"/><path d="M0 14 Q16 10 32 18" stroke="${waterLight}" stroke-width="2" fill="none"/>`, water),
  def('for_tallgrass', 'Hierba alta', 'bosque', `<rect width="32" height="32" fill="${greenDark}"/><path d="M6 26 L8 12 M12 28 L14 14 M18 26 L20 12 M24 28 L26 14" stroke="${green}" stroke-width="2"/>`, greenDark),
  def('for_flowers', 'Flores', 'bosque', `<rect width="32" height="32" fill="${greenDark}"/><circle cx="9" cy="10" r="2" fill="${gold}"/><circle cx="22" cy="14" r="2" fill="${red}"/><circle cx="14" cy="22" r="2" fill="${gold}"/><circle cx="26" cy="24" r="2" fill="${red}"/>`, greenDark),
  def('for_clearing', 'Claro', 'bosque', `<rect width="32" height="32" fill="${green}"/><circle cx="16" cy="16" r="10" fill="${greenDark}"/>`, '#38412e'),
];

// ---------- MINA ----------
const mina: TileDef[] = [
  def('min_rail', 'Raíl', 'mina', `<rect x="0" y="14" width="32" height="3" fill="${woodDark}"/><rect x="0" y="22" width="32" height="3" fill="${woodDark}"/><rect x="0" y="16" width="32" height="2" fill="${grey}"/>`),
  def('min_cart', 'Vagoneta', 'mina', `<rect x="6" y="14" width="20" height="12" fill="${wood}"/><rect x="8" y="14" width="4" height="12" fill="${woodDark}"/><circle cx="10" cy="26" r="3" fill="${grey}"/><circle cx="22" cy="26" r="3" fill="${grey}"/>`),
  def('min_pick', 'Pico', 'mina', `<rect x="14" y="6" width="4" height="20" fill="${wood}"/><path d="M8 8 L16 4 L24 8" stroke="${grey}" stroke-width="3" fill="none"/>`),
  def('min_pillar', 'Pilar', 'mina', `<rect x="12" y="2" width="8" height="28" fill="${stone}"/><rect x="10" y="0" width="12" height="4" fill="${stoneDark}"/><rect x="10" y="28" width="12" height="4" fill="${stoneDark}"/>`),
  def('min_crystal', 'Cristal', 'mina', `<path d="M16 4 L22 14 L16 28 L10 14 Z" fill="#5e84a6"/><path d="M16 4 L16 28 L10 14 Z" fill="#3f587a"/>`),
];

// ---------- DUNGEON ----------
const dungeon: TileDef[] = [
  def('dun_wall_h', 'Muro horizontal', 'dungeon', `<rect width="32" height="32" fill="${stoneDark}"/><rect x="0" y="10" width="32" height="12" fill="${stone}"/><rect x="6" y="10" width="2" height="12" fill="${stoneDark}"/><rect x="18" y="10" width="2" height="12" fill="${stoneDark}"/>`),
  def('dun_wall_v', 'Muro vertical', 'dungeon', `<rect width="32" height="32" fill="${stoneDark}"/><rect x="10" y="0" width="12" height="32" fill="${stone}"/><rect x="10" y="6" width="12" height="2" fill="${stoneDark}"/><rect x="10" y="18" width="12" height="2" fill="${stoneDark}"/>`),
  def('dun_corner', 'Esquina', 'dungeon', `<rect width="32" height="32" fill="${stoneDark}"/><rect x="0" y="0" width="14" height="14" fill="${stone}"/><rect x="14" y="0" width="2" height="14" fill="${stoneDark}"/><rect x="0" y="14" width="14" height="2" fill="${stoneDark}"/>`),
  def('dun_door', 'Puerta', 'dungeon', `<rect x="6" y="4" width="20" height="24" fill="${wood}"/><rect x="8" y="6" width="16" height="20" fill="${woodDark}"/><circle cx="20" cy="16" r="2" fill="${gold}"/>`),
  def('dun_hatch', 'Trampilla', 'dungeon', `<rect width="32" height="32" fill="${stoneDark}"/><rect x="4" y="4" width="24" height="24" fill="${woodDark}"/><rect x="4" y="4" width="24" height="3" fill="${wood}"/><rect x="4" y="25" width="24" height="3" fill="${wood}"/><circle cx="16" cy="16" r="2" fill="${gold}"/>`),
  def('dun_column', 'Columna', 'dungeon', `<rect x="10" y="2" width="12" height="28" fill="${stone}"/><rect x="8" y="0" width="16" height="4" fill="${stoneDark}"/><rect x="8" y="28" width="16" height="4" fill="${stoneDark}"/>`),
  def('dun_torch', 'Antorcha', 'dungeon', `<rect x="14" y="10" width="4" height="18" fill="${wood}"/><circle cx="16" cy="8" r="4" fill="${red}"/><circle cx="16" cy="8" r="2" fill="${gold}"/>`),
  def('dun_trap', 'Trampa', 'dungeon', `<rect width="32" height="32" fill="${stoneDark}"/><path d="M4 4 L28 28 M28 4 L4 28" stroke="${red}" stroke-width="3"/><circle cx="16" cy="16" r="4" fill="${red}"/>`),
  def('dun_stairs', 'Escalera', 'dungeon', `<rect width="32" height="32" fill="${stoneDark}"/><rect x="4" y="4" width="24" height="4" fill="${stone}"/><rect x="6" y="10" width="20" height="4" fill="${stone}"/><rect x="8" y="16" width="16" height="4" fill="${stone}"/><rect x="10" y="22" width="12" height="4" fill="${stone}"/>`),
  def('dun_sarc', 'Sarcófago', 'dungeon', `<rect x="6" y="4" width="20" height="24" fill="${stone}"/><rect x="8" y="6" width="16" height="20" fill="${stoneDark}"/><rect x="10" y="4" width="12" height="2" fill="${gold}"/>`),
  def('dun_tomb', 'Tumba', 'dungeon', `<rect x="4" y="6" width="24" height="20" fill="${stone}"/><rect x="6" y="8" width="20" height="16" fill="${stoneDark}"/><path d="M12 14 L20 14 M16 10 L16 22" stroke="${stone}" stroke-width="2"/>`),
];

// ---------- PANTANO ----------
const pantano: TileDef[] = [
  def('swamp_pool', 'Charca', 'pantano', `<rect width="32" height="32" fill="${greenDark}"/><ellipse cx="16" cy="16" rx="12" ry="9" fill="#1e3024"/><ellipse cx="16" cy="16" rx="12" ry="9" fill="none" stroke="${green}" stroke-width="1"/>`, '#1e3024'),
  def('swamp_lotus', 'Loto', 'pantano', `<rect width="32" height="32" fill="${greenDark}"/><circle cx="16" cy="16" r="6" fill="${green}"/><circle cx="16" cy="16" r="2" fill="${gold}"/>`, '#1e3024'),
  def('swamp_root', 'Raíz', 'pantano', `<rect width="32" height="32" fill="${greenDark}"/><path d="M4 28 Q12 16 16 22 Q22 12 28 18" stroke="${trunk}" stroke-width="3" fill="none"/>`, '#1e3024'),
  def('swamp_fog', 'Niebla', 'pantano', `<rect width="32" height="32" fill="rgba(232,226,208,0.18)"/><circle cx="10" cy="10" r="6" fill="rgba(232,226,208,0.3)"/><circle cx="22" cy="18" r="7" fill="rgba(232,226,208,0.25)"/>`, '#1e3024'),
];

// ---------- MONTAÑA ----------
const montana: TileDef[] = [
  def('mtn_bigrock', 'Roca grande', 'montaña', `<path d="M4 26 L10 6 L22 4 L28 22 L24 28 Z" fill="${stone}"/><path d="M10 6 L22 4 L18 16 Z" fill="${stoneDark}"/>`),
  def('mtn_cliff', 'Barranco', 'montaña', `<path d="M0 12 L32 12 L32 32 L0 32 Z" fill="${stone}"/><path d="M0 12 L8 18 L16 14 L24 20 L32 16" stroke="${stoneDark}" stroke-width="2" fill="none"/>`),
  def('mtn_cave', 'Cueva', 'montaña', `<rect width="32" height="32" fill="${stone}"/><path d="M8 30 L8 14 Q16 4 24 14 L24 30 Z" fill="#0a0a0a"/>`),
  def('mtn_snow', 'Nieve', 'montaña', `<path d="M4 26 L10 6 L22 4 L28 22 L24 28 Z" fill="${snow}"/><path d="M10 6 L22 4 L18 16 Z" fill="#c8c2b0"/>`),
  def('mtn_path', 'Sendero', 'montaña', `<rect width="32" height="32" fill="${stone}"/><path d="M0 16 Q16 8 32 18" stroke="${sand}" stroke-width="4" fill="none"/>`),
];

// ---------- DESIERTO ----------
const desierto: TileDef[] = [
  def('des_cactus', 'Cactus', 'desierto', `<rect x="14" y="6" width="4" height="22" fill="${green}"/><rect x="8" y="12" width="4" height="8" fill="${green}"/><rect x="20" y="10" width="4" height="10" fill="${green}"/>`, sand),
  def('des_dunes', 'Dunas', 'desierto', `<rect width="32" height="32" fill="${sand}"/><path d="M0 22 Q16 14 32 22 L32 32 L0 32 Z" fill="#b09050"/>`, sand),
  def('des_oasis', 'Oasis', 'desierto', `<rect width="32" height="32" fill="${sand}"/><circle cx="16" cy="16" r="8" fill="${water}"/><circle cx="16" cy="16" r="3" fill="${green}"/>`, sand),
  def('des_skeleton', 'Esqueleto', 'desierto', `<rect width="32" height="32" fill="${sand}"/><circle cx="16" cy="10" r="4" fill="${snow}"/><rect x="14" y="14" width="4" height="10" fill="${snow}"/><rect x="10" y="18" width="12" height="2" fill="${snow}"/>`, sand),
  def('des_sand', 'Arena', 'desierto', `<rect width="32" height="32" fill="${sand}"/><circle cx="10" cy="12" r="1" fill="#b09050"/><circle cx="22" cy="20" r="1" fill="#b09050"/>`, sand),
];

// ---------- PUEBLO ----------
const pueblo: TileDef[] = [
  def('town_house_sm', 'Casa pequeña', 'pueblo', `<rect x="4" y="12" width="24" height="16" fill="${wood}"/><path d="M2 14 L16 2 L30 14 Z" fill="${red}"/><rect x="14" y="18" width="4" height="10" fill="${woodDark}"/>`),
  def('town_house_lg', 'Casa grande', 'pueblo', `<rect x="2" y="14" width="28" height="16" fill="${wood}"/><path d="M0 16 L16 2 L32 16 Z" fill="${red}"/><rect x="8" y="20" width="4" height="6" fill="${woodDark}"/><rect x="20" y="20" width="4" height="6" fill="${woodDark}"/>`),
  def('town_well', 'Pozo', 'pueblo', `<circle cx="16" cy="18" r="8" fill="${stone}"/><circle cx="16" cy="18" r="4" fill="${water}"/><rect x="10" y="2" width="2" height="20" fill="${wood}"/><rect x="20" y="2" width="2" height="20" fill="${wood}"/><path d="M8 6 L24 6" stroke="${wood}" stroke-width="3"/>`),
  def('town_market', 'Mercado', 'pueblo', `<rect x="4" y="14" width="24" height="14" fill="${wood}"/><path d="M2 16 L16 6 L30 16 Z" fill="${red}"/><rect x="10" y="20" width="12" height="8" fill="${woodDark}"/>`),
  def('town_road', 'Camino', 'pueblo', `<rect width="32" height="32" fill="#a89870"/><rect x="0" y="14" width="32" height="4" fill="${sand}"/>`),
  def('town_bridge', 'Puente', 'pueblo', `<rect width="32" height="32" fill="${water}"/><rect x="0" y="10" width="32" height="12" fill="${wood}"/><rect x="0" y="10" width="32" height="2" fill="${woodDark}"/><rect x="0" y="20" width="32" height="2" fill="${woodDark}"/>`, water),
  def('town_fence', 'Valla', 'pueblo', `<rect x="0" y="14" width="32" height="2" fill="${wood}"/><rect x="0" y="20" width="32" height="2" fill="${wood}"/><rect x="6" y="10" width="2" height="14" fill="${wood}"/><rect x="18" y="10" width="2" height="14" fill="${wood}"/><rect x="28" y="10" width="2" height="14" fill="${wood}"/>`),
];

// ---------- CASTILLO ----------
const castillo: TileDef[] = [
  def('cas_wall', 'Muro fortificado', 'castillo', `<rect width="32" height="32" fill="${stone}"/><rect x="0" y="0" width="6" height="6" fill="${stoneDark}"/><rect x="13" y="0" width="6" height="6" fill="${stoneDark}"/><rect x="26" y="0" width="6" height="6" fill="${stoneDark}"/>`),
  def('cas_tower', 'Torre', 'castillo', `<rect x="8" y="4" width="16" height="24" fill="${stone}"/><rect x="8" y="4" width="16" height="3" fill="${stoneDark}"/><rect x="12" y="10" width="3" height="4" fill="${stoneDark}"/><rect x="17" y="10" width="3" height="4" fill="${stoneDark}"/>`),
  def('cas_wall_l', 'Muralla', 'castillo', `<rect width="32" height="10" fill="${stone}"/><rect x="0" y="0" width="4" height="4" fill="${stoneDark}"/><rect x="14" y="0" width="4" height="4" fill="${stoneDark}"/><rect x="28" y="0" width="4" height="4" fill="${stoneDark}"/>`),
  def('cas_battlement', 'Almena', 'castillo', `<rect width="32" height="32" fill="${stone}"/><rect x="0" y="0" width="8" height="8" fill="${stoneDark}"/><rect x="12" y="0" width="8" height="8" fill="${stoneDark}"/><rect x="24" y="0" width="8" height="8" fill="${stoneDark}"/>`),
  def('cas_moat', 'Foso', 'castillo', `<rect width="32" height="32" fill="${water}"/><path d="M0 16 Q16 12 32 16" stroke="${waterLight}" stroke-width="2" fill="none"/>`, water),
];

// ---------- CASA (interior) ----------
const casa: TileDef[] = [
  def('home_floor', 'Suelo madera', 'casa', `<rect width="32" height="32" fill="${wood}"/><rect x="0" y="10" width="32" height="2" fill="${woodDark}"/><rect x="0" y="22" width="32" height="2" fill="${woodDark}"/>`),
  def('home_carpet', 'Alfombra', 'casa', `<rect width="32" height="32" fill="${wood}"/><rect x="4" y="6" width="24" height="20" fill="${red}"/><rect x="6" y="8" width="20" height="16" fill="#a83838"/>`),
  def('home_bed', 'Cama', 'casa', `<rect x="4" y="8" width="24" height="16" fill="${wood}"/><rect x="6" y="10" width="20" height="12" fill="${woodDark}"/><rect x="8" y="4" width="6" height="6" fill="${snow}"/>`),
  def('home_table', 'Mesa', 'casa', `<rect x="4" y="10" width="24" height="10" fill="${wood}"/><rect x="6" y="20" width="3" height="8" fill="${woodDark}"/><rect x="23" y="20" width="3" height="8" fill="${woodDark}"/>`),
  def('home_chair', 'Silla', 'casa', `<rect x="10" y="14" width="12" height="10" fill="${wood}"/><rect x="10" y="6" width="12" height="3" fill="${woodDark}"/>`),
  def('home_fire', 'Chimenea', 'casa', `<rect x="6" y="4" width="20" height="24" fill="${stone}"/><rect x="10" y="14" width="12" height="10" fill="#0a0a0a"/><path d="M14 20 L18 20 L16 14 Z" fill="${red}"/><circle cx="16" cy="22" r="2" fill="${gold}"/>`),
  def('home_shelf', 'Estantería', 'casa', `<rect x="6" y="4" width="20" height="24" fill="${woodDark}"/><rect x="6" y="10" width="20" height="2" fill="${wood}"/><rect x="6" y="18" width="20" height="2" fill="${wood}"/>`),
  def('home_chest', 'Baúl', 'casa', `<rect x="4" y="10" width="24" height="18" fill="${woodDark}"/><rect x="4" y="10" width="24" height="6" fill="${wood}"/><rect x="14" y="14" width="4" height="3" fill="${gold}"/>`),
];

// ---------- DECORACIÓN ----------
const decoracion: TileDef[] = [
  def('dec_torch', 'Antorcha', 'decoracion', `<rect x="14" y="10" width="4" height="18" fill="${wood}"/><circle cx="16" cy="8" r="4" fill="${red}"/><circle cx="16" cy="8" r="2" fill="${gold}"/>`),
  def('dec_statue', 'Estatua', 'decoracion', `<rect x="10" y="14" width="12" height="14" fill="${stone}"/><circle cx="16" cy="10" r="4" fill="${stone}"/><rect x="8" y="28" width="16" height="2" fill="${stoneDark}"/>`),
  def('dec_barrel', 'Barril', 'decoracion', `<rect x="8" y="6" width="16" height="22" fill="${wood}"/><rect x="8" y="10" width="16" height="2" fill="${woodDark}"/><rect x="8" y="22" width="16" height="2" fill="${woodDark}"/>`),
  def('dec_box', 'Caja', 'decoracion', `<rect x="6" y="8" width="20" height="18" fill="${wood}"/><path d="M6 8 L26 8 L26 26 L6 26 Z M16 8 L16 26" stroke="${woodDark}" stroke-width="2" fill="none"/>`),
  def('dec_chest', 'Cofre', 'decoracion', `<rect x="4" y="12" width="24" height="16" fill="${woodDark}"/><rect x="4" y="12" width="24" height="6" fill="${wood}"/><rect x="14" y="16" width="4" height="3" fill="${gold}"/>`),
  def('dec_crystal', 'Cristal', 'decoracion', `<path d="M16 4 L22 14 L16 28 L10 14 Z" fill="#5e84a6"/><path d="M16 4 L16 28 L10 14 Z" fill="#3f587a"/>`),
  def('dec_grave', 'Lápida', 'decoracion', `<path d="M10 28 L10 10 Q16 4 22 10 L22 28 Z" fill="${stone}"/><path d="M14 14 L18 14 M16 12 L16 18" stroke="${stoneDark}" stroke-width="2"/>`),
];

export const TILES: TileDef[] = [
  ...bosque,
  ...mina,
  ...dungeon,
  ...pantano,
  ...montana,
  ...desierto,
  ...pueblo,
  ...castillo,
  ...casa,
  ...decoracion,
];

/** Devuelve los tiles de una categoría (vacío si no existe). */
export function tilesByCategory(category: TileCategory): TileDef[] {
  return TILES.filter((t) => t.category === category);
}

/** Devuelve un tile por id, o `undefined` si no existe. */
export function getTile(id: string): TileDef | undefined {
  return TILES.find((t) => t.id === id);
}

/** Convierte el SVG de un tile en un data URL listo para `Konva.Image`. */
export function tileToDataURL(tile: TileDef): string {
  const encoded = encodeURIComponent(tile.svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
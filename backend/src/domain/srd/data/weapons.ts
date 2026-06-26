/**
 * Curated SRD 5.2 (D&D 2024) weapons. CC-BY-4.0 — Wizards of the Coast SRD 5.2.
 * `ability`: 'finesse' weapons use the better of STR/DEX; ranged use DEX.
 */
import type { WeaponDef } from '../types.js';

export const WEAPONS: WeaponDef[] = [
  // ----- Simple melee -----
  { id: 'dagger', name: 'Daga', category: 'simple', damage: '1d4', damageType: 'perforante', properties: ['Sutil', 'Ligera', 'Arrojadiza'], ability: 'finesse' },
  { id: 'club', name: 'Garrote', category: 'simple', damage: '1d4', damageType: 'contundente', properties: ['Ligera'], ability: 'str' },
  { id: 'mace', name: 'Maza', category: 'simple', damage: '1d6', damageType: 'contundente', properties: [], ability: 'str' },
  { id: 'quarterstaff', name: 'Bastón', category: 'simple', damage: '1d6', damageType: 'contundente', properties: ['Versátil (1d8)'], ability: 'str' },
  { id: 'spear', name: 'Lanza', category: 'simple', damage: '1d6', damageType: 'perforante', properties: ['Arrojadiza', 'Versátil (1d8)'], ability: 'str' },
  { id: 'handaxe', name: 'Hacha de mano', category: 'simple', damage: '1d6', damageType: 'cortante', properties: ['Ligera', 'Arrojadiza'], ability: 'str' },
  { id: 'javelin', name: 'Jabalina', category: 'simple', damage: '1d6', damageType: 'perforante', properties: ['Arrojadiza'], ability: 'str' },
  // ----- Simple ranged -----
  { id: 'shortbow', name: 'Arco corto', category: 'simple', damage: '1d6', damageType: 'perforante', properties: ['A distancia', 'Dos manos'], ability: 'dex' },
  { id: 'light-crossbow', name: 'Ballesta ligera', category: 'simple', damage: '1d8', damageType: 'perforante', properties: ['A distancia', 'Dos manos', 'Recarga'], ability: 'dex' },
  // ----- Martial melee -----
  { id: 'shortsword', name: 'Espada corta', category: 'martial', damage: '1d6', damageType: 'perforante', properties: ['Sutil', 'Ligera'], ability: 'finesse' },
  { id: 'longsword', name: 'Espada larga', category: 'martial', damage: '1d8', damageType: 'cortante', properties: ['Versátil (1d10)'], ability: 'str' },
  { id: 'rapier', name: 'Estoque', category: 'martial', damage: '1d8', damageType: 'perforante', properties: ['Sutil'], ability: 'finesse' },
  { id: 'scimitar', name: 'Cimitarra', category: 'martial', damage: '1d6', damageType: 'cortante', properties: ['Sutil', 'Ligera'], ability: 'finesse' },
  { id: 'battleaxe', name: 'Hacha de batalla', category: 'martial', damage: '1d8', damageType: 'cortante', properties: ['Versátil (1d10)'], ability: 'str' },
  { id: 'warhammer', name: 'Martillo de guerra', category: 'martial', damage: '1d8', damageType: 'contundente', properties: ['Versátil (1d10)'], ability: 'str' },
  { id: 'greatsword', name: 'Espadón', category: 'martial', damage: '2d6', damageType: 'cortante', properties: ['Pesada', 'Dos manos'], ability: 'str' },
  { id: 'greataxe', name: 'Hacha a dos manos', category: 'martial', damage: '1d12', damageType: 'cortante', properties: ['Pesada', 'Dos manos'], ability: 'str' },
  { id: 'longbow', name: 'Arco largo', category: 'martial', damage: '1d8', damageType: 'perforante', properties: ['A distancia', 'Dos manos', 'Pesada'], ability: 'dex' },
];

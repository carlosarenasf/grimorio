/**
 * Map aggregate — the persistent map document for a campaign.
 *
 * The map editor on the frontend stores layers (Suelo / Objetos / Techo by
 * default), each holding tile-based elements positioned on a square grid. The
 * domain owns creation (id assignment, default layers) and the aggregate
 * shape; the server-authoritative derived values (cell dimensions) are stored
 * as supplied by the client — the server only validates ranges (transport).
 *
 * Pure domain: no I/O, no Node builtins — `Clock` is an injected port so
 * timestamps stay deterministic under test (SPEC §7).
 */
import type { CampaignId, MapId } from '../ids.js';
import { newId, newMapId } from '../ids.js';
import type { Clock } from '../ports.js';

export type MapType = 'exterior' | 'interior';

export type MapEnvironment =
  | 'bosque'
  | 'mina'
  | 'dungeon'
  | 'pantano'
  | 'montaña'
  | 'desierto'
  | 'pueblo'
  | 'castillo'
  | 'casa';

export interface MapElement {
  id: string;
  tileId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layerId: string;
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  elements: MapElement[];
}

export interface MapData {
  id: MapId;
  campaignId: CampaignId;
  name: string;
  type: MapType;
  environment: MapEnvironment;
  width: number; // grid cells
  height: number; // grid cells
  gridSize: number; // px per cell (default 32)
  layers: MapLayer[];
  createdAt: string;
  updatedAt: string;
}

/** Default `gridSize` (px per cell) when none was supplied on creation. */
export const DEFAULT_GRID_SIZE = 32;

/** Default layer names a new map starts with, in order. Spanish — UI strings. */
export const DEFAULT_LAYER_NAMES = ['Suelo', 'Objetos', 'Techo'] as const;

export interface CreateMapInput {
  campaignId: CampaignId;
  name: string;
  type: MapType;
  environment: MapEnvironment;
  width: number;
  height: number;
  /** Optional; falls back to {@link DEFAULT_GRID_SIZE} when omitted. */
  gridSize?: number;
}

/**
 * Builds a new `MapData` with three default layers (Suelo / Objetos / Techo),
 * each empty and visible, with a freshly generated `MapId` and timestamps
 * taken from the injected `Clock`.
 */
export function createMap(input: CreateMapInput, clock: Clock): MapData {
  const now = clock.now();
  const layers: MapLayer[] = DEFAULT_LAYER_NAMES.map((name) => ({
    id: newId('lyr'),
    name,
    visible: true,
    elements: [],
  }));

  return {
    id: newMapId(),
    campaignId: input.campaignId,
    name: input.name,
    type: input.type,
    environment: input.environment,
    width: input.width,
    height: input.height,
    gridSize: input.gridSize ?? DEFAULT_GRID_SIZE,
    layers,
    createdAt: now,
    updatedAt: now,
  };
}
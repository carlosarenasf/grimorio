/**
 * `updateMap` — dm-only edit of a map.
 *
 * Unset fields are left unchanged. `layers`, when provided, replace the entire
 * array (the frontend stores the full layer tree and pushes it back wholesale,
 * mirroring the campaign PATCH semantics). `updatedAt` is bumped from the
 * injected `Clock` so mutated maps re-order in listings deterministically.
 */
import type { MapId, UserId } from '../../domain/ids.js';
import type {
  MapData,
  MapEnvironment,
  MapLayer,
  MapType,
} from '../../domain/maps/index.js';
import type { CampaignRepository, Clock, MapRepository } from '../ports.js';
import { Forbidden, NotFound } from './errors.js';

export interface UpdateMapCommand {
  mapId: MapId;
  actorId: UserId;
  name?: string;
  type?: MapType;
  environment?: MapEnvironment;
  width?: number;
  height?: number;
  gridSize?: number;
  layers?: MapLayer[];
}

export interface UpdateMapDeps {
  campaigns: CampaignRepository;
  maps: MapRepository;
  clock: Clock;
}

export async function updateMap(
  cmd: UpdateMapCommand,
  deps: UpdateMapDeps,
): Promise<MapData> {
  const { campaigns, maps, clock } = deps;

  const map = await maps.findById(cmd.mapId);
  if (!map) {
    throw new NotFound(cmd.mapId);
  }

  const campaign = await campaigns.findById(map.campaignId);
  const isDm = !!campaign?.members.some(
    (m) => m.userId === cmd.actorId && m.role === 'dm',
  );
  if (!isDm) {
    throw new Forbidden('Only the campaign dm may update maps');
  }

  const updated: MapData = {
    ...map,
    name: cmd.name ?? map.name,
    type: cmd.type ?? map.type,
    environment: cmd.environment ?? map.environment,
    width: cmd.width ?? map.width,
    height: cmd.height ?? map.height,
    gridSize: cmd.gridSize ?? map.gridSize,
    layers: cmd.layers ?? map.layers,
    updatedAt: clock.now(),
  };

  await maps.save(updated);

  return updated;
}
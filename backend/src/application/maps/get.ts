/**
 * `getMap` — fetch a single map.
 *
 * Any campaign member (dm or player) may read it. Non-members get `Forbidden`.
 */
import type { MapId, UserId } from '../../domain/ids.js';
import type { MapData } from '../../domain/maps/index.js';
import type { CampaignRepository, MapRepository } from '../ports.js';
import { Forbidden, NotFound } from './errors.js';

export interface GetMapCommand {
  mapId: MapId;
  actorId: UserId;
}

export interface GetMapDeps {
  campaigns: CampaignRepository;
  maps: MapRepository;
}

export async function getMap(cmd: GetMapCommand, deps: GetMapDeps): Promise<MapData> {
  const { campaigns, maps } = deps;

  const map = await maps.findById(cmd.mapId);
  if (!map) {
    throw new NotFound(cmd.mapId);
  }

  const campaign = await campaigns.findById(map.campaignId);
  const isMember = !!campaign?.members.some((m) => m.userId === cmd.actorId);
  if (!isMember) {
    throw new Forbidden('Only campaign members may read the map');
  }

  return map;
}
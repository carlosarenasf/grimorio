/**
 * `deleteMap` — dm-only destructive operation.
 *
 * Resolves the map, then its campaign, and only lets the campaign's dm delete
 * it. Players and non-members get `Forbidden`; a missing map gets `NotFound`.
 */
import type { MapId, UserId } from '../../domain/ids.js';
import type { CampaignRepository, MapRepository } from '../ports.js';
import { Forbidden, NotFound } from './errors.js';

export interface DeleteMapCommand {
  mapId: MapId;
  actorId: UserId;
}

export interface DeleteMapDeps {
  campaigns: CampaignRepository;
  maps: MapRepository;
}

export async function deleteMap(
  cmd: DeleteMapCommand,
  deps: DeleteMapDeps,
): Promise<void> {
  const { campaigns, maps } = deps;

  const map = await maps.findById(cmd.mapId);
  if (!map) {
    throw new NotFound(cmd.mapId);
  }

  const campaign = await campaigns.findById(map.campaignId);
  const isDm = !!campaign?.members.some(
    (m) => m.userId === cmd.actorId && m.role === 'dm',
  );
  if (!isDm) {
    throw new Forbidden('Only the campaign dm may delete maps');
  }

  await maps.delete(cmd.mapId);
}
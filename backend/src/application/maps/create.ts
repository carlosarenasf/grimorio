/**
 * `createMap` — creates a new map for a campaign.
 *
 * Only the dm of the campaign may create maps. The pure domain (`createMap`)
 * handles id assignment + default layers; this use case enforces role + persists.
 */
import { createMap as createMapDomain } from '../../domain/maps/index.js';
import type {
  MapData,
  MapEnvironment,
  MapType,
} from '../../domain/maps/index.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import type { CampaignRepository, Clock, MapRepository } from '../ports.js';
import { Forbidden, NotFound } from './errors.js';

export interface CreateMapCommand {
  campaignId: CampaignId;
  actorId: UserId;
  name: string;
  type: MapType;
  environment: MapEnvironment;
  width: number;
  height: number;
  gridSize?: number;
}

export interface CreateMapDeps {
  campaigns: CampaignRepository;
  maps: MapRepository;
  clock: Clock;
}

export async function createMap(
  cmd: CreateMapCommand,
  deps: CreateMapDeps,
): Promise<MapData> {
  const { campaigns, maps, clock } = deps;

  const campaign = await campaigns.findById(cmd.campaignId);
  if (!campaign) {
    throw new NotFound(cmd.campaignId);
  }

  const isDm = campaign.members.some(
    (m) => m.userId === cmd.actorId && m.role === 'dm',
  );
  if (!isDm) {
    throw new Forbidden('Only the campaign dm may create maps');
  }

  const map = createMapDomain(
    {
      campaignId: cmd.campaignId,
      name: cmd.name,
      type: cmd.type,
      environment: cmd.environment,
      width: cmd.width,
      height: cmd.height,
      gridSize: cmd.gridSize,
    },
    clock,
  );

  await maps.save(map);

  return map;
}
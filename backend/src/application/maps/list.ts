/**
 * `listMaps` — list all maps of a campaign.
 *
 * Any campaign member (dm or player) may list. Non-members get `Forbidden`;
 * a missing campaign gets `NotFound`.
 */
import type { CampaignId, UserId } from '../../domain/ids.js';
import type { MapData } from '../../domain/maps/index.js';
import type { CampaignRepository, MapRepository } from '../ports.js';
import { Forbidden, NotFound } from './errors.js';

export interface ListMapsCommand {
  campaignId: CampaignId;
  actorId: UserId;
}

export interface ListMapsDeps {
  campaigns: CampaignRepository;
  maps: MapRepository;
}

export async function listMaps(
  cmd: ListMapsCommand,
  deps: ListMapsDeps,
): Promise<MapData[]> {
  const { campaigns, maps } = deps;

  const campaign = await campaigns.findById(cmd.campaignId);
  if (!campaign) {
    throw new NotFound(cmd.campaignId);
  }
  const isMember = campaign.members.some((m) => m.userId === cmd.actorId);
  if (!isMember) {
    throw new Forbidden('Only campaign members may list maps');
  }

  return maps.listByCampaign(cmd.campaignId);
}
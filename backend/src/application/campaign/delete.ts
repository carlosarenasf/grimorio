/**
 * `deleteCampaign` — owner-only destructive operation.
 *
 * Only the campaign's owner (the dm) may delete it; anyone else gets
 * `NotOwner`. Deletes the campaign plus all associated characters and the
 * live table in a single logical operation.
 */
import { canDeleteCampaign } from '../../domain/campaign/index.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import type {
  CampaignRepository,
  CharacterRepository,
  LiveTableRepository,
} from '../ports.js';
import { NotFound, NotOwner } from './errors.js';

export interface DeleteCampaignCommand {
  campaignId: CampaignId;
  actorId: UserId;
}

export interface DeleteCampaignDeps {
  campaigns: CampaignRepository;
  characters: CharacterRepository;
  tables: LiveTableRepository;
}

export async function deleteCampaign(
  cmd: DeleteCampaignCommand,
  deps: DeleteCampaignDeps,
): Promise<void> {
  const { campaigns, characters, tables } = deps;

  const campaign = await campaigns.findById(cmd.campaignId);
  if (!campaign) {
    throw new NotFound(cmd.campaignId);
  }

  if (!canDeleteCampaign(campaign, cmd.actorId)) {
    throw new NotOwner();
  }

  await characters.deleteByCampaign(cmd.campaignId);
  await tables.deleteByCampaign(cmd.campaignId);
  await campaigns.delete(cmd.campaignId);
}

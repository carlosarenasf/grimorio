/**
 * `updateCampaign` — owner-only edit of a campaign's name/tagline/status.
 *
 * Only the campaign's owner (the dm) may update it; anyone else gets
 * `Forbidden`. Unset fields are left unchanged.
 */
import type { CampaignId, UserId } from '../../domain/ids.js';
import type { Campaign, CampaignStatus } from '../../domain/types.js';
import type { CampaignRepository } from '../ports.js';
import { Forbidden, NotFound } from './errors.js';

export interface UpdateCampaignCommand {
  campaignId: CampaignId;
  actorId: UserId;
  name?: string;
  tagline?: string;
  status?: CampaignStatus;
}

export interface UpdateCampaignDeps {
  campaigns: CampaignRepository;
}

export async function updateCampaign(
  cmd: UpdateCampaignCommand,
  deps: UpdateCampaignDeps,
): Promise<Campaign> {
  const { campaigns } = deps;

  const campaign = await campaigns.findById(cmd.campaignId);
  if (!campaign) {
    throw new NotFound(cmd.campaignId);
  }

  if (campaign.ownerId !== cmd.actorId) {
    throw new Forbidden('Only the campaign owner may update it');
  }

  const updated: Campaign = {
    ...campaign,
    name: cmd.name ?? campaign.name,
    tagline: cmd.tagline ?? campaign.tagline,
    status: cmd.status ?? campaign.status,
  };

  await campaigns.save(updated);

  return updated;
}

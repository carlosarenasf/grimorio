/**
 * `issueInvite` — regenerates a campaign's join code.
 *
 * Dm-only: the domain guarantees exactly one 'dm' member, who is always the
 * campaign's `ownerId`, so authorization is the same owner check as `update`.
 */
import { regenerateInvite } from '../../domain/campaign/index.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import type { Campaign } from '../../domain/types.js';
import type { CampaignRepository, Rng } from '../ports.js';
import { Forbidden, NotFound } from './errors.js';

export interface IssueInviteCommand {
  campaignId: CampaignId;
  actorId: UserId;
}

export interface IssueInviteDeps {
  campaigns: CampaignRepository;
  rng: Rng;
}

export async function issueInvite(
  cmd: IssueInviteCommand,
  deps: IssueInviteDeps,
): Promise<Campaign> {
  const { campaigns, rng } = deps;

  const campaign = await campaigns.findById(cmd.campaignId);
  if (!campaign) {
    throw new NotFound(cmd.campaignId);
  }

  if (campaign.ownerId !== cmd.actorId) {
    throw new Forbidden('Only the dm may regenerate the invite code');
  }

  const updated = regenerateInvite(campaign, rng);

  await campaigns.save(updated);

  return updated;
}

/**
 * `listCampaignsForUser` — campaigns the given user belongs to (Campañas list).
 */
import type { UserId } from '../../domain/ids.js';
import type { Campaign } from '../../domain/types.js';
import type { CampaignRepository } from '../ports.js';

export interface ListCampaignsForUserDeps {
  campaigns: CampaignRepository;
}

export async function listCampaignsForUser(
  userId: UserId,
  deps: ListCampaignsForUserDeps,
): Promise<Campaign[]> {
  return deps.campaigns.listForUser(userId);
}

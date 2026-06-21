/**
 * `joinByCode` — adds a user to a campaign as 'player' via its join code.
 *
 * Idempotent: joining a campaign the user already belongs to is a no-op
 * (the domain's `addMember` already guarantees this).
 */
import { addMember } from '../../domain/campaign/index.js';
import type { UserId } from '../../domain/ids.js';
import type { Campaign } from '../../domain/types.js';
import type { CampaignRepository } from '../ports.js';
import { UnknownCode } from './errors.js';

export interface JoinByCodeCommand {
  joinCode: string;
  userId: UserId;
}

export interface JoinByCodeDeps {
  campaigns: CampaignRepository;
}

export async function joinByCode(cmd: JoinByCodeCommand, deps: JoinByCodeDeps): Promise<Campaign> {
  const { campaigns } = deps;

  const campaign = await campaigns.findByJoinCode(cmd.joinCode);
  if (!campaign) {
    throw new UnknownCode(cmd.joinCode);
  }

  const updated = addMember(campaign, cmd.userId, 'player');

  await campaigns.save(updated);

  return updated;
}

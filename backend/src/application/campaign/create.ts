/**
 * `createCampaign` — creates a new campaign owned by `cmd.ownerId`.
 *
 * Delegates to the pure domain (`createCampaign`) for the invariants (owner
 * added as the sole 'dm' member, status 'planning', fresh join code via the
 * injected `Rng`) and persists the result through the injected repository.
 */
import { createCampaign as createCampaignDomain } from '../../domain/campaign/index.js';
import type { UserId } from '../../domain/ids.js';
import type { Campaign } from '../../domain/types.js';
import type { CampaignRepository, Clock, Rng } from '../ports.js';

export interface CreateCampaignCommand {
  ownerId: UserId;
  name: string;
  tagline: string;
}

export interface CreateCampaignDeps {
  campaigns: CampaignRepository;
  clock: Clock;
  rng: Rng;
}

export async function createCampaign(
  cmd: CreateCampaignCommand,
  deps: CreateCampaignDeps,
): Promise<Campaign> {
  const { campaigns, clock, rng } = deps;

  const campaign = createCampaignDomain(cmd.ownerId, cmd.name, cmd.tagline, rng, clock);

  await campaigns.save(campaign);

  return campaign;
}

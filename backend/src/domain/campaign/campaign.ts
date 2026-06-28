/**
 * Campaign aggregate — creation and invite regeneration. Pure domain logic;
 * randomness (join code) and time (createdAt) are injected so behaviour is
 * deterministic under test (SPEC §7).
 */
import type { Campaign } from '../types.js';
import type { UserId } from '../ids.js';
import type { Rng } from '../ports.js';
import { newCampaignId } from '../ids.js';
import { generateJoinCode } from './joinCode.js';
import { addMember } from './members.js';

/**
 * Creates a new campaign in 'planning' status with the owner added as its
 * sole 'dm' member, an empty roster of characters, and a freshly generated
 * join code.
 */
export function createCampaign(
  ownerId: UserId,
  name: string,
  tagline: string,
  rng: Rng,
  clock?: { now(): string },
): Campaign {
  const createdAt = clock ? clock.now() : new Date().toISOString();

  const campaign: Campaign = {
    id: newCampaignId(),
    ownerId,
    name,
    tagline,
    status: 'planning',
    joinCode: generateJoinCode(rng),
    members: [],
    characterIds: [],
    sessionCount: 0,
    createdAt,
  };

  return addMember(campaign, ownerId, 'dm', clock);
}

/** Returns a new Campaign with a freshly generated joinCode. */
export function regenerateInvite(campaign: Campaign, rng: Rng): Campaign {
  return {
    ...campaign,
    joinCode: generateJoinCode(rng),
  };
}

/** Whether the given user is the campaign owner (the only one allowed to delete it). */
export function canDeleteCampaign(campaign: Campaign, userId: UserId): boolean {
  return campaign.ownerId === userId;
}

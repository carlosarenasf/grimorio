/**
 * Campaign membership rules — pure domain logic.
 *
 * Invariants: exactly one 'dm' per campaign; adding an existing member is a
 * no-op (idempotent), regardless of the role passed.
 */
import type { Campaign, CampaignMember, Role } from '../types.js';
import type { UserId } from '../ids.js';

/**
 * Returns a new Campaign with `userId` added as `role`, unless that user is
 * already a member (idempotent no-op) or adding a second 'dm' is attempted.
 */
export function addMember(
  campaign: Campaign,
  userId: UserId,
  role: Role,
  clock?: { now(): string },
): Campaign {
  const existing = campaign.members.find((m) => m.userId === userId);
  if (existing) {
    return campaign;
  }

  if (role === 'dm' && campaign.members.some((m) => m.role === 'dm')) {
    throw new Error('A campaign can only have one dm');
  }

  const member: CampaignMember = {
    userId,
    role,
    joinedAt: clock ? clock.now() : new Date().toISOString(),
  };

  return {
    ...campaign,
    members: [...campaign.members, member],
  };
}

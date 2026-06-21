/**
 * Resolve a user's role within a campaign from its membership roster.
 *
 * The domain guarantees the owner is always present in `members` with role
 * 'dm' (see `domain/campaign/create.ts`), so a single lookup suffices — no
 * special-casing of `ownerId` is needed here.
 */
import type { Campaign, Role } from '../../domain/types.js';
import type { UserId } from '../../domain/ids.js';

/** Returns the user's role in the campaign, or null if they're not a member. */
export function resolveRole(campaign: Campaign, userId: UserId): Role | null {
  const member = campaign.members.find((m) => m.userId === userId);
  return member ? member.role : null;
}

/**
 * `updateCharacter` use case: only the sheet's owner or the campaign's dm may
 * edit a character. Applies the patch, re-clamps HP via the domain so
 * `currentHp` can never drift outside `0..maxHp`, then persists.
 */
import type { CharacterId } from '../../domain/ids.js';
import type { UserId } from '../../domain/ids.js';
import type { CharacterSheet } from '../../domain/types.js';
import { clampHp } from '../../domain/character/index.js';
import { isLegalPointBuy } from '../../domain/rules/index.js';
import type { CampaignRepository, CharacterRepository } from '../ports.js';
import { CharacterError } from './errors.js';

export interface UpdateCharacterCommand {
  characterId: CharacterId;
  actorId: UserId;
  patch: Partial<CharacterSheet>;
}

export interface UpdateCharacterDeps {
  characters: CharacterRepository;
  campaigns: CampaignRepository;
}

export async function updateCharacter(
  cmd: UpdateCharacterCommand,
  deps: UpdateCharacterDeps,
): Promise<CharacterSheet> {
  const existing = await deps.characters.findById(cmd.characterId);
  if (!existing) {
    throw new CharacterError('NotFound', `Character ${cmd.characterId} not found`);
  }

  const campaign = await deps.campaigns.findById(existing.campaignId);
  if (!campaign) {
    throw new CharacterError('NotFound', `Campaign ${existing.campaignId} not found`);
  }

  const isOwner = existing.ownerId === cmd.actorId;
  const isDm = campaign.members.some((m) => m.userId === cmd.actorId && m.role === 'dm');
  if (!isOwner && !isDm) {
    throw new CharacterError(
      'Forbidden',
      `User ${cmd.actorId} may not edit character ${cmd.characterId}`,
    );
  }

  if (cmd.patch.scores && !isLegalPointBuy(cmd.patch.scores)) {
    throw new CharacterError('IllegalPointBuy', 'Patched scores are not a legal point-buy');
  }

  const patched: CharacterSheet = {
    ...existing,
    ...cmd.patch,
    id: existing.id,
    campaignId: existing.campaignId,
    ownerId: existing.ownerId,
  };

  const clamped = clampHp(patched);

  await deps.characters.save(clamped);

  return clamped;
}

/**
 * `createCharacter` use case: orchestrates the pure domain `createCharacter`
 * behind the campaign-membership guard, then links the new sheet into the
 * campaign's roster and persists both aggregates.
 */
import type { AbilityKey } from '../../domain/types.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import { createCharacter as createCharacterDomain } from '../../domain/character/index.js';
import type { CharacterSheet } from '../../domain/types.js';
import type { CampaignRepository, CharacterRepository, Rng } from '../ports.js';
import { CharacterError } from './errors.js';

export interface CreateCharacterCommand {
  campaignId: CampaignId;
  ownerId: UserId;
  name: string;
  species: string;
  className: string;
  background: string;
  level: number;
  method: 'buy' | 'roll';
  scores?: Record<AbilityKey, number>;
}

export interface CreateCharacterDeps {
  characters: CharacterRepository;
  campaigns: CampaignRepository;
  rng: Rng;
}

export async function createCharacter(
  cmd: CreateCharacterCommand,
  deps: CreateCharacterDeps,
): Promise<CharacterSheet> {
  const campaign = await deps.campaigns.findById(cmd.campaignId);
  if (!campaign) {
    throw new CharacterError('NotFound', `Campaign ${cmd.campaignId} not found`);
  }

  const isMember = campaign.members.some((m) => m.userId === cmd.ownerId);
  if (!isMember) {
    throw new CharacterError(
      'NotCampaignMember',
      `User ${cmd.ownerId} is not a member of campaign ${cmd.campaignId}`,
    );
  }

  let sheet: CharacterSheet;
  try {
    sheet = createCharacterDomain(
      {
        campaignId: cmd.campaignId,
        ownerId: cmd.ownerId,
        name: cmd.name,
        species: cmd.species,
        className: cmd.className,
        background: cmd.background,
        level: cmd.level,
        method: cmd.method,
        scores: cmd.scores,
      },
      deps.rng,
    );
  } catch (err) {
    if (err instanceof Error && /point-buy/i.test(err.message)) {
      throw new CharacterError('IllegalPointBuy', err.message);
    }
    throw err;
  }

  await deps.characters.save(sheet);

  const updatedCampaign = {
    ...campaign,
    characterIds: [...campaign.characterIds, sheet.id],
  };
  await deps.campaigns.save(updatedCampaign);

  return sheet;
}

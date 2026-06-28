/**
 * `levelUpCharacter` use case: only the sheet's owner or the campaign's dm may
 * level up a character. Applies the D&D 2024 level-up rules via the domain,
 * then persists the updated sheet.
 */
import type { AbilityKey, CharacterSheet } from '../../domain/types.js';
import type { CharacterId, UserId } from '../../domain/ids.js';
import { levelUp } from '../../domain/character/levelup.js';
import type { Rng } from '../ports.js';
import type { CampaignRepository, CharacterRepository } from '../ports.js';
import { CharacterError } from './errors.js';

export interface LevelUpCharacterCommand {
  characterId: CharacterId;
  actorId: UserId;
  hpMethod: 'fixed' | 'roll';
  asi?:
    | { type: 'single'; ability: AbilityKey }
    | { type: 'double'; ability1: AbilityKey; ability2: AbilityKey };
}

export interface LevelUpCharacterDeps {
  characters: CharacterRepository;
  campaigns: CampaignRepository;
  rng: Rng;
}

export interface LevelUpResult {
  sheet: CharacterSheet;
  hpGained: number;
  asiApplied: boolean;
}

export async function levelUpCharacter(
  cmd: LevelUpCharacterCommand,
  deps: LevelUpCharacterDeps,
): Promise<LevelUpResult> {
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
      `User ${cmd.actorId} may not level up character ${cmd.characterId}`,
    );
  }

  let result: LevelUpResult;
  try {
    result = levelUp(
      existing,
      { hpMethod: cmd.hpMethod, asi: cmd.asi },
      deps.rng,
    );
  } catch (err) {
    if (err instanceof Error) {
      if (/past 20/i.test(err.message)) {
        throw new CharacterError('MaxLevel', err.message);
      }
      if (/ASI/i.test(err.message)) {
        throw new CharacterError('InvalidAsi', err.message);
      }
    }
    throw err;
  }

  await deps.characters.save(result.sheet);

  return result;
}

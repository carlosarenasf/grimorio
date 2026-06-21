import { describe, expect, it } from 'vitest';
import { InMemoryCharacterRepository } from './characterRepository.js';
import { newCampaignId, newCharacterId, newUserId } from '../../domain/ids.js';
import type { CharacterSheet } from '../../domain/types.js';

function makeCharacter(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  return {
    id: newCharacterId(),
    campaignId: newCampaignId(),
    ownerId: newUserId(),
    name: 'Brom',
    species: 'Elfo',
    className: 'Explorador',
    background: 'Forastero',
    level: 1,
    scores: { str: 10, dex: 14, con: 12, int: 10, wis: 12, cha: 8 },
    maxHp: 10,
    currentHp: 10,
    armorClass: 14,
    speed: 9,
    proficientSkills: [],
    attacks: [],
    inventory: [],
    gold: 0,
    notes: '',
    visibility: 'owner',
    ...overrides,
  };
}

describe('InMemoryCharacterRepository', () => {
  it('round-trips save -> findById', async () => {
    const repo = new InMemoryCharacterRepository();
    const character = makeCharacter();

    await repo.save(character);

    expect(await repo.findById(character.id)).toEqual(character);
  });

  it('findById returns null for an unknown id', async () => {
    const repo = new InMemoryCharacterRepository();
    expect(await repo.findById(newCharacterId())).toBeNull();
  });

  it('listByCampaign returns sheets linked to the campaign', async () => {
    const repo = new InMemoryCharacterRepository();
    const campaignId = newCampaignId();
    const other = newCampaignId();

    const inCampaign = makeCharacter({ campaignId });
    const inOtherCampaign = makeCharacter({ campaignId: other });
    await repo.save(inCampaign);
    await repo.save(inOtherCampaign);

    expect(await repo.listByCampaign(campaignId)).toEqual([inCampaign]);
  });

  it('listByCampaign returns an empty array when none match', async () => {
    const repo = new InMemoryCharacterRepository();
    expect(await repo.listByCampaign(newCampaignId())).toEqual([]);
  });
});

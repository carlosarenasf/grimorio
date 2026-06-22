import { describe, expect, it } from 'vitest';
import { getCharacter } from './get.js';
import { CharacterError } from './errors.js';
import { makeInMemoryRepos } from '../../testing/index.js';
import { newCampaignId, newCharacterId, newUserId } from '../../domain/ids.js';
import type { Campaign, CharacterSheet } from '../../domain/types.js';

function setup() {
  const repos = makeInMemoryRepos();
  const dmId = newUserId();
  const ownerId = newUserId();
  const otherId = newUserId();
  const campaignId = newCampaignId();
  const characterId = newCharacterId();

  const campaign: Campaign = {
    id: campaignId,
    ownerId: dmId,
    name: 'La Cripta',
    tagline: '',
    status: 'planning',
    joinCode: 'RAVEN-77',
    members: [
      { userId: dmId, role: 'dm', joinedAt: '2026-01-01T00:00:00.000Z' },
      { userId: ownerId, role: 'player', joinedAt: '2026-01-01T00:00:00.000Z' },
    ],
    characterIds: [characterId],
    sessionCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const sheet: CharacterSheet = {
    id: characterId,
    campaignId,
    ownerId,
    name: 'Lyra',
    species: 'Elfo',
    className: 'Explorador',
    background: 'Forastero',
    level: 5,
    scores: { str: 12, dex: 18, con: 14, int: 10, wis: 16, cha: 11 },
    maxHp: 38,
    currentHp: 31,
    armorClass: 16,
    speed: 10.5,
    proficientSkills: ['stealth'],
    attacks: [],
    inventory: [],
    gold: 0,
    notes: '',
    visibility: 'owner',
  };
  return { repos, dmId, ownerId, otherId, characterId, campaign, sheet };
}

describe('getCharacter', () => {
  it('returns the sheet for its owner', async () => {
    const { repos, ownerId, characterId, campaign, sheet } = setup();
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    const got = await getCharacter(
      { characterId, actorId: ownerId },
      { characters: repos.characters, campaigns: repos.campaigns },
    );
    expect(got.name).toBe('Lyra');
  });

  it('returns the sheet for the campaign dm', async () => {
    const { repos, dmId, characterId, campaign, sheet } = setup();
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    const got = await getCharacter(
      { characterId, actorId: dmId },
      { characters: repos.characters, campaigns: repos.campaigns },
    );
    expect(got.id).toBe(characterId);
  });

  it('forbids an unrelated user', async () => {
    const { repos, otherId, characterId, campaign, sheet } = setup();
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    await expect(
      getCharacter(
        { characterId, actorId: otherId },
        { characters: repos.characters, campaigns: repos.campaigns },
      ),
    ).rejects.toBeInstanceOf(CharacterError);
  });

  it('throws NotFound for an unknown id', async () => {
    const { repos, ownerId } = setup();
    await expect(
      getCharacter(
        { characterId: newCharacterId(), actorId: ownerId },
        { characters: repos.characters, campaigns: repos.campaigns },
      ),
    ).rejects.toThrow(/not found/i);
  });
});

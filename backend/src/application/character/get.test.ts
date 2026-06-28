import { describe, expect, it } from 'vitest';
import { getCharacter } from './get.js';
import { CharacterError } from './errors.js';
import { makeInMemoryRepos } from '../../testing/index.js';
import { newCampaignId, newCharacterId, newUserId } from '../../domain/ids.js';
import type { Campaign, CharacterSheet } from '../../domain/types.js';
import { StaticSrdProvider } from '../../domain/srd/index.js';

function setup() {
  const repos = makeInMemoryRepos();
  const srd = new StaticSrdProvider();
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
  return { repos, srd, dmId, ownerId, otherId, characterId, campaign, sheet };
}

describe('getCharacter', () => {
  it('returns the sheet for its owner', async () => {
    const { repos, srd, ownerId, characterId, campaign, sheet } = setup();
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    const got = await getCharacter(
      { characterId, actorId: ownerId },
      { characters: repos.characters, campaigns: repos.campaigns, srd },
    );
    expect(got.name).toBe('Lyra');
  });

  it('returns the sheet for the campaign dm', async () => {
    const { repos, srd, dmId, characterId, campaign, sheet } = setup();
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    const got = await getCharacter(
      { characterId, actorId: dmId },
      { characters: repos.characters, campaigns: repos.campaigns, srd },
    );
    expect(got.id).toBe(characterId);
  });

  it('forbids an unrelated user', async () => {
    const { repos, srd, otherId, characterId, campaign, sheet } = setup();
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    await expect(
      getCharacter(
        { characterId, actorId: otherId },
        { characters: repos.characters, campaigns: repos.campaigns, srd },
      ),
    ).rejects.toBeInstanceOf(CharacterError);
  });

  it('throws NotFound for an unknown id', async () => {
    const { repos, srd, ownerId } = setup();
    await expect(
      getCharacter(
        { characterId: newCharacterId(), actorId: ownerId },
        { characters: repos.characters, campaigns: repos.campaigns, srd },
      ),
    ).rejects.toThrow(/not found/i);
  });

  it('returns species and class traits resolved from the SRD', async () => {
    const { repos, srd, ownerId, characterId, campaign, sheet } = setup();
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    const got = await getCharacter(
      { characterId, actorId: ownerId },
      { characters: repos.characters, campaigns: repos.campaigns, srd },
    );
    expect(got.traits).toBeDefined();
    const speciesTraits = got.traits!.filter((t) => t.source === 'species');
    const classTraits = got.traits!.filter((t) => t.source === 'class');
    expect(speciesTraits.length).toBeGreaterThan(0);
    expect(speciesTraits[0].name).toBe('Visión en la oscuridad');
    expect(classTraits.length).toBeGreaterThan(0);
    expect(classTraits[0].name).toBe('Enemigo favorito');
  });

  it('filters class features by character level', async () => {
    const { repos, srd, ownerId, campaign } = setup();
    const characterId = newCharacterId();
    const sheet: CharacterSheet = {
      id: characterId,
      campaignId: campaign.id,
      ownerId,
      name: 'Novato',
      species: 'Humano',
      className: 'Guerrero',
      background: 'Forastero',
      level: 1,
      scores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
      maxHp: 12,
      currentHp: 12,
      armorClass: 13,
      speed: 9,
      proficientSkills: ['athletics'],
      attacks: [],
      inventory: [],
      gold: 0,
      notes: '',
      visibility: 'owner',
    };
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    const got = await getCharacter(
      { characterId, actorId: ownerId },
      { characters: repos.characters, campaigns: repos.campaigns, srd },
    );
    const classTraits = got.traits!.filter((t) => t.source === 'class');
    expect(classTraits.every((t) => ['Estilo de combate', 'Segundo viento'].includes(t.name))).toBe(true);
    expect(classTraits.find((t) => t.name === 'Acción adicional')).toBeUndefined();
  });

  it('returns empty traits when species/class are not in the SRD', async () => {
    const { repos, srd, ownerId, campaign } = setup();
    const characterId = newCharacterId();
    const sheet: CharacterSheet = {
      id: characterId,
      campaignId: campaign.id,
      ownerId,
      name: 'Desconocido',
      species: 'Exótica',
      className: 'Inventor',
      background: 'Forastero',
      level: 3,
      scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      maxHp: 10,
      currentHp: 10,
      armorClass: 10,
      speed: 9,
      proficientSkills: [],
      attacks: [],
      inventory: [],
      gold: 0,
      notes: '',
      visibility: 'owner',
    };
    await repos.campaigns.save(campaign);
    await repos.characters.save(sheet);
    const got = await getCharacter(
      { characterId, actorId: ownerId },
      { characters: repos.characters, campaigns: repos.campaigns, srd },
    );
    expect(got.traits).toEqual([]);
  });
});

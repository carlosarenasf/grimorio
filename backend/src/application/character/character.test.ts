import { describe, test, expect, beforeEach } from 'vitest';
import { makeInMemoryRepos, SeededRng } from '../../testing/index.js';
import type { InMemoryRepos } from '../../testing/index.js';
import { createCampaign , addMember } from '../../domain/campaign/index.js';
import { newUserId } from '../../domain/ids.js';
import type { CampaignId, UserId } from '../../domain/ids.js';
import { createCharacter, updateCharacter } from './index.js';

describe('application/character', () => {
  let repos: InMemoryRepos;
  let rng: SeededRng;
  let dmId: UserId;
  let playerAId: UserId;
  let playerBId: UserId;
  let outsiderId: UserId;
  let campaignId: CampaignId;

  beforeEach(async () => {
    repos = makeInMemoryRepos();
    rng = new SeededRng(42);

    dmId = newUserId();
    playerAId = newUserId();
    playerBId = newUserId();
    outsiderId = newUserId();

    let campaign = createCampaign(dmId, 'La Maldición de Strahd', 'Horror gótico', rng);
    campaign = addMember(campaign, playerAId, 'player');
    campaign = addMember(campaign, playerBId, 'player');
    await repos.campaigns.save(campaign);

    campaignId = campaign.id;
  });

  test('non-member creating a character is rejected with NotCampaignMember', async () => {
    await expect(
      createCharacter(
        {
          campaignId,
          ownerId: outsiderId,
          name: 'Intruso',
          species: 'Humano',
          className: 'Guerrero',
          background: 'Forastero',
          level: 1,
          method: 'buy',
          scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
        },
        { characters: repos.characters, campaigns: repos.campaigns, rng },
      ),
    ).rejects.toMatchObject({ code: 'NotCampaignMember' });
  });

  test('member creates a character: persisted and linked into campaign.characterIds', async () => {
    const sheet = await createCharacter(
      {
        campaignId,
        ownerId: playerAId,
        name: 'Lyra',
        species: 'Elfo',
        className: 'Explorador',
        background: 'Forastero',
        level: 1,
        method: 'buy',
        scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      },
      { characters: repos.characters, campaigns: repos.campaigns, rng },
    );

    const persisted = await repos.characters.findById(sheet.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.ownerId).toBe(playerAId);

    const updatedCampaign = await repos.campaigns.findById(campaignId);
    expect(updatedCampaign?.characterIds).toContain(sheet.id);
  });

  test('a player editing another player sheet is Forbidden', async () => {
    const sheet = await createCharacter(
      {
        campaignId,
        ownerId: playerAId,
        name: 'Lyra',
        species: 'Elfo',
        className: 'Explorador',
        background: 'Forastero',
        level: 1,
        method: 'buy',
        scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      },
      { characters: repos.characters, campaigns: repos.campaigns, rng },
    );

    await expect(
      updateCharacter(
        { characterId: sheet.id, actorId: playerBId, patch: { notes: 'hackeado' } },
        { characters: repos.characters, campaigns: repos.campaigns },
      ),
    ).rejects.toMatchObject({ code: 'Forbidden' });
  });

  test('the owner can edit their own sheet', async () => {
    const sheet = await createCharacter(
      {
        campaignId,
        ownerId: playerAId,
        name: 'Lyra',
        species: 'Elfo',
        className: 'Explorador',
        background: 'Forastero',
        level: 1,
        method: 'buy',
        scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      },
      { characters: repos.characters, campaigns: repos.campaigns, rng },
    );

    const updated = await updateCharacter(
      { characterId: sheet.id, actorId: playerAId, patch: { notes: 'Mi historia...' } },
      { characters: repos.characters, campaigns: repos.campaigns },
    );

    expect(updated.notes).toBe('Mi historia...');
  });

  test('the dm of the campaign can edit any sheet', async () => {
    const sheet = await createCharacter(
      {
        campaignId,
        ownerId: playerAId,
        name: 'Lyra',
        species: 'Elfo',
        className: 'Explorador',
        background: 'Forastero',
        level: 1,
        method: 'buy',
        scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      },
      { characters: repos.characters, campaigns: repos.campaigns, rng },
    );

    const updated = await updateCharacter(
      { characterId: sheet.id, actorId: dmId, patch: { notes: 'Anotado por el Máster' } },
      { characters: repos.characters, campaigns: repos.campaigns },
    );

    expect(updated.notes).toBe('Anotado por el Máster');
  });

  test('update re-clamps currentHp via domain clampHp', async () => {
    const sheet = await createCharacter(
      {
        campaignId,
        ownerId: playerAId,
        name: 'Lyra',
        species: 'Elfo',
        className: 'Explorador',
        background: 'Forastero',
        level: 1,
        method: 'buy',
        scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      },
      { characters: repos.characters, campaigns: repos.campaigns, rng },
    );

    const updated = await updateCharacter(
      { characterId: sheet.id, actorId: playerAId, patch: { currentHp: 999 } },
      { characters: repos.characters, campaigns: repos.campaigns },
    );

    expect(updated.currentHp).toBe(updated.maxHp);
  });

  test('create with method "buy" and an illegal point-buy (score of 16) is rejected', async () => {
    await expect(
      createCharacter(
        {
          campaignId,
          ownerId: playerAId,
          name: 'Ilegal',
          species: 'Humano',
          className: 'Guerrero',
          background: 'Forastero',
          level: 1,
          method: 'buy',
          scores: { str: 16, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
        },
        { characters: repos.characters, campaigns: repos.campaigns, rng },
      ),
    ).rejects.toMatchObject({ code: 'IllegalPointBuy' });
  });

  test('create with method "buy" and total over 27 points is rejected', async () => {
    await expect(
      createCharacter(
        {
          campaignId,
          ownerId: playerAId,
          name: 'Ilegal2',
          species: 'Humano',
          className: 'Guerrero',
          background: 'Forastero',
          level: 1,
          method: 'buy',
          scores: { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 },
        },
        { characters: repos.characters, campaigns: repos.campaigns, rng },
      ),
    ).rejects.toMatchObject({ code: 'IllegalPointBuy' });
  });

  test('update accepts non-point-buy scores (from a 4d6 roll / standard array)', async () => {
    const sheet = await createCharacter(
      {
        campaignId,
        ownerId: playerAId,
        name: 'Lyra',
        species: 'Elfo',
        className: 'Explorador',
        background: 'Forastero',
        level: 1,
        method: 'buy',
        scores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      },
      { characters: repos.characters, campaigns: repos.campaigns, rng },
    );

    // A 17 is a valid 5e score (rolled) but not a legal 27-point buy — allowed.
    const updated = await updateCharacter(
      {
        characterId: sheet.id,
        actorId: playerAId,
        patch: { scores: { str: 15, dex: 15, con: 17, int: 10, wis: 8, cha: 12 } },
      },
      { characters: repos.characters, campaigns: repos.campaigns },
    );
    expect(updated.scores.con).toBe(17);
  });
});

import { describe, expect, it } from 'vitest';
import { addMember, createCampaign, generateJoinCode, regenerateInvite } from './index.js';
import { newUserId } from '../ids.js';
import type { Rng } from '../ports.js';

/** Deterministic fake Rng that returns values from a fixed queue, cycling if exhausted. */
function fakeRng(...values: number[]): Rng {
  let i = 0;
  return {
    int(_min: number, _max: number): number {
      const v = values[i % values.length];
      i += 1;
      return v;
    },
  };
}

describe('generateJoinCode', () => {
  it('matches the pattern UPPERWORD-NN', () => {
    const code = generateJoinCode(fakeRng(0, 7, 7));
    expect(code).toMatch(/^[A-Z]+-\d{2}$/);
  });

  it('is deterministic given the same fake rng sequence', () => {
    const codeA = generateJoinCode(fakeRng(2, 1, 9));
    const codeB = generateJoinCode(fakeRng(2, 1, 9));
    expect(codeA).toBe(codeB);
  });
});

describe('createCampaign', () => {
  it('adds the owner as a dm member', () => {
    const ownerId = newUserId();
    const campaign = createCampaign(ownerId, 'La Maldición', 'Una aventura oscura', fakeRng(0, 1, 2));
    expect(campaign.members).toEqual([
      expect.objectContaining({ userId: ownerId, role: 'dm' }),
    ]);
  });

  it('has status "planning"', () => {
    const ownerId = newUserId();
    const campaign = createCampaign(ownerId, 'La Maldición', 'Una aventura oscura', fakeRng(0, 1, 2));
    expect(campaign.status).toBe('planning');
  });

  it('starts with an empty characterIds list and sessionCount 0', () => {
    const ownerId = newUserId();
    const campaign = createCampaign(ownerId, 'La Maldición', 'Una aventura oscura', fakeRng(0, 1, 2));
    expect(campaign.characterIds).toEqual([]);
    expect(campaign.sessionCount).toBe(0);
  });

  it('uses the clock for createdAt when provided', () => {
    const ownerId = newUserId();
    const clock = { now: () => '2026-01-01T00:00:00.000Z' };
    const campaign = createCampaign(
      ownerId,
      'La Maldición',
      'Una aventura oscura',
      fakeRng(0, 1, 2),
      clock,
    );
    expect(campaign.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('addMember', () => {
  it('adding a member with an existing userId is a no-op', () => {
    const ownerId = newUserId();
    const playerId = newUserId();
    const campaign = createCampaign(ownerId, 'Name', 'Tagline', fakeRng(0, 1, 2));
    const withPlayer = addMember(campaign, playerId, 'player');
    const again = addMember(withPlayer, playerId, 'player');
    expect(again.members).toEqual(withPlayer.members);
  });

  it('cannot add a second dm', () => {
    const ownerId = newUserId();
    const secondDm = newUserId();
    const campaign = createCampaign(ownerId, 'Name', 'Tagline', fakeRng(0, 1, 2));
    expect(() => addMember(campaign, secondDm, 'dm')).toThrow();
  });

  it('adds a new player member', () => {
    const ownerId = newUserId();
    const playerId = newUserId();
    const campaign = createCampaign(ownerId, 'Name', 'Tagline', fakeRng(0, 1, 2));
    const withPlayer = addMember(campaign, playerId, 'player');
    expect(withPlayer.members).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: playerId, role: 'player' })]),
    );
    expect(withPlayer.members).toHaveLength(2);
  });
});

describe('regenerateInvite', () => {
  it('changes the joinCode', () => {
    const ownerId = newUserId();
    const campaign = createCampaign(ownerId, 'Name', 'Tagline', fakeRng(0, 1, 2));
    const updated = regenerateInvite(campaign, fakeRng(5, 6, 7));
    expect(updated.joinCode).not.toBe(campaign.joinCode);
  });
});

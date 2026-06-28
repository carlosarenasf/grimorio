import { test, expect } from 'vitest';
import type {
  Broadcaster,
  CampaignRepository,
  CharacterRepository,
  Clock,
  LiveTableRepository,
  PasswordHasher,
  Rng,
  SrdProvider,
  UserRepository,
} from './ports.js';

/**
 * These are compile-time contract checks: each `satisfies` proves a minimal dummy
 * implements the port exactly. If a port's shape drifts, `tsc --noEmit` fails.
 * The runtime assertion is incidental — the real test is that this file type-checks.
 */

const clock = { now: () => '2026-06-21T00:00:00.000Z' } satisfies Clock;

const rng = { int: (min: number, max: number) => min + (max - min) } satisfies Rng;

const hasher = {
  hash: async (pw: string) => pw,
  verify: async (hash: string, pw: string) => hash === pw,
} satisfies PasswordHasher;

const userRepo = {
  save: async () => {},
  findById: async () => null,
  findByEmail: async () => null,
} satisfies UserRepository;

const campaignRepo = {
  save: async () => {},
  findById: async () => null,
  findByJoinCode: async () => null,
  listForUser: async () => [],
  delete: async () => {},
} satisfies CampaignRepository;

const characterRepo = {
  save: async () => {},
  findById: async () => null,
  listByCampaign: async () => [],
  deleteByCampaign: async () => {},
} satisfies CharacterRepository;

const liveTableRepo = {
  save: async () => {},
  findById: async () => null,
  findByCampaignId: async () => null,
  deleteByCampaign: async () => {},
} satisfies LiveTableRepository;

const broadcaster = {
  toRoom: () => {},
} satisfies Broadcaster;

const srd = {
  searchMonsters: () => [],
  getMonster: () => null,
  conditions: () => [],
  rulesReference: () => [],
  species: () => [],
  classes: () => [],
  backgrounds: () => [],
  spells: () => [],
  weapons: () => [],
} satisfies SrdProvider;

test('ports are implementable by minimal dummies (type-level contract)', () => {
  expect([
    clock,
    rng,
    hasher,
    userRepo,
    campaignRepo,
    characterRepo,
    liveTableRepo,
    broadcaster,
    srd,
  ]).toHaveLength(9);
});

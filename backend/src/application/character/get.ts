/**
 * `getCharacter` use case: fetch a single sheet. Only the sheet's owner or the
 * campaign's dm may read it (a character sheet is `owner`-visible). This is what
 * the player view uses to load its full own sheet (scores/attacks/inventory),
 * which the live-table snapshot intentionally does not carry.
 *
 * Enriches the sheet with `traits` resolved from the SRD (species traits +
 * class features available at the character's current level).
 */
import type { CharacterId, UserId } from '../../domain/ids.js';
import type { CharacterSheet, CharacterTrait } from '../../domain/types.js';
import type { CampaignRepository, CharacterRepository, SrdProvider } from '../ports.js';
import { CharacterError } from './errors.js';

export interface GetCharacterCommand {
  characterId: CharacterId;
  actorId: UserId;
}

export interface GetCharacterDeps {
  characters: CharacterRepository;
  campaigns: CampaignRepository;
  srd: SrdProvider;
}

export async function getCharacter(
  cmd: GetCharacterCommand,
  deps: GetCharacterDeps,
): Promise<CharacterSheet> {
  const sheet = await deps.characters.findById(cmd.characterId);
  if (!sheet) {
    throw new CharacterError('NotFound', `Character ${cmd.characterId} not found`);
  }

  const campaign = await deps.campaigns.findById(sheet.campaignId);
  const isOwner = sheet.ownerId === cmd.actorId;
  const isDm = !!campaign?.members.some((m) => m.userId === cmd.actorId && m.role === 'dm');
  if (!isOwner && !isDm) {
    throw new CharacterError(
      'Forbidden',
      `User ${cmd.actorId} may not read character ${cmd.characterId}`,
    );
  }

  const traits = resolveTraits(sheet, deps.srd);

  return { ...sheet, traits };
}

function resolveTraits(sheet: CharacterSheet, srd: SrdProvider): CharacterTrait[] {
  const traits: CharacterTrait[] = [];

  const speciesDef = srd.species().find((s) => s.name === sheet.species);
  if (speciesDef) {
    speciesDef.traits.forEach((t, i) => {
      traits.push({ id: `species-${i}`, name: t.name, description: t.description, source: 'species' });
    });
  }

  const classDef = srd.classes().find((c) => c.name === sheet.className);
  if (classDef) {
    const available = classDef.features.filter((f) => f.level <= sheet.level);
    available.forEach((f, i) => {
      traits.push({ id: `class-${i}`, name: f.name, description: f.description, source: 'class' });
    });
  }

  return traits;
}

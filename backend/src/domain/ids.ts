import { nanoid } from 'nanoid';

/**
 * Branded primitive helper. `Brand<string, 'UserId'>` is structurally a string
 * but nominally distinct, so a `CampaignId` can never be passed where a `UserId`
 * is expected. The brand exists only at the type level (zero runtime cost).
 */
export type Brand<T, K extends string> = T & { readonly __brand: K };

export type UserId = Brand<string, 'UserId'>;
export type CampaignId = Brand<string, 'CampaignId'>;
export type CharacterId = Brand<string, 'CharacterId'>;
export type CombatantId = Brand<string, 'CombatantId'>;
export type LiveTableId = Brand<string, 'LiveTableId'>;

/**
 * Generate a prefixed, collision-resistant id, e.g. `newId('usr') -> 'usr_V1Stg...'`.
 * The prefix makes ids self-describing in logs and wire payloads.
 */
export function newId(prefix: string): string {
  return `${prefix}_${nanoid()}`;
}

export const newUserId = (): UserId => newId('usr') as UserId;
export const newCampaignId = (): CampaignId => newId('cmp') as CampaignId;
export const newCharacterId = (): CharacterId => newId('chr') as CharacterId;
export const newCombatantId = (): CombatantId => newId('cbt') as CombatantId;
export const newLiveTableId = (): LiveTableId => newId('tbl') as LiveTableId;

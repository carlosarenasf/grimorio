import type { CharacterRepository } from '../../application/ports.js';
import type { CampaignId, CharacterId } from '../../domain/ids.js';
import type { CharacterSheet } from '../../domain/types.js';

/** Map-backed `CharacterRepository` for tests and local dev (no persistence). */
export class InMemoryCharacterRepository implements CharacterRepository {
  private readonly byId = new Map<CharacterId, CharacterSheet>();

  async save(character: CharacterSheet): Promise<void> {
    this.byId.set(character.id, { ...character });
  }

  async findById(id: CharacterId): Promise<CharacterSheet | null> {
    const character = this.byId.get(id);
    return character ? { ...character } : null;
  }

  async listByCampaign(campaignId: CampaignId): Promise<CharacterSheet[]> {
    const result: CharacterSheet[] = [];
    for (const character of this.byId.values()) {
      if (character.campaignId === campaignId) result.push({ ...character });
    }
    return result;
  }
}

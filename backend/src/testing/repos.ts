import {
  InMemoryCampaignRepository,
  InMemoryCharacterRepository,
  InMemoryLiveTableRepository,
  InMemoryUserRepository,
} from '../infra/memory/index.js';

export interface InMemoryRepos {
  users: InMemoryUserRepository;
  campaigns: InMemoryCampaignRepository;
  characters: InMemoryCharacterRepository;
  liveTables: InMemoryLiveTableRepository;
}

/** Fresh, isolated set of in-memory repos for a single test. */
export function makeInMemoryRepos(): InMemoryRepos {
  return {
    users: new InMemoryUserRepository(),
    campaigns: new InMemoryCampaignRepository(),
    characters: new InMemoryCharacterRepository(),
    liveTables: new InMemoryLiveTableRepository(),
  };
}

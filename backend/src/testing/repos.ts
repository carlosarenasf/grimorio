import {
  InMemoryCampaignRepository,
  InMemoryCharacterRepository,
  InMemoryLiveTableRepository,
  InMemoryMapRepository,
  InMemoryUserRepository,
} from '../infra/memory/index.js';

export interface InMemoryRepos {
  users: InMemoryUserRepository;
  campaigns: InMemoryCampaignRepository;
  characters: InMemoryCharacterRepository;
  liveTables: InMemoryLiveTableRepository;
  maps: InMemoryMapRepository;
}

/** Fresh, isolated set of in-memory repos for a single test. */
export function makeInMemoryRepos(): InMemoryRepos {
  return {
    users: new InMemoryUserRepository(),
    campaigns: new InMemoryCampaignRepository(),
    characters: new InMemoryCharacterRepository(),
    liveTables: new InMemoryLiveTableRepository(),
    maps: new InMemoryMapRepository(),
  };
}

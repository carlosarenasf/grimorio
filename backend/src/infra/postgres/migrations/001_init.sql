-- Grimorio Postgres schema (Wave 2 infra).
--
-- Each aggregate is stored as a JSONB snapshot (`data`) plus a handful of
-- relational lookup columns mirroring the lookups the in-memory adapters
-- support (findByEmail, findByJoinCode, listForUser, listByCampaign,
-- findByCampaignId). The JSONB snapshot is the rehydration source of truth
-- (SPEC.md §4/§8): on reload we parse `data` straight back into the domain
-- type rather than reassembling it from columns.
--
-- Membership modeling decision (documented per task instructions): campaign
-- membership for `listForUser` is derived from the `campaigns.data` JSONB
-- (the `members` array already living inside the `Campaign` aggregate) via a
-- JSONB containment/path query, NOT a separate `campaign_members` join table.
-- Rationale: `Campaign.members` is already part of the aggregate's persisted
-- truth (SPEC §5) and is small (1 DM + a handful of players), so a join
-- table would just be a denormalized index for a query that's already cheap
-- with a JSONB GIN index, and we'd otherwise have to keep two copies of
-- membership in sync on every save. A join table would pay off if we needed
-- efficient cross-campaign membership queries at scale; v1 doesn't.

CREATE TABLE IF NOT EXISTS users (
  id    TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  data  JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id        TEXT PRIMARY KEY,
  join_code TEXT NOT NULL UNIQUE,
  data      JSONB NOT NULL
);

-- Accelerates listForUser's JSONB containment lookup over campaigns.members.
CREATE INDEX IF NOT EXISTS campaigns_members_gin_idx ON campaigns USING GIN (data);

CREATE TABLE IF NOT EXISTS characters (
  id          TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  data        JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS characters_campaign_id_idx ON characters (campaign_id);

CREATE TABLE IF NOT EXISTS live_tables (
  id          TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL UNIQUE,
  data        JSONB NOT NULL
);

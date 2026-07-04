-- Maps aggregate (Wave 2 infra).
--
-- Same JSONB-snapshot pattern as the other aggregates: a relational lookup
-- column (campaign_id) plus the full aggregate in `data`. Listing maps for a
-- campaign is a single indexed equality on `campaign_id` (no JSONB probing),
-- since maps are not members-bearing like campaigns.

CREATE TABLE IF NOT EXISTS maps (
  id          TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_maps_campaign ON maps(campaign_id);
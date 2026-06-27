-- Fix double-encoded JSONB data.
--
-- The previous code used `JSON.stringify()` + `::jsonb` cast, which stored
-- JSON strings (text) instead of JSON objects. This migration converts them
-- to proper JSON objects by parsing the text representation.
--
-- Example of the bug:
--   Stored: "\"{\\\"id\\\":\\\"...\\\",\\\"members\\\":[...]}\""
--   Should be: {"id":"...","members":[...]}

-- Fix campaigns table
UPDATE campaigns
SET data = (data #>> '{}')::jsonb
WHERE jsonb_typeof(data) = 'string';

-- Fix users table
UPDATE users
SET data = (data #>> '{}')::jsonb
WHERE jsonb_typeof(data) = 'string';

-- Fix characters table
UPDATE characters
SET data = (data #>> '{}')::jsonb
WHERE jsonb_typeof(data) = 'string';

-- Fix live_tables table
UPDATE live_tables
SET data = (data #>> '{}')::jsonb
WHERE jsonb_typeof(data) = 'string';

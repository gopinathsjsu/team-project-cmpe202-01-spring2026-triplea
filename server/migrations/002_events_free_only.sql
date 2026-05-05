-- Free events only: set all existing rows to free (columns kept for compatibility).
-- New installs: see server/models/schema.sql CHECK (is_free = true AND ticket_price = 0.00).
-- If an older database still has a CHECK allowing paid events, adjust that constraint in the Supabase/Postgres UI or via ALTER TABLE to match the schema.

UPDATE events SET is_free = true, ticket_price = 0;

-- Migration 004: Add banner_url to events
-- Adds a column to store the event banner image URL (from R2)

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN events.banner_url IS 'URL of the event banner image stored in R2';

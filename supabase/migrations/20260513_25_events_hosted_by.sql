-- Add hosted_by to events: tracks which group member is hosting at their home.
-- Only set when lugar = 'casa' and a specific member is selected as host.
-- Used by the "Anfitrión de oro" ranking.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS hosted_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Update contributions.category to accept APORTE_CATEGORIES IDs from constants
-- Drop old check constraint (if any) that restricted to the legacy category set
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_category_check;

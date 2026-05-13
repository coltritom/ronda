-- Allow non-member participants in contributions and expense splits

-- contributions: user_id nullable + guest_name
ALTER TABLE contributions
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name text;

ALTER TABLE contributions
  ADD CONSTRAINT contributions_participant_check
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_name <> ''));

-- expense_splits: user_id nullable + guest_name
ALTER TABLE expense_splits
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name text;

ALTER TABLE expense_splits
  ADD CONSTRAINT expense_splits_participant_check
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_name <> ''));

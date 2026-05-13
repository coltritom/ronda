-- Allow a guest (non-member) to be the payer of an expense.

ALTER TABLE expenses
  ALTER COLUMN paid_by DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS paid_by_guest_name text;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_payer_check
  CHECK (paid_by IS NOT NULL OR (paid_by_guest_name IS NOT NULL AND paid_by_guest_name <> ''));

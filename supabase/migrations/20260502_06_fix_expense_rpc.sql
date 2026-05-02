-- Fix create_expense_with_splits: grant execute + ensure split_type column exists

-- 1. Add split_type to expenses if missing (safe no-op if already present)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS split_type text NOT NULL DEFAULT 'equal';

-- 2. Re-create function to ensure it's in sync with the current schema
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_event_id       uuid,
  p_description    text,
  p_amount         numeric,
  p_paid_by        uuid,
  p_split_type     text,
  p_split_user_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense_id   uuid;
  v_split_amount numeric;
  v_user_id      uuid;
BEGIN
  IF array_length(p_split_user_ids, 1) IS NULL OR array_length(p_split_user_ids, 1) = 0 THEN
    RAISE EXCEPTION 'split_user_ids cannot be empty';
  END IF;

  INSERT INTO expenses (event_id, description, amount, paid_by, split_type)
  VALUES (p_event_id, p_description, p_amount, p_paid_by, p_split_type)
  RETURNING id INTO v_expense_id;

  v_split_amount := ROUND(p_amount / array_length(p_split_user_ids, 1), 2);

  FOREACH v_user_id IN ARRAY p_split_user_ids
  LOOP
    INSERT INTO expense_splits (expense_id, user_id, amount, is_settled)
    VALUES (v_expense_id, v_user_id, v_split_amount, false);
  END LOOP;

  RETURN v_expense_id;
END;
$$;

-- 3. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_expense_with_splits(uuid, text, numeric, uuid, text, uuid[]) TO authenticated;

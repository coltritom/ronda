-- B-07: Atomic expense + splits creation
-- Wraps both inserts in a single implicit transaction (plpgsql functions are atomic).
-- Call via: supabase.rpc('create_expense_with_splits', { ... })

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
AS $$
DECLARE
  v_expense_id  uuid;
  v_split_amount numeric;
  v_user_id     uuid;
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

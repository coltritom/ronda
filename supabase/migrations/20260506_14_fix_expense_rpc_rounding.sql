-- Fix create_expense_with_splits: last participant absorbs rounding remainder
-- so splits always sum exactly to the total amount.

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
  v_n            int;
  i              int;
BEGIN
  v_n := array_length(p_split_user_ids, 1);
  IF v_n IS NULL OR v_n = 0 THEN
    RAISE EXCEPTION 'split_user_ids cannot be empty';
  END IF;

  INSERT INTO expenses (event_id, description, amount, paid_by, split_type)
  VALUES (p_event_id, p_description, p_amount, p_paid_by, p_split_type)
  RETURNING id INTO v_expense_id;

  v_split_amount := ROUND(p_amount / v_n, 2);

  FOR i IN 1..v_n LOOP
    INSERT INTO expense_splits (expense_id, user_id, amount, is_settled)
    VALUES (
      v_expense_id,
      p_split_user_ids[i],
      CASE WHEN i = v_n THEN p_amount - v_split_amount * (v_n - 1) ELSE v_split_amount END,
      false
    );
  END LOOP;

  RETURN v_expense_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_expense_with_splits(uuid, text, numeric, uuid, text, uuid[]) TO authenticated;

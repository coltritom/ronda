-- Add missing RLS policies for expense_splits and expenses
-- expense_splits had only SELECT; the edit path and "mark paid" need DELETE/INSERT/UPDATE.
-- expenses had no UPDATE policy; the edit path needs it.

-- ─── expense_splits ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "expense_splits: group members can insert" ON expense_splits;
CREATE POLICY "expense_splits: group members can insert"
  ON expense_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    is_group_member(
      (SELECT e.group_id
         FROM expenses ex
         JOIN events e ON ex.event_id = e.id
        WHERE ex.id = expense_id)
    )
  );

DROP POLICY IF EXISTS "expense_splits: group members can delete" ON expense_splits;
CREATE POLICY "expense_splits: group members can delete"
  ON expense_splits FOR DELETE
  TO authenticated
  USING (
    is_group_member(
      (SELECT e.group_id
         FROM expenses ex
         JOIN events e ON ex.event_id = e.id
        WHERE ex.id = expense_id)
    )
  );

DROP POLICY IF EXISTS "expense_splits: group members can update" ON expense_splits;
CREATE POLICY "expense_splits: group members can update"
  ON expense_splits FOR UPDATE
  TO authenticated
  USING (
    is_group_member(
      (SELECT e.group_id
         FROM expenses ex
         JOIN events e ON ex.event_id = e.id
        WHERE ex.id = expense_id)
    )
  )
  WITH CHECK (
    is_group_member(
      (SELECT e.group_id
         FROM expenses ex
         JOIN events e ON ex.event_id = e.id
        WHERE ex.id = expense_id)
    )
  );

-- ─── expenses ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "expenses: group members can update" ON expenses;
CREATE POLICY "expenses: group members can update"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  )
  WITH CHECK (
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

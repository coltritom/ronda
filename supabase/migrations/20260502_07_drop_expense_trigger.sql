-- Drop trigger and its function — split creation is handled exclusively
-- by the create_expense_with_splits RPC, which uses the user's explicit selection.
DROP TRIGGER IF EXISTS on_expense_created ON expenses;
DROP FUNCTION IF EXISTS handle_new_expense();

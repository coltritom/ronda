-- Fix groups SELECT policy: allow the creator to see their own group.
-- Without this, createGroup fails because after INSERT the user is not yet
-- in group_members, so the SELECT to retrieve the group ID returns 0 rows.

DROP POLICY IF EXISTS "groups: members can view" ON groups;

CREATE POLICY "groups: members can view"
  ON groups FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_group_member(id));

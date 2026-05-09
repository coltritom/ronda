-- Allow all group members (not just admins) to update group info and manage invites.

-- groups: any member can now update name/description/emoji
DROP POLICY IF EXISTS "groups: admins can update" ON groups;
CREATE POLICY "groups: members can update"
  ON groups FOR UPDATE
  TO authenticated
  USING (is_group_member(id))
  WITH CHECK (is_group_member(id));

-- invites: any member can create/delete invite links
DROP POLICY IF EXISTS "invites: group admins can create" ON invites;
CREATE POLICY "invites: group members can create"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    is_group_member(group_id)
  );

DROP POLICY IF EXISTS "invites: group admins can delete" ON invites;
CREATE POLICY "invites: group members can delete"
  ON invites FOR DELETE
  TO authenticated
  USING (is_group_member(group_id));

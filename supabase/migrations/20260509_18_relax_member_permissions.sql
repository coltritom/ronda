-- Allow all group members (not just admins) to update group info and manage invites.

-- groups: any member can now update name/description/emoji
DROP POLICY IF EXISTS "groups: admins can update" ON groups;
CREATE POLICY "groups: members can update"
  ON groups FOR UPDATE
  TO authenticated
  USING (is_group_member(id))
  WITH CHECK (is_group_member(id));

-- invites: any member can delete invite links (INSERT already open to members via migration 05)
DROP POLICY IF EXISTS "invites: group admins can delete" ON invites;
CREATE POLICY "invites: group members can delete"
  ON invites FOR DELETE
  TO authenticated
  USING (is_group_member(group_id));

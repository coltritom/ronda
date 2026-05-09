-- Allow any member to leave their own group (not just admins).
-- Previously the function required p_actor_id to be an admin even for self-leave.
-- Change: skip the admin check when actor and target are the same user.

CREATE OR REPLACE FUNCTION remove_group_member(
  p_group_id  uuid,
  p_actor_id  uuid,
  p_target_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_role  text;
  v_target_role text;
  v_admin_count int;
BEGIN
  -- Acquire an exclusive lock on all current admin rows for this group.
  PERFORM user_id
  FROM group_members
  WHERE group_id = p_group_id AND role = 'admin'
  FOR UPDATE;

  -- Verify actor is a member of the group.
  SELECT role INTO v_actor_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_actor_id;

  IF v_actor_role IS NULL THEN
    RETURN 'Sin permisos.';
  END IF;

  -- Non-admins can only remove themselves (self-leave).
  IF v_actor_role <> 'admin' AND p_actor_id <> p_target_id THEN
    RETURN 'Sin permisos.';
  END IF;

  -- Check that the target is actually in the group.
  SELECT role INTO v_target_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_target_id;

  IF v_target_role IS NULL THEN
    RETURN 'Miembro no encontrado.';
  END IF;

  -- Prevent removing the last admin (applies to both self-leave and admin removal).
  IF v_target_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM group_members
    WHERE group_id = p_group_id AND role = 'admin';

    IF v_admin_count <= 1 THEN
      RETURN 'No podés salir siendo el único admin. Primero promové a otro miembro.';
    END IF;
  END IF;

  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = p_target_id;

  RETURN NULL; -- success
END;
$$;

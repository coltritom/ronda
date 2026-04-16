-- B-06: Race-condition-safe member removal
-- Uses SELECT ... FOR UPDATE to lock all admin rows for the group before
-- performing the last-admin check, preventing concurrent removals from
-- racing past the guard.
-- Returns NULL on success, or a Spanish error string on failure.
-- Call via: supabase.rpc('remove_group_member', { ... })

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
  -- This blocks any concurrent call that tries to modify admin membership
  -- until we are done, eliminating the TOCTOU window.
  PERFORM user_id
  FROM group_members
  WHERE group_id = p_group_id AND role = 'admin'
  FOR UPDATE;

  -- Verify that the caller is an admin of this group.
  SELECT role INTO v_actor_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_actor_id;

  IF v_actor_role IS NULL OR v_actor_role <> 'admin' THEN
    RETURN 'Sin permisos.';
  END IF;

  -- Check that the target is actually in the group.
  SELECT role INTO v_target_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = p_target_id;

  IF v_target_role IS NULL THEN
    RETURN 'Miembro no encontrado.';
  END IF;

  -- If the target is an admin, ensure we are not removing the last one.
  IF v_target_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM group_members
    WHERE group_id = p_group_id AND role = 'admin';

    IF v_admin_count <= 1 THEN
      RETURN 'No podés eliminar al único admin del grupo.';
    END IF;
  END IF;

  DELETE FROM group_members
  WHERE group_id = p_group_id AND user_id = p_target_id;

  RETURN NULL; -- success
END;
$$;

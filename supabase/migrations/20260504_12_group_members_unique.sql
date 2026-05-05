-- Migración 12: UNIQUE constraint en group_members(group_id, user_id)
-- Previene duplicados por race condition en aceptación de invitaciones.
-- Si ya existen duplicados en la tabla, este comando fallará y deberán
-- limpiarse manualmente antes de aplicar.

ALTER TABLE group_members
  ADD CONSTRAINT group_members_group_id_user_id_unique UNIQUE (group_id, user_id);

-- ============================================================
-- Migración 05: Arreglar tabla invites y permisos
-- Fecha: 2026-05-02
--
-- Cambios:
--   1. CREATE TABLE IF NOT EXISTS invites (crea si no existe,
--      no-op si ya existe con el schema correcto).
--   2. Agrega columna token IF NOT EXISTS (por si la tabla existe
--      con 'id' en vez de 'token').
--   3. Reemplaza política INSERT: cualquier miembro puede crear
--      invites (no solo admins).
--   4. Garantiza que anon y authenticated tienen SELECT.
-- ============================================================

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS invites (
  token       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  group_name  text NOT NULL DEFAULT '',
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invites_group_id_idx ON invites (group_id);

-- 2. Si la tabla existía con columna 'id' en vez de 'token',
--    agregar alias 'token' apuntando a 'id'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'invites'
      AND column_name  = 'token'
  ) THEN
    -- La PK se llama 'id'; agregar columna token que la refleje
    ALTER TABLE invites ADD COLUMN token uuid DEFAULT gen_random_uuid();
    -- Copiar los ids existentes al nuevo token
    UPDATE invites SET token = id WHERE token IS NULL;
    ALTER TABLE invites ALTER COLUMN token SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS invites_token_unique ON invites (token);
  END IF;
END;
$$;

-- 3. RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- SELECT abierto a todos (anon + authenticated) — el token UUID actúa como secreto
DROP POLICY IF EXISTS "invites: anyone can view (token-gated)" ON invites;
CREATE POLICY "invites: anyone can view (token-gated)"
  ON invites FOR SELECT
  USING (true);

-- INSERT: cualquier miembro del grupo (no solo admins)
DROP POLICY IF EXISTS "invites: group admins can create"  ON invites;
DROP POLICY IF EXISTS "invites: group members can create" ON invites;
CREATE POLICY "invites: group members can create"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    is_group_member(group_id)
  );

-- DELETE: solo admins pueden eliminar invites
DROP POLICY IF EXISTS "invites: group admins can delete" ON invites;
CREATE POLICY "invites: group admins can delete"
  ON invites FOR DELETE
  TO authenticated
  USING (is_group_admin(group_id));

-- 4. Garantizar privilegios de acceso al rol anon
GRANT SELECT ON invites TO anon;
GRANT SELECT, INSERT ON invites TO authenticated;

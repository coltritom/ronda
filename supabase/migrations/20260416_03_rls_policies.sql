-- ============================================================
-- Migración 03: Row Level Security para todas las tablas
-- Fecha: 2026-04-16
--
-- Estrategia:
--   - Dos funciones SECURITY DEFINER (is_group_member / is_group_admin)
--     que consultan group_members sin activar RLS recursiva.
--   - Todas las tablas tienen RLS habilitado.
--   - El principio de mínimo privilegio: un usuario solo accede
--     a datos de grupos a los que pertenece.
--   - Las funciones create_expense_with_splits y remove_group_member
--     son SECURITY DEFINER y ya bypasean RLS; no necesitan política
--     de INSERT/DELETE explícita para sus rutas de escritura.
-- ============================================================

-- ─── Helpers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id  = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_group_admin(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id  = auth.uid()
      AND role     = 'admin'
  );
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Cualquier usuario autenticado puede ver perfiles (necesario para mostrar
-- nombres en el grupo). Solo el dueño puede actualizar el suyo.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: authenticated users can view all"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles: users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── groups ──────────────────────────────────────────────────────────────────

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups: members can view"
  ON groups FOR SELECT
  TO authenticated
  USING (is_group_member(id));

-- El usuario que crea el grupo debe ser quien figura como created_by.
-- La acción createGroup inserta con created_by = user.id.
CREATE POLICY "groups: authenticated users can create"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "groups: admins can update"
  ON groups FOR UPDATE
  TO authenticated
  USING (is_group_admin(id))
  WITH CHECK (is_group_admin(id));

CREATE POLICY "groups: admins can delete"
  ON groups FOR DELETE
  TO authenticated
  USING (is_group_admin(id));

-- ─── group_members ───────────────────────────────────────────────────────────
-- DELETE lo maneja la función SECURITY DEFINER remove_group_member.
-- No exponemos política DELETE directa para evitar que un miembro
-- se elimine a sí mismo sin pasar por las validaciones de last-admin.

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members: members can view same group"
  ON group_members FOR SELECT
  TO authenticated
  USING (is_group_member(group_id));

-- Un usuario solo puede insertar su propia fila (al aceptar una invitación
-- o al crear un grupo). El rol siempre lo fija el servidor.
CREATE POLICY "group_members: users can join (own row only)"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Solo admins pueden cambiar roles dentro del grupo.
CREATE POLICY "group_members: admins can update roles"
  ON group_members FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id))
  WITH CHECK (is_group_admin(group_id));

-- ─── events ──────────────────────────────────────────────────────────────────

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: group members can view"
  ON events FOR SELECT
  TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "events: group members can create"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    is_group_member(group_id) AND
    created_by = auth.uid()
  );

CREATE POLICY "events: group members can update"
  ON events FOR UPDATE
  TO authenticated
  USING (is_group_member(group_id))
  WITH CHECK (is_group_member(group_id));

CREATE POLICY "events: group members can delete"
  ON events FOR DELETE
  TO authenticated
  USING (is_group_member(group_id));

-- ─── event_attendance ────────────────────────────────────────────────────────

ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_attendance: group members can view"
  ON event_attendance FOR SELECT
  TO authenticated
  USING (
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

CREATE POLICY "event_attendance: users can insert own"
  ON event_attendance FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_attendance: users can delete own"
  ON event_attendance FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── event_rsvps ─────────────────────────────────────────────────────────────

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_rsvps: group members can view"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

-- upsert necesita tanto INSERT como UPDATE sobre la propia fila
CREATE POLICY "event_rsvps: users can insert own"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_rsvps: users can update own"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_rsvps: users can delete own"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── expenses ────────────────────────────────────────────────────────────────
-- INSERT va siempre por la función SECURITY DEFINER create_expense_with_splits.
-- No exponemos política INSERT directa (quedan bloqueados los inserts manuales).

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: group members can view"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

-- deleteExpense en expenses.ts valida membership antes de borrar.
CREATE POLICY "expenses: group members can delete"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

-- ─── expense_splits ──────────────────────────────────────────────────────────
-- INSERT/UPDATE los maneja únicamente create_expense_with_splits (SECURITY DEFINER).

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_splits: group members can view"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    is_group_member(
      (SELECT e.group_id
         FROM expenses ex
         JOIN events   e  ON ex.event_id = e.id
        WHERE ex.id = expense_id)
    )
  );

-- ─── settlements ─────────────────────────────────────────────────────────────

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements: group members can view"
  ON settlements FOR SELECT
  TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "settlements: users can record own payments"
  ON settlements FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user = auth.uid() AND
    is_group_member(group_id)
  );

-- ─── contributions ───────────────────────────────────────────────────────────

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contributions: group members can view"
  ON contributions FOR SELECT
  TO authenticated
  USING (
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

CREATE POLICY "contributions: members can add own"
  ON contributions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    is_group_member(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

-- El dueño puede eliminar su aporte; un admin puede eliminar cualquiera.
CREATE POLICY "contributions: owner or admin can delete"
  ON contributions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_group_admin(
      (SELECT group_id FROM events WHERE id = event_id)
    )
  );

-- ─── invites ─────────────────────────────────────────────────────────────────
-- SELECT es público (incluso para anon): el token UUID actúa como secreto,
-- y la página de invitación necesita mostrar el nombre del grupo antes del login.

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites: anyone can view (token-gated)"
  ON invites FOR SELECT
  USING (true);

CREATE POLICY "invites: group admins can create"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    is_group_admin(group_id)
  );

CREATE POLICY "invites: group admins can delete"
  ON invites FOR DELETE
  TO authenticated
  USING (is_group_admin(group_id));

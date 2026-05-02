-- Migración 09: Agregar expiración a invite links (7 días desde creación)

ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS expires_at timestamptz
    NOT NULL DEFAULT (NOW() + interval '7 days');

-- Backfill: los invites existentes expiran en 7 días desde ahora
UPDATE invites SET expires_at = NOW() + interval '7 days' WHERE expires_at IS NULL;

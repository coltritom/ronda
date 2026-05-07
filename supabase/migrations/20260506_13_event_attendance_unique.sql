-- Add unique constraint on event_attendance(event_id, user_id) if it doesn't exist.
-- Deduplicates existing rows first to avoid constraint violations.

DELETE FROM event_attendance ea
WHERE ea.ctid NOT IN (
  SELECT MIN(ctid)
  FROM event_attendance
  GROUP BY event_id, user_id
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_attendance_event_id_user_id_key'
  ) THEN
    ALTER TABLE event_attendance
      ADD CONSTRAINT event_attendance_event_id_user_id_key
      UNIQUE (event_id, user_id);
  END IF;
END $$;

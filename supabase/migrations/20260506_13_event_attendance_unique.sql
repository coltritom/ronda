-- Add unique constraint on event_attendance(event_id, user_id)
-- Required for safe upserts and to prevent duplicate attendance records.
-- Deduplicate any existing rows before applying the constraint.

DELETE FROM event_attendance ea
WHERE ea.ctid NOT IN (
  SELECT MIN(ctid)
  FROM event_attendance
  GROUP BY event_id, user_id
);

ALTER TABLE event_attendance
  ADD CONSTRAINT event_attendance_event_id_user_id_key
  UNIQUE (event_id, user_id);

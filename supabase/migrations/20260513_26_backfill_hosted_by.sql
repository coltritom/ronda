-- Backfill hosted_by from location string "🏠 En lo de {name}".
-- Matches group members by profile name for events that already have the
-- location set but no hosted_by (created before migration 25).

UPDATE events e
SET hosted_by = p.id
FROM profiles p, group_members gm
WHERE gm.user_id = p.id
  AND gm.group_id = e.group_id
  AND e.location = ('🏠 En lo de ' || p.name)
  AND e.hosted_by IS NULL;

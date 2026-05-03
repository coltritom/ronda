-- RPC: get_group_page_data
-- Replaces 7-9 sequential queries in groups/[id]/page.tsx with a single call.
-- Returns all data needed to render the group page: group info, members,
-- events (with aggregated RSVP/attendance/expense counts), pending splits,
-- and per-member attendance for the ranking widget.

CREATE OR REPLACE FUNCTION get_group_page_data(p_group_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group         jsonb;
  v_members       jsonb;
  v_events        jsonb;
  v_pending_cnt   int;
  v_pending_amt   numeric;
  v_att_by_member jsonb;
BEGIN
  -- Verify membership (also gates access to all data below)
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'not_member');
  END IF;

  -- Group info
  SELECT jsonb_build_object('id', id, 'name', name, 'emoji', COALESCE(emoji, '🔥'))
  INTO v_group
  FROM groups
  WHERE id = p_group_id;

  IF v_group IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- Members with display names, ordered by join date (preserves colorIndex)
  SELECT jsonb_agg(
    jsonb_build_object('user_id', gm.user_id, 'name', COALESCE(p.name, 'Usuario'))
  )
  INTO v_members
  FROM group_members gm
  LEFT JOIN profiles p ON p.id = gm.user_id
  WHERE gm.group_id = p_group_id;

  -- Events with pre-aggregated RSVP counts, attendance, and total spend
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',               e.id,
      'name',             e.name,
      'date',             e.date,
      'location',         e.location,
      'status',           e.status,
      'going',            COALESCE(r.going,     0),
      'maybe',            COALESCE(r.maybe,     0),
      'not_going',        COALESCE(r.not_going, 0),
      'attendance_count', COALESCE(a.cnt,       0),
      'total_spent',      COALESCE(x.total,     0)
    )
    ORDER BY e.date
  )
  INTO v_events
  FROM events e
  LEFT JOIN (
    SELECT event_id,
      COUNT(*) FILTER (WHERE response = 'going')     AS going,
      COUNT(*) FILTER (WHERE response = 'maybe')     AS maybe,
      COUNT(*) FILTER (WHERE response = 'not_going') AS not_going
    FROM event_rsvps
    GROUP BY event_id
  ) r ON r.event_id = e.id
  LEFT JOIN (
    SELECT event_id, COUNT(*)::int AS cnt
    FROM event_attendance
    GROUP BY event_id
  ) a ON a.event_id = e.id
  LEFT JOIN (
    SELECT event_id, SUM(amount) AS total
    FROM expenses
    GROUP BY event_id
  ) x ON x.event_id = e.id
  WHERE e.group_id = p_group_id
    AND e.status <> 'cancelled';

  -- Pending (unsettled) splits owed by this user within this group
  SELECT
    COUNT(*)::int               AS cnt,
    COALESCE(SUM(es.amount), 0) AS amt
  INTO v_pending_cnt, v_pending_amt
  FROM expense_splits es
  JOIN expenses ex ON ex.id = es.expense_id
  JOIN events   ev ON ev.id = ex.event_id
  WHERE ev.group_id   = p_group_id
    AND es.user_id    = p_user_id
    AND es.is_settled = false;

  -- Per-member attendance count for the ranking widget
  SELECT COALESCE(
    jsonb_object_agg(sub.user_id::text, sub.cnt),
    '{}'::jsonb
  )
  INTO v_att_by_member
  FROM (
    SELECT ea.user_id, COUNT(*)::int AS cnt
    FROM event_attendance ea
    JOIN events ev ON ev.id = ea.event_id
    WHERE ev.group_id = p_group_id
    GROUP BY ea.user_id
  ) sub;

  RETURN jsonb_build_object(
    'group',                v_group,
    'members',              COALESCE(v_members,       '[]'::jsonb),
    'events',               COALESCE(v_events,        '[]'::jsonb),
    'pending_count',        v_pending_cnt,
    'pending_amount',       v_pending_amt,
    'attendance_by_member', v_att_by_member
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_page_data(uuid, uuid) TO authenticated;

-- attendance_count in get_group_page_data now includes event_guests for past events.
-- Guests are always attending by definition; only count them once the event has passed.

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
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'not_member');
  END IF;

  SELECT jsonb_build_object('id', id, 'name', name, 'emoji', COALESCE(emoji, '🔥'))
  INTO v_group
  FROM groups
  WHERE id = p_group_id;

  IF v_group IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object('user_id', gm.user_id, 'name', COALESCE(p.name, 'Usuario'))
  )
  INTO v_members
  FROM group_members gm
  LEFT JOIN profiles p ON p.id = gm.user_id
  WHERE gm.group_id = p_group_id;

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
      'attendance_count', COALESCE(a.cnt, 0) + CASE WHEN e.date < NOW() THEN COALESCE(g.cnt, 0) ELSE 0 END,
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
    WHERE attended = true
    GROUP BY event_id
  ) a ON a.event_id = e.id
  LEFT JOIN (
    SELECT event_id, COUNT(*)::int AS cnt
    FROM event_guests
    GROUP BY event_id
  ) g ON g.event_id = e.id
  LEFT JOIN (
    SELECT event_id, SUM(amount) AS total
    FROM expenses
    GROUP BY event_id
  ) x ON x.event_id = e.id
  WHERE e.group_id = p_group_id
    AND e.status <> 'cancelled';

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

  -- Per-member count for the ranking widget.
  -- Uses explicit attendance (attended=true) when recorded;
  -- falls back to RSVP "going" for past events with no attendance records.
  SELECT COALESCE(
    jsonb_object_agg(sub.user_id::text, sub.cnt),
    '{}'::jsonb
  )
  INTO v_att_by_member
  FROM (
    SELECT uid AS user_id, COUNT(*)::int AS cnt
    FROM (
      -- Explicitly recorded attendance
      SELECT ea.user_id AS uid
      FROM event_attendance ea
      JOIN events ev ON ev.id = ea.event_id
      WHERE ev.group_id = p_group_id AND ea.attended = true

      UNION ALL

      -- RSVP "going" fallback: only for past events with zero attendance records
      SELECT er.user_id AS uid
      FROM event_rsvps er
      JOIN events ev ON ev.id = er.event_id
      WHERE ev.group_id = p_group_id
        AND er.response = 'going'
        AND ev.date < NOW()
        AND NOT EXISTS (
          SELECT 1 FROM event_attendance ea2
          WHERE ea2.event_id = er.event_id AND ea2.attended = true
        )
    ) combined
    GROUP BY uid
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

-- Fix get_group_page_data: pending_count and pending_amount now use the same
-- net-balance logic as calcBalances in the client:
--   net = credits_as_payer - debits_as_participant + settlements_paid - settlements_received
-- If net < 0 the user owes money in that event (debt = -net).
-- pending_count = number of events with outstanding debt
-- pending_amount = total debt across those events

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
  -- Verify membership
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

  -- Members with display names, ordered by join date
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
      'guest_count',      COALESCE(gc.cnt,      0),
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
  ) gc ON gc.event_id = e.id
  LEFT JOIN (
    SELECT event_id, SUM(amount) AS total
    FROM expenses
    GROUP BY event_id
  ) x ON x.event_id = e.id
  WHERE e.group_id = p_group_id
    AND e.status <> 'cancelled';

  -- Pending balance: net debt per event using calcBalances logic
  -- debt = debits_as_participant - credits_as_payer - settlements_paid + settlements_received
  -- positive debt means user owes money in that event
  WITH event_net AS (
    SELECT
      ev.id,
      COALESCE(SUM(
        CASE WHEN es.user_id = p_user_id AND ex.paid_by IS DISTINCT FROM p_user_id
          THEN es.amount ELSE 0 END
      ), 0)
      - COALESCE(SUM(
        CASE WHEN ex.paid_by = p_user_id AND es.user_id != p_user_id
          THEN es.amount ELSE 0 END
      ), 0)
      - COALESCE((
        SELECT SUM(amount) FROM settlements
        WHERE event_id = ev.id AND from_user = p_user_id
      ), 0)
      + COALESCE((
        SELECT SUM(amount) FROM settlements
        WHERE event_id = ev.id AND to_user = p_user_id
      ), 0)
      AS debt
    FROM events ev
    LEFT JOIN expenses ex ON ex.event_id = ev.id
    LEFT JOIN expense_splits es ON es.expense_id = ex.id
    WHERE ev.group_id = p_group_id
      AND ev.status != 'cancelled'
    GROUP BY ev.id
  )
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE debt > 0.005), 0)::int,
    COALESCE(SUM(debt) FILTER (WHERE debt > 0.005), 0)
  INTO v_pending_cnt, v_pending_amt
  FROM event_net;

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

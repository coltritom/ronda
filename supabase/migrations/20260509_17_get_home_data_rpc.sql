-- RPC: get_home_data
-- Replaces 3 sequential query rounds (23 total queries) with a single DB call.
-- Returns all data needed to render the home page.

CREATE OR REPLACE FUNCTION get_home_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_ids uuid[];
  v_result    jsonb;
BEGIN
  -- Resolve group IDs once (reused throughout)
  SELECT array_agg(group_id) INTO v_group_ids
  FROM group_members WHERE user_id = p_user_id;

  -- Early return: user has no groups
  IF v_group_ids IS NULL THEN
    RETURN jsonb_build_object(
      'profile_name',    (SELECT name FROM profiles WHERE id = p_user_id),
      'groups',          '[]'::jsonb,
      'summary',         jsonb_build_object('debes', 0, 'te_debon', 0, 'attended', 0, 'total_events', 0),
      'pending_debts',   '[]'::jsonb,
      'upcoming_events', '[]'::jsonb,
      'recent_activity', '[]'::jsonb,
      'badge_groups',    '[]'::jsonb
    );
  END IF;

  WITH

  -- ── Profile ───────────────────────────────────────────────────────────────
  prof AS (
    SELECT name FROM profiles WHERE id = p_user_id
  ),

  -- ── Groups list ───────────────────────────────────────────────────────────
  grps AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('id', g.id, 'name', g.name, 'emoji', COALESCE(g.emoji, LEFT(g.name, 1)))
      ORDER BY gm.joined_at
    ), '[]'::jsonb) AS data
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE gm.user_id = p_user_id
  ),

  -- ── Financial summary ─────────────────────────────────────────────────────
  fin AS (
    SELECT
      GREATEST(0,
        COALESCE((
          SELECT SUM(es.amount)
          FROM expense_splits es JOIN expenses ex ON ex.id = es.expense_id
          WHERE es.user_id = p_user_id AND ex.paid_by != p_user_id
        ), 0)
        - COALESCE((SELECT SUM(amount) FROM settlements WHERE from_user = p_user_id), 0)
      ) AS debes,
      GREATEST(0,
        COALESCE((
          SELECT SUM(es.amount)
          FROM expense_splits es JOIN expenses ex ON ex.id = es.expense_id
          WHERE ex.paid_by = p_user_id AND es.user_id != p_user_id
        ), 0)
        - COALESCE((SELECT SUM(amount) FROM settlements WHERE to_user = p_user_id), 0)
      ) AS te_debon
  ),

  -- ── Attendance in last 10 past events ────────────────────────────────────
  last_ten AS (
    SELECT id FROM events
    WHERE group_id = ANY(v_group_ids)
      AND status != 'cancelled'
      AND date <= NOW()
    ORDER BY date DESC LIMIT 10
  ),
  att AS (
    SELECT
      COUNT(*) FILTER (WHERE ea.user_id IS NOT NULL)::int AS attended,
      COUNT(*)::int AS total
    FROM last_ten lt
    LEFT JOIN event_attendance ea ON ea.event_id = lt.id AND ea.user_id = p_user_id
  ),

  -- ── Pending debts (grouped by event + payer) ──────────────────────────────
  pending AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'event_id',    ev.id,
        'group_id',    g.id,
        'group_name',  g.name,
        'group_emoji', COALESCE(g.emoji, LEFT(g.name, 1)),
        'payer_name',  COALESCE(p.name, 'Alguien'),
        'amount',      d.amt
      )
    ), '[]'::jsonb) AS data
    FROM (
      SELECT ex.event_id, ex.paid_by, SUM(es.amount) AS amt
      FROM expense_splits es
      JOIN expenses ex ON ex.id = es.expense_id
      WHERE es.user_id    = p_user_id
        AND es.is_settled = false
        AND ex.paid_by   != p_user_id
      GROUP BY ex.event_id, ex.paid_by
      HAVING SUM(es.amount) > 0.005
    ) d
    JOIN events   ev ON ev.id = d.event_id
    JOIN groups   g  ON g.id  = ev.group_id
    JOIN profiles p  ON p.id  = d.paid_by
  ),

  -- ── Upcoming events (next 5) ──────────────────────────────────────────────
  upcoming AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id',           e.id,
        'name',         e.name,
        'date',         e.date,
        'group_id',     e.group_id,
        'group_name',   g.name,
        'group_emoji',  COALESCE(g.emoji, LEFT(g.name, 1)),
        'going',        COALESCE(r.going,     0),
        'maybe',        COALESCE(r.maybe,     0),
        'not_going',    COALESCE(r.not_going, 0),
        'member_count', COALESCE(mc.cnt,      0),
        'my_rsvp',      COALESCE(my_r.response, 'none')
      ) ORDER BY e.date ASC
    ), '[]'::jsonb) AS data
    FROM (
      SELECT * FROM events
      WHERE group_id = ANY(v_group_ids)
        AND status  != 'cancelled'
        AND date    >= NOW()
      ORDER BY date ASC LIMIT 5
    ) e
    JOIN groups g ON g.id = e.group_id
    LEFT JOIN (
      SELECT event_id,
        COUNT(*) FILTER (WHERE response = 'going')     AS going,
        COUNT(*) FILTER (WHERE response = 'maybe')     AS maybe,
        COUNT(*) FILTER (WHERE response = 'not_going') AS not_going
      FROM event_rsvps GROUP BY event_id
    ) r ON r.event_id = e.id
    LEFT JOIN (
      SELECT group_id, COUNT(*)::int AS cnt
      FROM group_members GROUP BY group_id
    ) mc ON mc.group_id = e.group_id
    LEFT JOIN event_rsvps my_r ON my_r.event_id = e.id AND my_r.user_id = p_user_id
  ),

  -- ── Recent activity ───────────────────────────────────────────────────────
  act_events AS (
    SELECT
      'event-' || e.id          AS id,
      'event_created'           AS type,
      COALESCE(p.name,'Alguien') AS actor_name,
      g.name                    AS group_name,
      e.name                    AS event_name,
      e.date                    AS event_date,
      e.created_at              AS created_at
    FROM events e
    JOIN groups   g ON g.id = e.group_id
    JOIN profiles p ON p.id = e.created_by
    WHERE e.group_id   = ANY(v_group_ids)
      AND e.status    != 'cancelled'
      AND e.created_by IS NOT NULL
    ORDER BY e.created_at DESC LIMIT 10
  ),
  act_joins AS (
    SELECT
      'join-' || gm.user_id || '-' || gm.group_id AS id,
      'member_joined'            AS type,
      COALESCE(p.name,'Alguien') AS actor_name,
      g.name                     AS group_name,
      NULL::text                 AS event_name,
      NULL::timestamptz          AS event_date,
      gm.joined_at               AS created_at
    FROM group_members gm
    JOIN groups   g ON g.id = gm.group_id
    JOIN profiles p ON p.id = gm.user_id
    WHERE gm.group_id  = ANY(v_group_ids)
      AND gm.joined_at IS NOT NULL
    ORDER BY gm.joined_at DESC LIMIT 10
  ),
  activity AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id',         a.id,
        'type',       a.type,
        'actor_name', a.actor_name,
        'group_name', a.group_name,
        'event_name', a.event_name,
        'event_date', a.event_date,
        'created_at', a.created_at
      ) ORDER BY a.created_at DESC
    ), '[]'::jsonb) AS data
    FROM (
      SELECT * FROM act_events
      UNION ALL
      SELECT * FROM act_joins
      ORDER BY created_at DESC LIMIT 8
    ) a
  ),

  -- ── Badge stats: per-member per-group ─────────────────────────────────────
  b_att AS (
    SELECT ev.group_id, ea.user_id, COUNT(*)::int AS cnt
    FROM event_attendance ea
    JOIN events ev ON ev.id = ea.event_id AND ev.status != 'cancelled'
    WHERE ev.group_id = ANY(v_group_ids)
    GROUP BY ev.group_id, ea.user_id
  ),
  b_maybe AS (
    SELECT ev.group_id, er.user_id, COUNT(*)::int AS cnt
    FROM event_rsvps er
    JOIN events ev ON ev.id = er.event_id
    WHERE ev.group_id = ANY(v_group_ids) AND er.response = 'maybe'
    GROUP BY ev.group_id, er.user_id
  ),
  b_ec AS (
    SELECT group_id, created_by AS user_id, COUNT(*)::int AS cnt
    FROM events
    WHERE group_id = ANY(v_group_ids) AND status != 'cancelled'
    GROUP BY group_id, created_by
  ),
  b_contrib AS (
    SELECT ev.group_id, c.user_id, COUNT(*)::int AS cnt
    FROM contributions c
    JOIN events ev ON ev.id = c.event_id
    WHERE ev.group_id = ANY(v_group_ids)
    GROUP BY ev.group_id, c.user_id
  ),
  b_exp AS (
    SELECT ev.group_id, ex.paid_by AS user_id, SUM(ex.amount) AS total
    FROM expenses ex
    JOIN events ev ON ev.id = ex.event_id
    WHERE ev.group_id = ANY(v_group_ids)
    GROUP BY ev.group_id, ex.paid_by
  ),

  -- Group-level maxes (across all members, for badge thresholds)
  g_maxes AS (
    SELECT
      gm.group_id,
      GREATEST(1, MAX(COALESCE(ba.cnt,     0))) AS max_att,
      MAX(COALESCE(bc.cnt,   0))                AS max_contrib,
      MAX(COALESCE(be.total, 0))                AS max_exp,
      MAX(COALESCE(bec.cnt,  0))                AS max_ec
    FROM group_members gm
    LEFT JOIN b_att    ba  ON ba.group_id  = gm.group_id AND ba.user_id  = gm.user_id
    LEFT JOIN b_contrib bc ON bc.group_id  = gm.group_id AND bc.user_id  = gm.user_id
    LEFT JOIN b_exp    be  ON be.group_id  = gm.group_id AND be.user_id  = gm.user_id
    LEFT JOIN b_ec     bec ON bec.group_id = gm.group_id AND bec.user_id = gm.user_id
    WHERE gm.group_id = ANY(v_group_ids)
    GROUP BY gm.group_id
  ),

  -- Score per member per group (needed for MVP badge)
  scores AS (
    SELECT
      gm.group_id,
      gm.user_id,
      (COALESCE(ba.cnt,     0)::float / mx.max_att) * 0.4
      + (CASE WHEN mx.max_contrib > 0 THEN (COALESCE(bc.cnt,   0)::float / mx.max_contrib) * 0.3 ELSE 0 END)
      + (CASE WHEN mx.max_exp     > 0 THEN (COALESCE(be.total, 0)::float / mx.max_exp)     * 0.3 ELSE 0 END)
      AS score
    FROM group_members gm
    JOIN g_maxes mx ON mx.group_id = gm.group_id
    LEFT JOIN b_att    ba ON ba.group_id = gm.group_id AND ba.user_id = gm.user_id
    LEFT JOIN b_contrib bc ON bc.group_id = gm.group_id AND bc.user_id = gm.user_id
    LEFT JOIN b_exp    be ON be.group_id = gm.group_id AND be.user_id = gm.user_id
    WHERE gm.group_id = ANY(v_group_ids)
  ),

  -- Badge groups: one row per group with events
  badges AS (
    SELECT COALESCE(jsonb_agg(bg), '[]'::jsonb) AS data
    FROM (
      SELECT jsonb_build_object(
        'group_id',           g.id,
        'group_name',         g.name,
        'total_events',       ev_cnt.n,
        'member_count',       mem_cnt.n,
        'my_attendance',      COALESCE(ba_me.cnt,    0),
        'my_maybe',           COALESCE(bm_me.cnt,    0),
        'my_events_created',  COALESCE(bec_me.cnt,   0),
        'my_contributions',   COALESCE(bc_me.cnt,    0),
        'my_expenses_paid',   COALESCE(be_me.total,  0),
        'max_events_created', mx.max_ec,
        'max_contributions',  mx.max_contrib,
        'max_expenses_paid',  mx.max_exp,
        'my_score',           COALESCE(my_s.score,   0),
        'top_score',          COALESCE(top_s.score,  0)
      ) AS bg
      FROM groups g
      JOIN (
        SELECT group_id, COUNT(DISTINCT id)::int AS n
        FROM events WHERE group_id = ANY(v_group_ids) AND status != 'cancelled'
        GROUP BY group_id
      ) ev_cnt  ON ev_cnt.group_id  = g.id
      JOIN (
        SELECT group_id, COUNT(*)::int AS n
        FROM group_members WHERE group_id = ANY(v_group_ids)
        GROUP BY group_id
      ) mem_cnt ON mem_cnt.group_id = g.id
      JOIN g_maxes mx ON mx.group_id = g.id
      LEFT JOIN b_att    ba_me  ON ba_me.group_id  = g.id AND ba_me.user_id  = p_user_id
      LEFT JOIN b_maybe  bm_me  ON bm_me.group_id  = g.id AND bm_me.user_id  = p_user_id
      LEFT JOIN b_ec     bec_me ON bec_me.group_id = g.id AND bec_me.user_id = p_user_id
      LEFT JOIN b_contrib bc_me ON bc_me.group_id  = g.id AND bc_me.user_id  = p_user_id
      LEFT JOIN b_exp    be_me  ON be_me.group_id  = g.id AND be_me.user_id  = p_user_id
      LEFT JOIN scores   my_s   ON my_s.group_id   = g.id AND my_s.user_id   = p_user_id
      LEFT JOIN (
        SELECT group_id, MAX(score) AS score FROM scores GROUP BY group_id
      ) top_s ON top_s.group_id = g.id
      WHERE g.id = ANY(v_group_ids)
    ) badge_rows
  )

  SELECT jsonb_build_object(
    'profile_name',    (SELECT name    FROM prof),
    'groups',          (SELECT data    FROM grps),
    'summary',         jsonb_build_object(
                         'debes',        (SELECT debes    FROM fin),
                         'te_debon',     (SELECT te_debon FROM fin),
                         'attended',     (SELECT attended FROM att),
                         'total_events', (SELECT total    FROM att)
                       ),
    'pending_debts',   (SELECT data FROM pending),
    'upcoming_events', (SELECT data FROM upcoming),
    'recent_activity', (SELECT data FROM activity),
    'badge_groups',    (SELECT data FROM badges)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_home_data(uuid) TO authenticated;

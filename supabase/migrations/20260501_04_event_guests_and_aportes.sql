-- Event guests (invitados sin cuenta en Ronda)
CREATE TABLE IF NOT EXISTS event_guests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group members can manage event guests" ON event_guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN events e ON e.id = event_guests.event_id
      WHERE gm.group_id = e.group_id AND gm.user_id = auth.uid()
    )
  );

-- Event aportes (quién trajo qué a la juntada)
CREATE TABLE IF NOT EXISTS event_aportes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  member_id text NOT NULL,
  member_name text NOT NULL,
  category_id text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_aportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group members can manage event aportes" ON event_aportes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN events e ON e.id = event_aportes.event_id
      WHERE gm.group_id = e.group_id AND gm.user_id = auth.uid()
    )
  );

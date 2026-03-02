-- 009: Production Notes + Calendar

CREATE TABLE IF NOT EXISTS production_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  section_index INT NOT NULL DEFAULT 0,
  shot_type TEXT CHECK (shot_type IN ('wide','medium','close','broll','overhead','pov')),
  equipment TEXT[] DEFAULT '{}',
  location TEXT DEFAULT '',
  talent TEXT[] DEFAULT '{}',
  broll_description TEXT DEFAULT '',
  estimated_duration_seconds INT DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES coscript_projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'deadline' CHECK (event_type IN ('deadline','shoot','review','delivery')),
  date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_script ON production_notes(script_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(date);

CREATE OR REPLACE TRIGGER trg_production_updated
  BEFORE UPDATE ON production_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_calendar_updated
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE production_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_owner" ON production_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = production_notes.script_id AND scripts.user_id = auth.uid())
  );

CREATE POLICY "calendar_owner" ON calendar_events
  FOR ALL USING (user_id = auth.uid());

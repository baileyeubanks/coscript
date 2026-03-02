-- CoScript V2 — Migration 004: Projects & Briefs

CREATE TABLE IF NOT EXISTS coscript_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coscript_projects_user ON coscript_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_coscript_projects_client ON coscript_projects(client_id) WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES coscript_projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objective TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  key_messages TEXT[] DEFAULT '{}',
  tone TEXT DEFAULT '',
  references TEXT[] DEFAULT '{}',
  deliverables JSONB DEFAULT '[]',
  deadline TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefs_user ON briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_briefs_project ON briefs(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_briefs_client ON briefs(client_id) WHERE client_id IS NOT NULL;

-- Updated-at triggers
DROP TRIGGER IF EXISTS trg_coscript_projects_updated ON coscript_projects;
CREATE TRIGGER trg_coscript_projects_updated BEFORE UPDATE ON coscript_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_briefs_updated ON briefs;
CREATE TRIGGER trg_briefs_updated BEFORE UPDATE ON briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE coscript_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY coscript_projects_owner ON coscript_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY briefs_owner ON briefs FOR ALL USING (auth.uid() = user_id);

-- FKs on scripts
ALTER TABLE scripts ADD CONSTRAINT fk_scripts_project FOREIGN KEY (project_id) REFERENCES coscript_projects(id) ON DELETE SET NULL;
ALTER TABLE scripts ADD CONSTRAINT fk_scripts_brief FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE SET NULL;

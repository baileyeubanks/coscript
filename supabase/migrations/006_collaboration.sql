-- 006: Collaboration — comments + suggestions

CREATE TABLE IF NOT EXISTS script_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  author_email TEXT,
  body TEXT NOT NULL,
  line_number INT,
  char_start INT,
  char_end INT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  parent_id UUID REFERENCES script_comments(id) ON DELETE CASCADE,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  is_external BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS script_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  line_number INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_script ON script_comments(script_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON script_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_script ON script_suggestions(script_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER trg_comments_updated
  BEFORE UPDATE ON script_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE script_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_owner" ON script_comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_comments.script_id AND scripts.user_id = auth.uid())
    OR user_id = auth.uid()
    OR is_external = true
  );

CREATE POLICY "suggestions_owner" ON script_suggestions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = script_suggestions.script_id AND scripts.user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- 007: Client Review Portal

CREATE TABLE IF NOT EXISTS review_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL DEFAULT '',
  reviewer_email TEXT NOT NULL DEFAULT '',
  permissions TEXT NOT NULL DEFAULT 'view' CHECK (permissions IN ('view','comment','approve')),
  password_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  max_views INT,
  view_count INT DEFAULT 0,
  branding JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_link_id UUID NOT NULL REFERENCES review_links(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved','changes_requested')),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_links_token ON review_links(token);
CREATE INDEX IF NOT EXISTS idx_review_links_script ON review_links(script_id);
CREATE INDEX IF NOT EXISTS idx_review_decisions_link ON review_decisions(review_link_id);

-- RLS: public read by token, owner create/manage
ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_links_owner" ON review_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM scripts WHERE scripts.id = review_links.script_id AND scripts.user_id = auth.uid())
  );

CREATE POLICY "review_decisions_owner" ON review_decisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM review_links rl
      JOIN scripts s ON s.id = rl.script_id
      WHERE rl.id = review_decisions.review_link_id AND s.user_id = auth.uid()
    )
  );

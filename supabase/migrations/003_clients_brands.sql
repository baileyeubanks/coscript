-- CoScript V2 — Migration 003: Clients & Brand Vaults

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  website TEXT DEFAULT '',
  colors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);

CREATE TABLE IF NOT EXISTS brand_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  voice_description TEXT DEFAULT '',
  vocabulary TEXT[] DEFAULT '{}',
  hook_style TEXT DEFAULT '',
  cta_patterns TEXT[] DEFAULT '{}',
  content_guidelines TEXT DEFAULT '',
  tone_preferences JSONB DEFAULT '{}',
  sample_scripts TEXT[] DEFAULT '{}',
  platform_notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_vaults_client ON brand_vaults(client_id);

-- Updated-at triggers
DROP TRIGGER IF EXISTS trg_clients_updated ON clients;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_brand_vaults_updated ON brand_vaults;
CREATE TRIGGER trg_brand_vaults_updated BEFORE UPDATE ON brand_vaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_owner ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY brand_vaults_owner ON brand_vaults FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = brand_vaults.client_id AND clients.user_id = auth.uid()));

-- Add FK from scripts.client_id -> clients.id
ALTER TABLE scripts ADD CONSTRAINT fk_scripts_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

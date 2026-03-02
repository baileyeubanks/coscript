-- CoScript V2 — Migration 002: Foundation
-- Add nullable foreign key columns to scripts for agency features

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS brief_id UUID;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS template_id UUID;

-- Update status check constraint to include new statuses
ALTER TABLE scripts DROP CONSTRAINT IF EXISTS scripts_status_check;
ALTER TABLE scripts ADD CONSTRAINT scripts_status_check
  CHECK (status IN ('draft', 'review', 'published', 'internal_review', 'client_review', 'approved', 'produced', 'delivered'));

-- Index for agency queries
CREATE INDEX IF NOT EXISTS idx_scripts_client ON scripts(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scripts_project ON scripts(project_id) WHERE project_id IS NOT NULL;

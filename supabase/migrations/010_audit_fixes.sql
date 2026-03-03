-- 010_audit_fixes.sql
-- Fixes from V2 audit: unique constraints + brand vault upsert support

-- Prevent duplicate version numbers per script
CREATE UNIQUE INDEX IF NOT EXISTS idx_script_versions_unique
  ON script_versions (script_id, version_number);

-- Ensure brand_vaults has unique constraint on client_id for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_vaults_client_unique
  ON brand_vaults (client_id);

-- Prevent duplicate review decisions per review link
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_decisions_unique
  ON review_decisions (review_link_id);

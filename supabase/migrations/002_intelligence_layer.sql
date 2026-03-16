-- Co-Script Intelligence Layer — Sandcastles-class data model expansion
-- Adds: channels, videos, transcripts, hook_templates, style_templates, ingestion_jobs
-- Run in Supabase SQL Editor after 001_coscript_schema.sql

-- ============================================================================
-- 1. CHANNELS — Normalized channel records from watchlists
-- ============================================================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  handle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  subscriber_count BIGINT DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  avg_views_30d BIGINT DEFAULT 0,
  thumbnail_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'youtube',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, youtube_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_user ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_youtube_id ON channels(youtube_id);

-- ============================================================================
-- 2. VIDEOS — Individual video records with metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  thumbnail_url TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  outlier_score NUMERIC(8,2) DEFAULT 0,
  outlier_label TEXT DEFAULT NULL, -- 'outlier' | 'viral' | 'mega-outlier'
  has_transcript BOOLEAN DEFAULT false,
  has_patterns BOOLEAN DEFAULT false,
  platform TEXT NOT NULL DEFAULT 'youtube',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, youtube_id)
);

CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_videos_outlier ON videos(outlier_score DESC);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(published_at DESC);

-- ============================================================================
-- 3. TRANSCRIPTS — Video transcript content + extracted intelligence
-- ============================================================================
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  language TEXT DEFAULT 'en',
  source TEXT NOT NULL DEFAULT 'youtube_captions', -- 'youtube_captions' | 'manual'
  word_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  extracted_hooks JSONB DEFAULT '[]',
  extracted_patterns JSONB DEFAULT '{}',
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_video ON transcripts(video_id);

-- ============================================================================
-- 4. HOOK TEMPLATES — Typed hook vault (extracted + manual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hook_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  hook_text TEXT NOT NULL,
  hook_type TEXT NOT NULL DEFAULT 'unknown',
  -- Maps to psychology-engine types: context_lean_in, question, statistic_shock,
  -- story_loop, controversy, before_after, speed_to_value
  psychology_principle TEXT DEFAULT '',
  scroll_stop_power INTEGER DEFAULT 5, -- 1-10
  source_url TEXT DEFAULT '',
  source_title TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hook_templates_user ON hook_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_hook_templates_type ON hook_templates(hook_type);
CREATE INDEX IF NOT EXISTS idx_hook_templates_power ON hook_templates(scroll_stop_power DESC);

-- ============================================================================
-- 5. STYLE TEMPLATES — Typed style/voice vault (extracted + manual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS style_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tone TEXT DEFAULT '',
  pacing TEXT DEFAULT '',
  structure TEXT DEFAULT '',
  word_count_min INTEGER DEFAULT 0,
  word_count_max INTEGER DEFAULT 0,
  sentence_style TEXT DEFAULT '', -- e.g. "staccato mix", "long flowing", "conversational"
  example_excerpt TEXT DEFAULT '',
  platform_fit TEXT[] DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_creator_voice BOOLEAN NOT NULL DEFAULT false, -- auto-generated from channel analysis
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_style_templates_user ON style_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_style_templates_channel ON style_templates(channel_id);

-- ============================================================================
-- 6. INGESTION JOBS — Background job queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'channel_sync' | 'video_fetch' | 'transcript_extract' | 'pattern_extract'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON ingestion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON ingestion_jobs(type);

-- ============================================================================
-- 7. ALTER EXISTING TABLES — Add foreign keys to new tables
-- ============================================================================

-- watchlists → channels link
ALTER TABLE watchlists ADD COLUMN IF NOT EXISTS channel_ref_id UUID REFERENCES channels(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_watchlists_channel_ref ON watchlists(channel_ref_id);

-- research_items → videos link
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS video_ref_id UUID REFERENCES videos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_research_video_ref ON research_items(video_ref_id);

-- ============================================================================
-- 8. UPDATED-AT TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS trg_channels_updated ON channels;
CREATE TRIGGER trg_channels_updated BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_videos_updated ON videos;
CREATE TRIGGER trg_videos_updated BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Channels: owner access
CREATE POLICY channels_owner ON channels FOR ALL USING (auth.uid() = user_id);

-- Videos: owner access
CREATE POLICY videos_owner ON videos FOR ALL USING (auth.uid() = user_id);

-- Transcripts: owner via video
CREATE POLICY transcripts_owner ON transcripts FOR ALL
  USING (EXISTS (SELECT 1 FROM videos WHERE videos.id = transcripts.video_id AND videos.user_id = auth.uid()));

-- Hook templates: system readable by all, user ones by owner
CREATE POLICY hook_templates_read ON hook_templates FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY hook_templates_write ON hook_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY hook_templates_update ON hook_templates FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY hook_templates_delete ON hook_templates FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Style templates: system readable by all, user ones by owner
CREATE POLICY style_templates_read ON style_templates FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY style_templates_write ON style_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY style_templates_update ON style_templates FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY style_templates_delete ON style_templates FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Ingestion jobs: owner access
CREATE POLICY jobs_owner ON ingestion_jobs FOR ALL USING (auth.uid() = user_id);

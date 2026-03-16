export type PersistenceMode = "cloud" | "local";

export interface SessionUser {
  id: string;
  email: string | null;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
}

export interface SignupResponse {
  success: boolean;
  authenticated: boolean;
  requiresEmailVerification: boolean;
  user: SessionUser | null;
}

export interface ScoreBreakdown {
  hook_strength: number;
  clarity: number;
  structure: number;
  emotional_pull: number;
  cta_power: number;
}

export interface AiFeedback {
  reasoning?: string;
  audience_analysis?: string;
  [key: string]: unknown;
}

export interface ScriptRecord {
  id: string;
  title: string;
  script_type: string;
  content: string;
  hook: string;
  audience: string;
  objective: string;
  tone: string;
  platform: string;
  score: number;
  score_breakdown?: Partial<ScoreBreakdown> | null;
  ai_feedback?: AiFeedback | null;
  status?: string | null;
  word_count: number;
  updated_at: string;
}

export interface ScriptVersionRecord {
  id: string;
  version_number: number;
  content: string;
  hook?: string;
  score: number;
  created_at: string;
}

export interface FrameworkRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  structure: string[];
  example: string;
  source: string;
  is_system: boolean;
}

export interface WatchlistRecord {
  id: string;
  name: string;
  platform: string;
  channel_url: string;
  status: string;
  last_synced_at: string | null;
}

export interface ResearchItemRecord {
  id: string;
  title: string;
  url: string;
  platform: string;
  view_count: number;
  avg_views: number;
  outlier_score: number;
  thumbnail_url: string;
  published_at: string | null;
}

export interface VaultItemRecord {
  id: string;
  title: string;
  content: string;
  source_url: string;
  source_type: string;
  tags: string[];
  notes: string;
  created_at: string;
}

export interface LocalDraftBackup {
  payload?: Partial<ScriptRecord> & {
    backup_at?: string;
  };
}

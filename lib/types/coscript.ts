// CoScript V2 — Unified Types

// ── Enums ──

export type ScriptType = "video_script" | "social_media" | "blog" | "ad_copy" | "email";
export type ScriptStatus = "draft" | "internal_review" | "client_review" | "approved" | "produced" | "delivered";
export type Tone = "conversational" | "professional" | "urgent" | "inspiring" | "educational" | "provocative";
export type Platform = "youtube" | "tiktok" | "instagram" | "linkedin" | "twitter" | "email";
export type BriefStatus = "draft" | "approved" | "in_progress" | "completed";
export type ProjectStatus = "active" | "completed" | "archived";
export type ReviewDecisionType = "approved" | "changes_requested";
export type ReviewPermission = "view" | "comment" | "approve";
export type CommentStatus = "open" | "resolved";
export type SuggestionStatus = "pending" | "accepted" | "rejected";
export type EventType = "deadline" | "shoot" | "review" | "delivery";
export type EventStatus = "scheduled" | "completed" | "cancelled";
export type ShotType = "wide" | "medium" | "close" | "broll" | "overhead" | "pov";
export type TemplateCategory = "reel" | "youtube" | "ad" | "testimonial" | "explainer" | "case_study" | "email" | "social";
export type Industry = "general" | "real_estate" | "saas" | "ecommerce" | "fitness" | "finance" | "education" | "agency";

// ── Core Models ──

export interface Script {
  id: string;
  user_id: string;
  title: string;
  script_type: ScriptType;
  content: string;
  hook: string;
  audience: string;
  objective: string;
  tone: Tone;
  platform: Platform;
  score: number;
  score_breakdown: ScoreBreakdown;
  ai_feedback: Record<string, string>;
  status: ScriptStatus;
  word_count: number;
  client_id: string | null;
  project_id: string | null;
  brief_id: string | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  hook_strength: number;
  clarity: number;
  structure: number;
  emotional_pull: number;
  cta_power: number;
}

export interface HookVariant {
  type: string;
  text: string;
}

export interface FrameworkMatch {
  name: string;
  fit: number;
  suggestion: string;
}

export interface ScriptVersion {
  id: string;
  script_id: string;
  version_number: number;
  content: string;
  hook: string;
  score: number;
  score_breakdown: Record<string, number>;
  created_at: string;
}

export interface Framework {
  id: string;
  name: string;
  category: string;
  description: string;
  structure: string[];
  example: string;
  source: string;
  is_system: boolean;
  user_id: string | null;
  created_at: string;
}

// ── Agency Models ──

export interface Client {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  industry: string;
  website: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
}

export interface BrandVault {
  id: string;
  client_id: string;
  voice_description: string;
  vocabulary: string[];
  hook_style: string;
  cta_patterns: string[];
  content_guidelines: string;
  tone_preferences: Record<string, boolean>;
  sample_scripts: string[];
  platform_notes: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brief {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  objective: string;
  target_audience: string;
  platform: Platform;
  key_messages: string[];
  tone: Tone;
  references: string[];
  deliverables: Record<string, boolean>;
  deadline: string | null;
  notes: string;
  status: BriefStatus;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  industry: Industry;
  platform: Platform;
  description: string;
  structure: Record<string, string>[];
  example_content: string;
  prompt_instructions: string;
  variables: TemplateVariable[];
  is_system: boolean;
  user_id: string | null;
  created_at: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "select";
  options?: string[];
}

// ── Collaboration Models ──

export interface ScriptComment {
  id: string;
  script_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  line_number: number | null;
  char_start: number | null;
  char_end: number | null;
  status: CommentStatus;
  parent_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  is_external: boolean;
  created_at: string;
  updated_at: string;
  replies?: ScriptComment[];
}

export interface ScriptSuggestion {
  id: string;
  script_id: string;
  user_id: string | null;
  author_name: string;
  original_text: string;
  suggested_text: string;
  line_number: number;
  status: SuggestionStatus;
  created_at: string;
}

// ── Review Models ──

export interface ReviewLink {
  id: string;
  script_id: string;
  token: string;
  client_id: string | null;
  reviewer_name: string;
  reviewer_email: string;
  permissions: ReviewPermission;
  password_hash: string | null;
  expires_at: string;
  max_views: number | null;
  view_count: number;
  branding: ReviewBranding;
  status: "active" | "expired" | "revoked";
  created_at: string;
}

export interface ReviewBranding {
  logo_url?: string;
  primary_color?: string;
  company_name?: string;
}

export interface ReviewDecision {
  id: string;
  review_link_id: string;
  script_id: string;
  decision: ReviewDecisionType;
  comment: string;
  created_at: string;
}

// ── Production Models ──

export interface ProductionNote {
  id: string;
  script_id: string;
  section_index: number;
  shot_type: ShotType;
  equipment: string[];
  location: string;
  talent: string[];
  broll_description: string;
  estimated_duration_seconds: number;
  notes: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  script_id: string | null;
  project_id: string | null;
  client_id: string | null;
  title: string;
  event_type: EventType;
  date: string;
  time_start: string | null;
  time_end: string | null;
  notes: string;
  status: EventStatus;
  created_at: string;
}

// ── Existing Models ──

export interface VaultItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source_url: string;
  source_type: string;
  tags: string[];
  notes: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  channel_url: string;
  channel_id: string;
  status: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface ResearchItem {
  id: string;
  user_id: string;
  watchlist_id: string | null;
  title: string;
  url: string;
  platform: string;
  view_count: number;
  avg_views: number;
  outlier_score: number;
  thumbnail_url: string;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ShareLink {
  id: string;
  script_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// ── Activity ──

export interface ActivityEntry {
  id: string;
  user_id: string;
  entity_type: "script" | "brief" | "project" | "review";
  entity_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Editor State Types ──

export type EditorTab = "score" | "reasoning" | "hooks" | "frameworks" | "audience" | "rewrite" | "analyze";

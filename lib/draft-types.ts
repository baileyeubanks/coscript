export type TemplateType = "social_media" | "blog" | "video_script" | "ad_copy";

export interface Draft {
  id: string;
  user_id: string;
  title: string;
  template_type: TemplateType;
  content: string;
  config: DraftConfig;
  created_at: string;
  updated_at: string;
}

export interface DraftConfig {
  audience?: string;
  tone?: string;
  length?: string;
  key_points?: string;
  platform?: string;
  keywords?: string;
  word_count_target?: number;
}

export const TEMPLATES: Record<TemplateType, { label: string; description: string; icon: string }> = {
  social_media: {
    label: "Social Media Post",
    description: "Platform-optimized posts for Instagram, X, LinkedIn, or TikTok",
    icon: "share",
  },
  blog: {
    label: "Blog Article",
    description: "Long-form content with SEO optimization and structured outlines",
    icon: "file-text",
  },
  video_script: {
    label: "Video Script",
    description: "Scene-by-scene scripts with timing notes and B-roll cues",
    icon: "video",
  },
  ad_copy: {
    label: "Ad Copy",
    description: "Headline, body, and CTA structures with A/B variant support",
    icon: "megaphone",
  },
};

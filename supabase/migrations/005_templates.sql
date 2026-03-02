-- CoScript V2 — Migration 005: Templates

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'video_script',
  industry TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  description TEXT DEFAULT '',
  structure JSONB DEFAULT '[]',
  example_content TEXT DEFAULT '',
  prompt_instructions TEXT DEFAULT '',
  variables JSONB DEFAULT '[]',
  is_system BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);

DROP TRIGGER IF EXISTS trg_templates_updated ON templates;
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_read ON templates FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY templates_write ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY templates_update ON templates FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY templates_delete ON templates FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Add FK from scripts.template_id -> templates.id
ALTER TABLE scripts ADD CONSTRAINT fk_scripts_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;

-- Seed system templates
INSERT INTO templates (name, category, industry, platform, description, structure, prompt_instructions, variables, is_system) VALUES
('YouTube Explainer', 'video_script', '', 'youtube', 'Educational video script with hook, problem, solution, and CTA.', '["Hook: Attention-grabbing opener", "Problem: Why this matters", "Solution: Step-by-step explanation", "Proof: Example or case study", "CTA: Subscribe or next action"]', 'Write an educational YouTube script. Strong hook in first 5 seconds. Use retention bumps every 30-60 seconds.', '[{"name": "topic", "label": "Topic", "placeholder": "e.g., How to invest in index funds"}, {"name": "expertise_level", "label": "Audience Level", "placeholder": "e.g., Beginner"}]', true),
('TikTok Hook & Teach', 'video_script', '', 'tiktok', 'Short-form script under 60 seconds with immediate hook.', '["Hook: Pattern interrupt in 1 second", "Teach: One key insight", "CTA: Follow for more"]', 'Write for TikTok. Maximum 60 seconds. Hook must be immediate. Raw, authentic tone.', '[{"name": "topic", "label": "Topic", "placeholder": "e.g., Budget meals under $5"}]', true),
('Product Ad (30s)', 'ad_copy', '', '', 'Direct response ad script for paid social.', '["Hook: Problem or desire statement", "Demo: Show the product solving it", "Social Proof: Testimonial or stat", "CTA: Limited time offer"]', 'Write a 30-second direct response ad. Lead with pain point. Include urgency.', '[{"name": "product", "label": "Product Name", "placeholder": "e.g., FitTrack Pro"}, {"name": "benefit", "label": "Key Benefit", "placeholder": "e.g., Lose 10lbs in 30 days"}]', true),
('Testimonial Story', 'video_script', '', '', 'Customer success story in narrative format.', '["Before: Customer pain point", "Discovery: How they found the solution", "Transformation: Results achieved", "Recommendation: Why they recommend it"]', 'Write a customer testimonial script. Make it feel authentic, not salesy. Include specific numbers.', '[{"name": "customer_name", "label": "Customer Name", "placeholder": "e.g., Sarah M."}, {"name": "product", "label": "Product/Service", "placeholder": "e.g., CoachPro"}]', true),
('Email Newsletter', 'email', '', 'email', 'Weekly newsletter with value-first approach.', '["Subject Line: Open-worthy hook", "Preview Text: Tease the value", "Opening: Personal or timely hook", "Main Content: One key insight or story", "CTA: Clear next step"]', 'Write an email newsletter. Subject line must be under 50 chars. One idea per email. Clear CTA.', '[{"name": "topic", "label": "Topic", "placeholder": "e.g., 3 productivity hacks"}, {"name": "list_name", "label": "Newsletter Name", "placeholder": "e.g., The Weekly Edge"}]', true),
('LinkedIn Thought Leadership', 'social_media', '', 'linkedin', 'LinkedIn post that establishes authority.', '["Hook: Contrarian take or surprising insight", "Story: Personal experience or data", "Lesson: Key takeaway", "Engagement: Question for comments"]', 'Write for LinkedIn. Professional but human. Lead with insight. Include a clear takeaway.', '[{"name": "topic", "label": "Topic", "placeholder": "e.g., Why most startups fail at hiring"}]', true),
('Case Study Script', 'video_script', '', 'youtube', 'Deep-dive case study for B2B or portfolio.', '["Context: Client background and challenge", "Approach: Strategy and process", "Execution: Key actions taken", "Results: Measurable outcomes", "Lessons: Key takeaways"]', 'Write a case study video script. Focus on specific metrics and outcomes. Professional tone.', '[{"name": "client", "label": "Client/Company", "placeholder": "e.g., TechFlow Inc."}, {"name": "industry", "label": "Industry", "placeholder": "e.g., SaaS"}]', true),
('Instagram Reel Script', 'video_script', '', 'instagram', 'Visual-first reel script under 90 seconds.', '["Hook: Text overlay + visual hook", "Content: 3 quick tips or steps", "CTA: Save, share, or follow"]', 'Write for Instagram Reels. Visual-first. Strong text overlay hooks. Under 90 seconds. Include [VISUAL] notes.', '[{"name": "topic", "label": "Topic", "placeholder": "e.g., Morning routine hacks"}]', true)
ON CONFLICT DO NOTHING;

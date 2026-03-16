/**
 * Transcript Pattern Analysis (AI-Powered)
 *
 * Uses Claude to extract hooks, styles, and patterns from video transcripts.
 * Results are stored in the transcripts table and auto-create vault templates.
 */

import { getSupabase } from "@/lib/supabase";
import { AI_MODEL, getAnthropicHeaders } from "@/lib/ai-config";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedHook {
  hook_text: string;
  hook_type: string;
  psychology_principle: string;
  scroll_stop_power: number;
  why_it_works: string;
}

export interface ExtractedPatterns {
  structure: string;
  tone: string;
  pacing: string;
  sentence_style: string;
  rehook_count: number;
  psychology_principles: string[];
  key_techniques: string[];
  word_count_estimate: number;
}

// ── System prompts ───────────────────────────────────────────────────────────

const HOOK_EXTRACTION_PROMPT = `You are an expert content analyst specializing in viral short-form video hooks. Analyze the FIRST 50 words of the transcript (the hook section) and identify the hook technique used.

Classify the hook into one of these 7 types:
1. "context_lean_in" — Context Lean-In + Contrarian Snapback (Kallaway 3-Step)
2. "question" — Question Hook (Cognitive closure)
3. "statistic_shock" — Statistic Shock (Social proof + expectation violation)
4. "story_loop" — Story Loop (Narrative engagement)
5. "controversy" — Controversy / Bold Claim (Tribal identity)
6. "before_after" — Before/After Bridge (Transformation gap)
7. "speed_to_value" — Speed to Value (Immediate reward)

Return ONLY valid JSON:
{
  "hooks": [
    {
      "hook_text": "<exact text of the hook, first 2-3 sentences>",
      "hook_type": "<one of the 7 types above>",
      "psychology_principle": "<primary psychology principle at work>",
      "scroll_stop_power": <1-10>,
      "why_it_works": "<brief explanation>"
    }
  ]
}`;

const STYLE_EXTRACTION_PROMPT = `You are an expert content analyst. Analyze the full transcript and identify the creator's style patterns.

Return ONLY valid JSON:
{
  "structure": "<overall script structure, e.g. 'Hook → Story → Lesson → CTA'>",
  "tone": "<e.g. 'casual and confident', 'authoritative but approachable'>",
  "pacing": "<e.g. 'fast with strategic pauses', 'steady build'>",
  "sentence_style": "<e.g. 'staccato mix - short punchy followed by longer explanatory'>",
  "rehook_count": <number of times the creator re-hooks attention>,
  "psychology_principles": ["<list of psychology techniques detected>"],
  "key_techniques": ["<list of specific writing techniques>"],
  "word_count_estimate": <approximate words in the transcript>
}`;

// ── Core functions ───────────────────────────────────────────────────────────

/**
 * Extract hooks from a transcript using Claude AI.
 */
export async function extractHooksFromTranscript(
  transcriptText: string
): Promise<ExtractedHook[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[analyze] Missing ANTHROPIC_API_KEY");
    return [];
  }

  // Only send first ~500 chars for hook analysis (the opening)
  const hookSection = transcriptText.slice(0, 500);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1024,
      system: HOOK_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this transcript opening and extract the hook:\n\n${hookSection}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[analyze] Claude API error:", res.status);
    return [];
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || "{}");
    return parsed.hooks || [];
  } catch {
    return [];
  }
}

/**
 * Extract style patterns from a transcript using Claude AI.
 */
export async function extractStyleFromTranscript(
  transcriptText: string,
  channelTitle?: string
): Promise<ExtractedPatterns | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[analyze] Missing ANTHROPIC_API_KEY");
    return null;
  }

  // Limit transcript to ~3000 chars for cost efficiency
  const limitedTranscript = transcriptText.slice(0, 3000);

  const contextNote = channelTitle
    ? `\n\nThis transcript is from the channel "${channelTitle}".`
    : "";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1024,
      system: STYLE_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this transcript and extract style patterns:${contextNote}\n\n${limitedTranscript}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[analyze] Claude API error:", res.status);
    return null;
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] || "null");
  } catch {
    return null;
  }
}

/**
 * Full pattern extraction pipeline for a video.
 * Extracts hooks + style, stores in transcript record, creates vault templates.
 */
export async function extractPatternsFromTranscript(
  videoDbId: string
): Promise<{ hooks: ExtractedHook[]; patterns: ExtractedPatterns | null }> {
  const supabase = getSupabase();

  // Get transcript + video + channel info
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("id, content, video_id")
    .eq("video_id", videoDbId)
    .single();

  if (!transcript?.content) {
    return { hooks: [], patterns: null };
  }

  const { data: video } = await supabase
    .from("videos")
    .select("id, user_id, youtube_id, title, channel_id, channels(title, id)")
    .eq("id", videoDbId)
    .single();

  if (!video) {
    return { hooks: [], patterns: null };
  }

  const channel = video.channels as any;

  // Run both extractions
  const [hooks, patterns] = await Promise.all([
    extractHooksFromTranscript(transcript.content),
    extractStyleFromTranscript(transcript.content, channel?.title),
  ]);

  // Update transcript with extracted data
  await supabase
    .from("transcripts")
    .update({
      extracted_hooks: hooks,
      extracted_patterns: patterns || {},
      extracted_at: new Date().toISOString(),
    })
    .eq("id", transcript.id);

  // Mark video as having patterns
  await supabase
    .from("videos")
    .update({ has_patterns: true })
    .eq("id", videoDbId);

  // Auto-create hook templates from extracted hooks
  for (const hook of hooks) {
    await supabase.from("hook_templates").insert({
      user_id: video.user_id,
      video_id: videoDbId,
      hook_text: hook.hook_text,
      hook_type: hook.hook_type,
      psychology_principle: hook.psychology_principle,
      scroll_stop_power: hook.scroll_stop_power,
      source_url: `https://youtube.com/watch?v=${video.youtube_id}`,
      source_title: video.title,
    });
  }

  // Auto-create style template if channel has enough analyzed videos (5+)
  if (channel?.id) {
    const { count } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", channel.id)
      .eq("has_patterns", true);

    if (count && count >= 5 && patterns) {
      // Check if creator voice already exists for this channel
      const { data: existing } = await supabase
        .from("style_templates")
        .select("id")
        .eq("channel_id", channel.id)
        .eq("user_id", video.user_id)
        .eq("is_creator_voice", true)
        .maybeSingle();

      if (!existing) {
        await supabase.from("style_templates").insert({
          user_id: video.user_id,
          channel_id: channel.id,
          name: `${channel.title} Voice`,
          description: `Auto-extracted creator voice profile from ${count} analyzed videos`,
          tone: patterns.tone,
          pacing: patterns.pacing,
          structure: patterns.structure,
          sentence_style: patterns.sentence_style,
          example_excerpt: transcript.content.slice(0, 500),
          is_creator_voice: true,
        });
      }
    }
  }

  return { hooks, patterns };
}

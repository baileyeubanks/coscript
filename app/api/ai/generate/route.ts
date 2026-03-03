import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function POST(req: Request) {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { hook, audience, objective, tone, platform, script_type, client_id } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // Fetch brand context if client_id provided
  let brandContext = "";
  if (client_id) {
    try {
      const { data: vault } = await supabase
        .from("brand_vaults")
        .select("voice_description, vocabulary, hook_style, cta_patterns, content_guidelines, tone_preferences")
        .eq("client_id", client_id)
        .single();

      if (vault) {
        const parts: string[] = [];
        if (vault.voice_description) parts.push(`Brand Voice: ${vault.voice_description}`);
        if (vault.vocabulary?.length) parts.push(`Approved Vocabulary: ${vault.vocabulary.join(", ")}`);
        if (vault.hook_style) parts.push(`Preferred Hook Style: ${vault.hook_style}`);
        if (vault.cta_patterns?.length) parts.push(`CTA Patterns: ${vault.cta_patterns.join("; ")}`);
        if (vault.content_guidelines) parts.push(`Content Guidelines: ${vault.content_guidelines}`);
        if (parts.length > 0) {
          brandContext = `\n\nBRAND CONTEXT (follow these guidelines closely):\n${parts.join("\n")}`;
        }
      }
    } catch {
      // Non-critical — generate without brand context
    }
  }

  const platformGuides: Record<string, string> = {
    youtube: "Write for YouTube. Strong hook in first 5 seconds. Use pattern interrupts. Include retention bumps every 30-60 seconds.",
    tiktok: "Write for TikTok. Maximum 60 seconds. Hook must be immediate. Conversational, raw, authentic tone.",
    instagram: "Write for Instagram Reels/Stories. Visual-first. Strong text overlay hooks. Under 90 seconds.",
    linkedin: "Write for LinkedIn. Professional but human. Lead with insight. Include a clear takeaway.",
    twitter: "Write for Twitter/X. Punchy threads. Each tweet must standalone. Hook tweet is everything.",
    email: "Write an email sequence. Subject line = hook. One idea per email. Clear CTA.",
  };

  const typeGuides: Record<string, string> = {
    video_script: "Format as a video script with [HOOK], [BODY], and [CTA] sections. Include visual notes in brackets where helpful.",
    social_media: "Write platform-optimized social copy. Include hashtag suggestions.",
    blog: "Write a blog post with SEO-friendly headers, intro, body sections, and conclusion.",
    ad_copy: "Write ad copy with 3 headline variants, body copy, and CTA variants.",
    email: "Write email with subject line, preview text, body, and CTA button text.",
  };

  const systemPrompt = `You are an elite content strategist and scriptwriter. Generate high-converting scripts.

${typeGuides[script_type] || typeGuides.video_script}
${platformGuides[platform] || ""}${brandContext}

Your scripts should be:
- Hook-first (grab attention in the first line)
- Emotionally resonant
- Clear and concise
- Action-oriented with strong CTAs
- Written in ${tone || "conversational"} tone

Return ONLY the script content. No meta-commentary.`;

  const userPrompt = `Generate a ${script_type || "video_script"} for ${platform || "youtube"}.

Target audience: ${audience || "general audience"}
Objective: ${objective || "engage and grow"}
${hook ? `Start with or riff on this hook: "${hook}"` : "Create a compelling hook."}
Tone: ${tone || "conversational"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "AI error", detail: err }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return NextResponse.json({ content: text });
}

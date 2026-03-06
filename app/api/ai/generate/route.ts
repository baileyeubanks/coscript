import { NextResponse } from "next/server";
import { AI_MODEL, AI_MAX_TOKENS, getAnthropicHeaders } from "@/lib/ai-config";
import {
  PSYCHOLOGY_SYSTEM_PROMPT,
  PLATFORM_PSYCHOLOGY,
  STYLE_TEMPLATES,
  buildStylePrompt,
} from "@/lib/psychology-engine";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    hook,
    audience,
    objective,
    tone,
    platform,
    script_type,
    // Wizard-enhanced fields
    style_id,
    research_context,
    selected_research,
    selected_hook,
  } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const typeGuides: Record<string, string> = {
    video_script:
      "Format as a video script. Use [VISUAL:] notes for on-screen elements. Use **bold** for text overlay cues. Include [PAUSE], [FAST], [SLOW] pacing markers.",
    social_media:
      "Write platform-optimized social copy. Include hashtag suggestions.",
    blog: "Write a blog post with SEO-friendly headers, intro, body sections, and conclusion.",
    ad_copy:
      "Write ad copy with 3 headline variants, body copy, and CTA variants.",
    email:
      "Write email with subject line, preview text, body, and CTA button text.",
  };

  // Build the style context if a style template was selected
  let styleContext = "";
  if (style_id) {
    const style = STYLE_TEMPLATES.find((s) => s.id === style_id);
    if (style) styleContext = "\n\n" + buildStylePrompt(style);
  }

  // Build research context if research was selected (from wizard step 2)
  let researchInjection = "";
  if (selected_research && Array.isArray(selected_research) && selected_research.length > 0) {
    researchInjection = `\n\n## RESEARCH CONTEXT (USE THESE IN THE SCRIPT)
${selected_research.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}`;
  } else if (research_context) {
    researchInjection = `\n\n## RESEARCH CONTEXT\n${research_context}`;
  }

  // Build the hook injection if a specific hook was selected (from wizard step 3)
  let hookInjection = "";
  if (selected_hook) {
    hookInjection = `\n\nYou MUST use this exact hook as the opening of the script (you may refine the wording slightly but keep the structure and psychology intact):
"${selected_hook}"`;
  }

  const systemPrompt = `${PSYCHOLOGY_SYSTEM_PROMPT}

${typeGuides[script_type] || typeGuides.video_script}
${PLATFORM_PSYCHOLOGY[platform] || ""}
${styleContext}
${researchInjection}
${hookInjection}

Write in a ${tone || "conversational"} tone.
Return ONLY the script content. No meta-commentary. No explanations.`;

  const userPrompt = `Generate a ${script_type || "video_script"} for ${platform || "youtube"}.

Target audience: ${audience || "general audience"}
Objective: ${objective || "engage and grow"}
${!selected_hook && hook ? `Start with or riff on this hook: "${hook}"` : ""}
${!selected_hook && !hook ? "Create a compelling hook using the Kallaway 3-Step Formula." : ""}
Tone: ${tone || "conversational"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: "AI error", detail: err },
      { status: 500 }
    );
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return NextResponse.json({ content: text });
}

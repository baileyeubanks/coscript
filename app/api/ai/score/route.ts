import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function POST(req: Request) {
  const { content, hook, audience, objective, script_type, script_id } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = `You are an expert script analyst. Score the following script on a 0-100 scale and provide detailed feedback.

Return ONLY valid JSON in this exact format:
{
  "score": <number 0-100>,
  "breakdown": {
    "hook_strength": <number 0-100>,
    "clarity": <number 0-100>,
    "structure": <number 0-100>,
    "emotional_pull": <number 0-100>,
    "cta_power": <number 0-100>
  },
  "reasoning": "<2-3 paragraph analysis of strengths, weaknesses, and specific improvements>",
  "hooks": [
    {"type": "Curiosity Gap", "text": "<alternative hook>"},
    {"type": "Contrarian Take", "text": "<alternative hook>"},
    {"type": "Before/After", "text": "<alternative hook>"}
  ],
  "frameworks": [
    {"name": "<framework name>", "fit": <number 0-100>, "suggestion": "<how to apply it>"}
  ],
  "audience_analysis": "<analysis of how well this script connects with the target audience>"
}`;

  const userPrompt = `Script type: ${script_type || "video_script"}
Target audience: ${audience || "general"}
Objective: ${objective || "engage and convert"}
Hook: ${hook || "(none)"}

SCRIPT:
${content}`;

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

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] || "{}");
  } catch {
    parsed = { score: 0, reasoning: text, breakdown: {}, hooks: [], frameworks: [], audience_analysis: "" };
  }

  // Auto-save score to DB when script_id provided
  if (script_id && parsed.score) {
    try {
      const supabase = await createSupabaseAuth();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("scripts")
          .update({
            score: parsed.score,
            score_breakdown: parsed.breakdown || {},
            ai_feedback: {
              reasoning: parsed.reasoning || "",
              audience_analysis: parsed.audience_analysis || "",
            },
          })
          .eq("id", script_id)
          .eq("user_id", user.id);
      }
    } catch {
      // Non-critical — score was still returned to client
    }
  }

  return NextResponse.json(parsed);
}

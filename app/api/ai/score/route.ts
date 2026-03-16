import { NextResponse } from "next/server";
import { AI_MODEL, AI_MAX_TOKENS, getAnthropicHeaders } from "@/lib/ai-config";
import { buildScoreSystemPrompt } from "@/lib/co-script-method";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return unauthorizedResponse();
  }

  const { content, hook, audience, objective, script_type } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = `${buildScoreSystemPrompt()}

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
    {"type": "Contrarian Truth", "text": "<alternative hook>"},
    {"type": "Hidden Cost", "text": "<alternative hook>"},
    {"type": "What Changed", "text": "<alternative hook>"}
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
    return NextResponse.json({ error: "AI error", detail: err }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || "{}");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ score: 0, reasoning: text, breakdown: {}, hooks: [], frameworks: [], audience_analysis: "" });
  }
}

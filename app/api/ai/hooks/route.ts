import { NextResponse } from "next/server";
import { AI_MODEL, getAnthropicHeaders } from "@/lib/ai-config";
import { HOOK_SYSTEM_PROMPT } from "@/lib/psychology-engine";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, audience, objective, script_type, topic, research_context } = body;

  if (!content?.trim() && !topic?.trim()) {
    return NextResponse.json({ error: "Content or topic required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const userPrompt = topic
    ? `Generate 7 hooks for this TOPIC:
Topic: ${topic}
Audience: ${audience || "general"}
Objective: ${objective || "engage"}
${research_context ? `\nResearch context to work with:\n${research_context}` : ""}

Generate hooks using ALL 7 different psychological mechanisms described in your instructions.`
    : `Generate 7 alternative hooks for this EXISTING SCRIPT:
Script type: ${script_type || "video_script"}
Audience: ${audience || "general"}
Objective: ${objective || "engage"}

SCRIPT:
${content!.slice(0, 2000)}

Generate hooks using ALL 7 different psychological mechanisms described in your instructions.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2048,
      system: `${HOOK_SYSTEM_PROMPT}

Return ONLY valid JSON:
{
  "hooks": [
    {
      "type": "Context Lean-In + Contrarian Snapback",
      "text": "...",
      "psychology": "curiosity_gap + expectation_violation",
      "scroll_stop_power": 8,
      "why_it_works": "..."
    }
  ]
}`,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "AI error" }, { status: 500 });

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || '{"hooks":[]}');
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ hooks: [] });
  }
}

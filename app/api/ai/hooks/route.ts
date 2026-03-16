import { NextResponse } from "next/server";
import { AI_MODEL, getAnthropicHeaders } from "@/lib/ai-config";
import { buildGenerateSystemPrompt } from "@/lib/co-script-method";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return unauthorizedResponse();
  }

  const { content, audience, objective, script_type } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = `${buildGenerateSystemPrompt()}

Specialize in hooks for short-form video and executive-facing branded content.
Given a script, generate 5 alternative hooks. Each hook should use a different technique and feel usable in spoken delivery.

Return ONLY valid JSON:
{
  "hooks": [
    {"type": "Contrarian Truth", "text": "..."},
    {"type": "Hidden Cost", "text": "..."},
    {"type": "What Changed", "text": "..."},
    {"type": "Operator Confession", "text": "..."},
    {"type": "Myth vs Reality", "text": "..."}
  ]
}`;

  const userPrompt = `Script type: ${script_type || "video_script"}
Audience: ${audience || "general"}
Objective: ${objective || "engage"}

SCRIPT:
${content.slice(0, 2000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
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

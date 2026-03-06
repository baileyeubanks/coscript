import { NextResponse } from "next/server";
import { AI_MODEL, AI_MAX_TOKENS, getAnthropicHeaders } from "@/lib/ai-config";
import { SCORING_SYSTEM_PROMPT } from "@/lib/psychology-engine";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, hook, audience, objective, script_type } = body;
  if (!content?.trim())
    return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });

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
      system: SCORING_SYSTEM_PROMPT,
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

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || "{}");
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      score: 0,
      reasoning: text,
      breakdown: {},
      hooks: [],
      frameworks: [],
      audience_analysis: "",
    });
  }
}

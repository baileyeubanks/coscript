import { NextResponse } from "next/server";
import { AI_MODEL, getAnthropicHeaders } from "@/lib/ai-config";
import { RESEARCH_SYSTEM_PROMPT } from "@/lib/psychology-engine";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { topic, audience, platform } = body;
  if (!topic?.trim())
    return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const userPrompt = `Research this topic for a ${platform || "short-form video"} script:

TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "general audience"}

Generate comprehensive research material that will make the script more compelling, shareable, and psychologically engaging. Focus on surprising facts, counterintuitive insights, and emotionally resonant angles.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2048,
      system: RESEARCH_SYSTEM_PROMPT,
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
    return NextResponse.json({
      misconceptions: [],
      analogies: [],
      how_it_works: [],
      statistics: [],
      emotional_angles: { fear: "", aspiration: "", curiosity: "" },
      raw: text,
    });
  }
}

import { NextResponse } from "next/server";
import { AI_MODEL, AI_MAX_TOKENS, getAnthropicHeaders } from "@/lib/ai-config";
import { buildRewriteSystemPrompt } from "@/lib/co-script-method";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";

function parseJsonBlock<T>(text: string, fallback: T) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] || "") as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return unauthorizedResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content : "";
  const fullContent = typeof body.full_content === "string" ? body.full_content : "";
  const instruction = typeof body.instruction === "string" ? body.instruction : "";
  const tone = typeof body.tone === "string" ? body.tone : "conversational";
  const audience = typeof body.audience === "string" ? body.audience : "";
  const objective = typeof body.objective === "string" ? body.objective : "";
  const hook = typeof body.hook === "string" ? body.hook : "";
  const platform = typeof body.platform === "string" ? body.platform : "youtube";
  const scriptType = typeof body.script_type === "string" ? body.script_type : "video_script";
  const scope = body.scope === "selection" ? "selection" : "document";

  if (!content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = buildRewriteSystemPrompt();

  const userPrompt = `Return ONLY valid JSON matching this schema:
{
  "summary": "<one short paragraph>",
  "content": "<rewritten script or passage>"
}

Rewrite scope: ${scope}
Audience: ${audience || "Not set yet"}
Objective: ${objective || "Not set yet"}
Opening angle / hook: ${hook || "Not set yet"}
Tone: ${tone}
Platform: ${platform}
Script type: ${scriptType}
Instruction: ${instruction || "Make it more engaging, more specific, and more retention-friendly without losing credibility."}

Target text to rewrite:
${content}

Full draft context:
${fullContent || content}`;

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

  return NextResponse.json(
    parseJsonBlock(text, {
      summary: scope === "selection" ? "Rewrite pass updated the selected passage." : "Rewrite pass updated the full draft.",
      content: text,
    }),
  );
}

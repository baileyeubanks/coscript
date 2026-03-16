import { NextResponse } from "next/server";
import { AI_MODEL, AI_MAX_TOKENS, getAnthropicHeaders } from "@/lib/ai-config";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import {
  buildGenerateSystemPrompt,
  getPlatformGuide,
  getTypeGuide,
} from "@/lib/co-script-method";

type GenerateMode = "angles" | "outline" | "draft";

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

  const mode = (body.mode as GenerateMode) || "draft";
  const title = typeof body.title === "string" ? body.title : "";
  const hook = typeof body.hook === "string" ? body.hook : "";
  const audience = typeof body.audience === "string" ? body.audience : "";
  const objective = typeof body.objective === "string" ? body.objective : "";
  const tone = typeof body.tone === "string" ? body.tone : "conversational";
  const platform = typeof body.platform === "string" ? body.platform : "youtube";
  const scriptType = typeof body.script_type === "string" ? body.script_type : "video_script";
  const currentContent = typeof body.current_content === "string" ? body.current_content : "";
  const direction = typeof body.direction === "string" ? body.direction : "";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const briefContext = `Working title: ${title || "Untitled Script"}
Audience: ${audience || "Not set yet"}
Objective: ${objective || "Not set yet"}
Opening angle / hook: ${hook || "Not set yet"}
Tone: ${tone}
Platform: ${platform}
Script type: ${scriptType}
Platform guide: ${getPlatformGuide(platform)}
Type guide: ${getTypeGuide(scriptType)}
Additional direction: ${direction || "None"}

Current draft or notes:
${currentContent || "(empty)"}`;

  const modePrompt =
    mode === "angles"
      ? `Mode: Signal Scan
Return ONLY valid JSON matching this schema:
{
  "summary": "<one short paragraph>",
  "angles": [
    {
      "label": "<short direction name>",
      "hook": "<the opening line or opening angle>",
      "why_it_works": "<why this angle fits the audience and objective>",
      "beats": ["<beat 1>", "<beat 2>", "<beat 3>"]
    }
  ]
}

Generate exactly 3 distinct angles. Each one should use a different hook archetype and a different story lens, not a minor rewrite.`
      : mode === "outline"
        ? `Mode: Narrative Map
Return ONLY valid JSON matching this schema:
{
  "summary": "<one short paragraph>",
  "title": "<refined working title>",
  "outline": [
    {
      "label": "<section label>",
      "purpose": "<what this section needs to do>",
      "beats": ["<beat 1>", "<beat 2>", "<beat 3>"]
    }
  ]
}

Build a 4-7 section outline that fits the script type and platform. The outline should follow a strong context, conflict, proof, turn, payoff progression and be specific enough that a human could draft from it immediately.`
        : `Mode: Script Build
Return ONLY valid JSON matching this schema:
{
  "summary": "<one short paragraph>",
  "title": "<refined working title>",
  "outline": [
    {
      "label": "<section label>",
      "purpose": "<what this section is doing>",
      "beats": ["<beat 1>", "<beat 2>"]
    }
  ],
  "content": "<full script draft>"
}

Write a first full draft that feels like working script copy, not like an assistant answer. Use concrete proof, visible tension, at least one rehook, and a distinct payoff. Keep it editable and grounded in the brief.`;

  const systemPrompt = buildGenerateSystemPrompt();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: getAnthropicHeaders(apiKey),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `${modePrompt}\n\nWorkspace context:\n${briefContext}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "AI error", detail: err }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  if (mode === "angles") {
    return NextResponse.json(
      parseJsonBlock(text, {
        summary: "Angle explorer returned an incomplete response.",
        angles: [],
      }),
    );
  }

  if (mode === "outline") {
    return NextResponse.json(
      parseJsonBlock(text, {
        summary: "Outline builder returned an incomplete response.",
        title,
        outline: [],
      }),
    );
  }

  return NextResponse.json(
    parseJsonBlock(text, {
      summary: "First draft pass returned an incomplete response.",
      title,
      outline: [],
      content: "",
    }),
  );
}

import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function POST(req: Request) {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, instruction, tone } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = `You are an expert script editor. Rewrite the given script according to the user's instructions.
Keep the same general message and intent but apply the requested changes.
Write in a ${tone || "conversational"} tone.
Return ONLY the rewritten script. No meta-commentary, no preamble, no explanation.`;

  const userPrompt = `${instruction ? `Instructions: ${instruction}\n\n` : ""}Original script:\n\n${content}`;

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

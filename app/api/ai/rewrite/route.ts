import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { content, instruction, tone } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = `You are an expert script rewriter. Rewrite the given script based on the user's instruction.
Maintain the core message but improve based on the specific request.
Return ONLY the rewritten script. No meta-commentary.`;

  const userPrompt = `INSTRUCTION: ${instruction || "Make it more engaging and concise"}
TONE: ${tone || "conversational"}

ORIGINAL SCRIPT:
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

  if (!res.ok) return NextResponse.json({ error: "AI error" }, { status: 500 });

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return NextResponse.json({ content: text });
}

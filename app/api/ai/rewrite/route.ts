import { NextResponse } from "next/server";
import { AI_MODEL, AI_MAX_TOKENS, getAnthropicHeaders } from "@/lib/ai-config";
import { PSYCHOLOGY_SYSTEM_PROMPT } from "@/lib/psychology-engine";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { content, instruction, tone, mode } = body;
  if (!content?.trim())
    return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // Quick-action chip modes (matching Sandcastles' UI)
  const chipInstructions: Record<string, string> = {
    facts: "Add more supporting data points, statistics, and evidence. Make every claim backed by something concrete.",
    hooks: "Strengthen all hooks — the opening hook AND every rehook throughout the script. Make each one create a stronger curiosity gap.",
    shorter: "Make the script 30% shorter. Cut filler ruthlessly. Every word must earn its place. Maintain all hooks.",
    longer: "Expand the script by 30%. Add more detail, examples, and rehook points. Never add filler — only substance.",
    translate: `Translate to ${instruction || "Spanish"} while preserving the hook structure, pacing, and psychology. Cultural adaptation, not literal translation.`,
    casual: "Rewrite in a more casual, conversational tone. Like talking to a friend. Keep the hook structure.",
    professional: "Rewrite in a more professional, authoritative tone. Expert-level credibility. Keep the hook structure.",
    humorous: "Add humor and wit. Lighten the tone while keeping the core message and hook architecture intact.",
    energy: "Increase the energy and urgency. Shorter sentences. More exclamation. More pattern interrupts.",
  };

  const finalInstruction = mode && chipInstructions[mode]
    ? chipInstructions[mode]
    : instruction || "Make it more engaging using the psychology principles in your training.";

  const systemPrompt = `${PSYCHOLOGY_SYSTEM_PROMPT}

You are rewriting an existing script. Apply the instruction while maintaining the multi-hook dance architecture.
CRITICAL: Preserve or enhance all hooks. Never remove a hook — only make them stronger.
Return ONLY the rewritten script. No meta-commentary. No explanations.`;

  const userPrompt = `INSTRUCTION: ${finalInstruction}
TONE: ${tone || "conversational"}

ORIGINAL SCRIPT:
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

  if (!res.ok) return NextResponse.json({ error: "AI error" }, { status: 500 });

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return NextResponse.json({ content: text, mode: mode || "custom" });
}

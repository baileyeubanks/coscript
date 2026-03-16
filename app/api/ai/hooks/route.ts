import { NextResponse } from "next/server";
import { AI_MODEL, getAnthropicHeaders } from "@/lib/ai-config";
import { buildGenerateSystemPrompt } from "@/lib/co-script-method";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const { content, audience, objective, script_type, topic } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // ── Fetch extracted hooks from vault as few-shot examples ──
  let vaultHookContext = "";
  let vaultHooks: Array<{ hook_text: string; hook_type: string; scroll_stop_power: number; source_title: string }> = [];

  const supabase = getSupabase();
  const { data: hookTemplates } = await supabase
    .from("hook_templates")
    .select("hook_text, hook_type, scroll_stop_power, source_title")
    .or(`user_id.eq.${user.id},is_system.eq.true`)
    .order("scroll_stop_power", { ascending: false })
    .limit(10);

  if (hookTemplates?.length) {
    vaultHooks = hookTemplates;
    vaultHookContext = `\n\nPROVEN HOOKS FROM REAL OUTLIER VIDEOS (use these as inspiration):
${hookTemplates.map((h, i) => `${i + 1}. [${h.hook_type}] "${h.hook_text}" (Power: ${h.scroll_stop_power}/10${h.source_title ? `, from: ${h.source_title}` : ""})`).join("\n")}

Draw inspiration from these real hooks but generate original variations tailored to the user's script.`;
  }

  const systemPrompt = `${buildGenerateSystemPrompt()}

Specialize in hooks for short-form video and executive-facing branded content.
Given a script, generate 5 alternative hooks. Each hook should use a different technique and feel usable in spoken delivery.${vaultHookContext}

Return ONLY valid JSON:
{
  "hooks": [
    {"type": "Contrarian Truth", "text": "...", "scroll_stop_power": 8, "psychology": "..."},
    {"type": "Hidden Cost", "text": "...", "scroll_stop_power": 7, "psychology": "..."},
    {"type": "What Changed", "text": "...", "scroll_stop_power": 8, "psychology": "..."},
    {"type": "Operator Confession", "text": "...", "scroll_stop_power": 7, "psychology": "..."},
    {"type": "Myth vs Reality", "text": "...", "scroll_stop_power": 9, "psychology": "..."}
  ]
}`;

  const userPrompt = `Script type: ${script_type || "video_script"}
Audience: ${audience || "general"}
Objective: ${objective || "engage"}
${topic ? `Topic: ${topic}` : ""}

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
    return NextResponse.json({
      ...parsed,
      vault_hooks: vaultHooks,
    });
  } catch {
    return NextResponse.json({ hooks: [], vault_hooks: vaultHooks });
  }
}

import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brief_id, script_type, tone } = await req.json();
  if (!brief_id) return NextResponse.json({ error: "Brief ID required" }, { status: 400 });

  // Fetch brief
  const { data: brief } = await supabase
    .from("coscript_briefs")
    .select("*")
    .eq("id", brief_id)
    .eq("user_id", user.id)
    .single();

  if (!brief) return NextResponse.json({ error: "Brief not found" }, { status: 404 });

  // Fetch brand context if client_id on brief
  let brandContext = "";
  if (brief.client_id) {
    try {
      const { data: vault } = await supabase
        .from("brand_vaults")
        .select("voice_description, vocabulary, hook_style, cta_patterns, content_guidelines")
        .eq("client_id", brief.client_id)
        .single();

      if (vault) {
        const parts: string[] = [];
        if (vault.voice_description) parts.push(`Brand Voice: ${vault.voice_description}`);
        if (vault.vocabulary?.length) parts.push(`Approved Vocabulary: ${vault.vocabulary.join(", ")}`);
        if (vault.hook_style) parts.push(`Preferred Hook Style: ${vault.hook_style}`);
        if (vault.cta_patterns?.length) parts.push(`CTA Patterns: ${vault.cta_patterns.join("; ")}`);
        if (vault.content_guidelines) parts.push(`Content Guidelines: ${vault.content_guidelines}`);
        if (parts.length > 0) brandContext = `\n\nBRAND CONTEXT:\n${parts.join("\n")}`;
      }
    } catch {
      // Non-critical
    }
  }

  const type = script_type || "video_script";
  const useTone = tone || brief.tone || "conversational";

  const systemPrompt = `You are an expert scriptwriter working from a content brief. Generate a high-quality ${type.replace(/_/g, " ")} that fulfills the brief requirements.
${brandContext}

Write in a ${useTone} tone.
Return ONLY the script content. No meta-commentary.`;

  const briefDetails = [
    `Title: ${brief.title}`,
    brief.objective && `Objective: ${brief.objective}`,
    brief.target_audience && `Target Audience: ${brief.target_audience}`,
    brief.platform && `Platform: ${brief.platform}`,
    brief.key_messages?.length && `Key Messages:\n${brief.key_messages.map((m: string) => `- ${m}`).join("\n")}`,
    brief.notes && `Notes: ${brief.notes}`,
  ].filter(Boolean).join("\n");

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
      messages: [{ role: "user", content: `Generate a script from this brief:\n\n${briefDetails}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "AI error", detail: err }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return NextResponse.json({ content: text, brief_id, brief_title: brief.title });
}

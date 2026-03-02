import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch template
  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .or(`is_system.eq.true,user_id.eq.${user.id}`)
    .single();

  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const body = await req.json();
  const { variables, client_id, tone, audience } = body;

  // Fetch brand context if client_id provided
  let brandContext = "";
  if (client_id) {
    try {
      const { data: vault } = await supabase
        .from("brand_vaults")
        .select("voice_description, vocabulary, hook_style, cta_patterns, content_guidelines")
        .eq("client_id", client_id)
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

  // Build variable context
  let variableContext = "";
  if (variables && typeof variables === "object") {
    const entries = Object.entries(variables).filter(([, v]) => v);
    if (entries.length > 0) {
      variableContext = "\n\nVARIABLES:\n" + entries.map(([k, v]) => `${k}: ${v}`).join("\n");
    }
  }

  // Build structure context
  const structureSteps = Array.isArray(template.structure) ? template.structure.join("\n") : "";

  const systemPrompt = `You are an expert scriptwriter. Generate content based on the template structure below.

TEMPLATE: ${template.name}
${template.prompt_instructions || ""}

STRUCTURE:
${structureSteps}
${brandContext}

Write in a ${tone || "conversational"} tone.
${audience ? `Target audience: ${audience}` : ""}
Return ONLY the script content. No meta-commentary.`;

  const userPrompt = `Generate a ${template.category} using the "${template.name}" template.${variableContext}`;

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
  return NextResponse.json({ content: text, template_id: id, template_name: template.name });
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

// GET /api/wizard/state?id=xxx — Load wizard state
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    // Load specific wizard state
    const { data, error } = await getSupabase()
      .from("scripts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Parse wizard state from script metadata
    return NextResponse.json({
      id: data.id,
      topic: data.hook || "",
      audience: data.audience || "",
      objective: data.objective || "",
      platform: data.platform || "youtube",
      tone: data.tone || "conversational",
      script_type: data.script_type || "video_script",
      research_data: data.score_breakdown?.research_data || null,
      selected_research: data.score_breakdown?.selected_research || [],
      hooks_generated: data.score_breakdown?.hooks_generated || [],
      selected_hook: data.score_breakdown?.selected_hook || null,
      selected_style: data.score_breakdown?.selected_style || null,
      step: data.status === "draft" ? (data.content ? "script" : "topic") : "complete",
      content: data.content || "",
    });
  }

  // List recent wizard sessions (incomplete scripts)
  const { data, error } = await getSupabase()
    .from("scripts")
    .select("id, title, hook, status, script_type, platform, updated_at")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

// POST /api/wizard/state — Save wizard state (create or update)
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    id,
    topic,
    audience,
    objective,
    platform,
    tone,
    script_type,
    research_data,
    selected_research,
    hooks_generated,
    selected_hook,
    selected_style,
    step,
    content,
  } = body;

  // Build the script record
  const scriptData = {
    user_id: user.id,
    title: topic ? `${topic.slice(0, 50)}...` : "Untitled Script",
    hook: selected_hook || topic || "",
    audience: audience || "general audience",
    objective: objective || "engage and grow",
    platform: platform || "youtube",
    tone: tone || "conversational",
    script_type: script_type || "video_script",
    content: content || "",
    status: step === "complete" ? "published" : "draft",
    // Store wizard state in score_breakdown (reusing existing JSONB field)
    score_breakdown: {
      research_data,
      selected_research,
      hooks_generated,
      selected_hook,
      selected_style,
      wizard_step: step,
    },
  };

  if (id) {
    // Update existing
    const { data, error } = await getSupabase()
      .from("scripts")
      .update(scriptData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Create new
  const { data, error } = await getSupabase()
    .from("scripts")
    .insert(scriptData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

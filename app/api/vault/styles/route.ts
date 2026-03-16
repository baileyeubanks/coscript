import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { STYLE_TEMPLATES } from "@/lib/psychology-engine";

/**
 * GET /api/vault/styles — List style templates (system + user + auto-extracted creator voices)
 * Query params: creator_voices_only, limit
 *
 * POST /api/vault/styles — Manually save a style template
 */
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const creatorVoicesOnly = url.searchParams.get("creator_voices_only") === "1";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const supabase = getSupabase();

  let query = supabase
    .from("style_templates")
    .select("*, channels(title, handle, thumbnail_url)")
    .or(`user_id.eq.${user.id},is_system.eq.true`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (creatorVoicesOnly) {
    query = query.eq("is_creator_voice", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    system_styles: STYLE_TEMPLATES,
    user_styles: data || [],
  });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, tone, pacing, structure, word_count_min, word_count_max, sentence_style, example_excerpt, platform_fit } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("style_templates")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description || "",
      tone: tone || "",
      pacing: pacing || "",
      structure: structure || "",
      word_count_min: word_count_min || 0,
      word_count_max: word_count_max || 0,
      sentence_style: sentence_style || "",
      example_excerpt: example_excerpt || "",
      platform_fit: platform_fit || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

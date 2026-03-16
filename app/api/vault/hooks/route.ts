import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/vault/hooks — List hook templates (system + user + auto-extracted)
 * Query params: hook_type, min_power, limit
 *
 * POST /api/vault/hooks — Manually save a hook to vault
 */
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const hookType = url.searchParams.get("hook_type");
  const minPower = parseInt(url.searchParams.get("min_power") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const supabase = getSupabase();

  let query = supabase
    .from("hook_templates")
    .select("*, videos(title, youtube_id, outlier_score)")
    .or(`user_id.eq.${user.id},is_system.eq.true`)
    .gte("scroll_stop_power", minPower)
    .order("scroll_stop_power", { ascending: false })
    .limit(limit);

  if (hookType) {
    query = query.eq("hook_type", hookType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hooks: data || [] });
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

  const { hook_text, hook_type, psychology_principle, scroll_stop_power, source_url, source_title, notes } = body;

  if (!hook_text?.trim()) {
    return NextResponse.json({ error: "hook_text required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("hook_templates")
    .insert({
      user_id: user.id,
      hook_text: hook_text.trim(),
      hook_type: hook_type || "unknown",
      psychology_principle: psychology_principle || "",
      scroll_stop_power: scroll_stop_power || 5,
      source_url: source_url || "",
      source_title: source_title || "",
      notes: notes || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

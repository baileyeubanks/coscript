import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

/**
 * GET /api/search — Unified search across videos, hooks, styles, scripts
 * Query params: q (required), type (videos|hooks|styles|scripts|all), limit
 */
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const type = url.searchParams.get("type") || "all";
  const limit = parseInt(url.searchParams.get("limit") || "20");

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const pattern = `%${q}%`;
  const result: Record<string, unknown[]> = {};

  // Search videos
  if (type === "all" || type === "videos") {
    const { data } = await supabase
      .from("videos")
      .select("id, youtube_id, title, view_count, outlier_score, outlier_label, thumbnail_url, published_at, channels(title)")
      .eq("user_id", user.id)
      .ilike("title", pattern)
      .order("outlier_score", { ascending: false })
      .limit(limit);

    result.videos = data || [];
  }

  // Search hook templates
  if (type === "all" || type === "hooks") {
    const { data } = await supabase
      .from("hook_templates")
      .select("*")
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .ilike("hook_text", pattern)
      .order("scroll_stop_power", { ascending: false })
      .limit(limit);

    result.hooks = data || [];
  }

  // Search style templates
  if (type === "all" || type === "styles") {
    const { data } = await supabase
      .from("style_templates")
      .select("*")
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .ilike("name", pattern)
      .limit(limit);

    result.styles = data || [];
  }

  // Search scripts
  if (type === "all" || type === "scripts") {
    const { data } = await supabase
      .from("scripts")
      .select("id, title, hook, status, platform, score, updated_at")
      .eq("user_id", user.id)
      .or(`title.ilike.${pattern},hook.ilike.${pattern},content.ilike.${pattern}`)
      .order("updated_at", { ascending: false })
      .limit(limit);

    result.scripts = data || [];
  }

  return NextResponse.json(result);
}

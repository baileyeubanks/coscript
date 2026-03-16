import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase";
import { OUTLIER_THRESHOLDS } from "@/lib/outlier-engine";

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") || "created_at";
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const includeOutliers = url.searchParams.get("include_outliers") !== "0";

  // Get manual research items
  const { data: items, error } = await supabase
    .from("research_items")
    .select("*")
    .eq("user_id", user.id)
    .order(sort === "outlier_score" ? "outlier_score" : "created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also include outlier videos from watchlists
  let outlierVideos: any[] = [];
  if (includeOutliers) {
    const svc = getSupabase();
    const { data: outliers } = await svc
      .from("videos")
      .select("id, youtube_id, title, view_count, outlier_score, outlier_label, thumbnail_url, published_at, channels(title, handle)")
      .eq("user_id", user.id)
      .gte("outlier_score", OUTLIER_THRESHOLDS.outlier)
      .order("outlier_score", { ascending: false })
      .limit(20);

    outlierVideos = (outliers || []).map((v: any) => ({
      id: v.id,
      type: "outlier_video",
      title: v.title,
      url: `https://youtube.com/watch?v=${v.youtube_id}`,
      platform: "youtube",
      view_count: v.view_count,
      outlier_score: Number(v.outlier_score),
      outlier_label: v.outlier_label,
      thumbnail_url: v.thumbnail_url,
      published_at: v.published_at,
      channel_title: (v.channels as any)?.title || "",
      channel_handle: (v.channels as any)?.handle || "",
    }));
  }

  return NextResponse.json({
    items: items || [],
    outlier_videos: outlierVideos,
  });
}
